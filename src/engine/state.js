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
        version: "3.0.0",
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
        logs: [], // Stores recent automated action logs
        advantage: 0,
        actionsSpent: 0,
        spellUpcasts: {} // stores { [spellName]: { tier: number, choiceId: string } }
    };

    // Dynamically merge class-specific defaults
    if (typeof CLASS_CONFIG !== 'undefined' && CLASS_CONFIG.classDefaults) {
        Object.assign(defaults, CLASS_CONFIG.classDefaults);
    }

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
    const config = CLASS_CONFIG;
    
    // 0. Class-specific validation hook (v2.6.0)
    // Allows classes to implement 'revert' logic for level-dependent active state
    if (config.validateState) {
        config.validateState(state);
    }

    // Ensure level is a valid number between 1 and 20
    if (typeof state.level === 'number' && !isNaN(state.level)) {
        state.level = Math.min(20, Math.max(1, state.level));
    } else {
        state.level = 1;
    }

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

    // 6. Automatic recovery on level change (Resource Restore)
    const derived = computeDerived(state);
    if (state.lastLeveledUpAt === undefined) state.lastLeveledUpAt = state.level;

    if (state.level !== state.lastLeveledUpAt) {
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

    // Ensure hpCurrent and hdCurrent are either null or non-negative numbers, clamped to their maximums
    if (state.hpCurrent !== null) {
        const hp = parseFloat(state.hpCurrent);
        if (!isNaN(hp) && hp >= 0) {
            state.hpCurrent = Math.min(derived.maxHP, hp);
        } else {
            state.hpCurrent = null;
        }
    }
    if (state.hdCurrent !== null) {
        const hd = parseFloat(state.hdCurrent);
        if (!isNaN(hd) && hd >= 0) {
            state.hdCurrent = Math.min(derived.hdMax, hd);
        } else {
            state.hdCurrent = null;
        }
    }

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
    const subclass = s.subclass || "None";
    
    // 0. Generate Clamped State (v2.5.0)
    // Ensures selections beyond the current level's limits are ignored in calculations
    const limits = CLASS_CONFIG.getActiveStateKeyLimits(level, subclass, s);
    const state = { ...s }; // Shallow copy for local mutation
    Object.keys(limits).forEach(key => {
        if (Array.isArray(state[key])) {
            state[key] = state[key].slice(0, limits[key]);
        }
    });

    const statsMap = getStatsMap(state);
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    const bgFeat = BACKGROUND_FEATURES[state.background];
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

    // 1. Baseline Hit Dice Face (Class-based, modified by Ancestry)
    let hdFaceBase = CLASS_CONFIG.hitDie || 10;
    if (ancFeat && ancFeat.modHDStep) {
        const dieSteps = [6, 8, 10, 12, 20];
        let idx = dieSteps.indexOf(hdFaceBase);
        if (idx !== -1) {
            idx = Math.min(dieSteps.length - 1, idx + ancFeat.modHDStep);
            hdFaceBase = dieSteps[idx];
        }
    }

    const hpPerLevelMap = { 6: 5, 8: 6, 10: 8, 12: 9, 20: 14 };

    // 2. Define standard base values for all attributes in ATTRIBUTE_SCHEMA
    const derivedBase = {
        baseHp: CLASS_CONFIG.baseHp || 10,
        hpPerLevel: hpPerLevelMap[hdFaceBase] || CLASS_CONFIG.hpPerLevel || 5,
        hdFace: hdFaceBase,
        hdMax: level,
        init: statsMap.dex,
        initAdv: false,
        speedBase: 6,
        speed: 0,
        woundMax: 6,
        maxActions: 0,
        armorBase: statsMap.dex,
        armor: 0,
        shieldBonus: 0,
        allSaveAdv: false,
        allSaveDis: false,
        profArmor: CLASS_CONFIG.proficiencies?.armor ? [CLASS_CONFIG.proficiencies.armor] : [],
        profWeapons: CLASS_CONFIG.proficiencies?.weapons ? [CLASS_CONFIG.proficiencies.weapons] : [],
        modFlySpeed: false,
        quickRestLoh: false,
        panel_surge: false
    };

    // 3. Convert active Ancestry, Background, and Background Option to standard modifiers
    const externalModifiers = [];
    const addExternalMod = (feat) => {
        if (!feat) return;
        if (feat.modHD) externalModifiers.push({ stat: 'hdMax', value: feat.modHD });
        if (feat.modInit) externalModifiers.push({ stat: 'init', value: feat.modInit });
        if (feat.modInitAdv) externalModifiers.push({ stat: 'initAdv', value: true });
        if (feat.modSpeed) externalModifiers.push({ stat: 'speed', value: feat.modSpeed });
        if (feat.modWounds) externalModifiers.push({ stat: 'woundMax', value: feat.modWounds });
        if (feat.modArmor) externalModifiers.push({ stat: 'armor', value: feat.modArmor });
        if (feat.profArmor) externalModifiers.push({ stat: 'profArmor', value: feat.profArmor });
        if (feat.profWeapons) externalModifiers.push({ stat: 'profWeapons', value: feat.profWeapons });
    };

    addExternalMod(ancFeat);
    addExternalMod(bgFeat);
    addExternalMod(bgSelectedOpt);

    // First fold pass: fold class, subclass, ancestry, and background modifiers to determine baseline metrics (e.g. maxHP)
    const subConfig = CLASS_CONFIG.getSubclassConfig(subclass, state);
    let combinedModifiers = [
        ...(CLASS_CONFIG.statModifiers || []), 
        ...(subConfig.statModifiers || []),
        ...externalModifiers
    ];

    let folded = typeof reduceModifiers === 'function' 
        ? reduceModifiers(combinedModifiers, level, subclass, state, statsMap, derivedBase)
        : { ...derivedBase };

    const baseMaxActions = folded.maxActions;

    // 4. Sequential Resolution (HP, HD scaling dependencies)
    folded.hpPerLevel = hpPerLevelMap[folded.hdFace] || CLASS_CONFIG.hpPerLevel || 5;
    folded.maxHP = folded.baseHp + ((level - 1) * folded.hpPerLevel);

    // 5. Resolve Conditions for Speed and Actions
    const isBloodied = state.hpCurrent !== null ? state.hpCurrent <= (folded.maxHP / 2) : false;
    const isDying = (state.hpCurrent ?? folded.maxHP) === 0;
    const isWounded = (state.wounds || 0) > 0;
    
    const effectiveConditions = [...(state.activeConditions || [])];
    if (isBloodied && !effectiveConditions.includes('bloodied')) effectiveConditions.push('bloodied');
    if (isDying && !effectiveConditions.includes('dying')) effectiveConditions.push('dying');
    if (isWounded && !effectiveConditions.includes('wounded')) effectiveConditions.push('wounded');

    // Resolve implied conditions (implied triggers & tag-alongs)
    if (effectiveConditions.includes('petrified') && !effectiveConditions.includes('incapacitated')) {
        effectiveConditions.push('incapacitated');
    }
    const hamperedTriggers = ['dazed', 'grappled', 'prone', 'slowed', 'incapacitated', 'petrified', 'dying', 'frightened'];
    if (hamperedTriggers.some(c => effectiveConditions.includes(c)) && !effectiveConditions.includes('hampered')) {
        effectiveConditions.push('hampered');
    }

    // Fold active condition maxActions reductions
    effectiveConditions.forEach(cId => {
        const c = CONDITIONS_LIST.find(cl => cl.id === cId);
        if (c && c.modMaxActions) {
            externalModifiers.push({ stat: 'maxActions', value: c.modMaxActions });
        }
    });

    // Re-fold including dynamically determined active condition modifiers
    combinedModifiers = [
        ...(CLASS_CONFIG.statModifiers || []), 
        ...(subConfig.statModifiers || []),
        ...externalModifiers
    ];

    folded = typeof reduceModifiers === 'function' 
        ? reduceModifiers(combinedModifiers, level, subclass, state, statsMap, derivedBase)
        : { ...derivedBase };

    // Re-resolve sequential HP/HD dependencies with fully reduced stats
    folded.hpPerLevel = hpPerLevelMap[folded.hdFace] || CLASS_CONFIG.hpPerLevel || 5;
    folded.maxHP = folded.baseHp + ((level - 1) * folded.hpPerLevel);

    // 6. Resolve AC with inventory and modifiers
    const allowedArmor = new Set();
    const profArmorList = folded.profArmor || [];
    profArmorList.forEach(p => {
        const pLower = p.toLowerCase();
        if (pLower.includes("all armor") || pLower.includes("plate")) {
            allowedArmor.add("cloth").add("leather").add("mail").add("plate").add("shields").add("light").add("medium").add("heavy");
        }
        if (pLower.includes("mail")) {
            allowedArmor.add("cloth").add("leather").add("mail").add("light").add("medium");
        }
        if (pLower.includes("leather")) {
            allowedArmor.add("cloth").add("leather").add("light");
        }
        if (pLower.includes("cloth")) {
            allowedArmor.add("cloth").add("light");
        }
        if (pLower.includes("shields") || pLower.includes("shield")) {
            allowedArmor.add("shields");
        }
    });

    let hasNonProficientEquipped = false;
    let armorIsLight = true;
    let bestArmorVal = -1;
    let inventoryShieldBonus = 0;
    (state.inventory || []).forEach(item => {
        if (!item.equipped) return;
        
        const isArmorItem = item.type === 'armor';
        const isShieldItem = item.type === 'shield';
        if (isArmorItem || isShieldItem) {
            const cat = (item.category || "").toLowerCase();
            const targetCat = cat.includes("shield") ? "shields" : cat;
            const hasAllArmorProf = allowedArmor.has("plate") && allowedArmor.has("shields");
            const isProficient = hasAllArmorProf || Array.from(allowedArmor).some(allowed => {
                if (allowed === 'shields') return targetCat.includes('shield');
                return targetCat.includes(allowed);
            });
            if (!isProficient) {
                hasNonProficientEquipped = true;
            }
        }

        if (isArmorItem) {
            const base = parseInt(item.armor) || 0;
            const dMax = item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0);
            const currentArmor = base + Math.min(statsMap.dex, dMax);
            if (currentArmor > bestArmorVal) bestArmorVal = currentArmor;
            if (item.armorType !== 'light') armorIsLight = false;
        } else if (isShieldItem) {
            inventoryShieldBonus += (parseInt(item.armor) || 0);
        }
    });

    let foldedArmor = folded.armorBase !== null ? folded.armorBase : statsMap.dex;
    if (bestArmorVal !== -1) {
        foldedArmor = bestArmorVal;
    }
    foldedArmor += inventoryShieldBonus + folded.shieldBonus + folded.armor;
    folded.hasNonProficientEquipped = hasNonProficientEquipped;

    // 7. Resolve Condition Speed Multipliers and final actions
    let foldedSpeed = (folded.speedBase !== null ? folded.speedBase : 6) + folded.speed;
    let foldedMaxActions = 3 + folded.maxActions;

    effectiveConditions.forEach(cId => {
        const c = CONDITIONS_LIST.find(cl => cl.id === cId);
        if (c && c.modSpeedMult !== undefined) {
            if (typeof foldedSpeed === 'number') foldedSpeed = Math.floor(foldedSpeed * c.modSpeedMult);
        }
    });
    foldedMaxActions = Math.max(0, foldedMaxActions);

    if ((folded.modFlySpeed) && armorIsLight) {
        foldedSpeed = `${foldedSpeed} (${foldedSpeed} Fly)`;
    }

    const classDerived = CLASS_CONFIG.getDerivedStats ? CLASS_CONFIG.getDerivedStats(level, subclass, state) : {};
    const passMods = getPassMods(state);

    // 7. Resource Maxes (Mana, Class-specific pools)
    const resourceMaxes = {};
    const combinedResources = CLASS_CONFIG.getCombinedResources ? CLASS_CONFIG.getCombinedResources(subclass, state) : (CLASS_CONFIG.resources || []);
    combinedResources.forEach(r => {
        resourceMaxes[r.id] = r.calcMax(level, statsMap, state, subclass, classDerived);
    });

    // 8. Spell Tier (Calculates highest unlocked spell tier based on level)
    let maxTier = 0;
    if (CLASS_CONFIG.getAvailableSpells || CLASS_CONFIG.spellProgression) {
        const progress = subConfig.spellProgression || CLASS_CONFIG.spellProgression || [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

        for (let i = progress.length - 1; i >= 0; i--) {
            if (level >= progress[i]) {
                maxTier = i;
                break;
            }
        }
    }

    const strMod = statsMap.str;
    const hdNotation = `1d${folded.hdFace}${strMod >= 0 ? '+' : ''}${strMod}`;

    return {
        ...folded,
        ...classDerived,
        level,
        statsMap,
        hdFace: folded.hdFace,
        maxHP: folded.maxHP,
        isBloodied,
        hdMax: folded.hdMax,
        armor: foldedArmor,
        speed: foldedSpeed,
        initiative: folded.init,
        woundMax: folded.woundMax,
        maxActions: foldedMaxActions,
        potentialActions: 3 + baseMaxActions,
        effectiveConditions,
        resourceMaxes,
        maxTier,
        hdNotation,
        passMods,
        initAdv: folded.initAdv || false,
        size: bgFeat?.modSize || ancFeat?.modSize || classDerived.size || folded.size || "Med",
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
 * Embedded state, read from the `#nimble-state` JSON island (src/base_template.html) rather
 * than from a source-level placeholder. When a character sheet is exported via "Save as HTML"
 * (see saveAsHTML/embedStateIntoHTML in app.js/html_export.js), the exported file's island
 * carries the character state as JSON; parsing it here means a persisted state string can never
 * break out of a <script> block or get truncated by a naive regex over the page source (issue
 * #35). A freshly-built (never exported) tracker ships the island with a literal `null` body,
 * which JSON.parse()s to `null` — identical to this file's previous hardcoded default.
 */
const EMBEDDED_STATE = (() => {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return null;
    const island = document.getElementById('nimble-state');
    const text = island && island.textContent && island.textContent.trim();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse embedded state island:", e);
        return null;
    }
})();

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

// Expose dispatch globally for non-module script access (e.g. rolls.js)
if (typeof window !== 'undefined') {
    window.dispatch = dispatch;
}

/**
 * Helper to perform absolute or relative adjustments on numeric vitals/resources with min/max clamping.
 */
function adjustNumericField(val, amt, max, abs) {
    const v = parseFloat(amt) || 0;
    return Math.min(max, Math.max(0, abs ? v : (val ?? max) + v));
}

/**
 * Pure reducer function that handles all character state transitions.
 * @param {Object} currentState - The current character state.
 * @param {Object} action - The action to perform.
 * @returns {Object} The new state object.
 */
function characterReducer(currentState, action) {
    const s = JSON.parse(JSON.stringify(currentState)); // Deep copy for immutability
    const oldDerived = computeDerived(currentState);
    const { type, payload } = action;

    console.log(`📡 State Action: ${type}`, payload);

    switch (type) {
        case 'SET_SPELL_UPCAST': {
            const { name, tier, choiceId } = payload;
            if (!s.spellUpcasts) s.spellUpcasts = {};
            s.spellUpcasts[name] = { tier, choiceId };
            break;
        }
        case 'ADJ_HP': {
            const { amount, isAbsolute } = payload;
            const maxHP = computeDerived(s).maxHP;
            const oldHP = s.hpCurrent ?? maxHP;
            
            // Damage handling: absorb via tempHP first if not absolute
            if (amount < 0 && !isAbsolute) {
                let damage = Math.abs(amount);
                const temp = s.tempHP || 0;
                if (temp > 0) {
                    const absorbed = Math.min(temp, damage);
                    s.tempHP = temp - absorbed;
                    damage -= absorbed;
                }
                if (damage > 0) {
                    s.hpCurrent = adjustNumericField(s.hpCurrent, -damage, maxHP, false);
                }
            } else {
                s.hpCurrent = adjustNumericField(s.hpCurrent, amount, maxHP, isAbsolute);
            }

            // Check if HP transitioned to 0
            if (oldHP > 0 && s.hpCurrent === 0) {
                s.wounds = Math.min(6, (s.wounds || 0) + 2);
            }
            break;
        }
        case 'ADJ_TEMP_HP': {
            const { amount, isAbsolute } = payload;
            s.tempHP = adjustNumericField(s.tempHP || 0, amount, Infinity, isAbsolute);
            break;
        }
        case 'ADJ_HD': {
            const { amount, isAbsolute } = payload;
            const hdMax = computeDerived(s).hdMax;
            s.hdCurrent = adjustNumericField(s.hdCurrent ?? hdMax, amount, hdMax, isAbsolute);
            break;
        }
        case 'ADJ_RES': {
            const { id, amount, isAbsolute, max } = payload;
            const maxLimit = max || 999;
            const raw = s.resourceValues[id];
            const current = raw === undefined ? (max || 0) : (parseFloat(raw) || 0);
            s.resourceValues[id] = adjustNumericField(current, amount, maxLimit, isAbsolute);
            break;
        }
        case 'SET_STATE_KEY': {
            let val = payload.value;
            const key = payload.key;
            if (key.startsWith('add') && ['addStr', 'addDex', 'addInt', 'addWil'].includes(key)) {
                // Determine which stat we are changing
                const statName = key.slice(3); // 'Str', 'Dex', 'Int', 'Wil'
                const baseKey = 'base' + statName;
                const baseVal = s[baseKey] || 0;
                
                // Calculate budgets using the exact same rules as validateAndCorrectState
                const level = s.level || 1;
                const keyMilestones = [4, 8, 12, 16];
                const secMilestones = [5, 9, 13, 17];
                const keyGains = keyMilestones.filter(l => level >= l).length;
                const secGains = secMilestones.filter(l => level >= l).length;
                const flexBudget = level >= 20 ? 2 : 0;

                const config = CLASS_CONFIG;
                const keyStats = (config.keyStats || []).map(stat => stat.charAt(0).toUpperCase() + stat.slice(1));
                const stats = ['Str', 'Dex', 'Int', 'Wil'];
                
                const init = config.initialStats || {};
                let baseKeyBudget = 0;
                let baseSecBudget = 0;
                stats.forEach(st => {
                    const v = init[`base${st}`] || 0;
                    if (keyStats.includes(st)) baseKeyBudget += v;
                    else baseSecBudget += v;
                });

                const keyBudget = baseKeyBudget + keyGains;
                const secBudget = baseSecBudget + secGains;

                // Calculate spent of ALL OTHER stats (excluding S)
                let keySpentOthers = 0;
                let secSpentOthers = 0;
                stats.forEach(st => {
                    if (st === statName) return;
                    const v = (s[`base${st}`] || 0) + (s[`add${st}`] || 0);
                    if (keyStats.includes(st)) keySpentOthers += v;
                    else secSpentOthers += v;
                });

                let maxAdd = 0;
                const isKeyStat = keyStats.includes(statName);
                if (isKeyStat) {
                    // S is a KEY stat
                    const secSpent = secSpentOthers;
                    const secOver = Math.max(0, secSpent - secBudget);
                    maxAdd = keyBudget + flexBudget - secOver - keySpentOthers - baseVal;
                } else {
                    // S is a SEC stat
                    const keySpent = keySpentOthers;
                    const keyOver = Math.max(0, keySpent - keyBudget);
                    maxAdd = secBudget + flexBudget - keyOver - secSpentOthers - baseVal;
                }

                // Clamp between 0 and 5 - baseVal, and also clamp to maxAdd
                const limit = Math.max(0, 5 - baseVal);
                const allowedMax = Math.max(0, Math.min(limit, maxAdd));
                
                // Clamp the incoming value
                val = Math.max(0, Math.min(allowedMax, val));
            }
            s[key] = val;

            // Auto-reset class resources on level change
            if (payload.key === 'level') {
                const derived = computeDerived(s);

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
            const { key, idx, isArray, count: payloadCount } = payload;

            if (!isArray) {
                const val = s[key] !== undefined ? s[key] : 1;
                const newVal = val === 1 ? 0 : 1;
                s[key] = newVal;

                if (typeof CLASS_CONFIG !== 'undefined' && typeof CLASS_CONFIG.onTogglePip === 'function') {
                    const d = computeDerived(s);
                    CLASS_CONFIG.onTogglePip(key, newVal, s, d);
                }
            } else {                // 'Fill Up To' logic (Action Point style)
                if (!Array.isArray(s[key])) s[key] = [];
                
                // Logic: Match toggleAction(idx)
                // If the clicked pip is ON (1), set count to idx (emptying this and everything right)
                // If the clicked pip is OFF (0), set count to idx + 1 (filling this and everything left)
                const isCurrentlyOn = (s[key][idx] === undefined) ? true : (s[key][idx] === 1);
                const newCount = isCurrentlyOn ? idx : idx + 1;

                // Apply the new count and pad to the full rendered count
                // This prevents 'gaps' or scaling bugs when the rendered count is higher than the state array
                const finalCount = payloadCount || Math.max(s[key].length, idx + 1);
                const newArr = [];
                for (let i = 0; i < finalCount; i++) {
                    newArr[i] = (i < newCount) ? 1 : 0;
                }
                s[key] = newArr;
            }
            break;
        }        case 'UPDATE_ITEM': {
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
                type: 'melee', // Default for custom items
                category: 'melee',
                reach: '1',
                ...payload.item 
            });
            break;
        }
        case 'ADD_QUICK_ITEM': {
            const { itemData, category } = payload;
            s.gold -= (itemData.cost || 0);
            s.inventory.push({
                id: Date.now(),
                name: itemData.name,
                type: itemData.type,
                category: category || itemData.category || '',
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
            const imported = validateAndCorrectState(ensureValidState(payload.newState));
            if (imported.level > 1) {
                const derived = computeDerived(imported);
                const level1State = { ...imported, level: 1 };
                const level1Derived = computeDerived(level1State);
                const classBaseHp = CLASS_CONFIG.baseHp || 10;
                
                if ((imported.hpCurrent === level1Derived.maxHP || imported.hpCurrent === classBaseHp) && derived.maxHP > imported.hpCurrent) {
                    const oldHp = imported.hpCurrent;
                    imported.hpCurrent = derived.maxHP;
                    console.log(`🩺 Corrected stuck level 1 HP on import from ${oldHp} to ${derived.maxHP}`);
                }
                if ((imported.hdCurrent === level1Derived.hdMax || imported.hdCurrent === 1) && derived.hdMax > imported.hdCurrent) {
                    const oldHd = imported.hdCurrent;
                    imported.hdCurrent = derived.hdMax;
                    console.log(`🩺 Corrected stuck level 1 HD on import from ${oldHd} to ${derived.hdMax}`);
                }
            }
            return imported;
        }
        case 'SYNC_STATE': {
            return validateAndCorrectState(s);
        }
        case 'ADD_LOG': {
            const newLog = { id: Date.now(), msg: payload.msg };
            s.logs = [newLog, ...(s.logs || [])].slice(0, 5);
            break;
        }
        case 'START_COMBAT': {
            console.log("⚔️ NIMBLE: Starting Combat Transaction...");
            
            // 1. Refill all encounter-based powers (keys starting with 'u')
            const classProtected = CLASS_CONFIG.protectedPips || [];
            const globalProtected = ['ubg', 'uRelentless', 'uElusive', 'uNewFace', 'uBeenAround'];
            
            Object.keys(s).forEach(key => {
                if (key.startsWith('u')) {
                    const isProtected = [...classProtected, ...globalProtected].some(p => key === p || key.startsWith(p + ':'));
                    const isBgProtected = key.startsWith('ubg');

                    if (!isProtected && !isBgProtected) {
                        if (typeof s[key] === 'string' && s[key] === 'BOOM') s[key] = 'OFF';
                        else if (Array.isArray(s[key])) s[key] = s[key].map(() => 1);
                        else if (typeof s[key] === 'number') s[key] = 1;
                    }
                }
            });

            // 2. Reset Actions
            s.actionsSpent = 0;
            
            // 3. General Reset Log
            const baseId = Date.now();
            s.logs = [{ id: baseId, msg: "Initiative: Actions reset and Encounter powers refilled." }, ...(s.logs || [])].slice(0, 5);

            // 4. Class-specific Initiative Logic (Atomic Transaction)
            if (typeof CLASS_CONFIG.onInitiative === 'function') {
                const derived = computeDerived(s);
                
                const localAdjRes = (id, amt, max, isAbs = false) => {
                    const finalMax = parseFloat(max) || 0;
                    s.resourceValues[id] = adjustNumericField(parseFloat(s.resourceValues[id] ?? 0) || 0, amt, finalMax, isAbs);
                    console.log(`  - Atomic Recharge [${id}]: Max=${finalMax}, New=${s.resourceValues[id]}`);
                };

                const localAddLog = (msg) => {
                    console.log(`  - Atomic Log: ${msg}`);
                    // Use a unique ID based on current log length to ensure they sort correctly
                    const logId = baseId + (s.logs.length * 10);
                    s.logs = [{ id: logId, msg }, ...s.logs].slice(0, 10);
                };

                console.log(`⚔️ Executing hook for ${CLASS_CONFIG.name}...`);
                CLASS_CONFIG.onInitiative(s.level, s.subclass, s, derived, localAdjRes, localAddLog);
            }

            console.log("⚔️ NIMBLE: Combat Transaction Complete.");
            break;
        }
        case 'REST_CHARACTER': {
            // 1. Comprehensive Reset of Toggles and Pips
            const dStat = computeDerived(s);

            const protectedKeys = ['version', 'charName', 'level', 'ancestry', 'background', 'subclass', 'gold', 'inventory', 'skills', 'activeConditions', 'resourceValues', 'spellUpcasts', 'bgSpell', 'showMinor', 'lastLeveledUpAt', 'hpCurrent', 'hdCurrent'];
            
            Object.keys(s).forEach(key => {
                if (protectedKeys.includes(key)) return;
                if (key.startsWith('base') || key.startsWith('add')) return;

                // Reset Booms and choice strings
                if (typeof s[key] === 'string') {
                    if (s[key] === 'BOOM') s[key] = 'OFF';
                }
                // Refill numeric and array usage pips
                else if (key.startsWith('u')) {
                    if (Array.isArray(s[key])) s[key] = s[key].map(() => 1);
                    else if (typeof s[key] === 'number') s[key] = 1;
                } else if (typeof s[key] === 'number') {
                    s[key] = 0;
                }
            });

            // 2. Vitals Reset (Calculated based on the clean state)
            s.hpCurrent = dStat.maxHP;
            s.hdCurrent = dStat.hdMax;
            s.tempHP = 0;
            s.wounds = 0;
            s.activeConditions = []; // Clear all conditions on Safe Rest
            s.actionsSpent = 0;
            s.advantage = 0;
            // 4. Class-specific Safe Rest Logic
            if (typeof CLASS_CONFIG !== 'undefined' && typeof CLASS_CONFIG.onSafeRest === 'function') {
                CLASS_CONFIG.onSafeRest(s, dStat);
            }
            // 3. Refill resources
            const combinedResources = CLASS_CONFIG.getCombinedResources ? CLASS_CONFIG.getCombinedResources(s.subclass, s) : (CLASS_CONFIG.resources || []);
            combinedResources.forEach(res => {
                const id = res.id;
                if (dStat.resourceMaxes[id] === undefined) return;
                if (res.refillOnSafeRest !== false) {
                    s.resourceValues[id] = dStat.resourceMaxes[id];
                } else {
                    s.resourceValues[id] = res.safeRestValue !== undefined ? res.safeRestValue : 0;
                }
            });

            // Log the event
            const logMsg = "Safe Rest: HP, HD, and all powers refilled.";
            s.logs = [{ id: Date.now(), msg: logMsg }, ...(s.logs || [])].slice(0, 5);
            
            return validateAndCorrectState(s);
        }
        default:
            console.warn(`Unknown action type: ${type}`);
            return s;
    }

    // Calculate and apply differences in maximum HP/HD
    const newDerived = computeDerived(s);
    const diffHP = newDerived.maxHP - oldDerived.maxHP;
    const diffHD = newDerived.hdMax - oldDerived.hdMax;

    if (diffHP !== 0 && s.hpCurrent !== null) {
        s.hpCurrent = Math.max(0, Math.min(newDerived.maxHP, s.hpCurrent + diffHP));
    }
    if (diffHD !== 0 && s.hdCurrent !== null) {
        s.hdCurrent = Math.max(0, Math.min(newDerived.hdMax, s.hdCurrent + diffHD));
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

function loadState(config) {
    // 1. Define standard state schema and defaults
    state = {
        version: "3.0.0",
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
        logs: [], // Stores recent automated action logs
        advantage: 0,
        actionsSpent: 0,
        spellUpcasts: {}
    };

    // Dynamically merge class-specific defaults
    if (config && config.classDefaults) {
        Object.assign(state, config.classDefaults);
    }

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
    
    console.log("💾 character state loaded:", state);

    // Ensure state is valid and has correct types/defaults, and apply game-specific corrections
    state = validateAndCorrectState(ensureValidState(state));

    // Correct stuck level 1 vitals if the loaded character is level > 1 but vitals match level 1 max values
    if (state.level > 1) {
        const derived = computeDerived(state);
        const level1State = { ...state, level: 1 };
        const level1Derived = computeDerived(level1State);
        const classBaseHp = CLASS_CONFIG.baseHp || 10;
        
        if ((state.hpCurrent === level1Derived.maxHP || state.hpCurrent === classBaseHp) && derived.maxHP > state.hpCurrent) {
            const oldHp = state.hpCurrent;
            state.hpCurrent = derived.maxHP;
            console.log(`🩺 Corrected stuck level 1 HP on load from ${oldHp} to ${derived.maxHP}`);
        }
        if ((state.hdCurrent === level1Derived.hdMax || state.hdCurrent === 1) && derived.hdMax > state.hdCurrent) {
            const oldHd = state.hdCurrent;
            state.hdCurrent = derived.hdMax;
            console.log(`🩺 Corrected stuck level 1 HD on load from ${oldHd} to ${derived.hdMax}`);
        }
    }

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

