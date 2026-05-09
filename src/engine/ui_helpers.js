/**
 * UI HELPERS MODULE
 */
function renderModField() {
    const html = `<div class="advantage-controls"><button class="adv-btn" onclick="adjAdv(-1)">-</button><div id="advDisplay" class="adv-val ${state.advantage > 0 ? 'positive' : (state.advantage < 0 ? 'negative' : '')}">${state.advantage === 0 ? 'Normal' : (state.advantage > 0 ? 'Adv +' + state.advantage : 'Dis ' + state.advantage)}</div><button class="adv-btn" onclick="adjAdv(1)">+</button></div>`;
    const container = document.getElementById('combatControlsContainer');
    if (container) { container.innerHTML = html; }
}

function adjAdv(amt) { state.advantage = Math.min(3, Math.max(-3, state.advantage + amt)); renderModField(); saveState(); }
function toggleAction(idx) { state.actionsSpent = (state.actionsSpent > idx) ? idx : idx + 1; for (let i = 0; i < 3; i++) { const ap = document.getElementById(`action${i+1}`); if(ap) ap.checked = (state.actionsSpent > i); } saveState(); }

function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    if (theme.accent) root.style.setProperty('--class-accent', theme.accent);
    if (theme.accentDim) root.style.setProperty('--class-accent-dim', theme.accentDim);
    if (theme.bodyBg) root.style.setProperty('--class-body-bg', theme.bodyBg);
    if (theme.containerBg) root.style.setProperty('--class-container-bg', theme.containerBg);
    if (theme.panelBg) root.style.setProperty('--class-panel-bg', theme.panelBg);
    if (theme.border) root.style.setProperty('--class-border', theme.border);
}

function triggerAnimation(id, type) { const el = document.getElementById(id); if (!el) return; const cls = type === 'green' ? 'flash-green' : 'flash-red'; el.classList.remove('flash-green', 'flash-red'); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1000); }
function updateClassState(key, index, value) { if (!state[key]) state[key] = []; state[key][index] = value; saveState(); render(); }
function toggleBgPip(key, idx) { const val = state[key] || 0; state[key] = (val === idx + 1) ? idx : idx + 1; saveState(); render(); }
function updateBgChoice(key, val) { state[key] = val; saveState(); render(); }
function updateBgSpell(val) { state.bgSpell = val; saveState(); render(); }
function adjRes(id, amt, max, isAbsolute = false) { let oldVal = state.resourceValues[id] || 0; state.resourceValues[id] = Math.min(max||999, Math.max(0, isAbsolute ? amt : oldVal + amt)); saveState(); render(); }

function addQuickItem(cat, key) { 
    let t = ITEM_TEMPLATES.data[key]; 
    if (!t) return; 
    state.gold -= (t.cost || 0); 
    if (document.getElementById('gold')) document.getElementById('gold').value = state.gold;
    state.inventory.push({ id: Date.now(), name: t.name, type: t.type, slots: t.slots, equipped: t.equipped, dmgDice: t.dmgDice||'1d6', stat: t.stat||'str', props: t.props||'', armor: t.armor||0, armorType: t.armorType || (t.type === 'armor' ? 'light' : ''), cost: t.cost || 0 }); 
    saveState(); render(); 
}
function addItem() { state.inventory.push({ id: Date.now(), name: 'New Item', type: 'misc', slots: 1, equipped: false, dmgDice: '1d6', stat: 'str', props: '', armor: 1, armorType: '', cost: 0, isCustom: true }); saveState(); render(); }
function deleteItem(id) { 
    let item = state.inventory.find(i => i.id === id); 
    if(item) {
        state.gold += (item.cost || 0); 
        if (document.getElementById('gold')) document.getElementById('gold').value = state.gold;
    }
    state.inventory = state.inventory.filter(i => i.id !== id); 
    saveState(); render(); 
}
function updateItem(id, field, val, check = false) { let item = state.inventory.find(i => i.id === id); if(item) { item[field] = check ? val : (field==='slots'||field==='armor'||field==='cost'?parseFloat(val):val); saveState(); render(); } }
function toggleCondition(id) { if (state.activeConditions.includes(id)) state.activeConditions = state.activeConditions.filter(c => c !== id); else state.activeConditions.push(id); saveState(); render(); }
function updateSkill(id, val) { state.skills[id] = parseInt(val) || 0; saveState(); render(); }

