/**
 * @fileoverview ROLL ENGINE MODULE
 * Handles the logic for processing and dispatching rolls, including advantage/disadvantage,
 * class-specific modifiers, cantrip scaling, and the interactive ISTATS parser.
 */

/**
 * Safely evaluates a chain of signed integers (e.g. "5+2-10", "+-1", "--2") without eval()/
 * Function() -- issue #57(d). Both call sites that used to `eval()` here only ever need to sum a
 * run of `+`/`-`-separated numbers (flat dice-notation modifiers, and iStats' resolved stat math
 * after every STR/DEX/INT/WIL/KEY/LVL/WOUNDS token has already been substituted with a number),
 * never real arithmetic (no `*`, `/`, parens, or function calls) -- so a small explicit parser
 * covers the legitimate use fully while refusing to execute anything else. Also tolerates stacked
 * unary signs (e.g. "1d6+-1" from welding a "+" onto a negative stat value) the same way `eval()`
 * did, rather than rejecting them outright.
 * @param {string} expr - A string that should contain only whitespace, digits, `+`, and `-`.
 * @returns {number|null} The summed value, or null if `expr` isn't a pure signed-integer chain.
 */
function evalArithmetic(expr) {
    const cleaned = String(expr).replace(/\s+/g, '');
    if (!cleaned) return 0;
    if (!/^[+-]*\d+([+-]+\d+)*$/.test(cleaned)) return null;
    const terms = cleaned.match(/[+-]*\d+/g);
    if (!terms) return null;
    return terms.reduce((sum, term) => {
        const m = term.match(/^([+-]*)(\d+)$/);
        const negCount = (m[1].match(/-/g) || []).length;
        const sign = (negCount % 2 === 0) ? 1 : -1;
        return sum + sign * parseInt(m[2], 10);
    }, 0);
}

/**
 * Collapses adjacent `+`/`-` sign runs (e.g. "+-1", "--2") produced when a stat token is
 * substituted with a negative number (e.g. "1d6+STR" at STR=-1 -> "1d6+-1") into a single sign --
 * issue #57's `+-` double-sign case. Applied to both the text shown to the player and the
 * notation dispatched to the roller, not just one or the other.
 * @param {string} str
 * @returns {string}
 */
