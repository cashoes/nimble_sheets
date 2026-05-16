/**
 * @fileoverview STATE ENGINE MODULE
 * Responsible for character mathematical model, derived stats, calculation,
 * persistence, and synchronization between state and DOM.
 */

/**
 * Ensures the state object is valid by setting defaults and correcting types.
 * @param {Object|null|undefined} state - The state object to validate.
 * @returns {Object} A valid state object with default values for missing or incorrect types.
 */
function ensureValidState(state) {
    // If state is null or undefined, start with an empty object
    const valid = { ...(state || {}) };

    // Define defaults and validators
    const defaults = {
        version: "2.5.0",
        charName: '',
        level: 1,
        ancestry: 'None',
        background: 'None',
        subclass: 'None',
        baseStr: 0, addStr: 0,
        baseDex: 0, addDex: 0,
        baseInt: 0, addInt: 0,
        baseWil: 0, addWil: 0,
        hpCurrent: null,
        tempHP: 0,
        hdCurrent: null,
        wounds: 0,
        skills: {},
        activeConditions: [],
        inventory: [],
        gold: 0,
        resourceValues: {},
        bgSpell: 'None',
        showMinor: false,
        greedyResult: '', // New: Stores the result text of Greedy Pact rolls
        // Multi-selection feature states
        selectedDecrees: [],
        selectedSpells: [],
        selectedArsenal: [],
        selectedToth: [],
        selectedMastery: [],
        selectedGreater: [],
        selectedLesser: [],
        selectedGraces: [],
        selectedLyrical: [],
        selectedBoons: [],
        selectedMartial: [],
        selectedUnderhanded: [],
        selectedDeepKnowledge: [],
        secondarySchool: [],
        selectedSubclassSpells: [],
        selectedStudy: [],
        selectedTwilight: [],
        selectedShadowmastery: [],
        currentForm: [],
        furyDice: [],
        judgmentDice: null,
        judgmentBoom: 'OFF',
        judgmentMode: 'Single',
        furyBoom: 'OFF',
        advantage: 0,
        actionsSpent: 0,
        spellUpcasts: {} // stores { [spellName]: { tier: number, choiceId: string } }
    };

    // Apply defaults for missing or incorrect types
    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (valid[key] === undefined) {
            valid[key] = defaultValue;
        } else {
            // Type correction
            const expectedType = typeof defaultValue;
            if (expectedType === 'object' && defaultValue !== null) {
                // For objects and arrays, we want to ensure they are the correct type
                if (Array.isArray(defaultValue)) {
                    if (!Array.isArray(valid[key])) {
                        valid[key] = [...defaultValue]; // copy the default array
                    }
                } else {
                    // Plain object
                    if (typeof valid[key] !== 'object' || valid[key] === null || Array.isArray(valid[key])) {
                        valid[key] = { ...defaultValue }; // copy the default object
                    }
                }
            } else if (expectedType === 'number') {
                if (typeof valid[key] !== 'number' || Number.isNaN(valid[key])) {
                    valid[key] = defaultValue;
                } else if (key === 'level') {
                    // Clamp level between 1 and 20
                    valid[key] = Math.min(20, Math.max(1, valid[key]));
                }
            } else if (expectedType === 'string') {
                if (typeof valid[key] !== 'string') {
                    valid[key] = String(valid[key]);
                }
            } else if (expectedType === 'boolean') {
                valid[key] = !!valid[key];
            }
            // For null (like hpCurrent, hdCurrent, judgmentDice) we don't correct type if it's not null,
            // because the rest of the code expects either null or a specific type.
            // We'll leave it as is and let the specific usage handle it.
        }
    }

    // Additional validation: ensure arrays of strings for certain fields? Not necessary.

    return valid;
}

/**
 * Validates and corrects state values according to game rules.
 * This function mutates the state object and returns it.
 * @param {Object} state - The state object to validate and correct.
 * @returns {Object} The validated state object (same reference).
 */
