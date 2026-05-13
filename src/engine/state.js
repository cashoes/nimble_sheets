/**
 * @fileoverview STATE ENGINE MODULE
 * Responsible for character mathematical model, derived stats, calculation,
 * persistence, and synchronization between state and DOM.
 */

/**
 * Ensures the state object is valid by setting defaults and correcting types.
 * @param {Object|null|undefined} state - The state object to validate.
 * @returns {Object} A valid state object with default values for missing or incorrect types.
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
 * Validates and corrects state values according to game rules.
 * This function mutates the state object and returns it.
 * @param {Object} state - The state object to validate and correct.
 * @returns {Object} The validated state object (same reference).
 */
function validateAndCorrectState(state) {
    // Ensure level is between 1 and 20
    if (typeof state.level === 'number') {
        state.level = Math.min(20, Math.max(1, state.level));
    } else {
        state.level = 1;
    }

    // Ensure attribute bases and additions are numbers and within reasonable bounds
    const attributes = ['Str', 'Dex', 'Int', 'Wil'];
    attributes.forEach(attr => {
        const baseKey = `base${attr}`;
        const addKey = `add${attr}`;
        let base = parseFloat(state[baseKey]) || 0;
        let add = parseFloat(state[addKey]) || 0;
        // Ensure they are numbers
        if (isNaN(base)) base = 0;
        if (isNaN(add)) add = 0;
        // NIMBLE rule: base + add should be between -5 and 5? We'll just cap sum at 5 and -5 for safety.
        let sum = base + add;
        const max = 5;
        const min = -5;
        if (sum > max) {
            // If base already exceeds max, set base to max and add to 0
            if (base > max) {
                base = max;
                add = 0;
            } else {
                // Reduce add to keep sum at max
                add = max - base;
            }
        } else if (sum < min) {
            if (base < min) {
                base = min;
                add = 0;
            } else {
                add = min - base;
            }
        }
        state[baseKey] = base;
        state[addKey] = add;
    });

    // Ensure resource values are non-negative numbers
    if (state.resourceValues && typeof state.resourceValues === 'object') {
        for (const [key, value] of Object.entries(state.resourceValues)) {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0) {
                state.resourceValues[key] = num;
            } else {
                state.resourceValues[key] = 0;
            }
        }
    }

    // Ensure gold is non-negative
    if (typeof state.gold === 'number') {
        state.gold = Math.max(0, state.gold);
    } else {
        state.gold = 0;
    }

    // Ensure wounds non-negative
    if (typeof state.wounds === 'number') {
        state.wounds = Math.max(0, state.wounds);
    } else {
        state.wounds = 0;
    }

    // Ensure tempHP non-negative
    if (typeof state.tempHP === 'number') {
        state.tempHP = Math.max(0, state.tempHP);
    } else {
        state.tempHP = 0;
    }

    // Ensure advantage is non-negative integer? We'll just ensure it's a number >=0
    if (typeof state.advantage === 'number') {
        state.advantage = Math.max(0, state.advantage);
    } else {
        state.advantage = 0;
    }

    // Ensure actionsSpent is between 0 and 3
    if (typeof state.actionsSpent === 'number') {
        state.actionsSpent = Math.min(3, Math.max(0, state.actionsSpent));
    } else {
        state.actionsSpent = 0;
    }

    // Ensure hpCurrent and hdCurrent are either null or non-negative numbers
    if (state.hpCurrent !== null) {
        const hp = parseFloat(state.hpCurrent);
        if (!isNaN(hp) && hp >= 0) {
            state.hpCurrent = hp;
        } else {
            state.hpCurrent = null;
        }
    }
    if (state.hdCurrent !== null) {
        const hd = parseFloat(state.hdCurrent);
        if (!isNaN(hd) && hd >= 0) {
            state.hdCurrent = hd;
        } else {
            state.hdCurrent = null;
        }
    }

    // Ensure furyDice is an array of objects with total property? We'll just ensure it's an array.
    if (!Array.isArray(state.furyDice)) {
        state.furyDice = [];
    } else {
        // Optionally validate each element, but skip for brevity.
    }

    // Ensure selected* arrays are arrays
    const selectionKeys = [
        'selectedDecrees', 'selectedSpells', 'selectedArsenal', 'selectedToth',
        'selectedMastery', 'selectedGreater', 'selectedLesser', 'selectedGraces',
        'selectedLyrical', 'selectedBoons', 'selectedMartial', 'selectedUnderhanded',
        'selectedDeepKnowledge', 'secondarySchool', 'selectedSubclassSpells',
        'selectedStudy', 'selectedTwilight', 'selectedShadowmastery', 'currentForm'
    ];
    selectionKeys.forEach(key => {
        if (!Array.isArray(state[key])) {
            state[key] = [];
        }
    });

    return state;
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
 * Saves the character state to LocalStorage.
 * @param {Object|null} newState - Optional state object to overwrite the current state.
 * @param {Object} domValues - Optional object containing DOM values to sync with state.
 *                              If not provided, state is not synced with DOM (for programmatic updates).
 */
