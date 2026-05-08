/**
 * STATE MANAGEMENT MODULE
 */
const getStorageKey = () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return `nimble_v4_${CLASS_CONFIG.name.toLowerCase()}_${filename}`;
};
const STORAGE_KEY = getStorageKey();
const EMBEDDED_STATE = null;

let state = {};

function saveState(newState = null) {
    if (newState) {
        state = JSON.parse(JSON.stringify(newState));
    } else {
        const oldDerived = computeDerived(state);
        const oldGold = state.gold;
        const oldLevel = state.level;

        state.charName = document.getElementById('charName').value;
        state.level = parseInt(document.getElementById('level').value) || 1;
        state.ancestry = document.getElementById('ancestry').value;
        state.background = document.getElementById('background').value;
        state.subclass = document.getElementById('subclass').value;
        state.gold = parseInt(document.getElementById('gold').value) || 0;
        state.showMinor = document.getElementById('toggleMinorFeatures')?.checked || false;

        if (state.gold > oldGold) triggerAnimation('gold', 'green');
        else if (state.gold < oldGold) triggerAnimation('gold', 'red');

        ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
            const baseEl = document.getElementById(`base${s}`);
            const addEl = document.getElementById(`add${s}`);
            if (baseEl && addEl) {
                let b = parseInt(baseEl.value) || 0;
                let a = parseInt(addEl.value) || 0;
                if (b + a > 5) { a = Math.max(0, 5 - b); addEl.value = a; }
                addEl.max = Math.max(0, 5 - b);
                state[`base${s}`] = b;
                state[`add${s}`] = a;
            }
        });

        const derived = computeDerived(state);

        if (oldLevel !== state.level || state.hpCurrent === null) {
            state.hpCurrent = derived.maxHP;
            state.hdCurrent = derived.hdMax;
        }

        (CLASS_CONFIG.resources || []).forEach(r => {
            const newMax = derived.resourceMaxes[r.id];
            const oldMax = oldDerived.resourceMaxes[r.id];
            if (state.resourceValues[r.id] === undefined || newMax !== oldMax || oldLevel !== state.level) {
                state.resourceValues[r.id] = newMax;
            }
        });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const ind = document.getElementById('saveIndicator'); 
    if (ind) {
        ind.textContent = 'Saved ✓'; 
        setTimeout(() => { ind.textContent = 'Auto-saved'; }, 1500);
    }
}

