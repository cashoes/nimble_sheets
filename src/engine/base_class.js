/**
 * BaseClass definition for NIMBLE trackers.
 * Individual classes should extend this to provide specific logic.
 * 
 * Spell progression is handled automatically via constructor config:
 * - spellSchools: Array of default schools to include
 * - subclassSchools: Object mapping subclass -> additional schools
 * - includeUtilitySpells: Boolean or object config for utility spell inclusion
 */
class BaseClass {
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
        
        // NEW: Spell configuration
        this.spellSchools = config.spellSchools || []; // e.g., ["Fire", "Ice", "Lightning"]
        this.subclassSchools = config.subclassSchools || {}; // e.g., { "Control": ["Necrotic"], "Chaos": ["Wind"] }
        this.extraSchoolsKeys = config.extraSchoolsKeys || []; // Keys in state that might contain a school choice (e.g. ["selectedStudy"])
        this.includeUtilitySpells = config.includeUtilitySpells || false; // Boolean or config object
        this.includeTieredSpells = config.includeTieredSpells || []; // Array of state keys that contain individual tiered spell choices
        this.includeCantripSpells = config.includeCantripSpells || []; // Array of state keys that contain individual cantrip choices
        this.spellReplacements = config.spellReplacements || []; // For Oathbreaker-style replacements
        this.scalingStats = config.scalingStats || {}; // Declarative level scaling for derived stats
        this.rollTriggers = config.rollTriggers || []; // Automated roll modifiers/effects
        
        // Internal references for default renderers
        this.featuresData = config.featuresData || { core: {}, subclasses: {} };
        this.optionsData = config.optionsData || {};
        
