/**
 * STATE MANAGEMENT
 */
const getStorageKey = () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return `nimble_v4_${CLASS_CONFIG.name.toLowerCase()}_${filename}`;
};
const STORAGE_KEY = getStorageKey();
const EMBEDDED_STATE = null;

/**
 * CORE HELPERS
 */
const getStatsMap = (s) => ({
    str: (s.baseStr || 0) + (s.addStr || 0),
    dex: (s.baseDex || 0) + (s.addDex || 0),
    int: (s.baseInt || 0) + (s.addInt || 0),
    wil: (s.baseWil || 0) + (s.addWil || 0)
});

function computeDerived(s) {
    const level = s.level || 1;
    const statsMap = getStatsMap(s);
    const ancFeat = ANCESTRY_FEATURES[s.ancestry];
    const bgFeat = BACKGROUND_FEATURES[s.background];
    let bgSelectedOpt = null;
    if (bgFeat && bgFeat.options && s[bgFeat.stateKey]) {
        bgSelectedOpt = bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === s[bgFeat.stateKey]);
    }

    // 1. Hit Dice Face
    let hdFace = CLASS_CONFIG.hitDie || 10;
    if (ancFeat && ancFeat.modHDStep) {
        const dieSteps = [6, 8, 10, 12, 20];
        let idx = dieSteps.indexOf(hdFace);
        if (idx !== -1) { idx = Math.min(dieSteps.length - 1, idx + ancFeat.modHDStep); hdFace = dieSteps[idx]; }
    }

    // 2. HP per Level & Max HP
    const hpPerLevelMap = { 6: 5, 8: 6, 10: 8, 12: 9, 20: 14 };
    const hpPerLevel = hpPerLevelMap[hdFace] || CLASS_CONFIG.hpPerLevel;
    const maxHP = (CLASS_CONFIG.baseHp || 10) + ((level - 1) * hpPerLevel);

    // 3. Max HD
    let maxHD = level + (ancFeat?.modHD || 0) + (bgFeat?.modHD || 0) + (bgSelectedOpt?.modHD || 0);

    // 4. Base Stats & Overrides from Class
    const classDerived = CLASS_CONFIG.getDerivedStats ? CLASS_CONFIG.getDerivedStats(level, s.subclass, s) : {};
    const classOverrides = CLASS_CONFIG.getStatOverrides ? CLASS_CONFIG.getStatOverrides(level, s.subclass, s, statsMap) : {};

    // 5. Initiative
    let initiative = statsMap.dex + (classOverrides.init || 0) + (ancFeat?.modInit || 0) + (bgFeat?.modInit || 0) + (bgSelectedOpt?.modInit || 0);

    // 6. Speed
    let speed = (classDerived.speed || 6) + (classOverrides.speed || 0) + (ancFeat?.modSpeed || 0) + (bgFeat?.modSpeed || 0) + (bgSelectedOpt?.modSpeed || 0);
    let armorIsLight = true;

    // 7. Wounds
    let woundMax = Math.max(1, (classDerived.woundMax || 6) + (ancFeat?.modWounds || 0) + (bgFeat?.modWounds || 0) + (bgSelectedOpt?.modWounds || 0));

    // 8. Actions
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

    // 9. Skill Passives
    let passMods = {}; SKILL_LIST.forEach(sk => passMods[sk.id] = 0);
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

    // 10. Armor
    let armorVal = classOverrides.armorBase !== undefined ? classOverrides.armorBase : statsMap.dex;
    let bestArmorVal = -1;
    let shieldBonus = 0;
    
    s.inventory.forEach(item => {
        if (!item.equipped) return;
        if (item.type === 'armor') {
            const base = parseInt(item.armor) || 0;
            const dMax = item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0);
            const currentArmor = base + Math.min(statsMap.dex, dMax);
            if (currentArmor > bestArmorVal) bestArmorVal = currentArmor;
            if (item.armorType !== 'light') armorIsLight = false;
        } else if (item.type === 'shield') {
            shieldBonus += (parseInt(item.armor) || 0);
        }
    });

    if (bestArmorVal !== -1) armorVal = bestArmorVal;
    armorVal += shieldBonus + (CLASS_CONFIG.getShieldBonus ? CLASS_CONFIG.getShieldBonus(level, s.subclass, statsMap) : 0);
    if (classOverrides.armor) armorVal += classOverrides.armor;
    if (ancFeat?.modArmor) armorVal += ancFeat.modArmor;
    if (bgFeat?.modArmor) armorVal += bgFeat.modArmor;
    if (bgSelectedOpt?.modArmor) armorVal += bgSelectedOpt.modArmor;

    // Flight check
    if ((ancFeat?.modFlySpeed || classOverrides.modFlySpeed) && armorIsLight) {
        speed = `${speed} (${speed} Fly)`;
    }

    // 11. Resource Maxes
    const resourceMaxes = {};
    (CLASS_CONFIG.resources || []).forEach(r => {
        resourceMaxes[r.id] = r.calcMax(level, statsMap, s, s.subclass);
    });

    // 12. Spell Tier
    let maxTier = 0;
    if (CLASS_CONFIG.getAvailableSpells || CLASS_CONFIG.spellProgression || (s.subclass === "Spellblade")) {
        const progress = (s.subclass === "Spellblade") ? [0, 3, 7, 11, 15] : (CLASS_CONFIG.spellProgression || [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
        maxTier = progress.findLastIndex(l => level >= l);
    }

    return {
        ...classDerived,
        level, statsMap, hdFace, maxHP, hdMax: maxHD, armor: armorVal, speed, initiative, woundMax, maxActions, resourceMaxes, maxTier, passMods,
        size: bgFeat?.modSize || ancFeat?.modSize || classDerived.size || "Med"
    };
}

function saveAndRender() {
    saveState();
    render();
}

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
        version: "1.3.0", charName: '', level: 1, ancestry: 'None', background: 'None', subclass: 'None',
        baseStr: 0, addStr: 0, baseDex: 0, addDex: 0, baseInt: 0, addInt: 0, baseWil: 0, addWil: 0,
        hpCurrent: null, tempHP: 0, hdCurrent: null, wounds: 0,
        skills: {}, activeConditions: [], inventory: [], gold: 0,
        resourceValues: {}, bgSpell: 'None', showMinor: false,
        selectedDecrees: [], selectedSpells: [], selectedArsenal: [], selectedToth: [],
        advantage: 0, actionsSpent: 0
    };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (EMBEDDED_STATE) { Object.assign(state, EMBEDDED_STATE); } 
    else if (raw) { try { const loaded = JSON.parse(raw); Object.assign(state, loaded); } catch(e) {} }
    if (state.level === 1 && !state.charName) { if (CLASS_CONFIG.initialStats) { Object.assign(state, CLASS_CONFIG.initialStats); state.version = "1.0.0"; } }
    applyTheme(CLASS_CONFIG.theme); syncStateToDOM();
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

