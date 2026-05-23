/**
 * @fileoverview CORE ENGINE FOUNDATION
 * Defines the BaseClass for all character classes and standardized resource creation factories.
 */

/**
 * Simple memoization utility.
 * @param {Function} fn - Function to memoize.
 * @param {Function} [keyResolver] - Optional function to generate cache key from args.
 * @returns {Function} Memoized function.
 */
function memoize(fn, keyResolver = JSON.stringify) {
    const cache = new Map();
    return function (...args) {
        const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Startup validator to verify that all base and subclass modifiers map to valid attributes defined in ATTRIBUTE_SCHEMA.
 * Throws developer-friendly console errors at launch if any typos exist.
 * @param {Object} config - The class configuration.
 */
function validateClassModifiers(config) {
    if (typeof ATTRIBUTE_SCHEMA === 'undefined') {
        console.warn("validateClassModifiers: ATTRIBUTE_SCHEMA is not defined yet.");
        return;
    }
    const checkModifiers = (mods, source) => {
        if (!Array.isArray(mods)) return;
        mods.forEach(mod => {
            if (!mod.stat) {
                console.error(`Validation Error [${source}]: Modifier is missing 'stat' property.`, mod);
            } else if (!(mod.stat in ATTRIBUTE_SCHEMA)) {
                console.error(`Validation Error [${source}]: Attribute '${mod.stat}' is not registered in ATTRIBUTE_SCHEMA.`, mod);
            }
        });
    };

    // Validate base class modifiers
    checkModifiers(config.statModifiers, `Class: ${config.name}`);

    // Validate subclass modifiers
    if (Array.isArray(config.subclasses)) {
        config.subclasses.forEach(sub => {
            if (sub.config) {
                const subConfig = typeof sub.config === 'function' ? sub.config({}) : sub.config;
                checkModifiers(subConfig.statModifiers, `Subclass: ${sub.label}`);
            }
        });
    }
}

/**
 * Unified reduction function to fold all active modifiers following their COMBINERS/combine strategy.
 * @param {Array<Object>} modifiers - Combined base and subclass modifiers.
 * @param {number} level - Character level.
 * @param {string} subclass - Selected subclass.
 * @param {Object} state - Character state.
 * @param {Object} statsMap - Stats map.
 * @param {Object} derivedBase - Baseline values before modifiers.
 * @returns {Object} Fully folded attribute map.
 */
function reduceModifiers(modifiers, level, subclass, state, statsMap, derivedBase) {
    const results = {};
    
    // Initialize results with baseline values or ATTRIBUTE_SCHEMA defaults
    if (typeof ATTRIBUTE_SCHEMA !== 'undefined') {
        Object.entries(ATTRIBUTE_SCHEMA).forEach(([key, schema]) => {
            results[key] = (derivedBase && derivedBase[key] !== undefined && derivedBase[key] !== null) 
                ? derivedBase[key] 
                : schema.default;
        });
    }

    // Group active modifiers by their target stat
    const activeModsByStat = {};
    modifiers.forEach(mod => {
        const subclassMatch = !mod.subclass || mod.subclass === subclass;
        const maxHP = derivedBase ? derivedBase.maxHP : null;
        const conditionMatch = !mod.condition || mod.condition(level, subclass, state, maxHP);

        if (subclassMatch && conditionMatch) {
            const milestones = Array.isArray(mod.milestones) ? mod.milestones : [(mod.level || 0)];
            milestones.forEach(m => {
                if (level >= m) {
                    const stat = mod.stat;
                    if (!stat || (typeof ATTRIBUTE_SCHEMA !== 'undefined' && !(stat in ATTRIBUTE_SCHEMA))) return;

                    let val = typeof mod.getMod === 'function' ? mod.getMod(statsMap, state, level) : mod.value;
                    if (val === undefined && typeof ATTRIBUTE_SCHEMA !== 'undefined' && ATTRIBUTE_SCHEMA[stat].type === 'boolean') {
                        val = true;
                    }

                    if (!activeModsByStat[stat]) activeModsByStat[stat] = [];
                    activeModsByStat[stat].push(val);
                }
            });
        }
    });

    // Reduce active modifiers using combiner strategies
    if (typeof ATTRIBUTE_SCHEMA !== 'undefined') {
        Object.entries(ATTRIBUTE_SCHEMA).forEach(([key, schema]) => {
            const activeVals = activeModsByStat[key] || [];
            results[key] = schema.combine(results[key], activeVals);
        });
    }

    return results;
}

// Export validator and reducer for other modules
if (typeof window !== 'undefined') {
    window.validateClassModifiers = validateClassModifiers;
    window.reduceModifiers = reduceModifiers;
}

/** Cache for expensive pure functions. Cleared when state changes. */
const pureFunctionCache = {
    getKnownSchools: new Map(),
    getDerivedStats: new Map(),
    getAvailableSpells: new Map()
};

/**
 * Clears the cache for expensive pure functions. Call this when the state changes.
 */
function clearPureFunctionCache() {
    pureFunctionCache.getKnownSchools.clear();
    pureFunctionCache.getDerivedStats.clear();
    pureFunctionCache.getAvailableSpells.clear();
}

/**
 * Manages resource creation and combination for a class.
 */




/**
 * Creates a spell‑replacement configuration object.
 * @param {string|string[]} replace - The spell name (or array of names) to remove.
 * @param {string} add            - The spell name to add in place of the removed one(s).
 * @param {string} school         - The magic school both spells belong to.
 * @returns {Object}              { replace, add, school }
 */
function createSpellReplacement(replace, add, school) {
    return { replace, add, school };
}

/**
 * Creates a utility‑spells configuration object.
 * @param {boolean|string[]|Function} [all=false] -
 *        `true` → include **all** utility schools;
 *        `string[]` → include only the listed schools;
 *        `Function(level, subclass, state)` → return `true`/`string[]` to decide;
 *        `false`/null/undefined → no automatic inclusion.
 * @param {string|null} [selectKey=null] -
 *        Name of a state key (e.g., `"selectedMastery"`). When provided,
 *        the engine looks at `state[selectKey]` (an array of school names or spell names)
 *        to decide which utilities to include.
 * @returns {Object} { all, selectKey }
 */
function createUtilityConfig(all = false, selectKey = null) {
    return { all, selectKey };
}

/**
 * Creates a standard mana-style resource definition.
 * @param {string} [stat='int'] - The attribute that scales the resource.
 * @param {string} [label='Mana Pool'] - The display name for the resource.
 * @param {Object} [options={}] - Additional display options.
 * @returns {Object} Resource definition object.
 */
function createManaResource(stat = 'int', label = 'Mana Pool', options = {}) {
    const multiplier = options.multiplier !== undefined ? options.multiplier : 3;
    return {
        id: 'mana',
        label,
        manual: true,
        options,
        calcMax: (level, stats) => {
            return level >= 2 ? (stats[stat] * multiplier) + level : 0;
        }
    };
}

/**
 * Creates a simple manual resource definition.
 * @param {string} id - Unique identifier for the resource.
 * @param {string} label - Display name for the resource.
 * @param {Function} calcMaxFn - Function to calculate the maximum value (level, stats, state, subclass, derived) => number.
 * @param {Object} [options={}] - Additional display options.
 * @returns {Object} Resource definition object.
 */
function createSimpleResource(id, label, calcMaxFn, options = {}) {
    return {
        id,
        label,
        manual: true,
        options,
        calcMax: calcMaxFn
    };
}
