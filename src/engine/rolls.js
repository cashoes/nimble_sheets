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

    // Access fresh reactive state to prevent race conditions
    const s = charState();
    const charName = CLASS_CONFIG.name;
    let finalNotation = notation.replace(/[⚔️🛡️]/g, '').trim();
    const metadata = options.metadata || {};

    // --- RULE-BREAKING OVERRIDES (v2.8.22) ---
    // Capture state flags BEFORE any triggers run
    const isMelee = metadata.weaponType === 'melee' || /⚔️/.test(label) || options.stat === 'str';
    const hasJD = charName === "Oathsworn" && (s.judgmentDice || []).length > 0;
    // Heads I Win: Detect when the 1/encounter pip is checked
    const isHeadsIWin = /Cheat/i.test(charName) && (s.uHeadsIWin > 0 || s['uHeadsIWin'] > 0);

    if (/Cheat/i.test(charName)) {
        console.log(`🎲 dispatchRoll [Cheat Diagnostic]: uHeadsIWin=${s.uHeadsIWin}, active=${isHeadsIWin}`);
    }

    console.log(`🎲 dispatchRoll [${charName}]: Melee=${isMelee}, hasJD=${hasJD}, HeadsIWin=${isHeadsIWin}`);

    // --- AUTOMATED CLASS MODIFIERS ---
    let autoMod = 0;
    const isAttack = /attack|⚔️/i.test(label) || options.type === 'attack';
    let triggerRan = false;

    if (CLASS_CONFIG.rollTriggers) {
        CLASS_CONFIG.rollTriggers.forEach(trigger => {
            if (trigger.condition(label, options, s)) {
                const mod = trigger.getMod(s, options);
                if (mod) {
                    autoMod += mod;
                    if (trigger.onRoll) {
                        trigger.onRoll(s);
                        triggerRan = true;
                    }
                }
            }
        });
    }

    if (triggerRan) {
        dispatch({ type: 'SYNC_STATE' });
    }

    if (autoMod !== 0) {
        finalNotation += (autoMod >= 0 ? '+' : '') + autoMod;
    }

    // --- ON INITIATIVE HOOK ---
    if (/initiative/i.test(label)) {
        dispatch({ type: 'START_COMBAT' });
        dispatch({ type: 'SYNC_STATE' });
    }
    // -------------------------

    const isSave = /save/i.test(label);
    const isCheckOrSaveOrPool = isSave || /check|rest|hit die|pool|fury|judgment/i.test(label) || options.type === 'pool';
    const derived = computeDerived(s);

    let condAdv = 0;
    if (!options.isMinion) {
        if (isSave) {
            if (derived.allSaveAdv) condAdv++;
            if (derived.allSaveDis) condAdv--;
        }

        s.activeConditions.forEach(cId => {
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

    let totalAdv = s.advantage + condAdv + (options.inherentAdv || 0) + (options.forceAdv ? 1 : 0);
    
    const dieMatch = finalNotation.match(/^(\d+)?d(\d+)(.*)$/i);
    if (dieMatch) {
        let count = parseInt(dieMatch[1] || "1");
        let faces = dieMatch[2];
        let rest = dieMatch[3];
        
        if (isCheckOrSaveOrPool) {
            // Standard Advantage/Disadvantage for checks, saves, and pools
            let diePart = (totalAdv > 0) ? `${count + totalAdv}d${faces}kh${count}` : (totalAdv < 0) ? `${count + Math.abs(totalAdv)}d${faces}kl${count}` : `${count}d${faces}`;
            finalNotation = diePart + rest;
        } else {
            // NIMBLE Combat Logic: Decompose into Primary + Secondary
            // Advantage/Disadvantage applies ONLY to the Primary die
            
            // --- Special Subclass Overrides (v2.8.22) ---
            const cheatAutoHit = isHeadsIWin;
            const oathUnerring = hasJD && isMelee;
            
            let primaryPart = (totalAdv > 0) ? `${1 + totalAdv}d${faces}kh1` : (totalAdv < 0) ? `${1 + Math.abs(totalAdv)}d${faces}kl1` : `1d${faces}`;
            
            // Apply Physical Miss Prevention (min2)
            if (cheatAutoHit || oathUnerring) {
                primaryPart += 'min2';
            }

            // Apply Dynamic Crit Thresholds (!!>${faces-2} means max face AND one value below explode)
            if (cheatAutoHit || oathUnerring) {
                primaryPart += `!!>${faces - 2}`;
            } else {
                primaryPart += `!!`;
            }

            // Named {primary} for result parsing
            primaryPart += `{primary}`;
            
            let secondaryPart = (count > 1) ? ` + ${count - 1}d${faces}` : "";
            finalNotation = primaryPart + secondaryPart + rest;
        }
    }

    const tableMatch = finalNotation.match(/^t(\d+)(.*)$/i);
    if (tableMatch) {
        let faces = tableMatch[1];
        let rest = tableMatch[2];
        let tablePart = (totalAdv > 0) ? `2t${faces}kh1` : (totalAdv < 0) ? `2t${faces}kl1` : `t${faces}`;
        finalNotation = tablePart + rest;
    }

    console.log(`🎲 NIMBLE Roll: [${label}] => ${finalNotation}`, { options, autoMod });
    
    // Add label and context directly to notation using Dice+ syntax (#label)
    // Suffix hash format is the most compatible standard for Dice+
    let labeledNotation = finalNotation;
    if (label) {
        const cleanLabel = label.replace(/[#\[\]()]/g, '');
        const weaponType = options.metadata?.weaponType;
        const tag = weaponType ? ` (${weaponType})` : '';
        labeledNotation = `${finalNotation} #${cleanLabel}${tag}`;
    }

    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_EVENT", {
        detail: {
            notation: labeledNotation,
            label: label,
            playerName: state.charName || "Adventurer",
            rollTarget: 'everyone',
            timestamp: Date.now()
        }
    }));
}

/**
 * Analyzes OBR roll results and triggers character automation.
 * @param {Object} data - Result data from OBR Dice+.
 */
function handleRollResult(data) {
    if (!data || !data.result) return;

    // 1. Update the result readout signal
    if (typeof setLastRollResult === 'function') {
        setLastRollResult(data);
    }

    const res = data.result;
    const groups = res.groups || [];
    const notation = res.diceNotation || "";
    
    // 2. Identify NIMBLE Primary Die Group
    const primaryGroup = groups.find(g => g.diceModel === 'primary');

    if (primaryGroup) {
        const faces = parseInt(primaryGroup.diceType.replace(/\D/g, '')) || 20;

        const char = CLASS_CONFIG.name;
        const s = charState();
        const d = charDerived();
        const sub = s.subclass;

        // Extract context from notation tags
        const isMelee = notation.toLowerCase().includes('(melee)');
        const isRanged = notation.toLowerCase().includes('(ranged)');

        // Detect active rule-breakers
        const isHeadsIWinActive = (char === "The Cheat" || char === "Cheat") && (s.uHeadsIWin > 0);
        const hasJDActive = char === "Oathsworn" && isMelee && (s.judgmentDice || []).length > 0;

        // NIMBLE Crit: Standard faces, or (faces - 1) if rule-breakers are active
        const critThreshold = (isHeadsIWinActive || hasJDActive) ? (faces - 1) : faces;
        
        // Note: primaryGroup.total includes explosions. 
        // If they roll (faces - 1) and explode, total will be >= faces.
        const isCrit = primaryGroup.total >= critThreshold;
        const isMiss = primaryGroup.total === 1 && !isHeadsIWinActive && !hasJDActive;
        const isHit = !isMiss;

        console.log(`🎲 handleRollResult [${char} / ${sub}]:`, { isCrit, isMiss, critThreshold, isMelee, isHeadsIWinActive });

        if (isCrit) {
            // Automation A: Berserker Red Mist Blood Frenzy (L3+)
            if (char === 'Berserker' && sub === 'RedMist' && s.level >= 3 && (s.activeConditions || []).includes('raging')) {
                const dice = [...(s.furyDice || [])];
                if (dice.length > 0) {
                     const fFaces = d.furyFaces || 4;
                     const idx = dice.findIndex(f => f.total < fFaces);
                     if (idx !== -1) {
                         dice[idx] = { ...dice[idx], total: fFaces };
                         dispatch({ type: 'UPDATE_POOL', payload: { key: 'furyDice', dice } });
                         dispatch({ type: 'ADD_LOG', payload: { msg: "Crit! Blood Frenzy maximized a Fury Die." } });
                     }
                }
            }

            // Reminder A: Shadowmancer Hungering Shadows
            if (char === 'Shadowmancer' && (s.selectedGreater || []).includes("Hungering Shadows")) {
                 dispatch({ type: 'ADD_LOG', payload: { msg: "Crit! Next tiered spell costs 0 Pilfered Power." } });
            }

            // Automation B: Hunter Thrill of the Hunt (Ranged Crit Only)
            if (char === 'Hunter' && isRanged && s.level >= 2) {
                const max = d.resourceMaxes['tothCharges'] || 0;
                dispatch({ type: 'ADJ_RES', payload: { id: 'tothCharges', amount: 1, max } });
                dispatch({ type: 'ADD_LOG', payload: { msg: "Ranged Crit! +1 Thrill charge gained." } });
            }

            // Automation C: Cheat Sneak Attack (Melee Crit)
            if ((char === 'The Cheat' || char === 'Cheat') && isMelee && (s.level || 1) >= 1) {
                const saDice = d.saDice || "1d6";
                dispatchRoll(saDice, 'Sneak Attack', { type: 'pool' });
                dispatch({ type: 'ADD_LOG', payload: { msg: `Melee Crit! Automated Sneak Attack roll (${saDice}).` } });
            }

            // Automation D: Zephyr Way of Flame (Crit)
            if (char === 'Zephyr' && sub === 'WayFlame' && s.level >= 3) {
                const str = d.statsMap.str || 0;
                const wounds = s.wounds || 0;
                const count = str + wounds;
                if (count > 0) {
                    const isBurning = s.level >= 15;
                    const fNot = `${count}d6${isBurning ? '*2' : ''}`;
                    dispatchRoll(fNot, 'Way of Flame', { type: 'pool' });
                    dispatch({ type: 'ADD_LOG', payload: { msg: `Crit! Way of Flame triggered (${fNot} Fire).` } });
                }
            }
        }

        if (isMiss) {
            // Automation D: Berserker Mountainheart Titan's Fury (L11+)
            if (char === 'Berserker' && sub === 'Mountainheart' && s.level >= 11) {
                if (!(s.activeConditions || []).includes('raging')) {
                    dispatch({ type: 'TOGGLE_CONDITION', payload: { id: 'raging' } });
                    dispatch({ type: 'ADD_LOG', payload: { msg: "Miss! Titan's Fury triggered Rage." } });
                }
            }

            // Reminder B: Commander Inerrant Strike
            if (char === 'Commander' && (s.selectedTactics || []).includes("Inerrant Strike")) {
                 dispatch({ type: 'ADD_LOG', payload: { msg: "Miss! Inerrant Strike: Reroll, +1 Primary Die, +Combat Die dmg." } });
            }

            // Reminder C: Cheat Feinting Attack
            if (char === 'The Cheat' && (s.selectedUnderhanded || []).includes("Feinting Attack")) {
                 dispatch({ type: 'ADD_LOG', payload: { msg: "Miss! Feinting Attack: If 2nd miss this round, change primary die." } });
            }
        }

        if (isHit) {
            // Automation E: Hunter Thrill of the Hunt (Melee Hit - includes Crits)
            if (char === 'Hunter' && isMelee && s.level >= 2) {
                const max = d.resourceMaxes['tothCharges'] || 0;
                dispatch({ type: 'ADJ_RES', payload: { id: 'tothCharges', amount: 1, max } });
                dispatch({ type: 'ADD_LOG', payload: { msg: "Melee Hit! +1 Thrill charge gained." } });
            }
        }
    }
}
/**
 * Robustly applies a scaling rule to a base value.
 * Supports recomputing dice counts, flat modifiers, and stat multipliers.
 */
function applyScaling(baseStr, scaleStr, tiersUp) {
    if (tiersUp === 0 || !scaleStr) return baseStr;
    let base = String(baseStr);
    let scale = String(scaleStr);

    // 1. Handle Dice (e.g. "1d6" scaling on "3d6")
    const diceMatch = scale.match(/^[+]?(\d+)d(\d+)(.*)$/i);
    if (diceMatch) {
        const scaleCount = parseInt(diceMatch[1]) * tiersUp;
        const faces = diceMatch[2];
        const rest = diceMatch[3] || "";
        const baseDiceMatch = base.match(new RegExp(`(\\d+)d${faces}`, 'i'));
        if (baseDiceMatch) {
            const newCount = parseInt(baseDiceMatch[1]) + scaleCount;
            return base.replace(baseDiceMatch[0], `${newCount}d${faces}${rest}`);
        } else {
            return (base === "0" || base === "") ? `${scaleCount}d${faces}${rest}` : `${base}+${scaleCount}d${faces}${rest}`;
        }
    }

    // 2. Handle Stat Multipliers (e.g. "+KEY", "+2xKEY")
    const statMatch = scale.match(/^[+]?(\d*)x?([A-Z]{3})$/i);
    if (statMatch) {
        const mult = statMatch[1] ? parseInt(statMatch[1]) : 1;
        const statName = statMatch[2].toUpperCase();
        const scaleTotal = mult * tiersUp;
        
        const baseStatMatch = base.match(new RegExp(`(\\d*)x?${statName}`, 'i'));
        if (baseStatMatch) {
            const baseMult = baseStatMatch[1] ? parseInt(baseStatMatch[1]) : 1;
            const newMult = baseMult + scaleTotal;
            return base.replace(baseStatMatch[0], `${newMult}x${statName}`);
        } else {
            return `${base}+${scaleTotal}x${statName}`;
        }
    }

    // 3. Handle Flat Numbers (e.g. "+10", "2")
    const numMatch = scale.match(/^[+]?(-?\d+)$/);
    if (numMatch) {
        const scaleVal = parseInt(numMatch[1]) * tiersUp;
        // Try to merge into a leading number (e.g. "10+KEY" -> "11+KEY")
        // We use (?!d) to ensure we don't accidentally merge into a dice count (e.g. "3d8")
        const leadingNumMatch = base.match(/^(\d+)(?!d)/i);
        if (leadingNumMatch) {
            const newVal = parseInt(leadingNumMatch[1]) + scaleVal;
            return base.replace(leadingNumMatch[1], newVal);
        }
        // Else try to merge into trailing flat mod
        const baseFlatMatch = base.match(/([+-]\s*\d+)$/);
        if (baseFlatMatch) {
            const baseVal = parseInt(baseFlatMatch[1].replace(/\s/g, ''));
            const newVal = baseVal + scaleVal;
            const replacement = newVal >= 0 ? `+${newVal}` : `${newVal}`;
            return base.substring(0, baseFlatMatch.index) + replacement;
        } else if (base.match(/^-?\d+$/)) {
             return String(parseInt(base) + scaleVal);
        } else {
            return `${base}${scaleVal >= 0 ? '+' : ''}${scaleVal}`;
        }
    }

    // 4. Handle Area (e.g. "2x2" -> "3x3")
    const areaMatchBase = base.match(/^(\d+)x(\d+)$/i);
    if (areaMatchBase) {
         let s1 = 0, s2 = 0;
         const areaScaleMatch1 = scale.match(/^[+]?(\d+)x(\d+)$/i);
         if (areaScaleMatch1) {
             s1 = parseInt(areaScaleMatch1[1]);
             s2 = parseInt(areaScaleMatch1[2]);
         } else {
             const areaScaleMatch2 = scale.match(/^[+]?(\d+)$/);
             if (areaScaleMatch2) {
                 s1 = parseInt(areaScaleMatch2[1]);
                 s2 = s1;
             }
         }
         if (s1 > 0 || s2 > 0) {
             return `${parseInt(areaMatchBase[1]) + s1*tiersUp}x${parseInt(areaMatchBase[2]) + s2*tiersUp}`;
         }
    }

    // 5. Handle "Single" -> numbers
    if (base.toLowerCase() === "single" && scale.match(/^[+]?(\d+)$/)) {
        return String(1 + parseInt(scale.match(/^[+]?(\d+)$/)[1]) * tiersUp);
    }

    // 6. Handle Keyword Mapping (e.g. Small -> Medium -> Large)
    if (typeof scaleStr === 'object' && scaleStr.type === 'map' && Array.isArray(scaleStr.list)) {
        const list = scaleStr.list;
        const baseIdx = list.indexOf(base);
        if (baseIdx !== -1) {
            const newIdx = Math.min(list.length - 1, baseIdx + tiersUp);
            return list[newIdx];
        }
    }

    return `${base} + (${scale} x ${tiersUp})`;
}

/**
 * Resolves upcasting math for a tiered spell.
 */
function resolveUpcast(spell, castTier, choiceId = null) {
    const baseTier = parseInt(spell.tier.replace(/\D/g, '')) || 0;
    const tiersUp = Math.max(0, castTier - baseTier);
    
    // Check for Greedy Pact Tier Bonus (Level 12 Shadowmancer)
    const hasGreedyBonus = state.greedyBonus === 'BOOM';
    const finalTiersUp = tiersUp + (hasGreedyBonus ? 1 : 0);

    let resolvedData = { ...(spell.base || {}), tiers: finalTiersUp };
    let desc = spell.desc;
    let upcastText = spell.upcastDesc || "";

    if (finalTiersUp > 0) {
        // 1. Apply Automatic Scaling
        if (spell.scaling) {
            Object.keys(spell.scaling).forEach(key => {
                resolvedData[key] = applyScaling(resolvedData[key], spell.scaling[key], finalTiersUp);
            });
        }

        // 2. Apply Selected Choice (or default to first)
        if (spell.upcastChoices && spell.upcastChoices.length > 0) {
            const effectiveChoiceId = choiceId || spell.upcastChoices[0].id;
            const choice = spell.upcastChoices.find(c => c.id === effectiveChoiceId);
            if (choice && choice.scaling) {
                Object.keys(choice.scaling).forEach(key => {
                    resolvedData[key] = applyScaling(resolvedData[key], choice.scaling[key], finalTiersUp);
                });
            }
        }
    }

    // 3. Resolve Template Placeholders
    Object.keys(resolvedData).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        desc = desc.replace(regex, resolvedData[key]);
        upcastText = upcastText.replace(regex, resolvedData[key]);
    });

    // 4. Append upcast descriptions (Highlighted)
    if (finalTiersUp > 0 && upcastText) {
        desc += ` <div style="margin-top:4px; font-weight:bold; color:var(--gold-light);">Upcast:</div> <span class="upcast-text">${upcastText}</span>`;
    }

    return { desc, baseData: resolvedData };
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
    
    // Safeguard for uninitialized CLASS_CONFIG or keyStats
    const keyStats = (CLASS_CONFIG && CLASS_CONFIG.keyStats) ? CLASS_CONFIG.keyStats : [];
    const keyValue = keyStats.length > 0 
        ? Math.max(...keyStats.map(s => statsMap[s] || 0))
        : 0;

    /**
     * Replaces stat tokens with their numerical values in notation strings.
     * @param {string} notation - The notation string to resolve.
     * @param {boolean} stripFormula - If true, returns only the clean numeric value.
     * @returns {string} Resolved notation string.
     */
    const resolveNotation = (notation, stripFormula = false) => {
        let res = notation.replace(/\bKEY\b/gi, keyValue)
            .replace(/\bLVL\b/gi, level)
            .replace(/\bWOUNDS\b/gi, state.wounds || 0)
            .replace(/\bSTR\b/gi, statsMap.str)
            .replace(/\bDEX\b/gi, statsMap.dex)
            .replace(/\bINT\b/gi, statsMap.int)
            .replace(/\bWIL\b/gi, statsMap.wil);
        return res;
    };

    // Skip Pattern: Ignores existing highlighted spans (except prop-hl) or any HTML tags
    // Non-capturing groups used to ensure target is always p1
    const skipPattern = /(?:<span[^>]*class="[^"]*(?:dice-hl|stat-hl|formula-label|pip-inline)[^"]*"[^>]*>.*?<\/span>|<[^>]*>)/gi;

    // Pass 0: Handle Inline Usage Tokens [[uKey]] or [[uKey:idx]] (v2.4.0)
    let processed = text.replace(/\[\[u([a-zA-Z0-9_]+)(?::(\d+))?\]\]/g, (match, key, idx) => {
        // Use the reactive state signal if available to ensure UI updates
        const currentState = (typeof window !== 'undefined' && window.charState) ? window.charState() : state;
        const val = currentState[key] || 0;
        const index = idx ? parseInt(idx) : 0;
        const isChecked = val > index;
        return `<input type="checkbox" class="pip pip-inline" ${isChecked ? 'checked' : ''} onclick="toggleBgPip('${key}', ${index})" title="Use ${index+1}">`;
    });

    // Pass 1: Handle mathematical multipliers (e.g., 3x LVL)
    processed = processed.replace(new RegExp(skipPattern.source + '|(\\b(?:\\d+)\\s*[xX×]\\s*(?:STR|DEX|INT|WIL|KEY|LVL|WOUNDS)\\b)', 'gi'), (match, p1) => {
        if (!p1) return match;
        
        const m = p1.match(/(\d+)\s*[xX×]\s*(STR|DEX|INT|WIL|KEY|LVL|WOUNDS)/i);
        if (!m) return match;
        
        const statName = m[2].toUpperCase();
        let val = (statName === 'STR' ? statsMap.str : statName === 'DEX' ? statsMap.dex : statName === 'INT' ? statsMap.int : statName === 'WIL' ? statsMap.wil : statName === 'LVL' ? level : statName === 'WOUNDS' ? (state.wounds || 0) : keyValue);
        return `<span class="stat-hl">${parseInt(m[1]) * val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p1})</span>`;
    });

    // Pass 2: Handle Dice/Table rolls (e.g., 1d6+KEY, 2d100kh1)
    const diceRegex = new RegExp(skipPattern.source + '|(\\b(?:(?:\\d+|STR|DEX|INT|WIL|KEY|LVL|WOUNDS)\\s*d\\d+|t\\d+)(?:kh\\d*|kl\\d*|dh\\d*|dl\\d*|!)*(?:[\\s\\+-]+(?:STR|DEX|INT|WIL|KEY|LVL|WOUNDS|\\d+))*\\b)', 'gi');
    processed = processed.replace(diceRegex, (match, p1) => {
        if (!p1) return match;
        
        const resolved = resolveNotation(p1);
        const cleanNotation = resolved.replace(/\s+/g, '');
        
        if (context.type === 'cantrip') {
            const scaled = applyCantripScaling(cleanNotation, context.name, context.school, level);
            return `<span class="dice-hl roll-link" onclick="dispatchRoll('${scaled}', '${context.name}', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${resolved}</span>`;
        }
        
        const label = (context.name || 'Roll').replace(/'/g, "\\'");
        const hasStat = /STR|DEX|INT|WIL|KEY|LVL|WOUNDS/i.test(p1);
        const formula = hasStat ? `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p1})</span>` : "";
        return `<span class="dice-hl roll-link" onclick="dispatchRoll('${cleanNotation}', '${label}', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${resolved}</span>${formula}`;
    });

    // Pass 3: Handle complex stat math (e.g. 10+KEY+1, LVL+WIL-1)
    const mathRegex = new RegExp(skipPattern.source + '|(\\b(?:\\d+|STR|DEX|INT|WIL|KEY|LVL|WOUNDS)(?:\\s*[\\+\\-]\\s*(?:\\d+|STR|DEX|INT|WIL|KEY|LVL|WOUNDS))+\\b)', 'gi');
    processed = processed.replace(mathRegex, (match, p1) => {
        if (!p1) return match;
        
        const resolvedExpr = resolveNotation(p1);
        try {
            const result = eval(resolvedExpr.replace(/\s+/g, ''));
            const formula = `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p1})</span>`;
            return `<span class="stat-hl">${result}</span>${formula}`;
        } catch(e) {
            return match;
        }
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

    const statTokenRegex = new RegExp(skipPattern.source + '|(\\b(STR|DEX|INT|WIL|KEY|LVL|WOUNDS)\\b(?!\\s+(?:save|check)))', 'gi');
    return processed.replace(statTokenRegex, (match, p1) => {
        if (!p1) return match;
        
        const statKey = p1.toUpperCase();
        if (statKey === 'LVL') {
            return `<span class="stat-hl">${level}</span>`;
        }
        if (statKey === 'WOUNDS') {
            return `<span class="stat-hl">${state.wounds || 0}</span>`;
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