function renderHeader(derived, armorVal, init) {
    let lStats = `<div class="header-stat"><label style="color:var(--gold-light)">Armor</label><div class="header-stat-val" style="color:var(--gold-light)">${armorVal}</div></div>`;
    CLASS_CONFIG.customHeaderStats?.filter(s=>s.position==='left').forEach(s => { 
        if(s.isVisible(state.level, state.subclass)) lStats += `<div class="header-stat"><label style="color:${s.color}">${s.label}</label><div class="header-stat-val" style="color:${s.color}">${s.getValue(derived)}</div></div>`; 
    });
    const hl = document.getElementById('headerLeftStats'); if(hl) hl.innerHTML = lStats;
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    const hasInitAdv = (ancFeat && ancFeat.modInitAdv);
    const initAdvIcon = hasInitAdv ? '<span style="font-size:0.5em; vertical-align:middle; color:var(--save-adv); margin-left:2px;">▲</span>' : '';
    const initNotation = `1d20${init >= 0 ? '+' : ''}${init}`;
    const hr = document.getElementById('headerRightStats');
    if(hr) hr.innerHTML = `<div class="header-stat"><label>Size</label><div class="header-stat-val">${derived.size}</div></div><div class="header-stat"><label>Speed</label><div class="header-stat-val">${derived.speed}</div></div><div class="header-stat"><label class="roll-link" onclick="dispatchRoll('${initNotation}', 'Initiative', { forceAdv: ${hasInitAdv} })">Init</label><div class="header-stat-val roll-link" onclick="dispatchRoll('${initNotation}', 'Initiative', { forceAdv: ${hasInitAdv} })">${init >= 0 ? "+" : ""}${init}${initAdvIcon}</div></div>`;
    renderModField();
}

function renderAttributes(level, statsMap) {
    ['str', 'dex', 'int', 'wil'].forEach(stat => {
        const card = document.getElementById(`statCard_${stat}`);
        if (card) {
            if (CLASS_CONFIG.keyStats.includes(stat)) card.classList.add('key-stat'); else card.classList.remove('key-stat');
            card.classList.remove('save-adv', 'save-dis');
            let inherentAdv = 0;
            if (CLASS_CONFIG.saves.adv === stat) { card.classList.add('save-adv'); inherentAdv = 1; }
            if (CLASS_CONFIG.saves.dis === stat) { card.classList.add('save-dis'); inherentAdv = -1; }
            card.setAttribute('onclick', `dispatchRoll('1d20+${statsMap[stat]}', '${stat.toUpperCase()} Save', { inherentAdv: ${inherentAdv} })`);
            card.style.cursor = 'pointer';
        }
    });
    if(document.getElementById('displayStr')) document.getElementById('displayStr').innerText = statsMap.str; 
    if(document.getElementById('displayDex')) document.getElementById('displayDex').innerText = statsMap.dex; 
    if(document.getElementById('displayInt')) document.getElementById('displayInt').innerText = statsMap.int; 
    if(document.getElementById('displayWil')) document.getElementById('displayWil').innerText = statsMap.wil;
    
    let keyAllowed = Math.min(4, Math.floor(level/4)); let secAllowed = Math.min(4, Math.floor((level-1)/4)); let flexAllowed = (level >= 20) ? 2 : 0; let keySpent = 0; let secSpent = 0;
    CLASS_CONFIG.keyStats.forEach(s => keySpent += state[`add${s.charAt(0).toUpperCase()+s.slice(1)}`]);
    ['str', 'dex', 'int', 'wil'].filter(s => !CLASS_CONFIG.keyStats.includes(s)).forEach(s => secSpent += state[`add${s.charAt(0).toUpperCase()+s.slice(1)}`]);
    let flexSpent = Math.max(0, keySpent - keyAllowed) + Math.max(0, secSpent - secAllowed);
    document.querySelectorAll('.core-stat-inputs input[id^="add"]').forEach(el => el.classList.remove('error-glow'));
    const us = document.getElementById('unspentStats');
    if(us) {
        if (flexSpent > flexAllowed) { 
            us.innerHTML = `<span style='color:var(--save-dis)'>OVERSPENT: ${flexAllowed - flexSpent} Pts</span>`; 
            document.querySelectorAll('.core-stat-inputs input[id^="add"]').forEach(el => el.classList.add('error-glow')); 
        } else { 
            us.innerHTML = `<span style='color:var(--class-accent)'>UNSPENT: ${Math.max(0, keyAllowed - keySpent)} Key, ${Math.max(0, secAllowed - secSpent)} Sec${level >= 20 ? `, ${flexAllowed - flexSpent} Flex` : ''}</span>`; 
        }
    }
}