        // Derived flag
        this.isCaster = this.spellSchools.length > 0 || !!this.spellProgression;
    }

    getDerivedStats(level, subclass, state) {
        const stats = { speed: 6, woundMax: 6 };
        
        // Process declarative scaling stats
        Object.entries(this.scalingStats).forEach(([key, milestones]) => {
            const sortedMilestones = Object.keys(milestones)
                .map(Number)
                .sort((a, b) => a - b);
            
            sortedMilestones.forEach(m => {
                if (level >= m) {
                    const val = milestones[m];
                    stats[key] = (typeof val === 'function') ? val(level, subclass) : val;
                }
            });
        });

        return stats;
    }

    getStatOverrides(level, subclass, state, statsMap) {
        return {};
    }

    getShieldBonus(level, subclass, statsMap) {
        return 0;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        return `<div class="panel mechanic-panel" style="min-height: 80px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-style: italic;">Standard Resource Hub</div>`;
    }

    getFeaturesHTML(level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        return defaultGetFeaturesHTML(level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, this.featuresData, this.optionsData, this);
    }

    renderFeature(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, optionsRef) {
        return defaultRenderFeature(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, optionsRef, this);
    }

    /**
     * Gather all active features for the current level and subclass
     */
    _getActiveFeatures(level, subclass) {
        const features = [];
        const replacedIds = new Set();
        const subData = this.featuresData.subclasses[subclass] || {};

        // 1. Identify replacements first
        Object.values(subData).forEach(lvlFeats => {
            lvlFeats.forEach(f => {
                if (f.replaces) {
                    if (Array.isArray(f.replaces)) f.replaces.forEach(id => replacedIds.add(id));
                    else replacedIds.add(f.replaces);
                }
            });
        });

        // 2. Add Core features (if not replaced)
        for (let i = 1; i <= level; i++) {
            if (this.featuresData.core[i]) {
                this.featuresData.core[i].forEach(f => {
                    if (!replacedIds.has(f.id)) features.push(f);
                });
            }
        }

        // 3. Add Subclass features
        for (let i = 1; i <= level; i++) {
            if (subData[i]) features.push(...subData[i]);
        }

        return features;
    }

    /**
     * Identify active state keys and their allowed budgets
     */
    _getActiveStateKeyLimits(level, subclass, state) {
        const limits = {};
        const features = this._getActiveFeatures(level, subclass);

        // Pass 1: Handle non-perSchool features (including school choices)
        features.forEach(f => {
            if (f.stateKey && !f.perSchool) {
                const count = typeof f.getCount === 'function' ? f.getCount(level, subclass, state) : (f.count || 1);
                const mult = typeof f.multiplier === 'function' ? f.multiplier(level, subclass, state) : (f.multiplier || 1);
                limits[f.stateKey] = (limits[f.stateKey] || 0) + (count * mult);
            }
        });

        // Resolve active schools using Pass 1 limits
        const schools = this.getKnownSchools(level, subclass, state, limits);

        // Pass 2: Handle perSchool features (dependent on schools)
        features.forEach(f => {
            if (f.stateKey && f.perSchool) {
                const count = typeof f.getCount === 'function' ? f.getCount(level, subclass, state) : (f.count || 1);
                const mult = typeof f.multiplier === 'function' ? f.multiplier(level, subclass, state) : (f.multiplier || 1);
                limits[f.stateKey] = (limits[f.stateKey] || 0) + (schools.length * count * mult);
            }
        });

        return limits;
    }

    getKnownSchools(level, subclass, state, limits = null) {
        const schools = new Set(this.spellSchools);
        if (subclass && this.subclassSchools[subclass]) {
            this.subclassSchools[subclass].forEach(s => schools.add(s));
        }
        
        // Add schools from dynamic school choices (only if active feature exists)
        this.extraSchoolsKeys.forEach(key => {
            // Strict check: if limits is provided, budget must be > 0. 
            // If limits is null, it includes everything (legacy compatibility).
            if (limits && (limits[key] || 0) <= 0) return;
            
            const val = state[key];
            if (val) {
                const vals = Array.isArray(val) ? val : [val];
                // Slice based on budget
                const activeVals = (limits && limits[key]) ? vals.slice(0, limits[key]) : vals;
                activeVals.forEach(v => {
                    if (v && v !== "None") {
                        if (SPELL_REGISTRY[v] || UTILITY_SPELLS[v]) schools.add(v);
                    }
                });
            }
        });

        return Array.from(schools);
    }

    /**
     * Default spell progression logic
     */
    getAvailableSpells(level, subclass, state, derived) {
        if (!this.isCaster) return [];
        
        const progression = this.spellProgression || [1, 2, 4, 6, 8, 10, 12, 14, 16, 18];
        const limits = this._getActiveStateKeyLimits(level, subclass, state);
        const schools = this.getKnownSchools(level, subclass, state, limits);
        const spells = [];
        
        // 1. Add tiered spells from each active school
        schools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                const tierNum = this._parseTierNumber(data.tier);
                const isCantrip = data.tier.toLowerCase().includes('cantrip');
                const requiredLevel = isCantrip ? (progression[0] || 1) : (progression[tierNum] || 99);
                if (level >= requiredLevel) {
                    if (this._isReplaced(name, subclass)) return;
                    spells.push({ name, ...data, school });
                }
            });
        });
        
        // 2. Handle spell replacements
        if (this.spellReplacements.length > 0) {
            this.spellReplacements.forEach(replacement => {
                if (replacement.subclass && replacement.subclass !== subclass) return;
                if (replacement.replace) {
                    const replaceList = Array.isArray(replacement.replace) ? replacement.replace : [replacement.replace];
                    replaceList.forEach(name => {
                        const idx = spells.findIndex(s => s.name === name);
                        if (idx !== -1) spells.splice(idx, 1);
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
        
        // 3. Add utility spells (filtered by budget)
        if (this.includeUtilitySpells) {
            this._addUtilitySpells(spells, level, subclass, state, limits);
        }
        
        // 4. Add individual tiered/cantrip spells (filtered by budget)
        [...this.includeTieredSpells, ...this.includeCantripSpells].forEach(key => {
            const budget = limits[key] || 0;
            const selections = (state[key] || []).slice(0, budget);
            selections.forEach(val => {
                if (val === "None") return;
                for (const [sch, spellsList] of Object.entries(SPELL_REGISTRY)) {
                    if (spellsList[val]) {
                        if (!spells.find(s => s.name === val)) spells.push({ name: val, ...spellsList[val], school: sch });
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
                    if (UTILITY_SPELLS[val]) { // School selection
                        Object.entries(UTILITY_SPELLS[val]).forEach(([name, desc]) => {
                            if (!spells.find(s => s.name === name)) spells.push({ name, desc, tier: "Utility", school: val });
                        });
                    } else { // Individual selection
                        for (const [sch, spellsList] of Object.entries(UTILITY_SPELLS)) {
                            if (spellsList[val]) {
                                if (!spells.find(s => s.name === val)) spells.push({ name: val, desc: spellsList[val], tier: "Utility", school: sch });
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
    
    _isReplaced(spellName, subclass) {
        return this.spellReplacements.some(r => {
            if (r.subclass && r.subclass !== subclass) return false;
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
}

function createSpellReplacement(replace, add, school, subclass = null) {
    return { replace, add, school, subclass };
}

function createUtilityConfig(all = false, selectKey = null) {
    return { all, selectKey };
}
