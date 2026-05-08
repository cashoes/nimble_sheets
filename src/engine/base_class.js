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
        this.includeUtilitySpells = config.includeUtilitySpells || false; // Boolean or config object
        this.spellReplacements = config.spellReplacements || []; // For Oathbreaker-style replacements
        
        // Internal references for default renderers
        this.featuresData = config.featuresData || { core: {}, subclasses: {} };
        this.optionsData = config.optionsData || {};
        
        // Derived flag
        this.isCaster = this.spellSchools.length > 0 || !!this.spellProgression;
    }

    getDerivedStats(level, subclass, state) {
        return { speed: 6, woundMax: 6 };
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
     * Default spell progression logic
     * Override this ONLY if you need custom behavior (Oathbreaker replacements, Shepherd's paired utilities, etc.)
     * 
     * @param {number} level - Character level
     * @param {string} subclass - Current subclass
     * @param {Object} state - Character state
     * @param {Object} derived - Derived stats
     * @returns {Object[]} Array of spell objects
     */
    getAvailableSpells(level, subclass, state, derived) {
        if (!this.isCaster) return [];
        
        const spells = [];
        const progression = this.spellProgression || [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];
        
        // 1. Gather all schools for this class + subclass
        const schools = [...this.spellSchools];
        if (subclass && this.subclassSchools[subclass]) {
            schools.push(...this.subclassSchools[subclass]);
        }
        
        // 2. Add tiered spells from each school
        schools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                const tierNum = this._parseTierNumber(data.tier);
                const isCantrip = data.tier.toLowerCase().includes('cantrip');
                const requiredLevel = isCantrip ? 1 : progression[tierNum] || 99;
                
                if (level >= requiredLevel) {
                    // Check if this spell should be replaced
                    if (this._isReplaced(name, subclass)) return;
                    spells.push({ name, ...data, school });
                }
            });
        });
        
        // 3. Handle spell replacements (Oathbreaker pattern)
        if (this.spellReplacements.length > 0) {
            this.spellReplacements.forEach(replacement => {
                if (replacement.subclass && replacement.subclass !== subclass) return;
                
                // Remove replaced spells
                if (replacement.replace) {
                    const replaceList = Array.isArray(replacement.replace) ? replacement.replace : [replacement.replace];
                    replacement.replaceList.forEach(name => {
                        const idx = spells.findIndex(s => s.name === name);
                        if (idx !== -1) spells.splice(idx, 1);
                    });
                }
                
                // Add new spells
                if (replacement.add) {
                    const spellData = SPELL_REGISTRY[replacement.school]?.[replacement.add];
                    if (spellData) {
                        spells.push({ name: replacement.add, ...spellData, school: replacement.school });
                    }
                }
            });
        }
        
        // 4. Add utility spells if configured
        if (this.includeUtilitySpells) {
            this._addUtilitySpells(spells, level, subclass, state);
        }
        
        return spells;
    }
    
    /**
     * Add utility spells based on configuration
     * Override this for custom utility handling (Shepherd's paired pattern, etc.)
     */
    _addUtilitySpells(spells, level, subclass, state) {
        if (!this.includeUtilitySpells) return;
        
        // Default: all utility spells from all schools
        const schools = [...this.spellSchools];
        if (subclass && this.subclassSchools[subclass]) {
            schools.push(...this.subclassSchools[subclass]);
        }
        
        schools.forEach(school => {
            if (!UTILITY_SPELLS[school]) return;
            
            // Check if we should add all or select N
            if (this.includeUtilitySpells.all) {
                Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school });
                });
            } else if (this.includeUtilitySpells.selectKey) {
                // Selection-based (Mage's Mastery pattern)
                const selections = state[this.includeUtilitySpells.selectKey] || [];
                selections.forEach(sel => {
                    if (UTILITY_SPELLS[school]?.[sel]) {
                        Object.entries(UTILITY_SPELLS[school][sel] || {}).forEach(([name, desc]) => {
                            spells.push({ name, desc, tier: "Utility", school });
                        });
                    }
                });
            }
        });
    }
    
    /**
     * Parse tier number from tier string
     */
    _parseTierNumber(tierStr) {
        if (!tierStr) return 0;
        if (tierStr.toLowerCase().includes('cantrip')) return 0;
        return parseInt(tierStr.replace(/\D/g, '')) || 0;
    }
    
    /**
     * Check if a spell should be replaced
     */
    _isReplaced(spellName, subclass) {
        return this.spellReplacements.some(r => {
            if (r.subclass && r.subclass !== subclass) return false;
            const replaceList = Array.isArray(r.replace) ? r.replace : [r.replace];
            return replaceList.includes(spellName);
        });
    }
}

/**
 * Helper function to create spell replacement configs (Oathbreaker pattern)
 */
function createSpellReplacement(replace, add, school, subclass = null) {
    return { replace, add, school, subclass };
}

/**
 * Helper to create utility spell config
 */
function createUtilityConfig(all = false, selectKey = null) {
    return { all, selectKey };
}
