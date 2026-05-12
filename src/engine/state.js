/**
 * @fileoverview STATE ENGINE MODULE
 * Responsible for character mathematical model, derived stats, calculation, 
 * persistence, and synchronization between state and DOM.
 */

/**
 * Ensures the state object is valid by setting defaults and correcting types.
 * @param {Object|null|undefined} state - The state object to validate.
 * @returns {Object} A valid state object.
 */
function ensureValidState(state) {
    // If state is null or undefined, start with an empty object
    const valid = { ...(state || {}) };

    // Define defaults and validators
    const defaults = {
        version: "2.2.4",
        charName: '',
        level: 1,
        ancestry: 'None',
        background: 'None',
        subclass: 'None',
        baseStr: 0, addStr: 0,
        baseDex: 0, addDex: 0,
        baseInt: 0, addInt: 0,
        baseWil: 0, addWil: 0,
        hpCurrent: null,
        tempHP: 0,
        hdCurrent: null,
        wounds: 0,
        skills: {},
        activeConditions: [],
        inventory: [],
        gold: 0,
        resourceValues: {},
        bgSpell: 'None',
        showMinor: false,
        // Multi-selection feature states
        selectedDecrees: [],
        selectedSpells: [],
        selectedArsenal: [],
        selectedToth: [],
        selectedMastery: [],
        selectedGreater: [],
        selectedLesser: [],
        selectedGraces: [],
        selectedLyrical: [],
        selectedBoons: [],
        selectedMartial: [],
        selectedUnderhanded: [],
        selectedDeepKnowledge: [],
        secondarySchool: [],
        selectedSubclassSpells: [],
        selectedStudy: [],
        selectedTwilight: [],
        selectedShadowmastery: [],
        currentForm: [],
        furyDice: [],
        judgmentDice: null,
        judgmentBoom: 'OFF',
        judgmentMode: 'Single',
        furyBoom: 'OFF',
        advantage: 0,
        actionsSpent: 0
    };

    // Apply defaults for missing or incorrect types
    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (valid[key] === undefined) {
            valid[key] = defaultValue;
        } else {
            // Type correction
            const expectedType = typeof defaultValue;
            if (expectedType === 'object' && defaultValue !== null) {
                // For objects and arrays, we want to ensure they are the correct type
                if (Array.isArray(defaultValue)) {
                    if (!Array.isArray(valid[key])) {
                        valid[key] = [...defaultValue]; // copy the default array
                    }
                } else {
                    // Plain object
                    if (typeof valid[key] !== 'object' || valid[key] === null || Array.isArray(valid[key])) {
                        valid[key] = { ...defaultValue }; // copy the default object
                    }
                }
            } else if (expectedType === 'number') {
                if (typeof valid[key] !== 'number' || Number.isNaN(valid[key])) {
                    valid[key] = defaultValue;
                } else if (key === 'level') {
                    // Clamp level between 1 and 20
                    valid[key] = Math.min(20, Math.max(1, valid[key]));
                }
            } else if (expectedType === 'string') {
                if (typeof valid[key] !== 'string') {
                    valid[key] = String(valid[key]);
                }
            } else if (expectedType === 'boolean') {
                valid[key] = !!valid[key];
            }
            // For null (like hpCurrent, hdCurrent, judgmentDice) we don't correct type if it's not null,
            // because the rest of the code expects either null or a specific type.
            // We'll leave it as is and let the specific usage handle it.
        }
    }

    // Additional validation: ensure arrays of strings for certain fields? Not necessary.

    return valid;
}

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
    const classOverrides = CLASS_CONFIG.getStatOverrides ? CLASS_CONFIG.getStatOverrides(level, s.subclass, s, statsMap, maxHP) : {};
    const isBloodied = CLASS_CONFIG.isBloodied(s, maxHP);

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
    const combinedResources = CLASS_CONFIG.getCombinedResources ? CLASS_CONFIG.getCombinedResources(s.subclass, s) : (CLASS_CONFIG.resources || []);
    combinedResources.forEach(r => {
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
        ...classOverrides,
        ...classDerived,
        level, 
        statsMap, 
        hdFace, 
        maxHP, 
        isBloodied,
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

/**
 * Generates a unique key for local storage based on the character class and filename.
 * @returns {string} The storage key.
 */
const getStorageKey = () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return `nimble_v4_${CLASS_CONFIG.name.toLowerCase()}_${filename}`;
};

const STORAGE_KEY = getStorageKey();

/** 
 * Placeholder for embedded state injection. 
 * This is used when a character sheet is exported as a standalone HTML file.
 */
const EMBEDDED_STATE = null;

/** The master character state object. */
let state = {};

/**
 * Saves the current character state to LocalStorage.
 * Reads values from the DOM if no newState is provided.
 * @param {Object|null} newState - Optional state object to overwrite the current state.
 */
function saveState(newState = null) {
    let newStateObj;
    if (newState) {
        // Parse and validate the provided state
        try {
            newStateObj = JSON.parse(JSON.stringify(newState));
        } catch (e) {
            console.error("Failed to parse provided state:", e);
            return; // Abort save if state is invalid JSON
        }
    } else {
        const oldDerived = computeDerived(state);
        const oldGold = state.gold;
        const oldLevel = state.level;

        // 1. Sync basic identity fields
        state.charName = document.getElementById('charName').value;
        state.level = parseInt(document.getElementById('level').value) || 1;
        state.ancestry = document.getElementById('ancestry').value;
        state.background = document.getElementById('background').value;
        state.subclass = document.getElementById('subclass').value;
        state.gold = parseInt(document.getElementById('gold').value) || 0;
        state.showMinor = document.getElementById('toggleMinorFeatures')?.checked || false;

        // 2. Trigger visual feedback for currency changes
        if (state.gold > oldGold) {
            triggerAnimation('gold', 'green');
        } else if (state.gold < oldGold) {
            triggerAnimation('gold', 'red');
        }

        // 3. Sync primary attributes (Base + Level Ups)
        const isLevel1 = state.level === 1;
        ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
            const baseEl = document.getElementById(`base${s}`);
            const addEl = document.getElementById(`add${s}`);
            if (baseEl && addEl) {
                let b = parseInt(baseEl.value) || 0;
                let a = parseInt(addEl.value) || 0;
                
                // Validate NIMBLE's attribute cap of 5
                if (b + a > 5) { 
                    a = Math.max(0, 5 - b); 
                    addEl.value = a; 
                }
                
                addEl.max = Math.max(0, 5 - b);
                if (isLevel1) {
                    state[`base${s}`] = b;
                }
                state[`add${s}`] = a;
            }
        });

        // 4. Recalculate derived totals
        const derived = computeDerived(state);

        // 5. Automatic recovery on level up
        if (oldLevel !== state.level || state.hpCurrent === null) {
            state.hpCurrent = derived.maxHP;
            state.hdCurrent = derived.hdMax;
        }

        // 6. Handle resource max changes
        (CLASS_CONFIG.resources || []).forEach(r => {
            const newMax = derived.resourceMaxes[r.id];
            const oldMax = oldDerived.resourceMaxes[r.id];
            
            // Auto-refill resources if they were empty or if level changed
            if (state.resourceValues[r.id] === undefined || newMax !== oldMax || oldLevel !== state.level) {
                state.resourceValues[r.id] = newMax;
            }
        });

        newStateObj = state; // Use the mutated state
    }

    // Ensure the state is valid and has correct types/defaults
    state = ensureValidState(newStateObj);

    // 7. Persist to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 8. Visual save confirmation
    const ind = document.getElementById('saveIndicator'); 
    if (ind) {
        ind.textContent = 'Saved ✓'; 
        setTimeout(() => { 
            ind.textContent = 'Auto-saved'; 
        }, 1500);
    }
}

