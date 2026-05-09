/**
 * Feature Generator Helpers
 * Simplifies level-up feature definitions.
 */

/**
 * Create a key stat increase feature
 */
function createKeyStatFeature(level, stats) {
    const count = [4, 8, 12, 16].indexOf(level) + 1;
    return {
        id: `key_stat_${count}`,
        name: "Key Stat Increase",
        desc: `+1 ${stats}.`,
        level: level,
        minor: true
    };
}

/**
 * Create a secondary stat increase feature
 */
function createSecondaryStatFeature(level, stats) {
    const count = [5, 9, 13, 17].indexOf(level) + 1;
    return {
        id: `sec_stat_${count}`,
        name: "Secondary Stat Increase",
        desc: `+1 ${stats}.`,
        level: level,
        minor: true
    };
}

/**
 * Create a tier unlock feature
 */
function createTierFeature(tier, level = null) {
    return {
        id: `tier_${tier}`,
        name: `Tier ${tier} Spells`,
        desc: `You gain access to Tier ${tier} spells.`,
        level: level || (tier * 2),
        minor: true
    };
}

/**
 * Create a cantrip upgrade feature
 */
function createCantripFeature(stage) {
    const level = [5, 10, 15, 20][stage - 1];
    return {
        id: `cantrips_${stage}`,
        name: "Upgraded Cantrips",
        desc: "Your cantrips grow stronger (scaling varies by cantrip).",
        level: level,
        minor: true
    };
}

/**
 * Create an epic boon feature
 */
function createEpicBoonFeature() {
    return {
        id: "epic_boon",
        name: "Epic Boon",
        desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
        level: 19
    };
}

/**
 * Create a subclass choice feature
 */
function createSubclassFeature(level = 3) {
    return {
        id: "subclass",
        name: "Subclass",
        desc: "Choose a subclass.",
        level: level,
        minor: true
    };
}

/**
 * Create a spell choice feature
 */
function createSpellChoiceFeature({ id, name, level, spellType, schools, stateKey, getCount, desc, minor = false, filterKnown = false, tier = null, tiers = null, milestones = [], perSchool = false, multiplier = 1 }) {
    return {
        id,
        name,
        level,
        type: "spell_choice",
        spellType, // "utility" or "tiered" or "school" or "cantrip" or "paired"
        schools,   // string or array of strings
        stateKey,
        getCount: typeof getCount === "function" ? getCount : () => (getCount || 1),
        desc,
        minor,
        filterKnown,
        tier,
        tiers,
        milestones: milestones.length > 0 ? milestones : [level],
        perSchool,
        multiplier: typeof multiplier === "function" ? multiplier : () => multiplier
    };
}

/**
 * Helper to create a growing point-form list for scaling descriptions
 */
function createScalingList(base, upgrades, level) {
    let text = base;
    const items = upgrades
        .filter(u => level >= u.level)
        .map(u => `<li><span style="color: #fff; font-weight: bold;">Level${u.level}+:</span> ${u.text}</li>`);
    
    if (items.length > 0) {
        text += `<ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">${items.join('')}</ul>`;
    }
    return text;
}

/**
 * Generate all standard progression features for a class
 */
function generateStandardFeatures(keyStats, secStats, isCaster = false, customTierProgression = null) {
    const core = {};
    for (let i = 1; i <= 20; i++) core[i] = [];
    
    const addFeature = (f) => {
        if (!core[f.level]) core[f.level] = [];
        core[f.level].push(f);
    };
    
    // Key stat increases
    [4, 8, 12, 16].forEach(l => addFeature(createKeyStatFeature(l, keyStats)));
    
    // Secondary stat increases
    [5, 9, 13, 17].forEach(l => addFeature(createSecondaryStatFeature(l, secStats)));
    
    // Epic boon
    addFeature(createEpicBoonFeature());
    
    // Cantrip upgrades & Tiers (if caster)
    if (isCaster) {
        [5, 10, 15, 20].forEach((l, idx) => addFeature(createCantripFeature(idx + 1)));
        
        const tiers = customTierProgression || [1, 2, 4, 6, 8, 10, 12, 14, 16, 18];
        tiers.forEach((l, idx) => {
            if (l > 0) {
                if (idx === 0) {
                    // This is the cantrip level, usually 1
                } else {
                    addFeature(createTierFeature(idx, l));
                }
            }
        });
    }
    
    return { core, subclasses: {} };
}

const FeatureGen = {
    createKeyStatFeature,
    createSecondaryStatFeature,
    createTierFeature,
    createCantripFeature,
    createEpicBoonFeature,
    createSubclassFeature,
    createSpellChoiceFeature,
    createScalingList,
    generateStandardFeatures
};
