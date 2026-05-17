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
class ResourceManager {
    /**
     * @param {Array<Object>} baseResources - The base resources defined for the class.
     */
    constructor(baseResources) {
        this.baseResources = baseResources || [];
    }

    /**
     * Combines base resources with subclass resources.
     * @param {Object} subConfig - The subclass configuration object.
     * @returns {Array<Object>} Combined resource definitions.
     */
    combineResources(subConfig) {
        return [...this.baseResources, ...(subConfig.resources || [])];
    }
}

/**
 * Handles calculation of derived statistics and overrides.
 */
class StatCalculator {
    /**
     * @param {BaseClass} baseClass - The base class instance to get configuration from.
     */
    constructor(baseClass) {
        this.baseClass = baseClass;
        this._derivedStatsCache = new Map();
        this._statOverridesCache = new Map();
    }

    /**
     * Calculates derived statistics for the character.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {CharacterState} state - Current character state.
     * @returns {DerivedStats} Derived statistics object.
     */
    getDerivedStats(level, subclass, state) {
        const key = `${level}-${subclass}-${JSON.stringify(state)}`;
        if (pureFunctionCache.getDerivedStats.has(key)) {
            return pureFunctionCache.getDerivedStats.get(key);
        }
        const stats = { speed: 6, woundMax: 6 };
        const subConfig = this.baseClass.getSubclassConfig(subclass, state);
        
        const combinedScaling = { ...this.baseClass.scalingStats, ...(subConfig.scalingStats || {}) };

        Object.entries(combinedScaling).forEach(([key, val]) => {
            if (typeof val === 'function') {
                stats[key] = val(level, subclass, state, stats);
            } else if (typeof val === 'object' && val !== null) {
                const sortedMilestones = Object.keys(val).map(Number).sort((a, b) => a - b);
                sortedMilestones.forEach(m => {
                    if (level >= m) {
                        const milestoneVal = val[m];
                        stats[key] = (typeof milestoneVal === 'function') ? milestoneVal(level, subclass, state, stats) : milestoneVal;
                    }
                });
            } else {
                stats[key] = val;
            }
        });

        pureFunctionCache.getDerivedStats.set(key, stats);
        return stats;
    }

    /**
     * Gets attribute overrides for the current state.
     */
    getStatOverrides(level, subclass, state, statsMap, maxHP = null) {
        const overrides = {};
        const subConfig = this.baseClass.getSubclassConfig(subclass, state);
        const combinedModifiers = [...this.baseClass.statModifiers, ...(subConfig.statModifiers || [])];

        combinedModifiers.forEach(mod => {
            const subclassMatch = !mod.subclass || mod.subclass === subclass;
            const conditionMatch = !mod.condition || mod.condition(level, subclass, state, maxHP);

            if (subclassMatch && conditionMatch) {
                const milestones = Array.isArray(mod.milestones) ? mod.milestones : [(mod.level || 0)];
                
                milestones.forEach(m => {
                    if (level >= m) {
                        const val = typeof mod.getMod === 'function' ? mod.getMod(statsMap, state, level) : (mod.value || 0);
                        if (['initAdv', 'modFlySpeed', 'quickRestLoh', 'panel_surge', 'profArmor', 'profWeapons', 'allSaveAdv', 'allSaveDis'].includes(mod.stat)) {
                            overrides[mod.stat] = val || true;
                        } else {
                            overrides[mod.stat] = (overrides[mod.stat] || 0) + val;
                        }
                    }
                });
            }
        });

        return overrides;
    }

    isUnarmored(state) {
        let unarmored = true;
        (state.inventory || []).forEach(item => { 
            if (item.type === 'armor' && item.equipped) unarmored = false;
        });
        return unarmored;
    }

    isHeavyArmored(state) {
        return (state.inventory || []).some(item => 
            item.equipped && item.type === 'armor' && item.armorType === 'heavy'
        );
    }

    isBloodied(state, maxHP = null) {
        if ((state.activeConditions || []).includes("bloodied")) return true;
        if (maxHP !== null && state.hpCurrent !== null) {
            return state.hpCurrent <= (maxHP / 2);
        }
        return false;
    }
}

/**
 * Manages spell-related logic.
 */
class SpellManager {
    /**
     * @param {BaseClass} baseClass - The base class instance to get configuration from.
     */
    constructor(baseClass) {
        this.baseClass = baseClass;
    }

    /**
     * Retrieves the configuration object for the active subclass.
     * Note: This is actually delegated to the base class, but we keep it here for consistency.
     * @param {string} subclass - Selected subclass value.
     * @param {Object} state - Current character state.
     * @returns {Object} Subclass config or empty object.
     */
    getSubclassConfig(subclass, state = null) {
        return this.baseClass.getSubclassConfig(subclass, state);
    }

