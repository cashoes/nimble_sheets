/**
 * @fileoverview ROLL ENGINE MODULE
 * Handles the logic for processing and dispatching rolls, including advantage/disadvantage,
 * class-specific modifiers, cantrip scaling, and the interactive ISTATS parser.
 */

/**
 * Dispatches a roll event after processing notation, modifiers, and conditions.
 * @param {string} notation - The dice notation to roll (e.g., "1d20+5").
 * @param {string} label - The label for the roll (e.g., "Sword Attack").
 * @param {Object} [options={}] - Additional options for the roll.
 * @param {string} [options.type] - The type of roll (e.g., "attack").
 * @param {boolean} [options.isMinion] - Whether the roller is a minion (skips condition checks).
 * @param {number} [options.inherentAdv] - Inherent advantage or disadvantage levels.
 * @param {boolean} [options.forceAdv] - Whether to force advantage.
 */
function dispatchRoll(notation, label, options = {}) {
    if (!notation) {
        return;
    }

    let finalNotation = notation.replace(/[⚔️🛡️]/g, '').trim();

    // --- AUTOMATED CLASS MODIFIERS ---
    let autoMod = 0;
    const isAttack = /attack|⚔️/i.test(label) || options.type === 'attack';

    if (CLASS_CONFIG.rollTriggers) {
        CLASS_CONFIG.rollTriggers.forEach(trigger => {
            if (trigger.condition(label, options, state)) {
                const mod = trigger.getMod(state, options);
                if (mod) {
                    autoMod += mod;
                    if (trigger.onRoll) {
                        trigger.onRoll(state);
                    }
                }
            }
        });
    }

    if (autoMod !== 0) {
        finalNotation += (autoMod >= 0 ? '+' : '') + autoMod;
    }

    // --- ON INITIATIVE HOOK ---
    if (/initiative/i.test(label) && typeof CLASS_CONFIG.onInitiative === 'function') {
        const derived = computeDerived(state);
        CLASS_CONFIG.onInitiative(state.level, state.subclass, state, derived);
        dispatch({ type: 'UPDATE_DOM_VALUES', payload: { domValues: extractDOMValues() } });
    }
    // -------------------------

    const isCheckOrSave = /check|save|rest|hit die/i.test(label);
    const isSave = /save/i.test(label);
    const derived = computeDerived(state);

    let condAdv = 0;
    if (!options.isMinion) {
        if (isSave) {
            if (derived.allSaveAdv) condAdv++;
            if (derived.allSaveDis) condAdv--;
        }

        state.activeConditions.forEach(cId => {
            const condition = CONDITIONS_LIST.find(cl => cl.id === cId);
            if (condition && condition.modRolls) {
                if (condition.modRolls.adv) {
                    if (condition.modRolls.adv.includes('all') || (isAttack && condition.modRolls.adv.includes('attack'))) {
                        condAdv++;
                    }
                }
                if (condition.modRolls.dis) {
                    if (condition.modRolls.dis.includes('all') || (isAttack && condition.modRolls.dis.includes('attack'))) {
                        condAdv--;
                    }
                }
            }
        });
    }

    let totalAdv = state.advantage + condAdv + (options.inherentAdv || 0) + (options.forceAdv ? 1 : 0);
    
    const dieMatch = finalNotation.match(/^(\d+)?d(\d+)(.*)$/i);
    if (dieMatch) {
        let count = parseInt(dieMatch[1] || "1");
        let faces = dieMatch[2];
        let rest = dieMatch[3];
        let diePart = (totalAdv > 0) ? `${count + totalAdv}d${faces}kh${count}` : (totalAdv < 0) ? `${count + Math.abs(totalAdv)}d${faces}kl${count}` : `${count}d${faces}`;
        
        if (!isCheckOrSave) {
            diePart += '!';
        }
        finalNotation = diePart + rest;
    }

    const tableMatch = finalNotation.match(/^t(\d+)(.*)$/i);
    if (tableMatch) {
        let faces = tableMatch[1];
        let rest = tableMatch[2];
        let tablePart = (totalAdv > 0) ? `2t${faces}kh1` : (totalAdv < 0) ? `2t${faces}kl1` : `t${faces}`;
        finalNotation = tablePart + rest;
    }

    console.log(`🎲 NIMBLE Roll: [${label}] => ${finalNotation}`, { options, autoMod });
    
    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_EVENT", {
        detail: {
            notation: finalNotation,
            label: label,
            playerName: state.charName || "Adventurer",
            rollTarget: 'everyone',
            timestamp: Date.now()
        }
    }));
}

/**
 * Applies level-based scaling to cantrip roll notations.
 * @param {string} notation - The original dice notation.
 * @param {string} name - The name of the cantrip.
 * @param {string} school - The magic school of the cantrip.
 * @param {number} level - Current character level.
 * @returns {string} The scaled dice notation.
 */
function applyCantripScaling(notation, name, school, level) {
    const levelMod = Math.floor(level / 5);
    if (levelMod === 0) {
        return notation;
    }

    if (name === "Entice") {
        const steps = ["d4", "d6", "d8", "d10", "d12"];
        return notation.replace(/d4/i, steps[Math.min(4, levelMod)]);
    }

    const scalingMap = {
        "Fire": 5,
        "Ice": 3,
        "Radiant": 2,
        "Wind": 2,
        "Withering Touch": 6,
        "Zap": 6,
        "Overload": 4,
        "Vicious Mockery": 2
    };

    const bonusPerMod = scalingMap[name] || scalingMap[school] || 0;
    if (bonusPerMod === 0) {
        return notation;
    }

    return notation + "+" + (bonusPerMod * levelMod);
}