function validateAndCorrectState(state) {
    // Ensure level is a valid number between 1 and 20
    if (typeof state.level === 'number' && !isNaN(state.level)) {
        state.level = Math.min(20, Math.max(1, state.level));
    } else {
        state.level = 1;
    }

    const config = CLASS_CONFIG;
    const level = state.level;
    const stats = ['Str', 'Dex', 'Int', 'Wil'];
    const keyStats = (config.keyStats || []).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    // 1. Calculate Budgets (NIMBLE v2.2 Revised Rules)
    const keyMilestones = [4, 8, 12, 16];
    const secMilestones = [5, 9, 13, 17];
    const keyGains = keyMilestones.filter(l => level >= l).length;
    const secGains = secMilestones.filter(l => level >= l).length;
    const flexBudget = level >= 20 ? 2 : 0;

    const init = config.initialStats || {};
    let baseKeyBudget = 0;
    let baseSecBudget = 0;
    stats.forEach(s => {
        const val = init[`base${s}`] || 0;
        if (keyStats.includes(s)) baseKeyBudget += val;
        else baseSecBudget += val;
    });

    const keyBudget = baseKeyBudget + keyGains;
    const secBudget = baseSecBudget + secGains;

    // 2. Base Attribute Protection (NIMBLE v2.2)
    // Base attributes are fixed after Level 1.
    if (level > 1 && state.lastLeveledUpAt !== undefined) {
        // Enforce that base stats don't change by comparing with a hidden initial state or just assuming they are fixed.
        // For now, the UI disables these inputs, but we'll ensure they are clamped if they somehow change.
    }

    // 3. Normalize and Total Spent
    let keySpent = 0;
    let secSpent = 0;
    stats.forEach(s => {
        state[`base${s}`] = Math.max(-1, parseInt(state[`base${s}`]) || 0);
        state[`add${s}`] = Math.max(0, parseInt(state[`add${s}`]) || 0);
        
        // Final Total Cap: sum (Base + Add) <= 5
        let total = state[`base${s}`] + state[`add${s}`];
        if (total > 5) {
            state[`add${s}`] = Math.max(0, 5 - state[`base${s}`]);
            if (state[`base${s}`] > 5) state[`base${s}`] = 5;
            total = state[`base${s}`] + state[`add${s}`];
        }

        if (keyStats.includes(s)) keySpent += total;
        else secSpent += total;
    });

    // 4. Enforce Budgets with Flex points
    let keyOver = Math.max(0, keySpent - keyBudget);
    let secOver = Math.max(0, secSpent - secBudget);
    let totalOver = keyOver + secOver;

    if (totalOver > flexBudget) {
        let excess = totalOver - flexBudget;
        // Prioritize reducing "Add" stats in reverse order
        for (let i = stats.length - 1; i >= 0 && excess > 0; i--) {
            const s = stats[i];
            const reduce = Math.min(state[`add${s}`], excess);
            state[`add${s}`] -= reduce;
            excess -= reduce;
        }
        // If still excess and level 1, reduce "Base" stats to enforce the starting pool
        if (excess > 0 && level === 1) {
            for (let i = stats.length - 1; i >= 0 && excess > 0; i--) {
                const s = stats[i];
                // Base stats can go as low as -1 in NIMBLE
                const currentBase = state[`base${s}`];
                const reduce = Math.min(currentBase + 1, excess);
                state[`base${s}`] -= reduce;
                excess -= reduce;
            }
        }
    }

    // 5. Skill Validation (NIMBLE v2.4 Revised)
    // - Skill budget: 4 (Level 1) + 1 per additional level.
    // - Total Skill modifier (pts + attr + passive) is maximum 12.
    // - Total Skill modifier cannot be reallocated below 0.
    // - One-way exception: If points are 0, total can be negative (base attribute).
    const maxSkillMod = 12;
    const skillBudget = 4 + (level - 1);
    let skillSpent = 0;

    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    const bgFeat = BACKGROUND_FEATURES[state.background];
    let bgSelectedOpt = null;
    if (bgFeat && bgFeat.options && state[bgFeat.stateKey]) {
        bgSelectedOpt = bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === state[bgFeat.stateKey]);
    }

    if (state.skills && typeof state.skills === 'object') {
        const statsMap = getStatsMap(state);
        
        // Calculate Passives for skills (Ancestry/Background)
        let passMods = {};
        SKILL_LIST.forEach(sk => passMods[sk.id] = 0);
        if (ancFeat) {
            if (ancFeat.modAllSkills) SKILL_LIST.forEach(sk => passMods[sk.id] += ancFeat.modAllSkills);
            if (ancFeat.modSkill) passMods[ancFeat.modSkill.id] += ancFeat.modSkill.val;
        }
        if (bgFeat) {
            if (bgFeat.modAllSkills) SKILL_LIST.forEach(sk => passMods[sk.id] += bgFeat.modAllSkills);
            if (bgFeat.modSkill) passMods[bgFeat.modSkill.id] += bgFeat.modSkill.val;
            if (bgSelectedOpt) {
                if (bgSelectedOpt.modAllSkills) SKILL_LIST.forEach(sk => passMods[sk.id] += bgSelectedOpt.modAllSkills);
                if (bgSelectedOpt.modSkill) passMods[bgSelectedOpt.modSkill.id] += bgSelectedOpt.modSkill.val;
            }
        }

        SKILL_LIST.forEach(sk => {
            let pts = parseInt(state.skills[sk.id]);
            if (isNaN(pts)) pts = 0;
            
            const attrBonus = statsMap[sk.stat] || 0;
            const passive = passMods[sk.id] || 0;
            const total = attrBonus + pts + passive;

            // Enforce max total of 12
            if (total > maxSkillMod) {
                pts = maxSkillMod - attrBonus - passive;
            }
            
            // Enforce floor of 0 (unless pts is 0)
            if (pts !== 0 && total < 0) {
                pts = -(attrBonus + passive);
            }

            state.skills[sk.id] = pts;
            skillSpent += pts;
        });

        // Enforce Skill Budget
        if (skillSpent > skillBudget) {
            let excess = skillSpent - skillBudget;
            // Reduce skill points in reverse order to fit budget
            // Note: We can reduce pts into negative range as long as total >= 0
            for (let i = SKILL_LIST.length - 1; i >= 0 && excess > 0; i--) {
                const sk = SKILL_LIST[i];
                let pts = state.skills[sk.id] || 0;
                const attrBonus = statsMap[sk.stat] || 0;
                const passive = passMods[sk.id] || 0;
                
                // How many points can we take away? 
                // Only until total (attr + pts + passive) reaches 0.
                const currentTotal = attrBonus + pts + passive;
                const maxReduction = Math.max(0, currentTotal); 
                
                const reduce = Math.min(maxReduction, excess);
                state.skills[sk.id] -= reduce;
                excess -= reduce;
            }
        }
    }

    // 6. Automatic recovery on level change (Full Heal and Resource Restore)
    const derived = computeDerived(state);
    if (state.lastLeveledUpAt === undefined) state.lastLeveledUpAt = state.level;

    if (state.level !== state.lastLeveledUpAt) {
        state.hpCurrent = derived.maxHP;
        state.hdCurrent = derived.hdMax;

        // Restore dynamic resources
        if (derived.resourceMaxes) {
            Object.keys(derived.resourceMaxes).forEach(id => {
                state.resourceValues[id] = derived.resourceMaxes[id];
            });
        }

        state.lastLeveledUpAt = state.level;
    }

    // Ensure resource values are non-negative numbers
    if (state.resourceValues && typeof state.resourceValues === 'object') {
        for (const [key, value] of Object.entries(state.resourceValues)) {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0) {
                state.resourceValues[key] = num;
            } else {
                state.resourceValues[key] = 0;
            }
        }
    }

    // Ensure gold is non-negative
    if (typeof state.gold === 'number' && !isNaN(state.gold)) {
        state.gold = Math.max(0, state.gold);
    } else {
        state.gold = 0;
    }

    // Ensure wounds non-negative
    if (typeof state.wounds === 'number' && !isNaN(state.wounds)) {
        state.wounds = Math.max(0, state.wounds);
    } else {
        state.wounds = 0;
    }

    // Ensure tempHP non-negative
    if (typeof state.tempHP === 'number' && !isNaN(state.tempHP)) {
        state.tempHP = Math.max(0, state.tempHP);
    } else {
        state.tempHP = 0;
    }

    // Ensure advantage is within bounds
    if (typeof state.advantage === 'number' && !isNaN(state.advantage)) {
        state.advantage = Math.min(3, Math.max(-3, state.advantage));
    } else {
        state.advantage = 0;
    }

    // Ensure actionsSpent is within valid bounds
    if (typeof state.actionsSpent === 'number' && !isNaN(state.actionsSpent)) {
        state.actionsSpent = Math.min(derived.maxActions, Math.max(0, state.actionsSpent));
    } else {
        state.actionsSpent = 0;
    }

    // Ensure hpCurrent and hdCurrent are either null or non-negative numbers
    if (state.hpCurrent !== null) {
        const hp = parseFloat(state.hpCurrent);
        if (!isNaN(hp) && hp >= 0) {
            state.hpCurrent = hp;
        } else {
            state.hpCurrent = null;
        }
    }
    if (state.hdCurrent !== null) {
        const hd = parseFloat(state.hdCurrent);
        if (!isNaN(hd) && hd >= 0) {
            state.hdCurrent = hd;
        } else {
            state.hdCurrent = null;
        }
    }

    // Ensure furyDice is an array of objects with total property? We'll just ensure it's an array.
    if (!Array.isArray(state.furyDice)) {
        state.furyDice = [];
    } else {
        // Optionally validate each element, but skip for brevity.
    }

    // Ensure selected* arrays are arrays
    const selectionKeys = [
        'selectedDecrees', 'selectedSpells', 'selectedArsenal', 'selectedToth',
        'selectedMastery', 'selectedGreater', 'selectedLesser', 'selectedGraces',
        'selectedLyrical', 'selectedBoons', 'selectedMartial', 'selectedUnderhanded',
        'selectedDeepKnowledge', 'secondarySchool', 'selectedSubclassSpells',
        'selectedStudy', 'selectedTwilight', 'selectedShadowmastery', 'currentForm'
    ];
    selectionKeys.forEach(key => {
        if (!Array.isArray(state[key])) {
            state[key] = [];
        }
    });

    return state;
}