function loadState() {
    state = {
        version: "1.5.0", charName: '', level: 1, ancestry: 'None', background: 'None', subclass: 'None',
        baseStr: 0, addStr: 0, baseDex: 0, addDex: 0, baseInt: 0, addInt: 0, baseWil: 0, addWil: 0,
        hpCurrent: null, tempHP: 0, hdCurrent: null, wounds: 0,
        skills: {}, activeConditions: [], inventory: [], gold: 0,
        resourceValues: {}, bgSpell: 'None', showMinor: false,
        selectedDecrees: [], selectedSpells: [], selectedArsenal: [], selectedToth: [],
        selectedMastery: [], selectedGreater: [], selectedLesser: [], selectedGraces: [],
        selectedLyrical: [], selectedBoons: [], selectedMartial: [], selectedUnderhanded: [],
        spiritSpellsRadiant: [], spiritSpellsNecrotic: [], 
        stormcallerSpells_Radiant: [], stormcallerSpells_Lightning: [],
        explodingDice: [], currentForm: [],
        furyDice: [], judgmentDice: null,
        advantage: 0, actionsSpent: 0
    };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (EMBEDDED_STATE) { Object.assign(state, EMBEDDED_STATE); } 
    else if (raw) { try { const loaded = JSON.parse(raw); Object.assign(state, loaded); } catch(e) {} }
    if (state.level === 1 && !state.charName) { if (CLASS_CONFIG.initialStats) { Object.assign(state, CLASS_CONFIG.initialStats); state.version = "1.0.0"; } }
    applyTheme(CLASS_CONFIG.theme); syncStateToDOM();
    
    // Ensure state is fully derived and saved on initial load
    const derived = computeDerived(state);
    if (state.hpCurrent === null) state.hpCurrent = derived.maxHP;
    if (state.hdCurrent === null) state.hdCurrent = derived.hdMax;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncStateToDOM() {
    if(document.getElementById('classNameDisplay')) document.getElementById('classNameDisplay').innerText = CLASS_CONFIG.name;
    if(document.getElementById('classSubtitleDisplay')) document.getElementById('classSubtitleDisplay').innerText = CLASS_CONFIG.subtitle;
    if (CLASS_CONFIG.proficiencies) { 
        if(document.getElementById('profArmor')) document.getElementById('profArmor').innerText = CLASS_CONFIG.proficiencies.armor || "--"; 
        if(document.getElementById('profWeapons')) document.getElementById('profWeapons').innerText = CLASS_CONFIG.proficiencies.weapons || "--"; 
    }
    let subHtml = ""; CLASS_CONFIG.subclasses.forEach(s => subHtml += `<option value="${s.value}">${s.label}</option>`);
    const sc = document.getElementById('subclass'); if(sc) sc.innerHTML = subHtml;
    let ancHtml = `<option value="None">None</option>`;
    Object.keys(ANCESTRIES).forEach(group => { ancHtml += `<optgroup label="${group}">`; ANCESTRIES[group].forEach(a => ancHtml += `<option value="${a}">${a}</option>`); ancHtml += `</optgroup>`; });
    const ac = document.getElementById('ancestry'); if(ac) ac.innerHTML = ancHtml;
    let bgHtml = `<option value="None">None</option>`;
    Object.keys(BACKGROUNDS).forEach(group => { bgHtml += `<optgroup label="${group}">`; BACKGROUNDS[group].forEach(b => bgHtml += `<option value="${b}">${b}</option>`); bgHtml += `</optgroup>`; });
    const bc = document.getElementById('background'); if(bc) bc.innerHTML = bgHtml;
    
    const mSel = document.getElementById('meleeSelect'); if(mSel) mSel.innerHTML = '<option value="">+ Melee Item</option>';
    if(mSel) Object.keys(ITEM_TEMPLATES.melee).forEach(group => { mSel.innerHTML += `<optgroup label="${group}">`; ITEM_TEMPLATES.melee[group].forEach(k => mSel.innerHTML += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`); mSel.innerHTML += `</optgroup>`; });
    const rSel = document.getElementById('rangedSelect'); if(rSel) rSel.innerHTML = '<option value="">+ Ranged Item</option>';
    if(rSel) Object.keys(ITEM_TEMPLATES.ranged).forEach(group => { rSel.innerHTML += `<optgroup label="${group}">`; ITEM_TEMPLATES.ranged[group].forEach(k => rSel.innerHTML += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`); rSel.innerHTML += `</optgroup>`; });
    const aSel = document.getElementById('armorSelect'); if(aSel) aSel.innerHTML = '<option value="">+ Armor/Shield</option>';
    if(aSel) Object.keys(ITEM_TEMPLATES.armor).forEach(group => { aSel.innerHTML += `<optgroup label="${group}">`; ITEM_TEMPLATES.armor[group].forEach(k => aSel.innerHTML += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`); aSel.innerHTML += `</optgroup>`; });
    
    if(document.getElementById('charName')) document.getElementById('charName').value = state.charName || ''; 
    if(document.getElementById('level')) document.getElementById('level').value = state.level || 1;
    if(document.getElementById('ancestry')) document.getElementById('ancestry').value = state.ancestry || 'None'; 
    if(document.getElementById('background')) document.getElementById('background').value = state.background || 'None';
    if(document.getElementById('subclass')) document.getElementById('subclass').value = state.subclass || 'None'; 
    if(document.getElementById('gold')) document.getElementById('gold').value = state.gold || 0;
    
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => { 
        const bEl = document.getElementById(`base${s}`);
        const aEl = document.getElementById(`add${s}`);
        if(bEl) bEl.value = state[`base${s}`]; 
        if(aEl) { aEl.value = state[`add${s}`]; aEl.max = Math.max(0, 5 - state[`base${s}`]); }
    });
    for (let i = 0; i < 3; i++) { const ap = document.getElementById(`action${i+1}`); if(ap) ap.checked = (state.actionsSpent > i); }
    if(mSel) mSel.onchange = (e) => { if(e.target.value) { addQuickItem('data', e.target.value); e.target.value = ""; } };
    if(rSel) rSel.onchange = (e) => { if(e.target.value) { addQuickItem('data', e.target.value); e.target.value = ""; } };
    if(aSel) aSel.onchange = (e) => { if(e.target.value) { addQuickItem('data', e.target.value); e.target.value = ""; } };
}
