/**
 * @fileoverview BaseClass definition for NIMBLE trackers.
 * Individual class definitions should extend this to provide specific logic
 * for features, resources, and spell progression.
 */

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
        
        // Declarative Extensions (v2.1)
        this.optionExtensions = config.optionExtensions || {}; // e.g., { "Spellblade": { "orders": { ... } } }
        this.grantedSpells = config.grantedSpells || [];      // e.g., [{ level: 3, subclass: "Spellblade", spells: [...] }]
        this.statModifiers = config.statModifiers || [];      // e.g., [{ level: 15, subclass: "WildHeart", stat: "armor", getMod: ... }]

        // Spell configuration
        this.spellSchools = config.spellSchools || []; // e.g., ["Fire", "Ice", "Lightning"]
        this.subclassSchools = config.subclassSchools || {}; // e.g., { "Control": ["Necrotic"], "Chaos": ["Wind"] }
        this.extraSchoolsKeys = config.extraSchoolsKeys || []; // Keys in state that might contain a school choice
        this.includeUtilitySpells = config.includeUtilitySpells || false; // Boolean or config object
        this.includeTieredSpells = config.includeTieredSpells || []; // Array of state keys for tiered spell choices
        this.includeCantripSpells = config.includeCantripSpells || []; // Array of state keys for cantrip choices
        this.spellReplacements = config.spellReplacements || []; // For subclass-specific spell replacements
        this.scalingStats = config.scalingStats || {}; // Declarative level scaling for derived stats
        this.rollTriggers = config.rollTriggers || []; // Automated roll modifiers/effects
        
        // Internal references for default renderers
        this.featuresData = config.featuresData || { core: {}, subclasses: {} };
        this.optionsData = config.optionsData || {};
        
        // Derived flag
        this.isCaster = this.spellSchools.length > 0 || !!this.spellProgression;
    }

    /**
     * Calculates derived statistics for the character.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @returns {Object} Derived statistics object.
     */
    getDerivedStats(level, subclass, state) {
        const stats = { speed: 6, woundMax: 6 };
        
        // 1. Process declarative scaling stats (Milestones or Functions)
        Object.entries(this.scalingStats).forEach(([key, val]) => {
            if (typeof val === 'function') {
                stats[key] = val(level, subclass, state);
            } else if (typeof val === 'object' && val !== null) {
                // Handle milestone objects { 1: val, 5: val }
                const sortedMilestones = Object.keys(val)
                    .map(Number)
                    .sort((a, b) => a - b);
                
                sortedMilestones.forEach(m => {
                    if (level >= m) {
                        const milestoneVal = val[m];
                        stats[key] = (typeof milestoneVal === 'function') ? milestoneVal(level, subclass) : milestoneVal;
                    }
                });
            } else {
                stats[key] = val;
            }
        });

        return stats;
    }

    /**
     * Gets attribute overrides for the current state.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} statsMap - Current attribute map.
     * @returns {Object} Stat overrides.
     */
    getStatOverrides(level, subclass, state, statsMap) {
        const overrides = {};

        // Process declarative stat modifiers (v2.1)
        this.statModifiers.forEach(mod => {
            const levelMatch = level >= (mod.level || 0);
            const subclassMatch = !mod.subclass || mod.subclass === subclass;
            const conditionMatch = !mod.condition || mod.condition(level, subclass, state);

            if (levelMatch && subclassMatch && conditionMatch) {
                const val = typeof mod.getMod === 'function' ? mod.getMod(statsMap, state, level) : (mod.value || 0);
                if (mod.stat === 'initAdv' || mod.stat === 'modFlySpeed') {
                    overrides[mod.stat] = val || true;
                } else {
                    overrides[mod.stat] = (overrides[mod.stat] || 0) + val;
                }
            }
        });

        return overrides;
    }

    /**
     * Calculates current shield bonus.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} statsMap - Current attribute map.
     * @returns {number} Shield bonus value.
     */
    getShieldBonus(level, subclass, statsMap) {
        return 0;
    }

    /**
     * Generates HTML for the class mechanic panel.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived statistics.
     * @returns {string} HTML string.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        return `<div class="panel mechanic-panel" style="min-height: 80px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-style: italic;">Standard Resource Hub</div>`;
    }

    /**
     * Generates HTML for all class features.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived character data.
     * @param {Function} buildFeatureHtml - Callback to build feature HTML.
     * @param {Function} iStats - Callback to parse stat tokens.
     * @param {Function} formatPips - Callback to format spell pips.
     * @param {Function} renderSingleSpellCard - Callback to render a spell card.
     * @returns {string} HTML string for all features.
     */
    getFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard) {
        return defaultGetFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, this.featuresData, this.optionsData, this);
    }

    /**
     * Renders an individual feature.
     * @param {Object} feat - Feature definition.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived character data.
     * @param {Function} buildFeatureHtml - Callback to build feature HTML.
     * @param {Function} iStats - Callback to parse stat tokens.
     * @param {Function} formatPips - Callback to format spell pips.
     * @param {Function} renderSingleSpellCard - Callback to render a spell card.
     * @param {string} cssClass - Additional CSS classes.
     * @param {Object} optionsRef - Reference to feature options.
     * @returns {string} HTML string for the feature.
     */
    renderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef) {
        return defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef, this);
    }

    /**
     * Gather all active features for the current level and subclass.
     * @param {number} level - Current level.
     * @param {string} subclass - Selected subclass.
     * @returns {Array} List of active features.
     * @private
     */
    _getActiveFeatures(level, subclass) {
        const features = [];
        const replacedIds = new Set();
        const subData = this.featuresData.subclasses[subclass] || {};

        // 1. Identify replacements first
        Object.values(subData).forEach(lvlFeats => {
            lvlFeats.forEach(feat => {
                if (feat.replaces) {
                    if (Array.isArray(feat.replaces)) {
                        feat.replaces.forEach(id => replacedIds.add(id));
                    } else {
                        replacedIds.add(feat.replaces);
                    }
                }
            });
        });

        // 2. Add Core features (if not replaced)
        for (let i = 1; i <= level; i++) {
            if (this.featuresData.core[i]) {
                this.featuresData.core[i].forEach(feat => {
                    if (!replacedIds.has(feat.id)) {
                        features.push(feat);
                    }
                });
            }
        }

        // 3. Add Subclass features
        for (let i = 1; i <= level; i++) {
            if (subData[i]) {
                features.push(...subData[i]);
            }
        }

        return features;
    }

    /**
     * Identify active state keys and their allowed selection budgets.
     * This ensures that only the correct number of selections (spells, options)
     * are rendered based on character level and features.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @returns {Object} Map of stateKey to selection count.
     * @private
     */
    _getActiveStateKeyLimits(level, subclass, state) {
        const limits = {};
        const features = this._getActiveFeatures(level, subclass);

        // Pass 1: Handle non-perSchool features (including school choices)
        // This calculates basic budgets for fixed choices.
        features.forEach(feat => {
            if (feat.stateKey && !feat.perSchool) {
                const count = typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1);
                const mult = typeof feat.multiplier === 'function' ? feat.multiplier(level, subclass, state) : (feat.multiplier || 1);
                limits[feat.stateKey] = (limits[feat.stateKey] || 0) + (count * mult);
            }
        });

        // Resolve active schools using Pass 1 limits
        // We need to know which schools are active to calculate budgets for per-school features.
        const schools = this.getKnownSchools(level, subclass, state, limits);

        // Pass 2: Handle perSchool features (dependent on schools)
        // This scales budgets based on the number of magic schools the character knows.
        features.forEach(feat => {
            if (feat.stateKey && feat.perSchool) {
                const count = typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1);
                const mult = typeof feat.multiplier === 'function' ? feat.multiplier(level, subclass, state) : (feat.multiplier || 1);
                limits[feat.stateKey] = (limits[feat.stateKey] || 0) + (schools.length * count * mult);
            }
        });

        return limits;
    }

    /**
     * Gets the list of magic schools known by the character.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} [limits=null] - Budget limits to filter choices.
     * @returns {string[]} List of school names.
     */
    getKnownSchools(level, subclass, state, limits = null) {
        const schools = new Set(this.spellSchools);
        if (subclass && this.subclassSchools[subclass]) {
            this.subclassSchools[subclass].forEach(s => schools.add(s));
        }
        
        // Add schools from dynamic school choices (only if active feature exists)
        this.extraSchoolsKeys.forEach(key => {
            // Strict check: if limits is provided, budget must be > 0. 
            // If limits is null, it includes everything (legacy compatibility).
            if (limits && (limits[key] || 0) <= 0) {
                return;
            }
            
            const val = state[key];
            if (val) {
                const vals = Array.isArray(val) ? val : [val];
                // Slice based on budget
                const activeVals = (limits && limits[key]) ? vals.slice(0, limits[key]) : vals;
                activeVals.forEach(v => {
                    if (v && v !== "None") {
                        if (SPELL_REGISTRY[v] || UTILITY_SPELLS[v]) {
                            schools.add(v);
                        }
                    }
                });
            }
        });

        return Array.from(schools);
    }

    /**
     * Gets all available spells for the character based on schools, tiers, and level.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived character data.
     * @returns {Array} List of spell objects.
     */
    getAvailableSpells(level, subclass, state, derived) {
        if (!this.isCaster) {
            return [];
        }
        
        const progression = this.spellProgression || [1, 2, 4, 6, 8, 10, 12, 14, 16, 18];
        const limits = this._getActiveStateKeyLimits(level, subclass, state);
        const schools = this.getKnownSchools(level, subclass, state, limits);
        const spells = [];
        
        // 1. Add tiered spells from each active school
        schools.forEach(school => {
            if (!SPELL_REGISTRY[school]) {
                return;
            }
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                const tierNum = this._parseTierNumber(data.tier);
                const isCantrip = data.tier.toLowerCase().includes('cantrip');
                const requiredLevel = isCantrip ? (progression[0] || 1) : (progression[tierNum] || 99);
                if (level >= requiredLevel) {
                    if (this._isReplaced(name, subclass)) {
                        return;
                    }
                    spells.push({ name, ...data, school });
                }
            });
        });
        
        // 2. Handle spell replacements
        if (this.spellReplacements.length > 0) {
            this.spellReplacements.forEach(replacement => {
                if (replacement.subclass && replacement.subclass !== subclass) {
                    return;
                }
                if (replacement.replace) {
                    const replaceList = Array.isArray(replacement.replace) ? replacement.replace : [replacement.replace];
                    replaceList.forEach(name => {
                        const idx = spells.findIndex(s => s.name === name);
                        if (idx !== -1) {
                            spells.splice(idx, 1);
                        }
                    });
                }
                if (replacement.add) {
                    const spellData = SPELL_REGISTRY[replacement.school]?.[replacement.add] || (UTILITY_SPELLS[replacement.school] ? { desc: UTILITY_SPELLS[replacement.school][replacement.add], tier: "Utility" } : null);
                    if (spellData && !spells.find(s => s.name === replacement.add)) {
                        spells.push({ name: replacement.add, ...spellData, school: replacement.school });
                    }
                }
            });
        }
        
        // 3. Handle declaratively granted spells (v2.1)
        this.grantedSpells.forEach(grant => {
            const levelMatch = level >= (grant.level || 0);
            const subclassMatch = !grant.subclass || grant.subclass === subclass;
            const conditionMatch = !grant.condition || grant.condition(level, subclass, state);

            if (levelMatch && subclassMatch && conditionMatch) {
                (grant.spells || []).forEach(sGrant => {
                    const name = typeof sGrant === 'string' ? sGrant : sGrant.name;
                    const school = typeof sGrant === 'string' ? null : sGrant.school;
                    
                    // Lookup in registries if school/data not provided
                    let spellData = null;
                    let foundSchool = school;
                    
                    if (school) {
                        spellData = SPELL_REGISTRY[school]?.[name] || (UTILITY_SPELLS[school] ? { desc: UTILITY_SPELLS[school][name], tier: "Utility" } : null);
                    } else {
                        // Global lookup
                        for (const [sch, list] of Object.entries(SPELL_REGISTRY)) {
                            if (list[name]) { spellData = list[name]; foundSchool = sch; break; }
                        }
                        if (!spellData) {
                            for (const [sch, list] of Object.entries(UTILITY_SPELLS)) {
                                if (list[name]) { spellData = { desc: list[name], tier: "Utility" }; foundSchool = sch; break; }
                            }
                        }
                    }

                    if (spellData && !spells.find(s => s.name === name)) {
                        spells.push({ name, ...spellData, school: foundSchool });
                    }
                });
            }
        });

        // 4. Add utility spells (filtered by budget)
        if (this.includeUtilitySpells) {
            this._addUtilitySpells(spells, level, subclass, state, limits);
        }
        
        // 4. Add individual tiered/cantrip spells (filtered by budget)
        [...this.includeTieredSpells, ...this.includeCantripSpells].forEach(key => {
            const budget = limits[key] || 0;
            const selections = (state[key] || []).slice(0, budget);
            selections.forEach(val => {
                if (val === "None") {
                    return;
                }
                for (const [sch, spellsList] of Object.entries(SPELL_REGISTRY)) {
                    if (spellsList[val]) {
                        if (!spells.find(s => s.name === val)) {
                            spells.push({ name: val, ...spellsList[val], school: sch });
                        }
                        break;
                    }
                }
            });
        });
        
        return spells;
    }
    
    /**
     * Internal helper to add utility spells to the character's list.
     * @private
     */
    _addUtilitySpells(spells, level, subclass, state, limits) {
        const schools = this.getKnownSchools(level, subclass, state, limits);
        const shouldAddAll = typeof this.includeUtilitySpells.all === "function" ? 
            this.includeUtilitySpells.all(level, subclass, state) : 
            this.includeUtilitySpells.all;

        if (shouldAddAll) {
            schools.forEach(school => {
                if (UTILITY_SPELLS[school]) {
                    Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                        if (!spells.find(s => s.name === name)) {
                            spells.push({ name, desc, tier: "Utility", school });
                        }
                    });
                }
            });
        }
        
        if (this.includeUtilitySpells.selectKey) {
            const keys = Array.isArray(this.includeUtilitySpells.selectKey) ? this.includeUtilitySpells.selectKey : [this.includeUtilitySpells.selectKey];
            keys.forEach(key => {
                const budget = limits[key] || 0;
                const selections = (state[key] || []).slice(0, budget);
                selections.forEach(val => {
                    if (val === "None") {
                        return;
                    }
                    if (UTILITY_SPELLS[val]) { // School selection
                        Object.entries(UTILITY_SPELLS[val]).forEach(([name, desc]) => {
                            if (!spells.find(s => s.name === name)) {
                                spells.push({ name, desc, tier: "Utility", school: val });
                            }
                        });
                    } else { // Individual selection
                        for (const [sch, spellsList] of Object.entries(UTILITY_SPELLS)) {
                            if (spellsList[val]) {
                                if (!spells.find(s => s.name === val)) {
                                    spells.push({ name: val, desc: spellsList[val], tier: "Utility", school: sch });
                                }
                                break;
                            }
                        }
                    }
                });
            });
        }
    }
    
    /**
     * Parses a tier string into its numerical value.
     * @param {string} tierStr - Tier string (e.g., "Tier 1").
     * @returns {number} The tier number.
     * @private
     */
    _parseTierNumber(tierStr) {
        if (!tierStr) {
            return 0;
        }
        if (tierStr.toLowerCase().includes('cantrip')) {
            return 0;
        }
        return parseInt(tierStr.replace(/\D/g, '')) || 0;
    }
    
    /**
     * Checks if a spell has been replaced by a subclass feature.
     * @param {string} spellName - Name of the spell.
     * @param {string} subclass - Selected subclass.
     * @returns {boolean} True if replaced.
     * @private
     */
    _isReplaced(spellName, subclass) {
        return this.spellReplacements.some(r => {
            if (r.subclass && r.subclass !== subclass) {
                return false;
            }
            const replaceList = Array.isArray(r.replace) ? r.replace : [r.replace];
            return replaceList.includes(spellName);
        });
    }

    /**
     * Checks if the character is currently unarmored.
     * @param {Object} state - Current character state.
     * @returns {boolean} True if unarmored.
     */
    isUnarmored(state) {
        let unarmored = true;
        (state.inventory || []).forEach(item => { 
            if (item.type === 'armor' && item.equipped) {
                unarmored = false;
            }
        });
        return unarmored;
    }
}

/**
 * Creates a spell replacement configuration.
 * @param {string|string[]} replace - Spell(s) to replace.
 * @param {string} add - Spell to add.
 * @param {string} school - School of the added spell.
 * @param {string} [subclass=null] - Optional subclass restriction.
 * @returns {Object} Replacement config.
 */
function createSpellReplacement(replace, add, school, subclass = null) {
    return { replace, add, school, subclass };
}

/**
 * Creates utility spell inclusion configuration.
 * @param {boolean|Function} [all=false] - Whether to include all utility spells for known schools.
 * @param {string|string[]} [selectKey=null] - State keys for individual utility selections.
 * @returns {Object} Utility config.
 */
function createUtilityConfig(all = false, selectKey = null) {
    return { all, selectKey };
}