    /**
     * Gets known schools for the given level, subclass, and state.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {CharacterState} state - Current character state.
     * @param {Object|null} limits - Optional limits for extra schools.
     * @returns {Array<string>} List of known spell schools.
     */
    getKnownSchools(level, subclass, state, limits = null) {
        const key = `${level}-${subclass}-${JSON.stringify(state)}-${JSON.stringify(limits)}`;
        if (pureFunctionCache.getKnownSchools.has(key)) {
            return pureFunctionCache.getKnownSchools.get(key);
        }
        const subConfig = this.baseClass.getSubclassConfig(subclass, state);
        const schools = new Set(this.baseClass.spellSchools);
        
        // Add legacy subclass schools
        if (subclass && this.baseClass.subclassSchools[subclass]) {
            this.baseClass.subclassSchools[subclass].forEach(s => schools.add(s));
        }

        // Add declarative subclass schools (v2.4)
        if (subConfig.spellSchools) {
            subConfig.spellSchools.forEach(s => schools.add(s));
        }
        
        this.baseClass.extraSchoolsKeys.forEach(key => {
            if (limits && (limits[key] || 0) <= 0) return;
            const val = state[key];
            if (val) {
                const vals = Array.isArray(val) ? val : [val];
                const activeVals = (limits && limits[key]) ? vals.slice(0, limits[key]) : vals;
                activeVals.forEach(v => {
                    if (v && v !== "None" && (SPELL_REGISTRY[v] || UTILITY_SPELLS[v])) {
                        schools.add(v);
                    }
                });
            }
        });

        const result = Array.from(schools);
        pureFunctionCache.getKnownSchools.set(key, result);
        return result;
    }