/**
 * Calculates the current total for the four primary attributes.
 * @param {Object} s - Character state object.
 * @returns {Object} Map of str, dex, int, wil totals.
 */
const getStatsMap = (s) => ({
    str: (s.baseStr || 0) + (s.addStr || 0),
    dex: (s.baseDex || 0) + (s.addDex || 0),
    int: (s.baseInt || 0) + (s.addInt || 0),
    wil: (s.baseWil || 0) + (s.addWil || 0)
});

/**
 * Calculates all passive skill modifiers from ancestry and background.
 * @param {Object} s - Character state object.
 * @returns {Object} Map of skill id to total passive bonus.
 */
const getPassMods = (s) => {
    let pass = {};
    SKILL_LIST.forEach(sk => pass[sk.id] = 0);
    
    const ancFeat = ANCESTRY_FEATURES[s.ancestry];
    const bgFeat = BACKGROUND_FEATURES[s.background];
    let bgSelectedOpt = null;
    if (bgFeat && bgFeat.options && s[bgFeat.stateKey]) {
        bgSelectedOpt = bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === s[bgFeat.stateKey]);
    }

    if (ancFeat) {
        if (ancFeat.modAllSkills) SKILL_LIST.forEach(sk => pass[sk.id] += ancFeat.modAllSkills);
        if (ancFeat.modSkill) pass[ancFeat.modSkill.id] += ancFeat.modSkill.val;
    }
    if (bgFeat) {
        if (bgFeat.modAllSkills) SKILL_LIST.forEach(sk => pass[sk.id] += bgFeat.modAllSkills);
        if (bgFeat.modSkill) pass[bgFeat.modSkill.id] += bgFeat.modSkill.val;
        if (bgSelectedOpt) {
            if (bgSelectedOpt.modAllSkills) SKILL_LIST.forEach(sk => pass[sk.id] += bgSelectedOpt.modAllSkills);
            if (bgSelectedOpt.modSkill) pass[bgSelectedOpt.modSkill.id] += bgSelectedOpt.modSkill.val;
        }
    }
    return pass;
};