function saveState(newState = null, domValues = null) {
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
        // If domValues provided, sync state with those values
        if (domValues) {
            syncStateWithDOMValues(state, domValues);
        }
        // If no domValues, we assume caller wants to save current state as-is
        // (used for programmatic updates like leveling up)

        newStateObj = state; // Use the current state
    }

    // Ensure the state is valid and has correct types/defaults, and apply game-specific corrections
    state = validateAndCorrectState(newStateObj);

    // 7. Persist to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Clear pure function cache since state has changed
    clearPureFunctionCache();

    // Publish state changed event (if eventBus is available)
    if (typeof window !== 'undefined' && window.eventBus !== null) {
        window.eventBus.publish('STATE_CHANGED', { state: {...state} });
        
        // Publish state saved event
        window.eventBus.publish('STATE_SAVED', { state: {...state} });
    }
}

/**
 * Syncs state object with DOM values.
 * Extracted from saveState to allow separate calling when needed.
 * @param {Object} stateObj - The state object to sync.
 * @param {Object} domValues - Object containing DOM values.
 */
function syncStateWithDOMValues(stateObj, domValues) {
    const oldDerived = computeDerived(stateObj);
    const oldGold = stateObj.gold;
    const oldLevel = stateObj.level;

    // 1. Sync basic identity fields
    stateObj.charName = domValues.charName ?? '';
    stateObj.level = parseInt(domValues.level) || 1;
    stateObj.ancestry = domValues.ancestry ?? 'None';
    stateObj.background = domValues.background ?? 'None';
    stateObj.subclass = domValues.subclass ?? 'None';
    stateObj.gold = parseInt(domValues.gold) || 0;
    stateObj.showMinor = domValues.showMinor ?? false;

    // 2. Trigger visual feedback for currency changes
    if (stateObj.gold > oldGold) {
        triggerAnimation('gold', 'green');
    } else if (stateObj.gold < oldGold) {
        triggerAnimation('gold', 'red');
    }

    // 3. Sync primary attributes (Base + Level Ups)
    const isLevel1 = stateObj.level === 1;
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
        const baseKey = `base${s}`;
        const addKey = `add${s}`;
        const baseEl = domValues[baseKey] !== undefined ? domValues[baseKey] : 0;
        const addEl = domValues[addKey] !== undefined ? domValues[addKey] : 0;

        let b = parseInt(baseEl) || 0;
        let a = parseInt(addEl) || 0;

        // Validate NIMBLE's attribute cap of 5
        if (b + a > 5) {
            a = Math.max(0, 5 - b);
        }

        if (isLevel1) {
            stateObj[baseKey] = b;
        }
        stateObj[addKey] = a;
    });

    // 4. Recalculate derived totals
    const derived = computeDerived(stateObj);

    // 5. Automatic recovery on level up
    if (oldLevel !== stateObj.level || stateObj.hpCurrent === null) {
        stateObj.hpCurrent = derived.maxHP;
        stateObj.hdCurrent = derived.hdMax;
    }

    // 6. Handle resource max changes
    (CLASS_CONFIG.resources || []).forEach(r => {
        const newMax = derived.resourceMaxes[r.id];
        const oldMax = oldDerived.resourceMaxes[r.id];

        // Auto-refill resources if they were empty or if level changed
        if (stateObj.resourceValues[r.id] === undefined || newMax !== oldMax || oldLevel !== stateObj.level) {
            stateObj.resourceValues[r.id] = newMax;
        }
    });
}

