/**
 * CORE LOGIC MODULE (Derived Stats & Calculation)
 * Handles the character mathematical model, calculating HP, AC, Speed, and other derived properties
 * based on the character's level, stats, ancestry, background, and class features.
 */

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
 * The master calculation engine for character stats.
 * Runs on every state change to refresh all derived numbers.
 * @param {Object} s - Character state object.
 * @returns {Object} Comprehensive map of all derived stats.
 */
function computeDerived(s) {
    const level = s.level || 1;
    const statsMap = getStatsMap(s);
    const ancFeat = ANCESTRY_FEATURES[s.ancestry];
    const bgFeat = BACKGROUND_FEATURES[s.background];
    
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

    // 4. Base Stats & Overrides from Class logic
    const classDerived = CLASS_CONFIG.getDerivedStats ? CLASS_CONFIG.getDerivedStats(level, s.subclass, s) : {};
    const classOverrides = CLASS_CONFIG.getStatOverrides ? CLASS_CONFIG.getStatOverrides(level, s.subclass, s, statsMap) : {};

    // 5. Initiative (DEX + modifiers)
    let initiative = statsMap.dex + (classOverrides.init || 0) + (ancFeat?.modInit || 0) + (bgFeat?.modInit || 0) + (bgSelectedOpt?.modInit || 0);

    // 6. Speed (Base 6 + modifiers)
    let speed = (classDerived.speed || 6) + (classOverrides.speed || 0) + (ancFeat?.modSpeed || 0) + (bgFeat?.modSpeed || 0) + (bgSelectedOpt?.modSpeed || 0);
    let armorIsLight = true;

    // 7. Wounds (Class base + modifiers)
    let woundMax = Math.max(1, (classDerived.woundMax || 6) + (classOverrides.woundMax || 0) + (ancFeat?.modWounds || 0) + (bgFeat?.modWounds || 0) + (bgSelectedOpt?.modWounds || 0));

    // 8. Actions (Standard 3, modified by Conditions)
    let maxActions = 3;
    s.activeConditions.forEach(cId => {
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

    // 10. Armor (Calculates best equipped AC vs base defense)
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
    (CLASS_CONFIG.resources || []).forEach(r => {
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
        ...classDerived,
        level, 
        statsMap, 
        hdFace, 
        maxHP, 
        hdMax: maxHD, 
        armor: armorVal, 
        speed, 
        initiative, 
        woundMax, 
        maxActions, 
        resourceMaxes, 
        maxTier, 
        passMods,
        initAdv: classOverrides.initAdv || false,
        size: bgFeat?.modSize || ancFeat?.modSize || classDerived.size || "Med"
    };
}

/**
 * Utility to save current state to storage and trigger a UI refresh.
 */
function saveAndRender() {
    saveState();
    render();
}