/**
 * master calculation engine for character stats.
 * Runs on every state change to refresh all derived numbers.
 * @param {Object} s - Character state object.
 * @returns {Object} Comprehensive map of all derived stats.
 */
function computeDerived(s) {
    const level = s.level || 1;
    const statsMap = getStatsMap(s);
    const ancFeat = ANCESTRY_FEATURES[s.ancestry];
    const bgFeat = BACKGROUND_FEATURES[s.background];
    const config = CLASS_CONFIG;

    // Attribute Point Tracking (Revised NIMBLE v2.2 Rules)
    const keyMilestones = [4, 8, 12, 16];
    const secMilestones = [5, 9, 13, 17];
    const keyGains = keyMilestones.filter(l => level >= l).length;
    const secGains = secMilestones.filter(l => level >= l).length;
    const flexBudget = level >= 20 ? 2 : 0;

    const keyStats = (config.keyStats || []).map(stat => stat.charAt(0).toUpperCase() + stat.slice(1));
    const stats = ['Str', 'Dex', 'Int', 'Wil'];
    
    const init = config.initialStats || {};
    let baseKeyBudget = 0;
    let baseSecBudget = 0;
    stats.forEach(s => {
        const val = init[`base${s}`] || 0;
        if (keyStats.includes(s)) baseKeyBudget += val;
        else baseSecBudget += val;
    });

    const keyBudget = baseKeyBudget + keyGains;
    const secBudget = baseSecBudget + secGains;
    
    let keySpent = 0;
    let secSpent = 0;
    stats.forEach(attr => {
        const val = (s[`base${attr}`] || 0) + (s[`add${attr}`] || 0);
        if (keyStats.includes(attr)) keySpent += val;
        else secSpent += val;
    });

    const keyOver = Math.max(0, keySpent - keyBudget);
    const secOver = Math.max(0, secSpent - secBudget);
    const flexSpent = keyOver + secOver;
    const flexRemaining = flexBudget - flexSpent;

    const keyUnspent = Math.max(0, keyBudget - keySpent);
    const secUnspent = Math.max(0, secBudget - secSpent);

    // Resolve specific background option if chosen
    let bgSelectedOpt = null;
    if (bgFeat && bgFeat.options && s[bgFeat.stateKey]) {
        bgSelectedOpt = bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === s[bgFeat.stateKey]);
    }

    // 1. Hit Dice Face (Class-based, modified by Ancestry)
    let hdFace = CLASS_CONFIG.hitDie || 10;
    if (ancFeat && ancFeat.modHDStep) {
        const dieSteps = [6, 8, 10, 12, 20];
        let idx = dieSteps.indexOf(hdFace);
        if (idx !== -1) {
            idx = Math.min(dieSteps.length - 1, idx + ancFeat.modHDStep);
            hdFace = dieSteps[idx];
        }
    }

    // 2. HP per Level & Max HP
    // Standard NIMBLE mapping of Hit Die size to HP growth
    const hpPerLevelMap = { 6: 5, 8: 6, 10: 8, 12: 9, 20: 14 };
    const hpPerLevel = hpPerLevelMap[hdFace] || CLASS_CONFIG.hpPerLevel;
    const maxHP = (CLASS_CONFIG.baseHp || 10) + ((level - 1) * hpPerLevel);

    // 3. Max Hit Dice (Level + racial/background bonuses)
    let maxHD = level + (ancFeat?.modHD || 0) + (bgFeat?.modHD || 0) + (bgSelectedOpt?.modHD || 0);

    const strMod = statsMap.str;
    const hdNotation = `1d${hdFace}${strMod >= 0 ? '+' : ''}${strMod}`;

    // 4. Base Stats & Overrides from Class logic
    const classDerived = CLASS_CONFIG.getDerivedStats ? CLASS_CONFIG.getDerivedStats(level, s.subclass, s) : {};
    const classOverrides = CLASS_CONFIG.getStatOverrides ? CLASS_CONFIG.getStatOverrides(level, s.subclass, s, statsMap, maxHP) : {};
    const isBloodied = CLASS_CONFIG.isBloodied(s, maxHP);
    const isDying = (s.hpCurrent ?? maxHP) === 0;
    const isWounded = (s.wounds || 0) > 0;

    // 5. Initiative (DEX + modifiers)
    let initiative = statsMap.dex + (classOverrides.init || 0) + (ancFeat?.modInit || 0) + (bgFeat?.modInit || 0) + (bgSelectedOpt?.modInit || 0);

    // 6. Speed (Base 6 + modifiers)
    let speed = (classDerived.speed || 6) + (classOverrides.speed || 0) + (ancFeat?.modSpeed || 0) + (bgFeat?.modSpeed || 0) + (bgSelectedOpt?.modSpeed || 0);
    let armorIsLight = true;

    // 7. Wounds (Class base + modifiers)
    let woundMax = Math.max(1, (classDerived.woundMax || 6) + (classOverrides.woundMax || 0) + (ancFeat?.modWounds || 0) + (bgFeat?.modWounds || 0) + (bgSelectedOpt?.modWounds || 0));

    // 8. Actions (Standard 3, modified by Class and Conditions)
    const potentialActions = 3 + (classOverrides.maxActions || 0);
    let maxActions = potentialActions;
    
    // Auto-calculate effective conditions for mechanics
    const effectiveConditions = [...(s.activeConditions || [])];
    if (isBloodied && !effectiveConditions.includes('bloodied')) effectiveConditions.push('bloodied');
    if (isDying && !effectiveConditions.includes('dying')) effectiveConditions.push('dying');
    if (isWounded && !effectiveConditions.includes('wounded')) effectiveConditions.push('wounded');

    effectiveConditions.forEach(cId => {
        const c = CONDITIONS_LIST.find(cl => cl.id === cId);
        if (c) {
            if (c.modSpeedMult !== undefined) {
                if (typeof speed === 'number') speed = Math.floor(speed * c.modSpeedMult);
            }
            if (c.modMaxActions) maxActions += c.modMaxActions;
        }
    });
    maxActions = Math.max(0, maxActions);

    // 9. Skill Passives (Ancestry and Background bonuses)
    const passMods = getPassMods(s);

    let unarmored = true;
    s.inventory.forEach(item => { 
        if (item.type === 'armor' && item.equipped) unarmored = false;
    });

    let armorVal = classOverrides.armorBase !== undefined ? classOverrides.armorBase : statsMap.dex;
    let bestArmorVal = -1;
    let shieldBonus = classOverrides.shieldBonus || 0;

    s.inventory.forEach(item => {
        if (!item.equipped) return;
        if (item.type === 'armor') {
            const base = parseInt(item.armor) || 0;
            // DEX cap logic: Light (no cap), Medium (max 2), Heavy (max 0)
            const dMax = item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0);
            const currentArmor = base + Math.min(statsMap.dex, dMax);
            if (currentArmor > bestArmorVal) bestArmorVal = currentArmor;
            if (item.armorType !== 'light') armorIsLight = false;
        } else if (item.type === 'shield') {
            shieldBonus += (parseInt(item.armor) || 0);
        }
    });

    if (bestArmorVal !== -1) armorVal = bestArmorVal;
    else if (classOverrides.armorBase === undefined) {
        // No armor and no base override - ensure we use DEX
        armorVal = statsMap.dex;
    }

    // Apply final composite AC modifiers
    armorVal += shieldBonus;
    if (classOverrides.armor) armorVal += classOverrides.armor;
    if (ancFeat?.modArmor) armorVal += ancFeat.modArmor;
    if (bgFeat?.modArmor) armorVal += bgFeat.modArmor;
    if (bgSelectedOpt?.modArmor) armorVal += bgSelectedOpt.modArmor;

    // Flight check (only works in light/no armor)
    if ((ancFeat?.modFlySpeed || classOverrides.modFlySpeed) && armorIsLight) {
        speed = `${speed} (${speed} Fly)`;
    }

    // 11. Resource Maxes (Mana, Class-specific pools)
    const resourceMaxes = {};
    const combinedResources = CLASS_CONFIG.getCombinedResources ? CLASS_CONFIG.getCombinedResources(s.subclass, s) : (CLASS_CONFIG.resources || []);
    combinedResources.forEach(r => {
        resourceMaxes[r.id] = r.calcMax(level, statsMap, s, s.subclass, classDerived);
    });

    // 12. Spell Tier (Calculates highest unlocked spell tier based on level)
    let maxTier = 0;
    if (CLASS_CONFIG.getAvailableSpells || CLASS_CONFIG.spellProgression) {
        const subConfig = CLASS_CONFIG.getSubclassConfig ? CLASS_CONFIG.getSubclassConfig(s.subclass) : {};
        const progress = subConfig.spellProgression || CLASS_CONFIG.spellProgression || [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

        for (let i = progress.length - 1; i >= 0; i--) {
            if (level >= progress[i]) {
                maxTier = i;
                break;
            }
        }
    }

    return {
        ...classOverrides,
        ...classDerived,
        level,
        statsMap,
        hdFace,
        maxHP,
        isBloodied,
        hdMax: maxHD,
        armor: armorVal,
        speed,
        initiative,
        woundMax,
        maxActions,
        potentialActions,
        resourceMaxes,
        maxTier,
        hdNotation,
        passMods,
        initAdv: classOverrides.initAdv || false,
        size: bgFeat?.modSize || ancFeat?.modSize || classDerived.size || "Med",
        keyBudget,
        keySpent,
        secBudget,
        secSpent,
        flexBudget,
        flexRemaining,
        keyUnspent,
        secUnspent
    };
}