function renderResources(level, derived, statsMap, hdFace) {
    const hl = document.getElementById('hitDiceLabel');
    if(hl) hl.innerHTML = `<span class="roll-link" onclick="dispatchRoll('1d${hdFace}${statsMap.str >= 0 ? '+' : ''}${statsMap.str}', 'Hit Die Rest')">Hit Dice (d${hdFace})</span>`;
    let wHtml = ""; for(let i=0; i<derived.woundMax; i++) wHtml += `<input type="checkbox" class="pip wound" ${i<state.wounds?'checked':''} onclick="handleWoundClick(${i})">`;
    const wc = document.getElementById('woundsContainer'); if(wc) wc.innerHTML = wHtml;
    let resHtml = "";
    (CLASS_CONFIG.resources || []).forEach(r => { 
        if (r.manual) return; 
        let max = derived.resourceMaxes[r.id];
        if (max <= 0) return; 
        resHtml += `<div class="res-row"><label>${r.label}</label><div style="display: flex; align-items: center; gap: 8px;"><div class="res-val dark-incrementer"><button onclick="adjRes('${r.id}', -1)">-</button><input type="number" id="res_${r.id}" value="${state.resourceValues[r.id]}" onchange="adjRes('${r.id}', parseInt(this.value), ${max}, true)"><button onclick="adjRes('${r.id}', 1, ${max})">+</button></div><div class="max-text">/ <span style="color:var(--text-main);">${max}</span></div></div></div>`; 
    });
    const drc = document.getElementById('dynamicResourcesContainer'); if(drc) drc.innerHTML = resHtml;
}