    /**
     * Gets available spells for the given level, subclass, state, and derived stats.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {CharacterState} state - Current character state.
     * @param {DerivedStats} derived - Derived stats.
     * @returns {Array<Object>} List of available spells.
     */
    getAvailableSpells(level, subclass, state, derived) {
        const key = `${level}-${subclass}-${JSON.stringify(state)}-${JSON.stringify(derived)}`;
        if (pureFunctionCache.getAvailableSpells.has(key)) {
            return pureFunctionCache.getAvailableSpells.get(key);
        }
        const subConfig = this.baseClass.getSubclassConfig(subclass, state);
        const progression = subConfig.spellProgression || this.baseClass.spellProgression;
        if (!progression) return [];
        
        const limits = this.baseClass._getActiveStateKeyLimits(level, subclass, state); // Note: This method is in BaseClass, we'll need to move it or delegate.
        const schools = this.getKnownSchools(level, subclass, state, limits);
        const spells = [];

        const combinedReplacements = [...this.baseClass.spellReplacements, ...(subConfig.spellReplacements || [])];
        
        schools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                const tierNum = this._parseTierNumber(data.tier);
                const isCantrip = data.tier.toLowerCase().includes('cantrip');
                const requiredLevel = isCantrip ? (progression[0] || 1) : (progression[tierNum] || 99);
                if (level >= requiredLevel) {
                    if (this._isReplaced(name, combinedReplacements)) return;
                    spells.push({ name, ...data, school });
                }
            });
        });
        
        if (combinedReplacements.length > 0) {
            combinedReplacements.forEach(replacement => {
                if (replacement.add) {
                    let spellData = SPELL_REGISTRY[replacement.school]?.[replacement.add];
                    if (!spellData && UTILITY_SPELLS[replacement.school]?.[replacement.add]) {
                        spellData = { desc: UTILITY_SPELLS[replacement.school][replacement.add], tier: "Utility" };
                    }
                    if (spellData && !spells.find(s => s.name === replacement.add)) {
                        spells.push({ name: replacement.add, ...spellData, school: replacement.school });
                    }
                }
            });
        }
        
        const combinedGrants = [...this.baseClass.grantedSpells, ...(subConfig.grantedSpells || [])];
        combinedGrants.forEach(grant => {
            const levelMatch = level >= (grant.level || 0);
            const conditionMatch = !grant.condition || grant.condition(level, subclass, state);

            if (levelMatch && conditionMatch) {
                (grant.spells || []).forEach(sGrant => {
                    const name = typeof sGrant === 'string' ? sGrant : sGrant.name;
                    const school = typeof sGrant === 'string' ? null : sGrant.school;
                    let spellData = null;
                    let foundSchool = school;
                    
                    if (school) {
                        spellData = SPELL_REGISTRY[school]?.[name] || (UTILITY_SPELLS[school] ? { desc: UTILITY_SPELLS[school][name], tier: "Utility" } : null);
                    } else {
                        for (const [sSch, list] of Object.entries(SPELL_REGISTRY)) {
                            if (list[name]) { spellData = list[name]; foundSchool = sSch; break; }
                        }
                        if (!spellData) {
                            for (const [sSch, list] of Object.entries(UTILITY_SPELLS)) {
                                if (list[name]) { spellData = { desc: list[name], tier: "Utility" }; foundSchool = sSch; break; }
                            }
                        }
                    }
                    if (spellData && !spells.find(s => s.name === name)) {
                        spells.push({ name, ...spellData, school: foundSchool });
                    }
                });
            }
        });

        this._addUtilitySpells(spells, level, subclass, state, limits, subConfig);
        
        const combinedTieredKeys = [...this.baseClass.includeTieredSpells, ...(subConfig.includeTieredSpells || [])];
        const combinedCantripKeys = [...this.baseClass.includeCantripSpells, ...(subConfig.includeCantripSpells || [])];
        
        [...combinedTieredKeys, ...combinedCantripKeys].forEach(key => {
            const budget = (key in limits) ? limits[key] : (state[key] ? state[key].length : 0);
            const selections = (state[key] || []).slice(0, budget);
            selections.forEach(val => {
                if (!val || val === "None" || val === "+1 Order") return; // Filter training markers
                for (const [sSch, spellsList] of Object.entries(SPELL_REGISTRY)) {
                    if (spellsList[val]) {
                        if (!spells.find(s => s.name === val)) spells.push({ name: val, ...spellsList[val], school: sSch });
                        break;
                    }
                }
                // Check utility spells as well
                for (const [sSch, utilsList] of Object.entries(UTILITY_SPELLS)) {
                    if (utilsList[val]) {
                        if (!spells.find(s => s.name === val)) spells.push({ name: val, desc: utilsList[val], tier: "Utility", school: sSch });
                        break;
                    }
                }
            });
        });
        
        const result = spells;
        pureFunctionCache.getAvailableSpells.set(key, result);
        return result;
    }
    
    _addUtilitySpells(spells, level, subclass, state, limits, subConfig = {}) {
        const schools = this.baseClass.getKnownSchools(level, subclass, state, limits);
        
        // Merge base and subclass utility configs
        const configs = [this.baseClass.includeUtilitySpells, subConfig.includeUtilitySpells].filter(Boolean);

        configs.forEach(cfg => {
            const allVal = typeof cfg.all === "function" ? cfg.all(level, subclass, state) : cfg.all;
            
            if (allVal) {
                // If allVal is a list of schools, use it; otherwise use all known schools
                const targetSchools = Array.isArray(allVal) ? allVal : schools;
                targetSchools.forEach(school => {
                    if (UTILITY_SPELLS[school]) {
                        Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                            if (!spells.find(s => s.name === name)) spells.push({ name, desc, tier: "Utility", school });
                        });
                    }
                });
            }
            
            if (cfg.selectKey) {
                const keys = Array.isArray(cfg.selectKey) ? cfg.selectKey : [cfg.selectKey];
                keys.forEach(key => {
                    const budget = (key in limits) ? limits[key] : (state[key] ? state[key].length : 0);
                    const selections = (state[key] || []).slice(0, budget);
                    selections.forEach(val => {
                        if (!val || val === "None") return;
                        if (UTILITY_SPELLS[val]) { // If selecting a whole school
                            Object.entries(UTILITY_SPELLS[val]).forEach(([uName, uDesc]) => {
                                if (!spells.find(s => s.name === uName)) spells.push({ name: uName, desc: uDesc, tier: "Utility", school: val });
                            });
                        } else { // If selecting a specific spell
                            for (const [sSch, list] of Object.entries(UTILITY_SPELLS)) {
                                if (list[val]) {
                                    if (!spells.find(s => s.name === val)) spells.push({ name: val, desc: list[val], tier: "Utility", school: sSch });
                                    break;
                                }
                            }
                        }
                    });
                });
            }
        });
    }
    
    _parseTierNumber(tierStr) {
        if (!tierStr) return 0;
        if (tierStr.toLowerCase().includes('cantrip')) return 0;
        return parseInt(tierStr.replace(/\D/g, '')) || 0;
    }
    
    _isReplaced(spellName, replacements) {
        return replacements.some(r => {
            const replaceList = Array.isArray(r.replace) ? r.replace : [r.replace];
            return replaceList.includes(spellName);
        });
    }
}