/**
 * Initializes the character state.
 * Loads from EMBEDDED_STATE (export mode) or LocalStorage.
 * Falls back to class defaults for new characters.
 * @param {Object} config - The class configuration to use.
 */
function loadState(config) {
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
    // Ensure state is valid and has correct types/defaults, and apply game-specific corrections
    state = validateAndCorrectState(state);

    // 3. Apply class-specific initial stats for brand new characters
    if (state.level === 1 && !state.charName) {
        if (config.initialStats) {
            Object.assign(state, config.initialStats);
        }
    }

    // 4. Publish state loaded event (if eventBus is available)
    if (typeof window !== 'undefined' && window.eventBus !== null) {
        window.eventBus.publish('STATE_LOADED', { state: {...state}, config });
    }

    // 5. Ensure derived totals are calculated and persisted
    const derived = computeDerived(state);
    if (state.hpCurrent === null) state.hpCurrent = derived.maxHP;
    if (state.hdCurrent === null) state.hdCurrent = derived.hdMax;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Clear pure function cache since state has been initialized/loaded
    clearPureFunctionCache();
}

// Subscribe to STATE_LOADED to sync the DOM when a character is first loaded
if (window.eventBus) {
    window.eventBus.subscribe('STATE_LOADED', (data) => {
        syncStateToDOM(data.state, data.config || CLASS_CONFIG);
    });
}

/**
 * Synchronizes the internal state object with the physical DOM elements.
 * Called on page load and after major state resets.
 * @param {Object} stateObj - The state object to sync.
 * @param {Object} config - The class configuration to use.
 */
function syncStateToDOM(stateObj, config) {
    const derived = computeDerived(stateObj);

    // 1. Identity and Header info
    if (document.getElementById('classNameDisplay')) document.getElementById('classNameDisplay').innerText = config.name;
    if (document.getElementById('classSubtitleDisplay')) document.getElementById('classSubtitleDisplay').innerText = config.subtitle;

    if (document.getElementById('profArmor')) {
        const armorProf = derived.profArmor || (config.proficiencies ? config.proficiencies.armor : "--");
        document.getElementById('profArmor').innerText = armorProf;
    }
    if (document.getElementById('profWeapons')) {
        const weaponsProf = derived.profWeapons || (config.proficiencies ? config.proficiencies.weapons : "--");
        document.getElementById('profWeapons').innerText = weaponsProf;
    }

    // 2. Populate Selection Dropdowns
    const subHtml = config.subclasses.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
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
    if (document.getElementById('charName')) document.getElementById('charName').value = stateObj.charName || '';
    if (document.getElementById('level')) document.getElementById('level').value = stateObj.level || 1;
    if (document.getElementById('ancestry')) document.getElementById('ancestry').value = stateObj.ancestry || 'None';
    if (document.getElementById('background')) document.getElementById('background').value = stateObj.background || 'None';
    if (document.getElementById('subclass')) document.getElementById('subclass').value = stateObj.subclass || 'None';
    if (document.getElementById('gold')) document.getElementById('gold').value = stateObj.gold || 0;

    // 5. Attributes and Limits
    const isLevel1 = (stateObj.level || 1) === 1;
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
        const bEl = document.getElementById(`base${s}`);
        const aEl = document.getElementById(`add${s}`);
        if (bEl) {
            bEl.value = stateObj[`base${s}`];
            bEl.disabled = !isLevel1;
            bEl.style.opacity = isLevel1 ? '1' : '0.6';
            bEl.style.cursor = isLevel1 ? 'text' : 'not-allowed';
        }
        if (aEl) {
            aEl.value = stateObj[`add${s}`];
            aEl.max = Math.max(0, 5 - stateObj[`base${s}`]);
        }
    });

    // 6. Action Points
    for (let i = 0; i < 3; i++) {
        const ap = document.getElementById(`action${i+1}`);
        if (ap) ap.checked = (stateObj.actionsSpent > i);
    }
}