function normalizeSignChain(str) {
    let prev;
    do {
        prev = str;
        str = str.replace(/([+-])\s*([+-])/, (m, a, b) => (a === b ? '+' : '-'));
    } while (str !== prev);
    return str;
}

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
    // Issue #54: this keyword/`options.type` allowlist decides whether a roll stays a flat
    // check/save/pool roll or falls through to the NIMBLE Combat decomposition below (exploding
    // primary die + `{primary}` crit-group tag). "Initiative" matched none of the prior keywords
    // and carried no `options.type`, so it silently fell into the attack-decomposition branch —
    // exploding on a nat 20 and minting a crit group for a plain DEX check that must never
    // explode or crit. Added here rather than inverting the default (attack-typed vs.
    // pool-typed) because spell/cantrip damage rolls throughout src/data/class_*.js rely on the
    // current default-to-decompose behavior without setting `type: 'attack'` explicitly.
    const isCheckOrSaveOrPool = isSave || /check|rest|hit die|pool|fury|judgment|initiative/i.test(label) || options.type === 'pool';
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

    // Issue #57(a): tolerate a leading sign on the die count so a negative count (e.g. "STR d8"
    // resolved at STR=-1 -> "-1d8") is actually captured by this regex instead of bypassing it
    // entirely -- previously the raw "-1d8" string shipped to the VTT completely unhandled.
    const dieMatch = finalNotation.match(/^(-?\d+)?d(\d+)(.*)$/i);
    if (dieMatch) {
        let count = parseInt(dieMatch[1] || "1");
        let faces = parseInt(dieMatch[2]);
        let rest = dieMatch[3];

        // Combine consecutive flat math modifiers (e.g., +2+10) into a single modifier (+12)
        // to prevent parsing errors in VTT dice extensions. Issue #57(d): was eval() on a string
        // that (here) only ever needs summing signed integers -- evalArithmetic covers exactly
        // that without executing arbitrary code.
        if (rest && /^[\s\+\-\d]+$/.test(rest)) {
            const combined = evalArithmetic(rest);
            if (combined !== null) {
                rest = combined === 0 ? '' : (combined > 0 ? '+' : '') + combined;
            }
        }

        // Issue #60: a keep/drop modifier (kh/kl/dh/dl) already present at the head of `rest` --
        // e.g. from applyScaling welding "+1d100kh1" onto a base die to form "2d100kh1" (Radiant
        // Vengeance's upcast) -- targets the WHOLE die pool ("keep the highest of all N dice").
        // The NIMBLE Combat decomposition below splits that pool into a primary die + secondary
        // dice, which would weld the modifier onto the lone secondary die instead ("keep highest
        // of 1" -- a no-op that silently discards the pool's keep/drop semantics). Route these
        // through the same flat pool logic used for checks/saves/pools instead of decomposing, so
        // the modifier stays applied to the combined pool it was written against.
        const hasPoolDiceModifier = /^(?:kh|kl|dh|dl)\d*/i.test(rest);

        if (count <= 0) {
            // Issue #57(a): a computed die count of zero or negative (e.g. "STR d8"/"WIL d6" at
            // stat<=0 -- class_commander.js:111, class_hunter.js:89/250) must roll ZERO dice, not
            // silently become "1d8" via the decomposition branch's hardcoded single-primary-die
            // assumption below (verified: Commander at STR 0 -> dispatchRoll('0d8') ->
            // "1d8!!{primary}"). Negative counts are clamped the same way as zero -- there's no
            // such thing as "negative dice", and the regex above only exists to keep them from
            // bypassing this block, not to give them a distinct meaning. Emit a flat "0" (plus
            // any surviving trailing modifier) instead of dice notation.
            finalNotation = rest ? (/^[+-]/.test(rest) ? `0${rest}` : `0+${rest}`) : '0';
        } else if (isCheckOrSaveOrPool || hasPoolDiceModifier) {
            // Standard Advantage/Disadvantage for checks, saves, pools, and any notation that
            // already carries its own keep/drop modifier on the full pool.
            let diePart;
            if (hasPoolDiceModifier) {
                // Issue #57 (F2): a keep/drop modifier already embedded in `rest` (e.g. "kh1"
                // welded on by applyScaling for an upcast pool -- Thousand Cuts 2d44kh1,
                // Unspeakable Word 2d66kh1, Vengeance upcast 2d100kh1 -- spells.json:351/570/465)
                // already targets the WHOLE pool. The #60 changelog entry claimed no real content
                // combines a scaled kh/kl notation with an advantage-eligible roll, but damage
                // rolls read the live `s.advantage` toggle regardless of label, so all three of
                // those real spells DO reach here with totalAdv != 0 whenever advantage/
                // disadvantage is active -- layering the toggle's own kh/kl wrapper on top used
                // to nest two keep operations on the same pool ("3d44kh2kh1"/"3d66kl2kh1"),
                // malformed for strict VTT parsers. There's no rules ruling yet for how
                // advantage/disadvantage should compose with an already-keep-highest-or-lowest
                // pool (kh and kl pull in opposite directions, so "just add dice" isn't obviously
                // correct for both signs) -- refuse rather than guess: leave the pool's own
                // embedded modifier untouched and drop the live advantage/disadvantage state for
                // THIS roll. Deferred pending a rules ruling -- see issue #57.
                diePart = `${count}d${faces}`;
            } else {
                // Issue #57(b): `s.advantage` is a sticky UI toggle (combat_controls.js) that
                // persists in state until the player changes it, and it used to be applied to
                // every roll that reaches this branch -- including pure damage/resource pools
                // with no roll-to-hit of their own (verified: Zephyr's Way of Flame, `type:
                // 'pool'`, at s.advantage=1 -> "4d6kh3*2" instead of "3d6*2"; the Cheat's
                // automated Sneak Attack, also `type: 'pool'`, -> "4d20kh3" instead of "3d20").
                // Exempt explicit `type: 'pool'` rolls from the STICKY toggle specifically (a
                // caller can still opt a pool into it via `options.poolAdvantage`);
                // condAdv/inherentAdv/forceAdv are non-sticky, per-call decisions the calling code
                // makes for THIS roll, so they still apply even to an advantage-exempt pool.
                const poolAdvExempt = options.type === 'pool' && !options.poolAdvantage;
                const poolAdv = poolAdvExempt ? (totalAdv - s.advantage) : totalAdv;
                diePart = (poolAdv > 0) ? `${count + poolAdv}d${faces}kh${count}` : (poolAdv < 0) ? `${count + Math.abs(poolAdv)}d${faces}kl${count}` : `${count}d${faces}`;
            }
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
        const tag = weaponType ? ` (${weaponType})` : '';
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

        // NIMBLE Crit: Standard faces, or (faces - offset) if rule-breakers are active
        const critOffset = (CLASS_CONFIG.rollOverrides && typeof CLASS_CONFIG.rollOverrides.getCritThresholdOffset === 'function')
            ? CLASS_CONFIG.rollOverrides.getCritThresholdOffset(notation, primaryGroup, s, faces)
            : 0;
        const critThreshold = faces - critOffset;
        
        // Note: primaryGroup.total includes explosions. 
        // If they roll (faces - offset) and explode, total will be >= faces.
        const isCrit = primaryGroup.total >= critThreshold;

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
        // Issue #57(c): `(?!d)` only excludes a LITERAL "d" immediately after the FIRST digit
        // it manages to match, and `\d+` backtracks -- on "12d6" it fails the lookahead at "12"
        // (next char IS "d") but then backtracks to "1" (next char is "2", not "d"), so it wrongly
        // matches just "1" out of a 2-digit dice count. `(?!\d*d)` excludes a "d" preceded by any
        // run of digits too, so it correctly refuses to match ANY leading count that's actually a
        // dice notation (e.g. "12d6", "10d6"), leaving those to fall through to the trailing/
        // generic append branches below instead of getting corrupted (verified:
        // applyScaling("12d6","+2",1) used to return "32d6" instead of "12d6+2").
        const leadingNumMatch = base.match(/^(\d+)(?!\d*d)/i);
        if (leadingNumMatch) {
            const newVal = parseInt(leadingNumMatch[1]) + scaleVal;
            // Slice rather than String.replace(searchString, ...) so this only ever touches the
            // matched LEADING run, not the first coincidental occurrence of that substring
            // anywhere else in `base`.
            return newVal + base.slice(leadingNumMatch[1].length);
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

    // Issue #57's "+-" double-sign case: substituting a stat token with a negative value (e.g.
    // "1d6+STR" at STR=-1) leaves the notation's own "+" adjacent to the substituted value's own
    // "-", producing "1d6+-1" both in the text shown to the player and in the notation later
    // dispatched to the roller, instead of the normalized "1d6-1". normalizeSignChain collapses
    // any adjacent sign run into a single sign; applied here so every caller of resolveNotation
    // (the dice-roll link display/dispatch in Pass 2, and the stat-math evaluation in Pass 3)
    // gets the fix for free.
    const resolveNotation = (notation) => {
        const substituted = notation.replace(/\b(KEY|LVL|WOUNDS|STR|DEX|INT|WIL)\b/gi, (match) => tokens[match.toLowerCase()]);
        return normalizeSignChain(substituted);
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
    // The trailing modifier group requires an explicit +/- operator (optionally surrounded by
    // whitespace) before a stat/number token. It previously accepted pure whitespace alone as
    // the separator, so a following descriptive word like "Wounds" in "1d4 Wounds" was captured
    // as part of the same match and later welded onto the face count with no operator between
    // them (see issue #50: "1d4 Wounds" -> "1d40"). Requiring the sign prevents plain trailing
    // prose from being absorbed into the die notation while still allowing "1d6+STR"/"1d4+2".
    const diceRegex = new RegExp(skipPattern.source + '|(\\b(?:(?:\\d+|STR|DEX|INT|WIL|KEY|LVL|WOUNDS)\\s*d\\d+|t\\d+)(?:kh\\d*|kl\\d*|dh\\d*|dl\\d*|!)*(?:\\s*[\\+-]\\s*(?:STR|DEX|INT|WIL|KEY|LVL|WOUNDS|\\d+))*\\b)', 'gi');
    // Issue #66: an untyped roll-link (no context.type) falls through dispatchRoll's default
    // exploding "NIMBLE Combat" decomposition -- correct for attack/damage rolls, wrong for
    // heal/wound-gain/temp-HP UTILITY rolls (a rolled max shouldn't crit-fish a heal or a
    // self-inflicted Wound). The roll's label is always the feature/spell NAME (context.name),
    // which carries no hint of intent, so classify from the prose immediately surrounding the
    // matched dice notation instead: a heal/regain/restore verb shortly BEFORE the roll ("Heal a
    // creature {X} HP", "Action: Heal yourself ... WIL d6 HP") or "Wound(s)"/"temp HP"
    // immediately AFTER it ("Gain 1d4 Wounds"). Bounded lookback/lookahead windows keep this from
    // reaching into an unrelated clause -- e.g. Vampiric Greed's "Gain 1 Wound. 4d12 to all
    // adjacent creatures..." is a real damage roll that happens to follow an unrelated
    // Wound-gain sentence and must keep exploding; Searing Light's "Heal WIL d8 HP ... Inflict
    // WIL d8 radiant damage" is two rolls in one feature and only the first is a heal.
    const UTILITY_LEADING_RE = /\b(?:heal(?:s|ing)?|regain(?:s)?|restore(?:s)?)\b/i;
    const UTILITY_TRAILING_RE = /^\s*(?:wounds?\b|temp\s*hp\b)/i;
    processed = processed.replace(diceRegex, (match, p1, offset, str) => {
        if (!p1) return match;
        const resolved = resolveNotation(p1);
        const cleanNotation = resolved.replace(/\s+/g, '');

        const leadingWindow = str.slice(Math.max(0, offset - 45), offset);
        const trailingWindow = str.slice(offset + match.length, offset + match.length + 20);
        const isUtilityRoll = UTILITY_LEADING_RE.test(leadingWindow) || UTILITY_TRAILING_RE.test(trailingWindow);
        // Never downgrade an explicit cantrip type -- no cantrip is a heal today, but if one ever
        // is, cantrip scaling must still apply.
        const rollCtx = isUtilityRoll ? { ...context, type: context.type === 'cantrip' ? context.type : 'pool' } : context;

        if (rollCtx.type === 'cantrip') {
            const scaled = applyCantripScaling(cleanNotation, context.name, context.school, level);
            return `<span class="dice-hl roll-link" onclick="dispatchRoll('${scaled}', '${context.name}', ${JSON.stringify(rollCtx).replace(/"/g, '&quot;')})">${resolved}</span>`;
        }
        const label = (context.name || 'Roll').replace(/'/g, "\\'");
        const hasStat = /STR|DEX|INT|WIL|KEY|LVL|WOUNDS/i.test(p1);
        const formula = hasStat ? `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p1})</span>` : "";
        return `<span class="dice-hl roll-link" onclick="dispatchRoll('${cleanNotation}', '${label}', ${JSON.stringify(rollCtx).replace(/"/g, '&quot;')})">${resolved}</span>${formula}`;
    });

    // Pass 3: Handle complex stat math (e.g. 10+KEY+1, LVL+WIL-1)
    const mathRegex = new RegExp(skipPattern.source + '|(\\b(?:\\d+|STR|DEX|INT|WIL|KEY|LVL|WOUNDS)(?:\\s*[\\+\\-]\\s*(?:\\d+|STR|DEX|INT|WIL|KEY|LVL|WOUNDS))+\\b)', 'gi');
    processed = processed.replace(mathRegex, (match, p1) => {
        if (!p1) return match;
        const resolvedExpr = resolveNotation(p1);
        // Issue #57(d): was eval() on a string built from feature/spell DESCRIPTION text (an
        // authored-today-but-untrusted-in-principle sink -- the same "data string reaches a
        // dangerous sink" family flagged elsewhere) -- replaced with evalArithmetic, which only
        // ever sums a `+`/`-` chain of already-resolved numbers (exactly what mathRegex captures)
        // and refuses (returns null) anything else, so no expression can execute arbitrary code
        // through this path regardless of what description text a spell/feature ever contains.
        const result = evalArithmetic(resolvedExpr);
        if (result === null) return match;
        const formula = `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p1})</span>`;
        return `<span class="stat-hl">${result}</span>${formula}`;
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