/**
 * Processes features for rendering.
 */
class FeatureProcessor {
    /**
     * @param {BaseClass} baseClass - The base class instance to get configuration from.
     */
    constructor(baseClass) {
        this.baseClass = baseClass;
    }

    /**
     * Generates HTML for all class features.
     */
    getFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard) {
        return defaultGetFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, this.baseClass.featuresData, this.baseClass.optionsData, this.baseClass);
    }

    /**
     * Renders an individual feature.
     */
    renderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef) {
        return defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef, this.baseClass);
    }

    /**
     * Gets active features (core and subclass) up to the given level, excluding replaced ones.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @returns {Array<Object>} List of active feature objects.
     */
    _getActiveFeatures(level, subclass) {
        const features = [];
        const replacedIds = new Set();
        const subData = this.baseClass.featuresData.subclasses[subclass] || {};

        Object.values(subData).forEach(lvlFeats => {
            lvlFeats.forEach(feat => {
                if (feat.replaces) {
                    const r = Array.isArray(feat.replaces) ? feat.replaces : [feat.replaces];
                    r.forEach(id => replacedIds.add(id));
                }
            });
        });

        for (let i = 1; i <= level; i++) {
            if (this.baseClass.featuresData.core[i]) {
                this.baseClass.featuresData.core[i].forEach(feat => {
                    if (!replacedIds.has(feat.id)) features.push(feat);
                });
            }
        }
        for (let i = 1; i <= level; i++) {
            if (subData[i]) features.push(...subData[i]);
        }
        return features;
    }

    /**
     * Gets active state key limits for the given level, subclass, and state.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @returns {Object} Limits for state keys.
     */
    _getActiveStateKeyLimits(level, subclass, state) {
        const limits = {};
        const features = this._getActiveFeatures(level, subclass);

        features.forEach(feat => {
            if (feat.stateKey && !feat.perSchool) {
                const count = typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1);
                const mult = typeof feat.multiplier === 'function' ? feat.multiplier(level, subclass, state) : (feat.multiplier || 1);
                limits[feat.stateKey] = (limits[feat.stateKey] || 0) + (count * mult);
            }
        });

        const schools = this.baseClass.getKnownSchools(level, subclass, state, limits);

        features.forEach(feat => {
            if (feat.stateKey && feat.perSchool) {
                const count = typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1);
                const mult = typeof feat.multiplier === 'function' ? feat.multiplier(level, subclass, state) : (feat.multiplier || 1);
                limits[feat.stateKey] = (limits[feat.stateKey] || 0) + (schools.length * count * mult);
            }
        });

        return limits;
    }
}

/**
 * Base class for all character class trackers.
 * Handles core attributes, feature rendering, and automated spell progression.
 */
class BaseClass {
    /**
     * Initializes a new instance of BaseClass.
     * @param {Object} config - Configuration object for the class.
     */
    constructor(config) {
        this.name = config.name;
        this.subtitle = config.subtitle;
        this.keyStats = config.keyStats || [];
        this.saves = config.saves || { adv: null, dis: null };
        this.proficiencies = config.proficiencies || { armor: "--", weapons: "--" };
        this.baseHp = config.baseHp || 10;
        this.hpPerLevel = config.hpPerLevel || 5;
        this.hitDie = config.hitDie || 10;
        this.theme = config.theme || {};
        this.initialStats = config.initialStats || {};
        this.subclasses = config.subclasses || [{ value: "None", label: "None" }];
        this.resources = config.resources || [];
        this.spellProgression = config.spellProgression || null;
        this.customHeaderStats = config.customHeaderStats || [];
        this.mechanicPanelExtension = config.mechanicPanelExtension || null;
        
        // Declarative Extensions (v2.2)
        this.lvl20StatBonus = config.lvl20StatBonus || 0;
        this.optionExtensions = config.optionExtensions || {}; 
        this.grantedSpells = config.grantedSpells || [];      
        this.statModifiers = config.statModifiers || [];      

        // Spell configuration
        this.spellSchools = config.spellSchools || []; 
        this.subclassSchools = config.subclassSchools || {}; 
        this.extraSchoolsKeys = config.extraSchoolsKeys || []; 
        this.includeUtilitySpells = config.includeUtilitySpells || false; 
        this.includeTieredSpells = config.includeTieredSpells || []; 
        this.includeCantripSpells = config.includeCantripSpells || []; 
        this.spellReplacements = config.spellReplacements || []; 
        this.scalingStats = config.scalingStats || {}; 
        this.rollTriggers = config.rollTriggers || []; 
        
        // Internal references for default renderers
        this.featuresData = config.featuresData || { core: {}, subclasses: {} };
        this.optionsData = config.optionsData || {};
        
        // Derived flag
        this.isCaster = this.spellSchools.length > 0 || !!this.spellProgression;

        // Managers for delegated responsibilities
        this.resourceManager = new ResourceManager(this.resources || []);
        this.statCalculator = new StatCalculator(this);
        this.spellManager = new SpellManager(this);
        this.featureProcessor = new FeatureProcessor(this);
    }