/**
 * Generates a unique key for local storage based on the character class and filename.
 * @returns {string} The storage key.
 */
const getStorageKey = () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return `nimble_v4_${CLASS_CONFIG.name.toLowerCase()}_${filename}`;
};

const STORAGE_KEY = getStorageKey();

/**
 * Placeholder for embedded state injection.
 * This is used when a character sheet is exported as a standalone HTML file.
 */
const EMBEDDED_STATE = null;

/** The master character state object. Initialized with defaults to prevent race conditions during UI setup. */
let state = ensureValidState({});

/**
 * Global character state dispatcher.
 * Centralizes all state mutations through a single choke point to ensure unidirectional data flow.
 * @param {Object} action - Action object containing type and payload.
 */
function dispatch(action) {
    const oldState = JSON.parse(JSON.stringify(state));
    
    // Apply mutation via reducer
    state = characterReducer(state, action);

    // Side Effects: Animations
    if (typeof triggerAnimation === 'function') {
        if (state.hpCurrent > oldState.hpCurrent) triggerAnimation('displayCurrentHP', 'green');
        else if (state.hpCurrent < oldState.hpCurrent) triggerAnimation('displayCurrentHP', 'red');
        
        if (state.tempHP < oldState.tempHP) triggerAnimation('displayTempHP', 'red');
    }

    // Persist and Notify
    saveState();
    if (typeof window !== 'undefined' && window.eventBus !== null) {
        window.eventBus.publish('STATE_CHANGED', { state: {...state} });
    }
}