/**
 * Initializes the character state.
 * Loads from EMBEDDED_STATE (export mode) or LocalStorage.
 * Falls back to class defaults for new characters.
 */
function loadState() {
    // 1. Define standard state schema and defaults
    state = {
        version: "2.2.4",
        charName: '',        level: 1, 
        ancestry: 'None', 
        background: 'None', 
        subclass: 'None',
        baseStr: 0, addStr: 0, 
        baseDex: 0, addDex: 0, 
        baseInt: 0, addInt: 0, 
        baseWil: 0, addWil: 0,
        hpCurrent: null, 
        tempHP: 0, 
        hdCurrent: null, 
        wounds: 0,
        skills: {}, 
        activeConditions: [], 
        inventory: [], 
        gold: 0,
        resourceValues: {}, 
        bgSpell: 'None', 
        showMinor: false,
        
        // Multi-selection feature states
        selectedDecrees: [], selectedSpells: [], selectedArsenal: [], selectedToth: [],
        selectedMastery: [], selectedGreater: [], selectedLesser: [], selectedGraces: [],
        selectedLyrical: [], selectedBoons: [], selectedMartial: [], selectedUnderhanded: [],
        selectedDeepKnowledge: [], secondarySchool: [], selectedSubclassSpells: [],
        selectedStudy: [], selectedTwilight: [], selectedShadowmastery: [],
        
        currentForm: [],
        furyDice: [], 
        judgmentDice: null,
        judgmentBoom: 'OFF',
        judgmentMode: 'Single',
        furyBoom: 'OFF',
        
        advantage: 0, 
        actionsSpent: 0
    };

    // 2. Load from storage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (EMBEDDED_STATE) { 
        Object.assign(state, EMBEDDED_STATE); 
    } else if (raw) { 
        try { 
            const loaded = JSON.parse(raw); 
            Object.assign(state, loaded); 
        } catch(e) {
            console.error("Failed to load character state:", e);
        } 
    }
    // Ensure state is valid and has correct types/defaults
    state = ensureValidState(state);

    // 3. Apply class-specific initial stats for brand new characters
    if (state.level === 1 && !state.charName) { 
        if (CLASS_CONFIG.initialStats) { 
            Object.assign(state, CLASS_CONFIG.initialStats); 
        } 
    }

    // 4. Initial UI Setup
    applyTheme(CLASS_CONFIG.theme); 
    syncStateToDOM();
    
    // 5. Ensure derived totals are calculated and persisted
    const derived = computeDerived(state);
    if (state.hpCurrent === null) state.hpCurrent = derived.maxHP;
    if (state.hdCurrent === null) state.hdCurrent = derived.hdMax;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Synchronizes the internal state object with the physical DOM elements.
 * Called on page load and after major state resets.
 */
