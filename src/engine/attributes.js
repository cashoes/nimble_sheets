/**
 * @fileoverview ATTRIBUTE REGISTRY MODULE
 * Establishes the static gameplay attributes schema and combiner strategies
 * to enable robust declarative stat folding.
 */

/**
 * Standard Combiner Strategies for folding modifiers.
 */
const COMBINERS = {
    ADDITIVE: (base, modifiers) => {
        const sum = modifiers.reduce((acc, m) => acc + (Number(m) || 0), 0);
        return (Number(base) || 0) + sum;
    },
    MAX_OVERRIDE: (base, modifiers) => {
        if (modifiers.length === 0) return base;
        return Math.max(Number(base) || 0, ...modifiers.map(Number));
    },
    BASE_OVERRIDE: (base, modifiers) => {
        if (modifiers.length === 0) return base;
        // Replaces base value with the last active override
        return modifiers[modifiers.length - 1];
    },
    BOOLEAN_OR: (base, modifiers) => {
        return !!base || modifiers.some(m => !!m);
    },
    UNION: (base, modifiers) => {
        const baseArr = Array.isArray(base) ? base : (base ? [base] : []);
        const flatMods = modifiers.flat().filter(x => x !== undefined && x !== null);
        const combined = Array.from(new Set([...baseArr, ...flatMods]));
        if (combined.includes("All Armor")) {
            return ["All Armor"];
        }
        return combined;
    }
};

/**
 * Unified Attribute Schema Registry.
 * Defines type, default, and combiner strategy for every gameplay statistic.
 */
const ATTRIBUTE_SCHEMA = {
    // Vitals and Progression
    baseHp: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    hpPerLevel: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    maxHP: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    hdMax: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    hdFace: { type: 'number', default: 10, combine: COMBINERS.MAX_OVERRIDE },
    
    // Core Attributes
    init: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    initAdv: { type: 'boolean', default: false, combine: COMBINERS.BOOLEAN_OR },
    speedBase: { type: 'number', default: 6, combine: COMBINERS.BASE_OVERRIDE },
    speed: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    woundMax: { type: 'number', default: 6, combine: COMBINERS.ADDITIVE },
    maxActions: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    
    // Defenses and Armor
    armorBase: { type: 'number', default: null, combine: COMBINERS.BASE_OVERRIDE },
    armor: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    shieldBonus: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    allSaveAdv: { type: 'boolean', default: false, combine: COMBINERS.BOOLEAN_OR },
    allSaveDis: { type: 'boolean', default: false, combine: COMBINERS.BOOLEAN_OR },
    
    // Proficiencies
    profArmor: { type: 'array', default: [], combine: COMBINERS.UNION },
    profWeapons: { type: 'array', default: [], combine: COMBINERS.UNION },
    
    // Specific Class/Subclass Features
    modFlySpeed: { type: 'boolean', default: false, combine: COMBINERS.BOOLEAN_OR },
    quickRestLoh: { type: 'boolean', default: false, combine: COMBINERS.BOOLEAN_OR },
    panel_surge: { type: 'boolean', default: false, combine: COMBINERS.BOOLEAN_OR },
    
    // Newly registered class-specific stats
    auraReach: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    // addStr/addDex/addInt/addWil (issue #55): flat attribute-boost modifier targets (e.g.
    // Shadowmancer's Fiendish Boon). computeDerived folds these into the effective statsMap
    // before any DEX/STR/INT/WIL-dependent baseline is computed -- see state.js computeDerived.
    addStr: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    addDex: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    addInt: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    addWil: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE },
    inspirationBonus: { type: 'number', default: 0, combine: COMBINERS.ADDITIVE }
};

// Export to window/global context for client-side inclusion
if (typeof window !== 'undefined') {
    window.COMBINERS = COMBINERS;
    window.ATTRIBUTE_SCHEMA = ATTRIBUTE_SCHEMA;
}
