/**
 * STATE MANAGEMENT MODULE
 * Responsible for character state persistence, local storage interaction,
 * and synchronization between the state object and the DOM elements.
 */

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
    if (newState) {
        state = JSON.parse(JSON.stringify(newState));
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
                state[`base${s}`] = b;
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
    }

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
        version: "2.0.0", 
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
    // 1. Identity and Header info
    if (document.getElementById('classNameDisplay')) document.getElementById('classNameDisplay').innerText = CLASS_CONFIG.name;
    if (document.getElementById('classSubtitleDisplay')) document.getElementById('classSubtitleDisplay').innerText = CLASS_CONFIG.subtitle;
    
    if (CLASS_CONFIG.proficiencies) { 
        if (document.getElementById('profArmor')) document.getElementById('profArmor').innerText = CLASS_CONFIG.proficiencies.armor || "--"; 
        if (document.getElementById('profWeapons')) document.getElementById('profWeapons').innerText = CLASS_CONFIG.proficiencies.weapons || "--"; 
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
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => { 
        const bEl = document.getElementById(`base${s}`);
        const aEl = document.getElementById(`add${s}`);
        if (bEl) bEl.value = state[`base${s}`]; 
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