function syncStateToDOM() {
    const derived = computeDerived(state);

    // 1. Identity and Header info
    if (document.getElementById('classNameDisplay')) document.getElementById('classNameDisplay').innerText = CLASS_CONFIG.name;
    if (document.getElementById('classSubtitleDisplay')) document.getElementById('classSubtitleDisplay').innerText = CLASS_CONFIG.subtitle;
    
    if (document.getElementById('profArmor')) {
        const armorProf = derived.profArmor || (CLASS_CONFIG.proficiencies ? CLASS_CONFIG.proficiencies.armor : "--");
        document.getElementById('profArmor').innerText = armorProf;
    }
    if (document.getElementById('profWeapons')) {
        const weaponsProf = derived.profWeapons || (CLASS_CONFIG.proficiencies ? CLASS_CONFIG.proficiencies.weapons : "--");
        document.getElementById('profWeapons').innerText = weaponsProf;
    }

    // 2. Populate Selection Dropdowns
    const subHtml = CLASS_CONFIG.subclasses.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
    const sc = document.getElementById('subclass'); 
    if (sc) sc.innerHTML = subHtml;

    let ancHtml = `<option value="None">None</option>`;
    Object.keys(ANCESTRIES).forEach(group => { 
        ancHtml += `<optgroup label="${group}">`; 
        ANCESTRIES[group].forEach(a => ancHtml += `<option value="${a}">${a}</option>`); 
        ancHtml += `</optgroup>`; 
    });
    const ac = document.getElementById('ancestry'); 
    if (ac) ac.innerHTML = ancHtml;

    let bgHtml = `<option value="None">None</option>`;
    Object.keys(BACKGROUNDS).forEach(group => { 
        bgHtml += `<optgroup label="${group}">`; 
        BACKGROUNDS[group].forEach(b => bgHtml += `<option value="${b}">${b}</option>`); 
        bgHtml += `</optgroup>`; 
    });
    const bc = document.getElementById('background'); 
    if (bc) bc.innerHTML = bgHtml;
    
    // 3. Populate Inventory Item Lists
    const itemSlots = [
        { id: 'meleeSelect', key: 'melee', label: '+ Melee Item' },
        { id: 'rangedSelect', key: 'ranged', label: '+ Ranged Item' },
        { id: 'armorSelect', key: 'armor', label: '+ Armor/Shield' }
    ];

    itemSlots.forEach(slot => {
        const el = document.getElementById(slot.id);
        if (el) {
            let html = `<option value="">${slot.label}</option>`;
            Object.keys(ITEM_TEMPLATES[slot.key]).forEach(group => {
                html += `<optgroup label="${group}">`;
                ITEM_TEMPLATES[slot.key][group].forEach(k => {
                    html += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`;
                });
                html += `</optgroup>`;
            });
            el.innerHTML = html;
            
            // Re-bind change events
            el.onchange = (e) => { 
                if (e.target.value) { 
                    addQuickItem('data', e.target.value); 
                    e.target.value = ""; 
                } 
            };
        }
    });
    
    // 4. Sync values to Input elements
    if (document.getElementById('charName')) document.getElementById('charName').value = state.charName || ''; 
    if (document.getElementById('level')) document.getElementById('level').value = state.level || 1;
    if (document.getElementById('ancestry')) document.getElementById('ancestry').value = state.ancestry || 'None'; 
    if (document.getElementById('background')) document.getElementById('background').value = state.background || 'None';
    if (document.getElementById('subclass')) document.getElementById('subclass').value = state.subclass || 'None'; 
    if (document.getElementById('gold')) document.getElementById('gold').value = state.gold || 0;
    
    // 5. Attributes and Limits
    const isLevel1 = (state.level || 1) === 1;
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => { 
        const bEl = document.getElementById(`base${s}`);
        const aEl = document.getElementById(`add${s}`);
        if (bEl) {
            bEl.value = state[`base${s}`]; 
            bEl.disabled = !isLevel1;
            bEl.style.opacity = isLevel1 ? '1' : '0.6';
            bEl.style.cursor = isLevel1 ? 'text' : 'not-allowed';
        }
        if (aEl) { 
            aEl.value = state[`add${s}`]; 
            aEl.max = Math.max(0, 5 - state[`base${s}`]); 
        }
    });

    // 6. Action Points
    for (let i = 0; i < 3; i++) { 
        const ap = document.getElementById(`action${i+1}`); 
        if (ap) ap.checked = (state.actionsSpent > i); 
    }
}
