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
        this.mechanicPanelExtension = config.mechanicPanelExtension || null;
        
        // Declarative Extensions (v2.2)
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
        const stats = { speed: 6, woundMax: 6 };
        const subConfig = this.getSubclassConfig(subclass, state);
        
        const combinedScaling = { ...this.scalingStats, ...(subConfig.scalingStats || {}) };

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

        return stats;
    }

    /**
     * Gets attribute overrides for the current state.
     */
    getStatOverrides(level, subclass, state, statsMap) {
        const overrides = {};
        const subConfig = this.getSubclassConfig(subclass, state);
        const combinedModifiers = [...this.statModifiers, ...(subConfig.statModifiers || [])];

        combinedModifiers.forEach(mod => {
            const levelMatch = level >= (mod.level || 0);
            const subclassMatch = !mod.subclass || mod.subclass === subclass;
            const conditionMatch = !mod.condition || mod.condition(level, subclass, state);

            if (levelMatch && subclassMatch && conditionMatch) {
                const val = typeof mod.getMod === 'function' ? mod.getMod(statsMap, state, level) : (mod.value || 0);
                if (['initAdv', 'modFlySpeed', 'quickRestLoh', 'panel_surge'].includes(mod.stat)) {
                    overrides[mod.stat] = val || true;
                } else {
                    overrides[mod.stat] = (overrides[mod.stat] || 0) + val;
                }
            }
        });

        return overrides;
    }

    /**
     * Generates HTML for the class mechanic panel.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);
        const subConfig = this.getSubclassConfig(subclass, state);
        
        // 1. Automatically add all standard resources (Base + Subclass)
        const combinedResources = [...(this.resources || []), ...(subConfig.resources || [])];
        combinedResources.forEach(res => {
            const max = derived.resourceMaxes[res.id];
            if (max > 0 || res.manual) {
                builder.addResource(res.id, res.label, state.resourceValues[res.id], max);
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
        return defaultGetFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, this.featuresData, this.optionsData, this);
    }

    /**
     * Renders an individual feature.
     */
    renderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef) {
        return defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef, this);
    }

    _getActiveFeatures(level, subclass) {
        const features = [];
        const replacedIds = new Set();
        const subData = this.featuresData.subclasses[subclass] || {};

        Object.values(subData).forEach(lvlFeats => {
            lvlFeats.forEach(feat => {
                if (feat.replaces) {
                    const r = Array.isArray(feat.replaces) ? feat.replaces : [feat.replaces];
                    r.forEach(id => replacedIds.add(id));
                }
            });
        });

        for (let i = 1; i <= level; i++) {
            if (this.featuresData.core[i]) {
                this.featuresData.core[i].forEach(feat => {
                    if (!replacedIds.has(feat.id)) features.push(feat);
                });
            }
        }
        for (let i = 1; i <= level; i++) {
            if (subData[i]) features.push(...subData[i]);
        }
        return features;
    }

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

        const schools = this.getKnownSchools(level, subclass, state, limits);

        features.forEach(feat => {
            if (feat.stateKey && feat.perSchool) {
                const count = typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1);
                const mult = typeof feat.multiplier === 'function' ? feat.multiplier(level, subclass, state) : (feat.multiplier || 1);
                limits[feat.stateKey] = (limits[feat.stateKey] || 0) + (schools.length * count * mult);
            }
        });

        return limits;
    }

    getKnownSchools(level, subclass, state, limits = null) {
        const subConfig = this.getSubclassConfig(subclass, state);
        const schools = new Set(this.spellSchools);
        
        // Add legacy subclass schools
        if (subclass && this.subclassSchools[subclass]) {
            this.subclassSchools[subclass].forEach(s => schools.add(s));
        }

        // Add declarative subclass schools (v2.2)
        if (subConfig.spellSchools) {
            subConfig.spellSchools.forEach(s => schools.add(s));
        }
        
        this.extraSchoolsKeys.forEach(key => {
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

        return Array.from(schools);
    }

    getAvailableSpells(level, subclass, state, derived) {
        const subConfig = this.getSubclassConfig(subclass, state);
        const progression = subConfig.spellProgression || this.spellProgression;
        if (!progression) return [];
        
        const limits = this._getActiveStateKeyLimits(level, subclass, state);
        const schools = this.getKnownSchools(level, subclass, state, limits);
        const spells = [];

        const combinedReplacements = [...this.spellReplacements, ...(subConfig.spellReplacements || [])];
        
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
                    const spellData = SPELL_REGISTRY[replacement.school]?.[replacement.add] || (UTILITY_SPELLS[replacement.school] ? { desc: UTILITY_SPELLS[replacement.school][replacement.add], tier: "Utility" } : null);
                    if (spellData && !spells.find(s => s.name === replacement.add)) {
                        spells.push({ name: replacement.add, ...spellData, school: replacement.school });
                    }
                }
            });
        }
        
        const combinedGrants = [...this.grantedSpells, ...(subConfig.grantedSpells || [])];
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

        if (this.includeUtilitySpells) this._addUtilitySpells(spells, level, subclass, state, limits);
        
        const combinedTieredKeys = [...this.includeTieredSpells, ...(subConfig.includeTieredSpells || [])];
        const combinedCantripKeys = [...this.includeCantripSpells, ...(subConfig.includeCantripSpells || [])];
        
        [...combinedTieredKeys, ...combinedCantripKeys].forEach(key => {
            const budget = limits[key] || 0;
            const selections = (state[key] || []).slice(0, budget);
            selections.forEach(val => {
                if (val === "None") return;
                for (const [sSch, spellsList] of Object.entries(SPELL_REGISTRY)) {
                    if (spellsList[val]) {
                        if (!spells.find(s => s.name === val)) spells.push({ name: val, ...spellsList[val], school: sSch });
                        break;
                    }
                }
            });
        });
        
        return spells;
    }
    
    _addUtilitySpells(spells, level, subclass, state, limits) {
        const schools = this.getKnownSchools(level, subclass, state, limits);
        const shouldAddAll = typeof this.includeUtilitySpells.all === "function" ? 
            this.includeUtilitySpells.all(level, subclass, state) : 
            this.includeUtilitySpells.all;

        if (shouldAddAll) {
            schools.forEach(school => {
                if (UTILITY_SPELLS[school]) {
                    Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                        if (!spells.find(s => s.name === name)) spells.push({ name, desc, tier: "Utility", school });
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
                    if (val === "None") return;
                    if (UTILITY_SPELLS[val]) {
                        Object.entries(UTILITY_SPELLS[val]).forEach(([name, desc]) => {
                            if (!spells.find(s => s.name === name)) spells.push({ name, desc, tier: "Utility", school: val });
                        });
                    } else {
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
}

function createSpellReplacement(replace, add, school) {
    return { replace, add, school };
}

function createUtilityConfig(all = false, selectKey = null) {
    return { all, selectKey };
}