/**
 * Pure reducer function that handles all character state transitions.
 * @param {Object} currentState - The current character state.
 * @param {Object} action - The action to perform.
 * @returns {Object} The new state object.
 */
function characterReducer(currentState, action) {
    const s = JSON.parse(JSON.stringify(currentState)); // Deep copy for immutability
    const { type, payload } = action;

    switch (type) {
        case 'SET_SPELL_UPCAST': {
            const { name, tier, choiceId } = payload;
            if (!s.spellUpcasts) s.spellUpcasts = {};
            s.spellUpcasts[name] = { tier, choiceId };
            break;
        }
        case 'ADJ_HP': {
            const { amount, isAbsolute } = payload;
            const derived = computeDerived(s);
            const max = derived.maxHP;
            const current = s.hpCurrent ?? max;
            
            if (isAbsolute) {
                s.hpCurrent = Math.min(max, Math.max(0, amount));
            } else if (amount < 0) {
                let dmg = Math.abs(amount);
                if ((s.tempHP || 0) > 0) {
                    const absorbed = Math.min(s.tempHP, dmg);
                    s.tempHP -= absorbed;
                    dmg -= absorbed;
                }
                if (dmg > 0) {
                    s.hpCurrent = Math.max(0, current - dmg);
                }
            } else {
                s.hpCurrent = Math.min(max, current + amount);
            }
            break;
        }
        case 'ADJ_TEMP_HP': {
            const { amount, isAbsolute } = payload;
            s.tempHP = Math.max(0, isAbsolute ? amount : (s.tempHP || 0) + amount);
            break;
        }
        case 'ADJ_HD': {
            const { amount, isAbsolute } = payload;
            const derived = computeDerived(s);
            const max = derived.hdMax;
            s.hdCurrent = Math.min(max, Math.max(0, isAbsolute ? amount : (s.hdCurrent === null ? max : s.hdCurrent) + amount));
            break;
        }
        case 'ADJ_RES': {
            const { id, amount, max, isAbsolute } = payload;
            let oldVal = s.resourceValues[id] || 0; 
            s.resourceValues[id] = Math.min(max || 999, Math.max(0, isAbsolute ? amount : oldVal + amount));
            break;
        }
        case 'SET_STATE_KEY': {
            s[payload.key] = payload.value;

            // Auto-reset vitals and class resources on level change
            if (payload.key === 'level') {
                const derived = computeDerived(s);
                s.hpCurrent = derived.maxHP;
                s.hdCurrent = derived.hdMax;

                // Reset dynamic class resources (Mana, Lay on Hands, etc.)
                if (derived.resourceMaxes) {
                    Object.keys(derived.resourceMaxes).forEach(id => {
                        s.resourceValues[id] = derived.resourceMaxes[id];
                    });
                }
            }
            break;
        }
        case 'UPDATE_CLASS_STATE': {
            const { key, index, value } = payload;
            if (!s[key]) s[key] = []; 
            s[key][index] = value;
            break;
        }
        case 'TOGGLE_BG_PIP': {
            const { key, idx } = payload;
            const val = s[key] || 0; 
            s[key] = (val === idx + 1) ? idx : idx + 1;
            break;
        }
        case 'UPDATE_ITEM': {
            const { id, field, val, check } = payload;
            let item = s.inventory.find(i => i.id === id); 
            if (item) { 
                item[field] = check ? val : (field === 'slots' || field === 'armor' || field === 'cost' ? parseFloat(val) : val); 
            }
            break;
        }
        case 'DELETE_ITEM': {
            const { id } = payload;
            let item = s.inventory.find(i => i.id === id);
            if (item) {
                s.gold += (item.cost || 0);
            }
            s.inventory = s.inventory.filter(i => i.id !== id);
            break;
        }
        case 'ADD_ITEM': {
            s.inventory.push({ 
                id: Date.now(), 
                category: '',
                reach: '1',
                ...payload.item 
            });
            break;
        }
        case 'ADD_QUICK_ITEM': {
            const { itemData } = payload;
            s.gold -= (itemData.cost || 0);
            s.inventory.push({
                id: Date.now(),
                name: itemData.name,
                type: itemData.type,
                category: itemData.category || '',
                slots: itemData.slots,
                equipped: itemData.equipped,
                dmgDice: itemData.dmgDice || '1d6',
                stat: itemData.stat || 'str',
                reach: itemData.reach || (itemData.type === 'weapon' ? '1' : '-'),
                props: itemData.props || '',
                armor: itemData.armor || 0,
                armorType: itemData.armorType || (itemData.type === 'armor' ? 'light' : ''),
                cost: itemData.cost || 0,
                isLibraryItem: !!itemData.isLibraryItem
            });
            break;
        }        case 'TOGGLE_CONDITION': {
            const { id } = payload;
            if (s.activeConditions.includes(id)) {
                s.activeConditions = s.activeConditions.filter(c => c !== id);
            } else {
                s.activeConditions.push(id);
            }
            break;
        }
        case 'UPDATE_SKILL': {
            const { id, val } = payload;
            const newPts = parseInt(val) || 0;
            const oldPts = s.skills[id] || 0;
            
            const statsMap = getStatsMap(s);
            const passMods = getPassMods(s);
            const skillDef = SKILL_LIST.find(sk => sk.id === id);
            const attrBonus = skillDef ? statsMap[skillDef.stat] : 0;
            const passive = passMods[id] || 0;

            const oldTotal = attrBonus + oldPts + passive;
            const naturalTotal = attrBonus + passive;
            
            // 1. Enforce max total modifier of 12
            let clampedPts = Math.min(newPts, 12 - attrBonus - passive);
            
            // 2. Enforce floor of 0 
            // Rule: Total >= 0, UNLESS (pts is 0 AND old total was already negative)
            // Rule 2: If old total was >= 0, new total MUST be >= 0 (Lock-in)
            if (oldTotal >= 0 || clampedPts !== 0) {
                clampedPts = Math.max(clampedPts, -(attrBonus + passive));
            } else {
                // They are at pts=0 and total is negative. 
                // They can't make it even more negative.
                clampedPts = Math.max(clampedPts, 0); 
            }

            // 3. Enforce Budget
            const skillBudget = 4 + (s.level - 1);
            const currentSpent = SKILL_LIST.reduce((sum, sk) => sum + (s.skills[sk.id] || 0), 0);
            const remaining = skillBudget - (currentSpent - oldPts);
            
            // Note: Buying back points (negative pts) increases the remaining budget
            s.skills[id] = Math.min(clampedPts, remaining);
            break;
        }
        case 'HANDLE_WOUND_CLICK': {
            const { i, isAbsolute } = payload;
            if (isAbsolute) {
                s.wounds = i;
            } else {
                s.wounds = (s.wounds === i + 1) ? i : i + 1;
            }
            break;
        }
        case 'UPDATE_POOL': {
            s[payload.key] = payload.dice;
            break;
        }
        case 'IMPORT_STATE': {
            return validateAndCorrectState(ensureValidState(payload.newState));
        }
        case 'SYNC_STATE': {
            return validateAndCorrectState(s);
        }
        case 'REST_CHARACTER': {
            // 1. Comprehensive Reset of Toggles and Pips
            // We reset anything that isn't core identity, base stats, or vitals
            const protectedKeys = ['version', 'charName', 'level', 'ancestry', 'background', 'subclass', 'gold', 'inventory', 'skills', 'activeConditions', 'resourceValues', 'spellUpcasts', 'bgSpell', 'showMinor', 'lastLeveledUpAt', 'hpCurrent', 'hdCurrent'];
            
            Object.keys(s).forEach(key => {
                if (protectedKeys.includes(key)) return;
                if (key.startsWith('base') || key.startsWith('add')) return;

                // Reset Booms and choice strings
                if (typeof s[key] === 'string') {
                    if (s[key] === 'BOOM') s[key] = 'OFF';
                }
                // Reset numeric usage pips
                else if (typeof s[key] === 'number') {
                    s[key] = 0;
                }
            });

            // 2. Vitals Reset (Calculated based on the clean state)
            const dStat = computeDerived(s);
            s.hpCurrent = dStat.maxHP;
            s.hdCurrent = dStat.hdMax;
            s.tempHP = 0;
            s.wounds = 0;
            s.activeConditions = []; // Clear all conditions on Safe Rest
            s.actionsSpent = 0;
            s.advantage = 0;
            s.furyDice = [];
            s.judgmentDice = [];
            s.greedyResult = '';
            s.greedyBonus = 'OFF';
            s.freeCast = 'OFF';
            
            // 3. Refill resources
            Object.keys(dStat.resourceMaxes).forEach(id => {
                // Exception: Spellblade mana is gained on Initiative only
                const isSpellbladeMana = id === 'mana' && CLASS_CONFIG.name === 'Commander' && s.subclass === 'Spellblade';
                if (!isSpellbladeMana) {
                    s.resourceValues[id] = dStat.resourceMaxes[id];
                } else {
                    s.resourceValues[id] = 0; // Clear it on safe rest so it can be gained fresh on init
                }
            });
            
            return validateAndCorrectState(s);
        }
        default:
            console.warn(`Unknown action type: ${type}`);
            return s;
    }

    return validateAndCorrectState(s);
}