function renderInventoryRow(item, statsMap, iStatsBound) {
    let eH = '-';
    if (item.type === 'weapon' && item.equipped) {
        const tMod = statsMap[item.stat];
        const notation = `${item.dmgDice}${tMod >= 0 ? '+' : ''}${tMod}`;
        const label = item.name.replace(/'/g, "\\'");
        eH = `<span class="roll-link" onclick="dispatchRoll('${notation}', '${label}', { stat: '${item.stat}', type: 'attack' })">⚔️ ${notation}</span>`;
    } else if (item.type === 'armor' && item.equipped) {
        const dMax = item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0);
        const finalAC = (parseInt(item.armor) || 0) + Math.min(statsMap.dex, dMax);
        eH = `🛡️ ${finalAC} AC`;
    } else if (item.type === 'shield' && item.equipped) {
        eH = `🛡️ +${item.armor} AC`;
    }

    let typeCell = `<div style="font-size:0.9em; color:var(--text-muted); text-transform:capitalize; text-align:left; min-height:26px; display:flex; align-items:center; padding:2px 0; line-height:1.2;">${item.type === 'armor' ? (item.armorType || '') + ' ' : ''}${item.type}</div>`;
    let dexDisplay = `<span class="stat-hl">${statsMap.dex >= 0 ? '+' : ''}${statsMap.dex}</span> DEX`;
    let statsContent = '-';
    
    if (item.type === 'weapon') {
        const sVal = statsMap[item.stat];
        statsContent = `${item.dmgDice} (<span class="stat-hl">${sVal >= 0 ? '+' : ''}${sVal}</span> ${item.stat.toUpperCase()})`;
    } else if (item.type === 'armor') {
        if (item.armorType === 'light') statsContent = `+${item.armor} (${dexDisplay})`;
        else if (item.armorType === 'medium') statsContent = `+${item.armor} max(${dexDisplay}, 2)`;
        else statsContent = `+${item.armor}`;
    }
    let statsCell = `<div style="text-align:center; font-size:0.9em; min-height:26px; display:flex; align-items:center; justify-content:center; padding:2px 0; line-height:1.2;">${statsContent}</div>`;

    if (item.isCustom) {
        typeCell = `<div style="display:flex; flex-direction:column; gap:2px;">
            <select class="inv-input" style="font-size:0.85em; text-align:center;" onchange="updateItem(${item.id}, 'type', this.value, true)">
                <option value="misc" ${item.type === 'misc' ? 'selected' : ''}>Misc</option>
                <option value="weapon" ${item.type === 'weapon' ? 'selected' : ''}>Weapon</option>
                <option value="armor" ${item.type === 'armor' ? 'selected' : ''}>Armor</option>
                <option value="shield" ${item.type === 'shield' ? 'selected' : ''}>Shield</option>
            </select>
            ${item.type === 'armor' ? `
            <select class="inv-input" style="font-size:0.75em; text-align:center;" onchange="updateItem(${item.id}, 'armorType', this.value, true)">
                <option value="light" ${item.armorType === 'light' ? 'selected' : ''}>Light</option>
                <option value="medium" ${item.armorType === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="heavy" ${item.armorType === 'heavy' ? 'selected' : ''}>Heavy</option>
            </select>` : ''}
        </div>`;

        if (item.type === 'weapon') {
            statsCell = `<div style="display:flex; gap:2px; justify-content:center;">
                <input type="text" class="inv-input" value="${item.dmgDice}" style="width:35px;" onchange="updateItem(${item.id}, 'dmgDice', this.value, true)">
                <select class="inv-input" style="width:40px; font-size:0.75em;" onchange="updateItem(${item.id}, 'stat', this.value, true)">
                    <option value="str" ${item.stat === 'str' ? 'selected' : ''}>STR</option>
                    <option value="dex" ${item.stat === 'dex' ? 'selected' : ''}>DEX</option>
                    <option value="int" ${item.stat === 'int' ? 'selected' : ''}>INT</option>
                    <option value="wil" ${item.stat === 'wil' ? 'selected' : ''}>WIL</option>
                </select>
            </div>`;
        } else if (item.type === 'armor') {
            statsCell = `<div style="display:flex; gap:2px; justify-content:center; align-items:center;">
                <span>+</span><input type="number" class="inv-input" value="${item.armor}" style="width:25px;" title="Base Armor" onchange="updateItem(${item.id}, 'armor', parseInt(this.value), true)">
            </div>`;
        } else if (item.type === 'shield') {
            statsCell = `<input type="number" class="inv-input" value="${item.armor}" style="width:30px;" onchange="updateItem(${item.id}, 'armor', parseInt(this.value), true)">`;
        }
    }

    return `<div class="inv-row ${item.equipped ? 'equipped' : ''}">
        <div style="display:flex; justify-content:center; align-items:center; min-height:26px;"><input type="checkbox" ${item.equipped ? 'checked' : ''} onchange="updateItem(${item.id}, 'equipped', this.checked, true)"></div>
        <div style="display:flex; align-items:center; min-height:26px;"><input type="text" class="inv-input" value="${item.name}" style="text-align:left;" onchange="updateItem(${item.id}, 'name', this.value)"></div>
        ${typeCell}
        <div style="display:flex; align-items:center; min-height:26px;"><textarea class="inv-input" style="height:auto; resize:none; overflow:hidden; font-size:0.85em; color:var(--text-muted); line-height:1.2; border:none; background:transparent; text-align:left;" oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';" onfocus="this.style.height='auto';this.style.height=this.scrollHeight+'px';" onchange="updateItem(${item.id}, 'props', this.value)">${item.props || ''}</textarea></div>
        <div style="display:flex; justify-content:center; align-items:center; min-height:26px;"><input type="number" class="inv-input" value="${item.cost || 0}" onchange="updateItem(${item.id}, 'cost', this.value)"></div>
        <div style="display:flex; justify-content:center; align-items:center; min-height:26px;"><input type="number" class="inv-input" value="${item.slots}" onchange="updateItem(${item.id}, 'slots', this.value)"></div>
        ${statsCell}
        <div style="font-weight:bold; color:var(--class-accent); display:flex; justify-content:center; align-items:center; min-height:26px;">${eH}</div>
        <div style="display:flex; justify-content:center; align-items:center; min-height:26px;"><button onclick="deleteItem(${item.id})" style="background:none; border:none; color:var(--save-dis); cursor:pointer;">×</button></div>
    </div>`;
}

function renderInventory(statsMap, armorVal, str, iStats) {
    let maxSlots = 10 + str;
    let slotsUsed = 0;
    state.inventory.forEach(item => slotsUsed += (parseFloat(item.slots) || 0));

    let html = `<div class="inv-header"><div></div><div>Item</div><div>Type</div><div>Description</div><div style="text-align:center;">GP</div><div style="text-align:center;">Wt</div><div style="text-align:center;">Stats</div><div style="text-align:center;">Effect</div><div></div></div>`;
    html += state.inventory.map(item => renderInventoryRow(item, statsMap, iStats)).join('');

    const ic = document.getElementById('inventoryContainer'); if(ic) ic.innerHTML = html;
    document.querySelectorAll('#inventoryContainer textarea').forEach(ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
    const is = document.getElementById('inventorySlots'); if(is) is.innerHTML = `SLOTS: <span style="color:${slotsUsed > maxSlots ? 'var(--save-dis)' : 'var(--class-accent)'}">${slotsUsed} / ${maxSlots}</span>`;
}

function renderSkills(level, statsMap, passMods) {
    let totalPts = 3 + level; let spent = 0; SKILL_LIST.forEach(s => { let pts = state.skills[s.id] || 0; let base = statsMap[s.stat] + passMods[s.id]; pts = Math.min(12 - base, Math.max(Math.min(0, -base), pts)); state.skills[s.id] = pts; spent += pts; });
    let sHtml = `<div class="skill-header"><span>SKILLS</span><span style="color:${(totalPts - spent) < 0 ? 'var(--save-dis)' : 'var(--class-accent)'}">UNSPENT: ${totalPts - spent}</span></div><div class="skills-grid">`;
    SKILL_LIST.forEach(s => { let t = statsMap[s.stat] + (state.skills[s.id]||0) + passMods[s.id]; sHtml += `<div class="skill-row"><div class="skill-name">${s.name} <span class="skill-stat">${s.stat.toUpperCase()}</span></div><div class="skill-pts"><input type="number" value="${state.skills[s.id]||0}" onchange="updateSkill('${s.id}', this.value)"></div><div class="skill-total roll-link" onclick="dispatchRoll('1d20${t >= 0 ? '+' : ''}${t}', '${s.name} Skill Check')">${t >= 0 ? '+' : ''}${t}</div></div>`; });
    const sc = document.getElementById('skillsContainer'); if(sc) sc.innerHTML = sHtml + `</div>`;
}

function renderConditions() { let cHtml = ""; CONDITIONS_LIST.forEach(c => cHtml += `<div class="condition-btn ${c.type} ${state.activeConditions.includes(c.id)?'active':''}" title="${c.desc}" onclick="toggleCondition('${c.id}')">${c.name}</div>`); const cc = document.getElementById('conditionsContainer'); if(cc) cc.innerHTML = cHtml; }

function dispatchRoll(notation, label, options = {}) {
    if (!notation) return;
    let finalNotation = notation.replace(/[⚔️🛡️]/g, '').trim();

    // --- AUTOMATED CLASS MODIFIERS ---
    let autoMod = 0;
    const isAttack = /attack|⚔️/i.test(label) || options.type === 'attack';

    if (CLASS_CONFIG.name === 'Berserker') {
        if (isAttack && options.stat === 'str') {
            const furySum = (state.furyDice || []).reduce((a, b) => a + b.total, 0);
            if (furySum > 0) autoMod += furySum;
        }
    } else if (CLASS_CONFIG.name === 'Oathsworn') {
        if (isAttack) {
            const jdSum = (state.judgmentDice || []).reduce((a, b) => a + b.total, 0);
            if (jdSum > 0) {
                autoMod += jdSum;
                state.judgmentDice = null;
                saveState();
                render();
            } else if (state.level >= 18 && (options.stat === 'str' || options.stat === 'dex' || options.stat === 'wil')) {
                autoMod += 5;
            }
        }
    } else if (CLASS_CONFIG.name === 'Zephyr') {
        if (label === 'Swift Fists' && state.level >= 5) {
            autoMod += state.level;
        }
    }

    if (autoMod !== 0) finalNotation += (autoMod >= 0 ? '+' : '') + autoMod;
    // ---------------------------------

    const isCheckOrSave = /check|save|rest|hit die/i.test(label);

    let condAdv = 0;
    if (!options.isMinion) {
        state.activeConditions.forEach(cId => {
            const c = CONDITIONS_LIST.find(cl => cl.id === cId);
            if (c && c.modRolls) {
                if (c.modRolls.adv) {
                    if (c.modRolls.adv.includes('all') || (isAttack && c.modRolls.adv.includes('attack'))) condAdv++;
                }
                if (c.modRolls.dis) {
                    if (c.modRolls.dis.includes('all') || (isAttack && c.modRolls.dis.includes('attack'))) condAdv--;
                }
            }
        });
    }

    let totalAdv = state.advantage + condAdv + (options.inherentAdv || 0) + (options.forceAdv ? 1 : 0);
    
    const dieMatch = finalNotation.match(/^(\d+)?d(\d+)(.*)$/i);
    if (dieMatch) {
        let count = parseInt(dieMatch[1] || "1"); let faces = dieMatch[2]; let rest = dieMatch[3];
        let diePart = (totalAdv > 0) ? `${count + totalAdv}d${faces}kh${count}` : (totalAdv < 0) ? `${count + Math.abs(totalAdv)}d${faces}kl${count}` : `${count}d${faces}`;
        if (!isCheckOrSave) diePart += '!';
        finalNotation = diePart + rest;
    }

    const tableMatch = finalNotation.match(/^t(\d+)(.*)$/i);
    if (tableMatch) {
        let faces = tableMatch[1]; let rest = tableMatch[2];
        let tablePart = (totalAdv > 0) ? `2t${faces}kh1` : (totalAdv < 0) ? `2t${faces}kl1` : `t${faces}`;
        finalNotation = tablePart + rest;
    }
    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_EVENT", { detail: { notation: finalNotation, label: label, playerName: state.charName || "Adventurer", rollTarget: 'everyone', timestamp: Date.now() } }));
}

function applyCantripScaling(notation, name, school, level) {
    const levelMod = Math.floor(level / 5);
    if (levelMod === 0) return notation;

    if (name === "Entice") {
        const steps = ["d4", "d6", "d8", "d10", "d12"];
        const step = Math.min(4, levelMod);
        return notation.replace(/d4/i, steps[step]);
    }

    let bonus = 0;
    if (school === "Fire") bonus = 5 * levelMod;
    else if (school === "Ice") bonus = 3 * levelMod;
    else if (school === "Lightning") {
        if (name === "Zap") bonus = 6 * levelMod;
        else if (name === "Overload") bonus = 4 * levelMod;
        else bonus = 4 * levelMod;
    }
    else if (school === "Wind" || name === "Vicious Mockery") bonus = 2 * levelMod;
    else if (school === "Radiant") bonus = 2 * levelMod;
    else if (name === "Withering Touch") bonus = 6 * levelMod;

    if (bonus === 0) return notation;
    return notation + "+" + bonus;
}

/**
 * ISTATS ENGINE
 */
function iStats(txt, level, statsMap, context = {}) {
    if (!txt) return "";
    const kv = Math.max(...CLASS_CONFIG.keyStats.map(s => statsMap[s]));

    // Helper: Replace stat names with values in raw notation strings
    const resolveNotation = (not) => {
        return not.replace(/\bKEY\b/gi, kv)
                  .replace(/\bLVL\b/gi, level)
                  .replace(/\bSTR\b/gi, statsMap.str)
                  .replace(/\bDEX\b/gi, statsMap.dex)
                  .replace(/\bINT\b/gi, statsMap.int)
                  .replace(/\bWIL\b/gi, statsMap.wil);
    };

    // Skip Pattern: Ignores existing highlighted spans or any HTML tags
    const skipPattern = /(<span[^>]*class="[^"]*(dice-hl|stat-hl|formula-label)[^"]*"[^>]*>.*?<\/span>)|<[^>]*>/gi;

    // Pass 1: Handle mathematical multipliers (e.g., 3x LVL)
    let processed = txt.replace(new RegExp(skipPattern.source + '|(\\b(\\d+)\\s*[xX×]\\s*(STR|DEX|INT|WIL|KEY|LVL)\\b)', 'gi'), (m, p1, p2, p3, p4, p5) => {
        if (p1 || !p3) return m;
        const s = p5.toUpperCase();
        let val = (s==='STR'?statsMap.str:s==='DEX'?statsMap.dex:s==='INT'?statsMap.int:s==='WIL'?statsMap.wil:s==='LVL'?level:kv);
        return `<span class="stat-hl">${parseInt(p4) * val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p3})</span>`;
    });

    // Pass 2: Handle Dice/Table rolls (e.g., 1d6+KEY)
    processed = processed.replace(new RegExp(skipPattern.source + '|(\\b((\\d+|STR|DEX|INT|WIL|KEY|LVL)\\s*d\\d+|t\\d+)([\\s\\+-]+(STR|DEX|INT|WIL|KEY|LVL|\\d+))*\\b)', 'gi'), (m, p1, p2, p3) => {
        if (p1 || !p3) return m;
        let notation = resolveNotation(p3).replace(/\s+/g, '');
        if (context.type === 'cantrip') notation = applyCantripScaling(notation, context.name, context.school, level);
        
        const label = (context.name || 'Roll').replace(/'/g, "\\'");
        const display = resolveNotation(p3);
        const hasStat = /STR|DEX|INT|WIL|KEY|LVL/i.test(p3);
        const formula = hasStat ? `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p3})</span>` : "";
        return `<span class="dice-hl roll-link" onclick="dispatchRoll('${notation}', '${label}', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${display}</span>${formula}`;
    });

    // Pass 3: Handle remaining isolated placeholders (outside of dice strings)
    const wrapStat = (val, label) => {
        const escapedLabel = (context.name || 'Roll').replace(/'/g, "\\'");
        return `<span class="stat-hl roll-link" onclick="dispatchRoll('1d20+${val}', '${escapedLabel} Check', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${label})</span>`;
    };

    return processed.replace(new RegExp(skipPattern.source + '|(\\b(STR|DEX|INT|WIL|KEY|LVL)\\b)', 'gi'), (m, p1, p2, p3, p4) => {
        if (p1 || !p3) return m;
        const k = p4.toUpperCase();
        if (k === 'LVL') return `<span class="stat-hl">${level}</span>`;
        if (k === 'STR') return wrapStat(statsMap.str, 'STR');
        if (k === 'DEX') return wrapStat(statsMap.dex, 'DEX');
        if (k === 'INT') return wrapStat(statsMap.int, 'INT');
        if (k === 'WIL') return wrapStat(statsMap.wil, 'WIL');
        if (k === 'KEY') return wrapStat(kv, 'KEY');
        return m;
    });
}

function bFeat(t, l, d, theme = "", skip = false, level, statsMap, context = {}) { 
    const featContext = { ...context, name: t };
    const desc = skip ? d : iStats(d, level, statsMap, featContext); 
    return `<div class="feature ${theme}"><h3>${t} ${l ? `<span class="level-tag">Lvl ${l}</span>` : ''}</h3><div class="feature-desc">${desc}</div></div>`; 
}
function formatPips(tier, school = null) { 
    const tStr = String(tier); 
    const tNum = parseInt(tStr.replace(/\D/g, '')) || 0; 
    let pips = ""; 
    if (tNum > 0) { for (let i = 0; i < tNum; i++) pips += "●"; } 
    else if (tStr.toLowerCase().includes("cantrip")) { pips = "○"; } 
    if (!pips) return tStr; 
    
    let color = 'var(--subclass-accent, var(--class-accent))';
    if (school) {
        const s = school.toLowerCase();
        if (['fire', 'ice', 'lightning', 'wind', 'radiant', 'necrotic'].includes(s)) {
            color = `var(--${s}-school)`;
        }
    }

    return `${tStr} <span style="letter-spacing:2px; color:${color}; margin-left:8px;">${pips}</span>`; 
}

function renderSingleSpellCard(s, level, statsMap, contextOverride = null) { 
    const schoolClass = (s.school || "").toLowerCase(); 
    const isCantrip = (s.tier || "").toLowerCase().includes("cantrip") || s.name === "Vicious Mockery";
    const context = contextOverride || (isCantrip ? { type: 'cantrip', name: s.name, school: s.school } : { name: s.name });
    const desc = s.customHtml ? s.customHtml : (s.desc ? iStats(s.desc, level, statsMap, context) : ""); 
    return `<div class="spell-card ${schoolClass}" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3);"><h4>${s.name ? `${s.name} ` : ""}<span class="tier-tag">${formatPips(s.tier, s.school)}</span></h4><div class="spell-desc" style="font-size: 0.85em;">${desc}</div></div>`; 
}

function renderSpells(level, subclass, state, derived, iStatsBound) {
    let spells = []; if (CLASS_CONFIG.getAvailableSpells) { spells = CLASS_CONFIG.getAvailableSpells(level, subclass, state, derived); }
    if (!spells || spells.length === 0) return "";
    const tierOrder = { "Utility": 0, "Cantrip": 1, "Tier 1": 2, "Tier 2": 3, "Tier 3": 4, "Tier 4": 5, "Tier 5": 6, "Tier 6": 7, "Tier 7": 8, "Tier 8": 9, "Tier 9": 10 };
    spells.sort((a, b) => { let aOrder = tierOrder[a.tier] ?? 99; let bOrder = tierOrder[b.tier] ?? 99; if (aOrder !== bOrder) return aOrder - bOrder; if (a.school !== b.school) return (a.school || "").localeCompare(b.school || ""); return (a.name || "").localeCompare(b.name || ""); });
    return spells.map(s => renderSingleSpellCard(s, level, derived.statsMap)).join("");
}

function render() {
    const derived = computeDerived(state);
    const { level, statsMap, armor, initiative, speed, hdFace, maxHP, hdMax, woundMax, maxActions, maxTier, passMods } = derived;

    const subclassSelect = document.getElementById('subclass');
    if (level < 3) {
        if (subclassSelect && subclassSelect.value !== "None") { subclassSelect.value = "None"; state.subclass = "None"; }
        if (subclassSelect) subclassSelect.disabled = true;
    } else {
        if (subclassSelect) subclassSelect.disabled = false;
    }

    const subConfig = CLASS_CONFIG.subclasses.find(s => s.value === state.subclass);
    document.documentElement.style.setProperty('--subclass-accent', (subConfig && subConfig.accent) ? subConfig.accent : 'var(--class-accent)');
    const cmp = document.getElementById('classMechanicPanel');
    if (CLASS_CONFIG.getMechanicPanelHTML && cmp) {
        cmp.innerHTML = CLASS_CONFIG.getMechanicPanelHTML(level, state.subclass, state, derived);
    }

    for (let i = 0; i < 3; i++) {
        const pip = document.getElementById(`action${i+1}`);
        if (pip) {
            pip.disabled = (i >= maxActions);
            pip.style.opacity = (i >= maxActions) ? '0.2' : '1';
            pip.style.cursor = (i >= maxActions) ? 'not-allowed' : 'pointer';
            if (i >= maxActions && pip.checked) {
                pip.checked = false;
                if (state.actionsSpent > i) state.actionsSpent = i;
            }
        }
    }

    const hpEl = document.getElementById('displayCurrentHP');
    const thpEl = document.getElementById('displayTempHP');
    const hdEl = document.getElementById('displayHD');
    if (hpEl && document.activeElement !== hpEl) hpEl.value = state.hpCurrent;
    if (thpEl && document.activeElement !== thpEl) thpEl.value = state.tempHP || 0;
    if (hdEl && document.activeElement !== hdEl) hdEl.value = state.hdCurrent;
    const dmh = document.getElementById('displayMaxHP'); if(dmh) dmh.innerText = maxHP;
    const mhd = document.getElementById('maxHD'); if(mhd) mhd.innerText = hdMax;

    const iStatsBound = (txt, l, sm, ctx) => iStats(txt, l || level, sm || statsMap, ctx || {});
    const bFeatBound = (t, l, d, theme = "", skip = false, l2, sm, ctx) => bFeat(t, l, d, theme, skip, l2 || level, sm || statsMap, ctx || {});

    renderHeader(derived, armor, initiative);
    renderAttributes(level, statsMap);
    renderResources(level, derived, statsMap, hdFace);
    renderInventory(statsMap, armor, statsMap.str, iStatsBound);
    renderSkills(level, statsMap, passMods);
    renderConditions();

    const tmf = document.getElementById('toggleMinorFeatures');
    if (tmf) tmf.checked = state.showMinor || false;
    document.body.classList.toggle('show-minor', state.showMinor);

    let fHtml = CLASS_CONFIG.getFeaturesHTML(level, state.subclass, state, derived, bFeatBound, iStatsBound, formatPips, renderSingleSpellCard);
    const bgFeat = BACKGROUND_FEATURES[state.background];
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];

    if (bgFeat) {
        let bgDesc = bgFeat.desc;
        let bgSelectedOpt = (bgFeat.options && state[bgFeat.stateKey]) ? bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === state[bgFeat.stateKey]) : null;

        if (bgFeat.type === "choice") {
            let choiceHtml = "";
            if (bgFeat.collection === "utility") {
                let opts = `<option value="None">-- Select Spell --</option>`;
                Object.keys(UTILITY_SPELLS).forEach(school => {
                    opts += `<optgroup label="${school}">`;
                    Object.keys(UTILITY_SPELLS[school]).forEach(sName => {
                        opts += `<option value="${sName}" ${state.bgSpell === sName ? 'selected' : ''}>${sName}</option>`;
                    });
                    opts += `</optgroup>`;
                });
                let school = "Radiant";
                if (state.bgSpell && state.bgSpell !== "None") {
                    for (const [sch, spells] of Object.entries(UTILITY_SPELLS)) { if (spells[state.bgSpell]) { school = sch; break; } }
                }
                choiceHtml = renderSingleSpellCard({
                    name: state.bgSpell !== "None" ? state.bgSpell : state.background,
                    tier: "Utility",
                    school: school,
                    customHtml: `<div style="margin-bottom:8px;"><select onchange="updateBgSpell(this.value)">${opts}</select></div><div style="font-weight:bold; color:var(--text-muted); font-size:0.85em; margin-bottom:4px;">1 Action</div><div>${state.bgSpell !== "None" ? iStatsBound(UTILITY_SPELLS[school][state.bgSpell]) : ''}</div>`
                }, level, statsMap);
            } else if (bgFeat.collection === "ancestry") {
                let opts = `<option value="None">-- Select Ancestry --</option>`;
                Object.keys(ANCESTRIES).forEach(group => {
                    opts += `<optgroup label="${group}">`;
                    ANCESTRIES[group].forEach(a => opts += `<option value="${a}" ${state[bgFeat.stateKey] === a ? 'selected' : ''}>${a}</option>`);
                    opts += `</optgroup>`;
                });
                choiceHtml = `<div class="bg-choice-selector" style="margin-top:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;"><select style="width:100%; padding:4px; background:var(--class-panel-bg); color:var(--text-main); border:1px solid var(--class-border);" onchange="updateBgChoice('${bgFeat.stateKey}', this.value)">${opts}</select></div>`;
            } else if (bgFeat.options && bgFeat.stateKey) {
                let opts = `<option value="None">-- Select Option --</option>`;
                bgFeat.options.forEach(opt => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    opts += `<option value="${label}" ${state[bgFeat.stateKey] === label ? 'selected' : ''}>${label}</option>`;
                });
                let optDesc = "";
                if (bgSelectedOpt && bgSelectedOpt.desc) {
                    optDesc = `<div style="margin-top:8px; font-size:0.9em; color:var(--text-main); border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">${iStatsBound(bgSelectedOpt.desc)}</div>`;
                }
                choiceHtml = `<div class="bg-choice-selector" style="margin-top:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;"><select style="width:100%; padding:4px; background:var(--class-panel-bg); color:var(--text-main); border:1px solid var(--class-border);" onchange="updateBgChoice('${bgFeat.stateKey}', this.value)">${opts}</select>${optDesc}</div>`;
            }
            bgDesc += choiceHtml;
        }
        if (bgFeat.uses || (bgSelectedOpt && bgSelectedOpt.uses)) {
            let usesHtml = '<div style="margin-top:10px; display:flex; flex-direction:column; gap:6px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">';
            const allUses = [...(bgFeat.uses || []), ...(bgSelectedOpt?.uses || [])];
            allUses.forEach(u => {
                let pips = "";
                for (let i = 0; i < u.max; i++) {
                    const checked = (state[u.stateKey] || 0) > i;
                    pips += `<input type="checkbox" class="pip" ${checked ? 'checked' : ''} onclick="toggleBgPip('${u.stateKey}', ${i})">`;
                }
                usesHtml += `<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.85em; color:var(--text-muted);"><span style="color:var(--text-main); font-weight:bold;">• ${u.label}</span><div style="display:flex; gap:4px;">${pips}</div></div>`;
            });
            usesHtml += '</div>';
            bgDesc += usesHtml;
        }
        fHtml = bFeatBound(`Background: ${state.background}`, "", bgDesc, "", false) + fHtml;
    }

    if (ancFeat) fHtml = bFeatBound(`Ancestry: ${state.ancestry}`, "", ancFeat.desc, "", false) + fHtml;
    const fc = document.getElementById('featuresContainer'); if(fc) fc.innerHTML = fHtml;

    const mtEl = document.getElementById('maxTierDisplay');
    if (mtEl) mtEl.innerText = maxTier > 0 ? `(Max Tier: ${maxTier})` : "";

    let sHtml = renderSpells(level, state.subclass, state, derived, iStatsBound);
    const sWrapper = document.getElementById('spellsColWrapper');
    if (sHtml && sHtml.trim().length > 0) {
        if(document.getElementById('featuresSpellsLayout')) document.getElementById('featuresSpellsLayout').className = 'layout-2col';
        if(sWrapper) sWrapper.style.display = 'block';
        const sc = document.getElementById('spellsContainer'); if(sc) sc.innerHTML = sHtml;
    } else {
        if(document.getElementById('featuresSpellsLayout')) document.getElementById('featuresSpellsLayout').className = 'layout-1col';
        if(sWrapper) sWrapper.style.display = 'none';
    }
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
window.addEventListener('wheel', (e) => { if (e.target.type === 'number') { e.preventDefault(); let d = e.deltaY < 0 ? 1 : -1; if (e.target.id === 'displayCurrentHP') adjHP(d, false); else if (e.target.id === 'displayTempHP') adjTempHP(d, false); else if (e.target.id === 'displayHD') adjHD(d, false); else { let val = parseInt(e.target.value || 0) + d; let newVal = Math.min(e.target.hasAttribute('max')?parseInt(e.target.getAttribute('max')):Infinity, Math.max(e.target.hasAttribute('min')?parseInt(e.target.getAttribute('min')):-Infinity, val)); e.target.value = newVal; e.target.dispatchEvent(new Event('change')); } } }, { passive: false });
function importCharacter(input) { const file = input.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const imported = JSON.parse(e.target.result); saveState(imported); loadState(); render(); alert("Character imported successfully!"); } catch (err) { alert("Error importing character: Invalid file format."); } }; reader.readAsText(file); }
function saveAsHTML() {
    let newHtml = document.documentElement.outerHTML.replace(/const EMBEDDED_STATE = (null|{.*?});/, `const EMBEDDED_STATE = ${JSON.stringify(state)};`);
    newHtml = newHtml.replace(/<title>(.*?)<\/title>/, `<title>NIMBLE — ${state.charName || 'Hero'} (${CLASS_CONFIG.name})</title>`);
    const blob = new Blob([newHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nimble_${state.charName || 'Hero'}_${CLASS_CONFIG.name}.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
const debouncedSaveAndRender = debounce(() => { saveState(); render(); }, 300);
function debounce(fn, ms) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn.apply(this, args), ms); }; }
document.addEventListener('DOMContentLoaded', () => { loadState(); render(); document.querySelectorAll('input, select').forEach(el => { el.addEventListener('change', () => { saveState(); render(); }); el.addEventListener('input', debouncedSaveAndRender); }); });
