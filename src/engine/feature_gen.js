/**
 * @fileoverview Feature Generator Helpers
 * Simplifies level-up feature definitions and standardizes class progression features.
 */

/**
 * Create a key stat increase feature.
 * @param {number} level - Level at which the increase occurs.
 * @param {string} stats - The stats to increase.
 * @returns {Object} Feature object.
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
 * Create a secondary stat increase feature.
 * @param {number} level - Level at which the increase occurs.
 * @param {string} stats - The stats to increase.
 * @returns {Object} Feature object.
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
 * Create a tier unlock feature for casters.
 * @param {number} tier - The spell tier being unlocked.
 * @param {number} [level=null] - Optional level override.
 * @returns {Object} Feature object.
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
 * Create a cantrip upgrade feature.
 * @param {number} stage - The stage of upgrade (1-4).
 * @returns {Object} Feature object.
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
 * Create an epic boon feature for level 19.
 * @returns {Object} Feature object.
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
 * Create a subclass choice feature.
 * @param {number} [level=3] - Level at which subclass is chosen.
 * @returns {Object} Feature object.
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
 * Create a spell choice feature with complex configuration.
 * @param {Object} config - Configuration for the spell choice.
 * @returns {Object} Feature object.
 */
function createSpellChoiceFeature({
    id,
    name,
    level,
    spellType,
    schools,
    stateKey,
    getCount,
    getSlots,
    desc,
    minor = false,
    filterKnown = false,
    tier = null,
    tiers = null,
    milestones = [],
    perSchool = false,
    multiplier = 1,
    replaces = null
}) {
    return {
        id,
        name,
        level,
        replaces,
        type: "spell_choice",
        spellType, // "utility", "tiered", "school", "cantrip", or "paired"
        schools,   // string or array of strings
        stateKey,
        getCount: typeof getCount === "function" ? getCount : () => (getCount || 1),
        getSlots,
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
 * Helper to create a growing point-form list for scaling descriptions based on level.
 * @param {string} base - Base description text.
 * @param {Array} upgrades - List of upgrade objects {level, text}.
 * @param {number} level - Current character level.
 * @returns {string} HTML string with base text and applicable upgrades.
 */
function createScalingList(base, upgrades, level) {
    let text = base;
    const items = upgrades
        .filter(upgrade => level >= upgrade.level)
        .map(upgrade => `<li><span style="color: #fff; font-weight: bold;">Level ${upgrade.level}+:</span> ${upgrade.text}</li>`);
    
    if (items.length > 0) {
        text += `<ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">${items.join('')}</ul>`;
    }
    return text;
}

/**
 * Standard count generator for dynamic choice features based on level milestones.
 * @param {number[]} milestones - Level milestones to check against.
 * @returns {Function} Function taking (level) and returning (count).
 */
function createStandardCount(milestones) {
    return (level) => {
        let count = 0;
        milestones.forEach(m => {
            if (level >= m) {
                count++;
            }
        });
        return count;
    };
}

/**
 * Generate all standard progression features for a class (stats, tiers, boons).
 * @param {string} keyStats - Description of key stats.
 * @param {string} secStats - Description of secondary stats.
 * @param {boolean} [isCaster=false] - Whether the class is a spellcaster.
 * @param {number[]} [customTierProgression=null] - Optional custom tier unlock levels.
 * @returns {Object} Core features object.
 */
function generateStandardFeatures(keyStats, secStats, isCaster = false, customTierProgression = null) {
    const core = {};
    for (let i = 1; i <= 20; i++) {
        core[i] = [];
    }
    
    /**
     * Internal helper to add a feature to the core registry.
     * @param {Object} feature - Feature object to add.
     */
    const addFeature = (feature) => {
        if (!core[feature.level]) {
            core[feature.level] = [];
        }
        core[feature.level].push(feature);
    };
    
    // Key stat increases
    [4, 8, 12, 16].forEach(level => addFeature(createKeyStatFeature(level, keyStats)));
    
    // Secondary stat increases
    [5, 9, 13, 17].forEach(level => addFeature(createSecondaryStatFeature(level, secStats)));
    
    // Epic boon
    addFeature(createEpicBoonFeature());
    
    // Cantrip upgrades & Tiers (if caster)
    if (isCaster) {
        [5, 10, 15, 20].forEach((level, idx) => addFeature(createCantripFeature(idx + 1)));
        
        const tiers = customTierProgression || [1, 2, 4, 6, 8, 10, 12, 14, 16, 18];
        tiers.forEach((level, idx) => {
            if (level > 0) {
                if (idx === 0) {
                    // This is the cantrip level, usually 1
                } else {
                    addFeature(createTierFeature(idx, level));
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
    createStandardCount,
    generateStandardFeatures
};
