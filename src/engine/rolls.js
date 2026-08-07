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

    // --- RULE-BREAKING OVERRIDES ---
    // Capture state flags BEFORE any triggers run
    const isMelee = metadata.weaponType === 'melee' || (metadata.weaponType !== 'ranged' && (/⚔️/.test(label) || options.stat === 'str'));
    const isRanged = metadata.weaponType === 'ranged' || (metadata.weaponType !== 'melee' && (/🏹|🎯/.test(label) || options.stat === 'dex'));

    console.log(`🎲 dispatchRoll [${charName}]: Melee=${isMelee}, Ranged=${isRanged}`);

    // --- AUTOMATED CLASS MODIFIERS ---
    let autoMod = 0;
    let faceMod = 0;
    const isAttack = /attack|⚔️/i.test(label) || options.type === 'attack';
    const matchedTriggers = [];

    if (CLASS_CONFIG.rollTriggers) {
        CLASS_CONFIG.rollTriggers.forEach(trigger => {
            if (trigger.condition(label, options, s)) {
                // Modifiers to the total sum
                const mod = (typeof trigger.getMod === 'function') ? trigger.getMod(s, options) : (trigger.getMod || 0);
                autoMod += mod;

                // Modifiers to the primary die face (e.g. Unerring Judgment)
                if (trigger.getFaceMod) {
                    faceMod += trigger.getFaceMod(s, options);
                }

                // Track for post-dispatch side effects
                if (trigger.onRoll) {
                    matchedTriggers.push(trigger);
                }
            }
        });
    }

    if (autoMod !== 0) {
        finalNotation += (autoMod >= 0 ? '+' : '') + autoMod;
    }

    // --- ON INITIATIVE HOOK ---
    if (/initiative/i.test(label)) {
        dispatch({ type: 'START_COMBAT' });
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
        let faces = parseInt(dieMatch[2]);
        let rest = dieMatch[3];
        
        // Combine consecutive flat math modifiers (e.g., +2+10) into a single modifier (+12)
        // to prevent parsing errors in VTT dice extensions.
        if (rest && /^[\s\+\-\d]+$/.test(rest)) {
            try {
                let combined = eval(rest.replace(/\s+/g, ''));
                rest = combined === 0 ? '' : (combined > 0 ? '+' : '') + combined;
            } catch(e) {}
        }
        
        if (isCheckOrSaveOrPool) {
            // Standard Advantage/Disadvantage for checks, saves, and pools
            let diePart = (totalAdv > 0) ? `${count + totalAdv}d${faces}kh${count}` : (totalAdv < 0) ? `${count + Math.abs(totalAdv)}d${faces}kl${count}` : `${count}d${faces}`;
            finalNotation = diePart + rest;
        } else {
            // NIMBLE Combat Logic: Decompose into Primary + Secondary
            // Advantage/Disadvantage applies ONLY to the Primary die
            
            // --- Decoupled Roll Overrides ---
            const forceAutoHit = (CLASS_CONFIG.rollOverrides && typeof CLASS_CONFIG.rollOverrides.forceAutoHit === 'function')
                ? CLASS_CONFIG.rollOverrides.forceAutoHit(label, options, s)
                : false;

            const explosionOffset = (CLASS_CONFIG.rollOverrides && typeof CLASS_CONFIG.rollOverrides.getExplosionThresholdOffset === 'function')
                ? CLASS_CONFIG.rollOverrides.getExplosionThresholdOffset(label, options, s, faces)
                : 0;

            let primaryPart = (totalAdv > 0) ? `${1 + totalAdv}d${faces}kh1` : (totalAdv < 0) ? `${1 + Math.abs(totalAdv)}d${faces}kl1` : `1d${faces}`;

            // Order is critical for Dice+ parsing: !! (explosion) -> min (floor) -> {primary} -> + (face modifiers)

            // 1. Apply Dynamic Crit Thresholds
            if (explosionOffset > 0) {
                primaryPart += `!!>${faces - explosionOffset}`;
            } else {
                primaryPart += `!!`;
            }

            // 2. Apply Physical Miss Prevention (min2)
            if (forceAutoHit) {
                primaryPart += 'min2';
            }

            // 3. Named {primary} for result parsing (MUST follow functional modifiers)
            primaryPart += `{primary}`;

            // 4. Apply Physical Modifiers to Primary Face (e.g. Unerring Judgment +1)
            if (faceMod > 0) {
                primaryPart += `+${faceMod}`;
            }
            
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
        let tag = weaponType ? ` (${weaponType})` : '';
        // CL-13 / issue #53: a weapon attack flagged non-proficient by the caller (see
        // inventory.js's isProficientInWeapon) round-trips through this same "(tag)" convention
        // used for melee/ranged, since dispatchRoll never rolls dice itself -- it only builds a
        // notation string for an external VTT extension, and the numeric result comes back later
        // through handleRollResult with only that notation string to read.
        if (options.metadata?.weaponProficient === false) tag += ' (non-proficient)';
        labeledNotation = `${finalNotation} #${cleanLabel}${tag}`;
    }

    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_EVENT", {
        detail: {
            notation: labeledNotation,
            label: label,
            playerName: s.charName || "Adventurer",
            rollTarget: 'everyone',
            timestamp: Date.now()
        }
    }));

    // --- POST-DISPATCH SIDE EFFECTS ---
    // Run hooks after the event loop tick to ensure the roll event is "out the door" 
    // and hasn't been interrupted by reactive UI re-renders.
    if (matchedTriggers.length > 0) {
        setTimeout(() => {
            const d = (typeof dispatch === 'function' ? dispatch : window.dispatch);
            if (typeof d === 'function') {
                matchedTriggers.forEach(trigger => {
                    if (typeof trigger.onRoll === 'function') {
                        trigger.onRoll(s, d);
                    }
                });
            }
        }, 50);
    }
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
        // CL-13 / issue #53: inventory.js tags a weapon attack "(non-proficient)" (via
        // dispatchRoll's metadata.weaponProficient) whenever the equipped weapon isn't covered
        // by the class's normalized profWeapons tokens (state.js's isWeaponItemProficient).
        const isNonProficientWeapon = notation.toLowerCase().includes('(non-proficient)');

        // NIMBLE Crit: Standard faces, or (faces - offset) if rule-breakers are active
        const critOffset = (CLASS_CONFIG.rollOverrides && typeof CLASS_CONFIG.rollOverrides.getCritThresholdOffset === 'function')
            ? CLASS_CONFIG.rollOverrides.getCritThresholdOffset(notation, primaryGroup, s, faces)
            : 0;
        const critThreshold = faces - critOffset;

        // Note: primaryGroup.total includes explosions.
        // If they roll (faces - offset) and explode, total will be >= faces.
        // CL-13: heroes not proficient with the weapon they're attacking with (e.g. Unarmed
        // Strike) cannot crit -- same as any other weapon used without proficiency.
        const isCrit = primaryGroup.total >= critThreshold && !isNonProficientWeapon;

        // Auto-hit rule-breaker bypasses natural 1 miss check
        const forceAutoHit = (CLASS_CONFIG.rollOverrides && typeof CLASS_CONFIG.rollOverrides.forceAutoHit === 'function')
            ? CLASS_CONFIG.rollOverrides.forceAutoHit(notation, { metadata: { weaponType: isMelee ? 'melee' : (isRanged ? 'ranged' : '') } }, s)
            : false;
        const isMiss = primaryGroup.total === 1 && !forceAutoHit;
        const isHit = !isMiss;

        console.log(`🎲 handleRollResult [${CLASS_CONFIG.name}]:`, { isCrit, isMiss, critThreshold, isMelee, forceAutoHit });

        // Run Decoupled Lifecycle Hooks
        if (typeof CLASS_CONFIG.onRollResult === 'function') {
            const context = {
                isMelee,
                isRanged,
                isCrit,
                isMiss,
                isHit,
                faces,
                primaryGroup
            };
            CLASS_CONFIG.onRollResult(data, s, d, dispatch, dispatchRoll, context);
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
    
    // Check for dynamic class/subclass upcast bonuses
    const upcastBonus = (typeof CLASS_CONFIG !== 'undefined' && typeof CLASS_CONFIG.getUpcastBonus === 'function')
        ? CLASS_CONFIG.getUpcastBonus(spell, state)
        : 0;
    const finalTiersUp = tiersUp + upcastBonus;

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
    if (!text) return "";
    
    const keyStats = (CLASS_CONFIG && CLASS_CONFIG.keyStats) ? CLASS_CONFIG.keyStats : [];
    const keyValue = keyStats.length > 0 ? Math.max(...keyStats.map(s => statsMap[s] || 0)) : 0;

    const tokens = {
        str: statsMap.str,
        dex: statsMap.dex,
        int: statsMap.int,
        wil: statsMap.wil,
        lvl: level,
        wounds: state.wounds || 0,
        key: keyValue
    };

    const resolveNotation = (notation) => {
        return notation.replace(/\b(KEY|LVL|WOUNDS|STR|DEX|INT|WIL)\b/gi, (match) => tokens[match.toLowerCase()]);
    };

    const skipPattern = /(?:<span[^>]*class="[^"]*(?:dice-hl|stat-hl|formula-label|pip-inline)[^"]*"[^>]*>.*?<\/span>|<[^>]*>)/gi;

    // Pass 0: Handle Inline Usage Tokens [[uKey]] or [[uKey:COUNT]]
    let processed = text.replace(/\[\[(u[a-zA-Z0-9_]+)(?::([^\]]+))?\]\]/g, (match, key, countToken) => {
        const currentState = (typeof window !== 'undefined' && window.charState) ? window.charState() : state;
        let count = 1;
        if (countToken) {
            const multiMatch = countToken.match(/(\d+)\s*[xX×]\s*(STR|DEX|INT|WIL|KEY|LVL)/i);
            if (multiMatch) {
                count = parseInt(multiMatch[1]) * tokens[multiMatch[2].toLowerCase()];
            } else if (/\d+/.test(countToken)) {
                count = parseInt(countToken);
            } else {
                count = tokens[countToken.toLowerCase()] || 0;
            }
        }

        let htmlPips = "";
        const stateVal = currentState[key];
        for (let i = 0; i < count; i++) {
            let isAvailable = true;
            if (count > 1) {
                if (Array.isArray(stateVal) && i < stateVal.length) isAvailable = (stateVal[i] === 1);
            } else if (stateVal !== undefined) {
                isAvailable = (stateVal === 1);
            }
            const title = count > 1 ? `Use ${i+1}` : "Toggle Power";
            htmlPips += `<input type="checkbox" class="pip pip-inline" ${isAvailable ? 'checked' : ''} onclick="toggleBgPip('${key}', ${i}, ${count > 1}, ${count})" title="${title}"> `;
        }
        return htmlPips.trim();
    });

    // Pass 1: Handle mathematical multipliers (e.g., 3x LVL)
    processed = processed.replace(new RegExp(skipPattern.source + '|(\\b(?:\\d+)\\s*[xX×]\\s*(?:STR|DEX|INT|WIL|KEY|LVL|WOUNDS)\\b)', 'gi'), (match, p1) => {
        if (!p1) return match;
        const m = p1.match(/(\d+)\s*[xX×]\s*(STR|DEX|INT|WIL|KEY|LVL|WOUNDS)/i);
        if (!m) return match;
        const val = tokens[m[2].toLowerCase()] || 0;
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

    // Pass 4: Wrap individual stat values in clickable check links
    const wrapStat = (val, label) => {
        const escapedLabel = (context.name || 'Roll').replace(/'/g, "\\'");
        return `<span class="stat-hl roll-link" onclick="dispatchRoll('1d20+${val}', '${escapedLabel} Check', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${label})</span>`;
    };

    const statTokenRegex = new RegExp(skipPattern.source + '|(\\b(STR|DEX|INT|WIL|KEY|LVL)\\b(?!\\s+(?:save|check))|\\+\\s*WOUNDS\\b)', 'gi');
    return processed.replace(statTokenRegex, (match, p1) => {
        if (!p1) return match;
        const statKey = p1.toUpperCase().replace(/\s+/g, '');
        if (statKey === 'LVL') return `<span class="stat-hl">${level}</span>`;
        if (statKey === '+WOUNDS') return `+ <span class="stat-hl">${state.wounds || 0}</span>`;
        return wrapStat(tokens[statKey.toLowerCase()], statKey);
    });
}