    /**
     * Retrieves the configuration object for the active subclass.
     * @param {string} subclass - Selected subclass value.
     * @param {Object} state - Current character state.
     * @returns {Object} Subclass config or empty object.
     */
    getSubclassConfig(subclass, state = null) {
        if (!subclass || subclass === "None") return {};
        const sub = this.subclasses.find(s => s.value === subclass);
        let config = sub?.config || {};
        // If config is a function, evaluate it with the current context
        if (typeof config === 'function') {
            config = config(state);
        }
        return config;
    }

    /**
     * Calculates derived statistics for the character.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @returns {Object} Derived statistics object.
     */
    getDerivedStats(level, subclass, state) {
        return this.statCalculator.getDerivedStats(level, subclass, state);
    }

    /**
     * Gets attribute overrides for the current state.
     */
    getStatOverrides(level, subclass, state, statsMap, maxHP = null) {
        return this.statCalculator.getStatOverrides(level, subclass, state, statsMap, maxHP);
    }

    /**
     * Gets active state key limits for the given level, subclass, and state.
     */
    getActiveStateKeyLimits(level, subclass, state) {
        return this.featureProcessor._getActiveStateKeyLimits(level, subclass, state);
    }

    /**
     * Gets all resources (Base + Subclass) by delegating to ResourceManager.
     */
    getCombinedResources(subclass, state) {
        return this.resourceManager.combineResources(this.getSubclassConfig(subclass, state));
    }

    /**
     * Validates and corrects class-specific state.
     * Override this to implement 'revert' logic for level-dependent state (e.g. Beastforms).
     */
    validateState(state) {
        // Default: No-op
    }

    /**
     * Generates HTML for the class mechanic panel.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);
        const subConfig = this.getSubclassConfig(subclass, state);
        
        // 1. Automatically add all standard resources (Base + Subclass)
        this.getCombinedResources(subclass, state).forEach(res => {
            const max = derived.resourceMaxes[res.id];
            if (max > 0 || res.manual) {
                builder.addResource(res.id, res.label, state.resourceValues[res.id], max, res.options || {});
            }
        });

        // 2. Class-level extension
        if (typeof this.mechanicPanelExtension === 'function') {
            this.mechanicPanelExtension(builder, level, state, derived, statsMap);
        }

        // 3. Subclass-level extension
        if (typeof subConfig.mechanicPanelExtension === 'function') {
            subConfig.mechanicPanelExtension(builder, level, state, derived, statsMap);
        }

        return builder.build();
    }

    /**
     * Generates HTML for all class features.
     */
    getFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard) {
        return this.featureProcessor.getFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard);
    }

    /**
     * Renders an individual feature.
     */
    renderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef) {
        return this.featureProcessor.renderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef);
    }

    _getActiveFeatures(level, subclass) {
        return this.featureProcessor._getActiveFeatures(level, subclass);
    }

    _getActiveStateKeyLimits(level, subclass, state) {
        return this.featureProcessor._getActiveStateKeyLimits(level, subclass, state);
    }

    /**
     * Gets known schools for the given level, subclass, and state.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object|null} limits - Optional limits for extra schools.
     * @returns {Array<string>} List of known spell schools.
     */
    getKnownSchools(level, subclass, state, limits = null) {
        return this.spellManager.getKnownSchools(level, subclass, state, limits);
    }

    /**
     * Gets available spells for the given level, subclass, state, and derived stats.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {CharacterState} state - Current character state.
     * @param {DerivedStats} derived - Derived stats.
     * @returns {Array<Object>} List of available spells.
     */
    getAvailableSpells(level, subclass, state, derived) {
        return this.spellManager.getAvailableSpells(level, subclass, state, derived);
    }

    isUnarmored(state) {
        return this.statCalculator.isUnarmored(state);
    }

    isHeavyArmored(state) {
        return this.statCalculator.isHeavyArmored(state);
    }

    isBloodied(state, maxHP = null) {
        return this.statCalculator.isBloodied(state, maxHP);
    }
}

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