/**
 * Saves the character state to LocalStorage.
 * @param {Object|null} newState - Optional state object to overwrite the current state.
 */
function saveState(newState = null) {
    if (newState) {
        // Parse and validate the provided state
        try {
            state = validateAndCorrectState(ensureValidState(newState));
        } catch (e) {
            console.error("Failed to parse provided state:", e);
            return; 
        }
    }

    // 7. Persist to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Clear pure function cache since state has changed
    clearPureFunctionCache();

    // Publish state saved event
    if (typeof window !== 'undefined' && window.eventBus !== null) {
        window.eventBus.publish('STATE_SAVED', { state: {...state} });
    }
}

/**
 * Initializes the character state.
 * Loads from EMBEDDED_STATE (export mode) or LocalStorage.
 * Falls back to class defaults for new characters.
 * @param {Object} config - The class configuration to use.
 */
function loadState(config) {
    // 1. Define standard state schema and defaults
    state = {
        version: "2.5.0",
        charName: '',        level: 1,
        ancestry: 'None',
        background: 'None',
        subclass: 'None',
        baseStr: 0, addStr: 0,
        baseDex: 0, addDex: 0,
        baseInt: 0, addInt: 0,
        baseWil: 0, addWil: 0,
        hpCurrent: null,
        tempHP: 0,
        hdCurrent: null,
        wounds: 0,
        skills: {},
        activeConditions: [],
        inventory: [],
        gold: 0,
        resourceValues: {},
        bgSpell: 'None',
        showMinor: false,

        // Multi-selection feature states
        selectedDecrees: [], selectedSpells: [], selectedArsenal: [], selectedToth: [],
        selectedMastery: [], selectedGreater: [], selectedLesser: [], selectedGraces: [],
        selectedLyrical: [], selectedBoons: [], selectedMartial: [], selectedUnderhanded: [],
        selectedDeepKnowledge: [], secondarySchool: [], selectedSubclassSpells: [],
        selectedStudy: [], selectedTwilight: [], selectedShadowmastery: [],

        currentForm: [],
        furyDice: [],
        judgmentDice: null,
        judgmentBoom: 'OFF',
        judgmentMode: 'Single',
        furyBoom: 'OFF',

        advantage: 0,
        actionsSpent: 0,
        spellUpcasts: {}
    };

    // 2. Load from storage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (EMBEDDED_STATE) {
        Object.assign(state, EMBEDDED_STATE);
    } else if (raw) {
        try {
            const loaded = JSON.parse(raw);
            Object.assign(state, loaded);
        } catch(e) {
            console.error("Failed to load character state:", e);
        }
    }
    // Ensure state is valid and has correct types/defaults, and apply game-specific corrections
    state = validateAndCorrectState(state);

    // 3. Apply class-specific initial stats for brand new characters
    if (state.level === 1 && !state.charName) {
        if (config.initialStats) {
            Object.assign(state, config.initialStats);
        }
    }

    // 4. Publish state loaded event (if eventBus is available)
    if (typeof window !== 'undefined' && window.eventBus !== null) {
        window.eventBus.publish('STATE_LOADED', { state: {...state}, config });
    }

    // 5. Ensure derived totals are calculated and persisted
    const derived = computeDerived(state);
    const isNewChar = state.level === 1 && !state.charName;
    if (state.hpCurrent === null || isNewChar) state.hpCurrent = derived.maxHP;
    if (state.hdCurrent === null || isNewChar) state.hdCurrent = derived.hdMax;

    // Initialize dynamic class resources for new characters
    if (isNewChar && derived.resourceMaxes) {
        Object.keys(derived.resourceMaxes).forEach(id => {
            state.resourceValues[id] = derived.resourceMaxes[id];
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Clear pure function cache since state has been initialized/loaded
    clearPureFunctionCache();
}