/**
 * ISTATS ENGINE
 * Parses text for special tokens (STR, DEX, INT, WIL, KEY, LVL) and converts them
 * into interactive, auto-calculating HTML elements.
 * @param {string} text - The raw text to parse.
 * @param {number} level - Current character level.
 * @param {Object} statsMap - Current attribute values.
 * @param {Object} [context={}] - Context for rolls generated from the text.
 * @returns {string} The HTML-enriched text.
 */
function iStats(text, level, statsMap, context = {}) {
    if (!text) {
        return "";
    }
    
    const keyValue = Math.max(...CLASS_CONFIG.keyStats.map(s => statsMap[s]));

    /**
     * Replaces stat tokens with their numerical values in notation strings.
     * @param {string} notation - The notation string to resolve.
     * @returns {string} Resolved notation string.
     */
    const resolveNotation = (notation) => {
        return notation.replace(/\bKEY\b/gi, keyValue)
            .replace(/\bLVL\b/gi, level)
            .replace(/\bSTR\b/gi, statsMap.str)
            .replace(/\bDEX\b/gi, statsMap.dex)
            .replace(/\bINT\b/gi, statsMap.int)
            .replace(/\bWIL\b/gi, statsMap.wil);
    };

    // Skip Pattern: Ignores existing highlighted spans or any HTML tags
    const skipPattern = /(<span[^>]*class="[^"]*(dice-hl|stat-hl|formula-label|pip-inline)[^"]*"[^>]*>.*?<\/span>)|<[^>]*>/gi;

    // Pass 0: Handle Inline Usage Tokens [[uKey]] or [[uKey:idx]] (v2.2.4)
    let processed = text.replace(/\[\[u([a-zA-Z0-9_]+)(?::(\d+))?\]\]/g, (match, key, idx) => {
        const val = state[key] || 0;
        const index = idx ? parseInt(idx) : 0;
        const isChecked = val > index;
        return `<input type="checkbox" class="pip pip-inline" ${isChecked ? 'checked' : ''} onclick="toggleBgPip('${key}', ${index})" title="Use ${index+1}">`;
    });

    // Pass 1: Handle mathematical multipliers (e.g., 3x LVL)
    processed = processed.replace(new RegExp(skipPattern.source + '|(\\b(\\d+)\\s*[xX×]\\s*(STR|DEX|INT|WIL|KEY|LVL)\\b)', 'gi'), (match, p1, p2, p3, p4, p5) => {
        if (p1 || !p3) {
            return match;
        }
        const statName = p5.toUpperCase();
        let val = (statName === 'STR' ? statsMap.str : statName === 'DEX' ? statsMap.dex : statName === 'INT' ? statsMap.int : statName === 'WIL' ? statsMap.wil : statName === 'LVL' ? level : keyValue);
        return `<span class="stat-hl">${parseInt(p4) * val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p3})</span>`;
    });

    // Pass 2: Handle Dice/Table rolls (e.g., 1d6+KEY)
    processed = processed.replace(new RegExp(skipPattern.source + '|(\\b((\\d+|STR|DEX|INT|WIL|KEY|LVL)\\s*d\\d+|t\\d+)([\\s\\+-]+(STR|DEX|INT|WIL|KEY|LVL|\\d+))*\\b)', 'gi'), (match, p1, p2, p3) => {
        if (p1 || !p3) {
            return match;
        }
        let notation = resolveNotation(p3).replace(/\s+/g, '');
        if (context.type === 'cantrip') {
            notation = applyCantripScaling(notation, context.name, context.school, level);
        }
        
        const label = (context.name || 'Roll').replace(/'/g, "\\'");
        const display = resolveNotation(p3);
        const hasStat = /STR|DEX|INT|WIL|KEY|LVL/i.test(p3);
        const formula = hasStat ? `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p3})</span>` : "";
        return `<span class="dice-hl roll-link" onclick="dispatchRoll('${notation}', '${label}', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${display}</span>${formula}`;
    });

    /**
     * Wraps a stat value in a clickable roll-link span.
     * @param {number} val - The stat value.
     * @param {string} label - The stat label.
     * @returns {string} HTML span string.
     */
    const wrapStat = (val, label) => {
        const escapedLabel = (context.name || 'Roll').replace(/'/g, "\\'");
        return `<span class="stat-hl roll-link" onclick="dispatchRoll('1d20+${val}', '${escapedLabel} Check', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${label})</span>`;
    };

    return processed.replace(new RegExp(skipPattern.source + '|(\\b(STR|DEX|INT|WIL|KEY|LVL)\\b)', 'gi'), (match, p1, p2, p3, p4) => {
        if (p1 || !p3) {
            return match;
        }
        const statKey = p4.toUpperCase();
        if (statKey === 'LVL') {
            return `<span class="stat-hl">${level}</span>`;
        }
        if (statKey === 'STR') {
            return wrapStat(statsMap.str, 'STR');
        }
        if (statKey === 'DEX') {
            return wrapStat(statsMap.dex, 'DEX');
        }
        if (statKey === 'INT') {
            return wrapStat(statsMap.int, 'INT');
        }
        if (statKey === 'WIL') {
            return wrapStat(statsMap.wil, 'WIL');
        }
        if (statKey === 'KEY') {
            return wrapStat(keyValue, 'KEY');
        }
        return match;
    });
}