function adjHP(a, isAbsolute = false) {
    const derived = computeDerived(state);
    const max = derived.maxHP;
    const oldHP = state.hpCurrent ?? max;
    if (isAbsolute) {
        state.hpCurrent = Math.min(max, Math.max(0, a));
    } else if (a < 0) {
        let dmg = Math.abs(a);
        if ((state.tempHP || 0) > 0) {
            const absorbed = Math.min(state.tempHP, dmg);
            state.tempHP -= absorbed;
            dmg -= absorbed;
            triggerAnimation('displayTempHP', 'red');
        }
        if (dmg > 0) state.hpCurrent = Math.max(0, oldHP - dmg);
    } else {
        state.hpCurrent = Math.min(max, oldHP + a);
    }
    if (state.hpCurrent > oldHP) triggerAnimation('displayCurrentHP', 'green');
    else if (state.hpCurrent < oldHP) triggerAnimation('displayCurrentHP', 'red');
    saveState(); render();
}
function adjTempHP(a, isAbsolute = false) {
    state.tempHP = Math.max(0, isAbsolute ? a : (state.tempHP || 0) + a);
    saveState(); render();
}
function adjHD(a, isAbsolute = false) {
    const derived = computeDerived(state);
    const max = derived.hdMax;
    state.hdCurrent = Math.min(max, Math.max(0, isAbsolute ? a : (state.hdCurrent === null ? max : state.hdCurrent) + a));
    saveState(); render();
}

function handleResPipClick(id, i, max) { 
    const current = state.resourceValues[id] || 0;
    state.resourceValues[id] = (current === i + 1) ? i : i + 1;
    saveState(); render(); 
}
function handleWoundClick(i) { state.wounds = (state.wounds === i + 1) ? i : i + 1; saveState(); render(); }

/**
 * GLOBAL DICE POOL HELPERS
 */
function _rollDie(faces, allowExplode = false) {
    let total = Math.floor(Math.random() * faces) + 1;
    let detail = total.toString();
    
    if (allowExplode && total === faces) {
        const next = _rollDie(faces, true);
        total += next.total;
        detail = `${detail}! + ${next.detail}`;
    }
    return { total, detail };
}

function addPoolDie(key, max, faces) {
    if (!state[key]) state[key] = [];
    
    const allowExplode = (key === 'furyDice' && state.furyBoom === 'BOOM') || 
                         (key === 'judgmentDice' && state.judgmentBoom === 'BOOM');
    const roll = _rollDie(faces, allowExplode);

    // Fill first empty slot if exists, otherwise push
    const emptyIdx = state[key].findIndex(d => d === null);
    if (emptyIdx !== -1) {
        state[key][emptyIdx] = roll;
    } else if (state[key].length < max) {
        state[key].push(roll);
    }
    
    saveState(); render();
}

function removePoolDie(key, idx, isStatic = false) {
    if (!state[key]) return;
    if (isStatic) {
        state[key][idx] = null;
    } else {
        state[key].splice(idx, 1);
    }
    saveState(); render();
}

function clearPool(key) {
    state[key] = [];
    saveState(); render();
}

function maximizePoolDie(key, idx, faces) {
    if (!state[key] || !state[key][idx]) return;
    state[key][idx].total = faces;
    state[key][idx].detail = `${faces} (Maxed)`;
    saveState(); render();
}

function rollPool(key, count, faces) {
    let finalDice = [];
    const hasAdv = (key === 'judgmentDice' && state.selectedDecrees?.includes("Reliable Justice"));
    const allowExplode = (key === 'furyDice' && state.furyBoom === 'BOOM') || 
                         (key === 'judgmentDice' && state.judgmentBoom === 'BOOM');
    
    let rollCount = hasAdv ? count + 1 : count;

    for (let i = 0; i < rollCount; i++) {
        finalDice.push(_rollDie(faces, allowExplode));
    }

    if (hasAdv) {
        let minVal = Math.min(...finalDice.map(d => d.total));
        let minIdx = finalDice.findIndex(d => d.total === minVal);
        finalDice.splice(minIdx, 1);
    }
    
    state[key] = finalDice;
    saveState(); render();
}


