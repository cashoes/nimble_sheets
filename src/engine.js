/**
 * STATE MANAGEMENT
 */
// Generate a unique key based on the filename to allow "Copy & Rename" for multiple characters
const getStorageKey = () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return `nimble_v4_${CLASS_CONFIG.name.toLowerCase()}_${filename}`;
};

const STORAGE_KEY = getStorageKey();

function saveState() {
    const lvlInput = parseInt(document.getElementById('level').value) || 1;
    let oldLevel = state.level;
    let oldGold = state.gold;
    
    // Capture old stats to check for max resource changes
    let oldStatsMap = { 
        str: state.baseStr + state.addStr, 
        dex: state.baseDex + state.addDex, 
        int: state.baseInt + state.addInt, 
        wil: state.baseWil + state.addWil 
    };

    state.charName = document.getElementById('charName').value;
    state.ancestry = document.getElementById('ancestry').value;
    state.background = document.getElementById('background').value;
    state.subclass = document.getElementById('subclass').value;
    state.gold = parseInt(document.getElementById('gold').value) || 0;
    
    if (state.gold > oldGold) triggerAnimation('gold', 'green');
    else if (state.gold < oldGold) triggerAnimation('gold', 'red');

    // Enforce Stat Cap (+5 Total)
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
        const baseEl = document.getElementById(`base${s}`);
        const addEl = document.getElementById(`add${s}`);
        let b = parseInt(baseEl.value) || 0;
        let a = parseInt(addEl.value) || 0;
        
        // Enforce Cap: b + a <= 5
        if (b + a > 5) {
            a = Math.max(0, 5 - b);
            addEl.value = a;
        }

        // Dynamically update HTML max attribute for spinner feedback
        addEl.max = Math.max(0, 5 - b);

        state[`base${s}`] = b;
        state[`add${s}`] = a;
    });
    
    // New Stat Map after UI update
    let statsMap = { 
        str: state.baseStr + state.addStr, 
        dex: state.baseDex + state.addDex, 
        int: state.baseInt + state.addInt, 
        wil: state.baseWil + state.addWil 
    };

    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    let hdFace = CLASS_CONFIG.hitDie;
    if (ancFeat && ancFeat.modHDStep) {
        const dieSteps = [6, 8, 10, 12, 20];
        let idx = dieSteps.indexOf(hdFace);
        if (idx !== -1) {
            idx = Math.min(dieSteps.length - 1, idx + ancFeat.modHDStep);
            hdFace = dieSteps[idx];
        }
    }
    const hpPerLevelMap = { 6: 5, 8: 6, 10: 8, 12: 9, 20: 14 };
    let hpPerLevel = hpPerLevelMap[hdFace] || CLASS_CONFIG.hpPerLevel;

    let maxHP = CLASS_CONFIG.baseHp + ((lvlInput - 1) * hpPerLevel);
    let maxHD = lvlInput + (ancFeat?.modHD || 0);

    if (oldLevel !== lvlInput || state.hpCurrent === null) { 
        state.hpCurrent = maxHP; 
        state.hdCurrent = maxHD; 
    }

    // Reset Class Resources if Level or Stats changed their Maximum
    (CLASS_CONFIG.resources || []).forEach(r => {
        let newMax = r.calcMax(lvlInput, statsMap);
        let prevMax = r.calcMax(oldLevel, oldStatsMap); 
        
        if (state.resourceValues[r.id] === undefined || newMax !== prevMax || oldLevel !== lvlInput) {
            state.resourceValues[r.id] = newMax;
        }
    });
    
    state.level = lvlInput;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const ind = document.getElementById('saveIndicator'); ind.textContent = 'Saved ✓'; setTimeout(() => { ind.textContent = 'Auto-saved'; }, 1500);
}

function loadState() {
    state = {
        version: "1.0.0",
        charName: '', level: 1, ancestry: 'Human', background: 'None', subclass: 'None',
        baseStr: 0, addStr: 0, baseDex: 0, addDex: 0, baseInt: 0, addInt: 0, baseWil: 0, addWil: 0,
        hpCurrent: null, tempHP: 0, hdCurrent: null, wounds: 0,
        skills: {}, activeConditions: [], inventory: [], gold: 0,
        resourceValues: {}, bgSpell: 'None',
        selectedDecrees: [], selectedSpells: [], selectedArsenal: [], selectedToth: []
    };

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        const loaded = JSON.parse(raw);
        Object.assign(state, loaded);
        
        // Force update to new standardized arrays if character is fresh (Lvl 1, no name) OR version is old
        if ((!loaded.version || loaded.version < 1.0) && state.level === 1 && !state.charName) {
            if (CLASS_CONFIG.initialStats) {
                Object.assign(state, CLASS_CONFIG.initialStats);
                state.version = "1.0.0";
            }
        }
    } else {
        // Initialize with class defaults if first load
        if (CLASS_CONFIG.initialStats) Object.assign(state, CLASS_CONFIG.initialStats);
    }

    applyTheme(CLASS_CONFIG.theme);

    document.getElementById('classNameDisplay').innerText = CLASS_CONFIG.name;
    document.getElementById('classSubtitleDisplay').innerText = CLASS_CONFIG.subtitle;
    
    let subHtml = ""; CLASS_CONFIG.subclasses.forEach(s => subHtml += `<option value="${s.value}">${s.label}</option>`);
    document.getElementById('subclass').innerHTML = subHtml;
    
    let ancHtml = "";
    Object.keys(ANCESTRIES).forEach(group => {
        ancHtml += `<optgroup label="${group}">`;
        ANCESTRIES[group].forEach(a => ancHtml += `<option value="${a}">${a}</option>`);
        ancHtml += `</optgroup>`;
    });
    document.getElementById('ancestry').innerHTML = ancHtml;
    
    let bgHtml = `<option value="None">None</option>`;
    Object.keys(BACKGROUNDS).forEach(group => {
        bgHtml += `<optgroup label="${group}">`;
        BACKGROUNDS[group].forEach(b => bgHtml += `<option value="${b}">${b}</option>`);
        bgHtml += `</optgroup>`;
    });
    document.getElementById('background').innerHTML = bgHtml;
    
    const mSel = document.getElementById('meleeSelect'); mSel.innerHTML = '<option value="">+ Melee Item</option>';
    Object.keys(ITEM_TEMPLATES.melee).forEach(group => {
        mSel.innerHTML += `<optgroup label="${group}">`;
        ITEM_TEMPLATES.melee[group].forEach(k => mSel.innerHTML += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`);
        mSel.innerHTML += `</optgroup>`;
    });
    
    const rSel = document.getElementById('rangedSelect'); rSel.innerHTML = '<option value="">+ Ranged Item</option>';
    Object.keys(ITEM_TEMPLATES.ranged).forEach(group => {
        rSel.innerHTML += `<optgroup label="${group}">`;
        ITEM_TEMPLATES.ranged[group].forEach(k => rSel.innerHTML += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`);
        rSel.innerHTML += `</optgroup>`;
    });
    
    const aSel = document.getElementById('armorSelect'); aSel.innerHTML = '<option value="">+ Armor/Shield</option>';
    Object.keys(ITEM_TEMPLATES.armor).forEach(group => {
        aSel.innerHTML += `<optgroup label="${group}">`;
        ITEM_TEMPLATES.armor[group].forEach(k => aSel.innerHTML += `<option value="${k}">${ITEM_TEMPLATES.data[k].name}</option>`);
        aSel.innerHTML += `</optgroup>`;
    });

    document.getElementById('charName').value = state.charName || ''; document.getElementById('level').value = state.level || 1;
    document.getElementById('ancestry').value = state.ancestry || 'Human'; document.getElementById('background').value = state.background || 'None';
    document.getElementById('subclass').value = state.subclass || 'None'; document.getElementById('gold').value = state.gold || 0;
    
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
        document.getElementById(`base${s}`).value = state[`base${s}`];
        const addEl = document.getElementById(`add${s}`);
        addEl.value = state[`add${s}`];
        addEl.max = Math.max(0, 5 - state[`base${s}`]);
    });
    
    mSel.onchange = (e) => { if(e.target.value) { addQuickItem('data', e.target.value); e.target.value = ""; } };
    rSel.onchange = (e) => { if(e.target.value) { addQuickItem('data', e.target.value); e.target.value = ""; } };
    aSel.onchange = (e) => { if(e.target.value) { addQuickItem('data', e.target.value); e.target.value = ""; } };
}

/**
 * THEME ENGINE
 */
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

/**
 * MODULAR RENDER FUNCTIONS
 */

function renderHeader(derived, armorVal, init) {
    let lStats = `<div class="header-stat"><label style="color:var(--gold-light)">Armor</label><div class="header-stat-val" style="color:var(--gold-light)">${armorVal}</div></div>`;
    CLASS_CONFIG.customHeaderStats?.filter(s=>s.position==='left').forEach(s => { 
        if(s.isVisible(state.level, state.subclass)) lStats += `<div class="header-stat"><label style="color:${s.color}">${s.label}</label><div class="header-stat-val" style="color:${s.color}">${s.getValue(derived)}</div></div>`; 
    });
    document.getElementById('headerLeftStats').innerHTML = lStats;
    
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    const initAdv = ancFeat && ancFeat.modInitAdv ? '<span style="font-size:0.5em; vertical-align:middle; color:var(--save-adv); margin-left:2px;">▲</span>' : '';
    
    document.getElementById('headerRightStats').innerHTML = `
        <div class="header-stat"><label>Size</label><div class="header-stat-val">${derived.size}</div></div>
        <div class="header-stat"><label>Speed</label><div class="header-stat-val">${derived.speed}</div></div>
        <div class="header-stat"><label>Init</label><div class="header-stat-val">${init >= 0 ? "+" : ""}${init}${initAdv}</div></div>
    `;
}

function renderAttributes(level, statsMap) {
    ['str', 'dex', 'int', 'wil'].forEach(stat => {
        const card = document.getElementById(`statCard_${stat}`);
        if (card) {
            if (CLASS_CONFIG.keyStats.includes(stat)) card.classList.add('key-stat'); else card.classList.remove('key-stat');
            card.classList.remove('save-adv', 'save-dis');
            if (CLASS_CONFIG.saves.adv === stat) card.classList.add('save-adv');
            if (CLASS_CONFIG.saves.dis === stat) card.classList.add('save-dis');
        }
    });

    document.getElementById('displayStr').innerText = statsMap.str; 
    document.getElementById('displayDex').innerText = statsMap.dex;
    document.getElementById('displayInt').innerText = statsMap.int; 
    document.getElementById('displayWil').innerText = statsMap.wil;

    let keyAllowed = Math.floor(level/4); 
    let secAllowed = Math.floor((level-1)/4);
    let keySpent = 0; let secSpent = 0;
    
    CLASS_CONFIG.keyStats.forEach(s => keySpent += state[`add${s.charAt(0).toUpperCase()+s.slice(1)}`]);
    ['str', 'dex', 'int', 'wil'].filter(s => !CLASS_CONFIG.keyStats.includes(s)).forEach(s => secSpent += state[`add${s.charAt(0).toUpperCase()+s.slice(1)}`]);
    
    let unspentHtml = ""; 
    let keyLeft = keyAllowed - keySpent; 
    let secLeft = secAllowed - secSpent;
    
    document.querySelectorAll('.core-stat-inputs input[id^="add"]').forEach(el => el.classList.remove('error-glow'));
    
    if (keySpent > keyAllowed) {
        unspentHtml = `<span style='color:var(--save-dis)'>OVERSPENT: ${keyLeft} Key</span>`;
        CLASS_CONFIG.keyStats.forEach(s => document.getElementById(`add${s.charAt(0).toUpperCase()+s.slice(1)}`).classList.add('error-glow'));
    } else if (secSpent > secAllowed) {
        unspentHtml = `<span style='color:var(--save-dis)'>OVERSPENT: ${secLeft} Sec</span>`;
        ['str', 'dex', 'int', 'wil'].filter(s => !CLASS_CONFIG.keyStats.includes(s)).forEach(s => document.getElementById(`add${s.charAt(0).toUpperCase()+s.slice(1)}`).classList.add('error-glow'));
    } else {
        unspentHtml = `<span style='color:var(--class-accent)'>UNSPENT: ${keyLeft} Key, ${secLeft} Sec</span>`;
    }
    document.getElementById('unspentStats').innerHTML = unspentHtml;
}

function renderResources(level, derived, statsMap, hdFace) {
    const hpPerLevelMap = { 6: 5, 8: 6, 10: 8, 12: 9, 20: 14 };
    let hpPerLevel = hpPerLevelMap[hdFace] || CLASS_CONFIG.hpPerLevel;
    let maxHP = CLASS_CONFIG.baseHp + ((level - 1) * hpPerLevel);
    let hdMax = derived.hdMax;
    
    if (state.hpCurrent === null) state.hpCurrent = maxHP;
    if (state.hdCurrent === null) state.hdCurrent = hdMax;

    const hpEl = document.getElementById('displayCurrentHP');
    const thpEl = document.getElementById('displayTempHP');
    const hdEl = document.getElementById('displayHD');

    if (hpEl && document.activeElement !== hpEl) hpEl.value = state.hpCurrent; 
    if (thpEl && document.activeElement !== thpEl) thpEl.value = state.tempHP || 0;
    if (hdEl && document.activeElement !== hdEl) hdEl.value = state.hdCurrent; 

    document.getElementById('displayMaxHP').innerText = maxHP;
    document.getElementById('maxHD').innerText = hdMax;
    document.getElementById('hitDiceLabel').innerText = `Hit Dice (d${hdFace})`;
    
    let wHtml = ""; for(let i=0; i<derived.woundMax; i++) wHtml += `<input type="checkbox" class="pip wound" ${i<state.wounds?'checked':''} onclick="handleWoundClick(${i})">`;
    document.getElementById('woundsContainer').innerHTML = wHtml;

    let resHtml = "";
    (CLASS_CONFIG.resources || []).forEach(r => {
        if (r.manual) return; // Skip rendering if class handles it in the mechanic panel
        let max = r.calcMax(level, statsMap); if (max <= 0) return;
        if (state.resourceValues[r.id] === undefined) state.resourceValues[r.id] = max;
        resHtml += `<div class="res-row"><label>${r.label}</label><div style="display: flex; align-items: center; gap: 8px;"><div class="res-val dark-incrementer"><button onclick="adjRes('${r.id}', -1)">-</button><input type="number" id="res_${r.id}" value="${state.resourceValues[r.id]}" onchange="adjRes('${r.id}', parseInt(this.value), ${max}, true)"><button onclick="adjRes('${r.id}', 1, ${max})">+</button></div><div class="max-text">/ <span style="color:var(--text-main);">${max}</span></div></div></div>`;
    });
    document.getElementById('dynamicResourcesContainer').innerHTML = resHtml;
}

function renderInventory(statsMap, armorVal, str, iStats) {
    let maxSlots = 10 + str;
    let slotsUsed = 0;
    state.inventory.forEach(item => { slotsUsed += (parseFloat(item.slots) || 0); });

    const DICE_OPTS = ["1d4", "1d6", "1d8", "1d10", "1d12", "2d4", "2d6", "3d4", "4d4", "1d20"];
    const STAT_OPTS = ["str", "dex", "int", "wil"];
    const TYPE_OPTS = ["weapon", "armor", "shield", "misc"];
    const ARMOR_OPTS = ["light", "medium", "heavy"];

    let invHtml = `<div class="inv-header"><div></div><div>Item</div><div>Type</div><div style="text-align:center;">Stats</div><div style="text-align:center;">Effect</div><div>Props</div><div style="text-align:center;">GP</div><div style="text-align:center;">Wt</div><div></div></div>`;
    state.inventory.forEach(item => {
        let sH = '-'; let eH = '-';
        if (item.type === 'weapon') { 
            sH = `${item.dmgDice} (${item.stat.toUpperCase()})`; 
            if (item.equipped) eH = `⚔️ ${item.dmgDice}${statsMap[item.stat] >= 0 ? '+' : ''}${statsMap[item.stat]}`; 
        }
        else if (item.type === 'armor' && item.equipped) {
            const dMax = item.dexMax !== undefined ? item.dexMax : (item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0));
            let formula = `${item.armor} + DEX`;
            if (dMax < 90) formula += ` (max ${dMax})`;
            if (dMax === 0) formula = `${item.armor}`;
            eH = `🛡️ ${iStats(formula)} AC`;
        }
        else if (item.type === 'shield' && item.equipped) {
            eH = `🛡️ +${item.armor} AC`;
        }

        // UI Logic
        let typeHtml = `<div style="font-size:0.9em; color:var(--text-muted);">${item.type}</div>`;
        let statsHtml = `<div style="text-align:center; font-size:0.95em;">${sH}</div>`;
        let propsHtml = `<div style="font-size:0.9em; color:var(--text-muted);">${item.props||''}</div>`;
        let slotsHtml = `<div style="text-align:center;">${item.slots}</div>`;

        if (item.isCustom) {
            typeHtml = `<select class="inv-input" onchange="updateItem(${item.id}, 'type', this.value)">${TYPE_OPTS.map(t => `<option value="${t}" ${item.type===t?'selected':''}>${t}</option>`).join('')}</select>`;
            
            if (item.type === 'weapon') {
                statsHtml = `<div style="display:flex; gap:2px;">
                    <select class="inv-input" style="flex:1.2;" onchange="updateItem(${item.id}, 'dmgDice', this.value)">${DICE_OPTS.map(d => `<option value="${d}" ${item.dmgDice===d?'selected':''}>${d}</option>`).join('')}</select>
                    <select class="inv-input" style="flex:1;" onchange="updateItem(${item.id}, 'stat', this.value)">${STAT_OPTS.map(s => `<option value="${s}" ${item.stat===s?'selected':''}>${s.toUpperCase()}</option>`).join('')}</select>
                </div>`;
            } else if (item.type === 'armor') {
                statsHtml = `<div style="display:flex; gap:2px;">
                    <input type="number" class="inv-input" style="width:35px;" value="${item.armor}" onchange="updateItem(${item.id}, 'armor', this.value)">
                    <select class="inv-input" style="flex:1;" onchange="updateItem(${item.id}, 'armorType', this.value)">${ARMOR_OPTS.map(a => `<option value="${a}" ${item.armorType===a?'selected':''}>${a.charAt(0).toUpperCase()}</option>`).join('')}</select>
                </div>`;
            } else if (item.type === 'shield') {
                statsHtml = `<input type="number" class="inv-input" value="${item.armor}" onchange="updateItem(${item.id}, 'armor', this.value)">`;
            }

            propsHtml = `<input type="text" class="inv-input" value="${item.props||''}" onchange="updateItem(${item.id}, 'props', this.value)">`;
            slotsHtml = `<input type="number" class="inv-input" value="${item.slots}" onchange="updateItem(${item.id}, 'slots', this.value)">`;
        }

        invHtml += `<div class="inv-row"><div style="text-align:center;"><input type="checkbox" ${item.equipped?'checked':''} onchange="updateItem(${item.id}, 'equipped', this.checked, true)"></div><div><input type="text" class="inv-input" value="${item.name}" onchange="updateItem(${item.id}, 'name', this.value)"></div><div>${typeHtml}</div><div>${statsHtml}</div><div style="font-weight:bold; color:var(--class-accent); text-align:center;">${eH}</div><div>${propsHtml}</div><div style="text-align:center;"><input type="number" class="inv-input" value="${item.cost||0}" onchange="updateItem(${item.id}, 'cost', this.value)"></div><div style="text-align:center;">${slotsHtml}</div><div style="text-align:center;"><button onclick="deleteItem(${item.id})" style="background:none; border:none; color:var(--save-dis); cursor:pointer;">×</button></div></div>`;
    });
    document.getElementById('inventoryContainer').innerHTML = invHtml;
    document.getElementById('inventorySlots').innerHTML = `SLOTS: <span style="color:${slotsUsed > maxSlots?'var(--save-dis)':'var(--class-accent)'}">${slotsUsed} / ${maxSlots}</span>`;
}

function renderSkills(level, statsMap, passMods) {
    let totalPts = 3 + level; 
    let spent = 0; 
    SKILL_LIST.forEach(s => spent += (state.skills[s.id] || 0));
    
    let isOverspent = (totalPts - spent) < 0;
    let sHtml = `<div class="skill-header"><span>SKILLS</span><span style="color:${isOverspent ? 'var(--save-dis)' : 'var(--class-accent)'}">UNSPENT: ${totalPts - spent}</span></div>`;
    
    sHtml += `<div class="skills-grid">`;
    
    SKILL_LIST.forEach(s => {
        let pts = state.skills[s.id] || 0;
        let t = statsMap[s.stat] + pts + passMods[s.id];
        let validationClass = isOverspent && pts > 0 ? 'error-glow' : '';
        sHtml += `<div class="skill-row">
            <div class="skill-name">${s.name} <span class="skill-stat">${s.stat.toUpperCase()}</span></div>
            <div class="skill-pts"><input type="number" min="0" class="${validationClass}" value="${pts}" onchange="updateSkill('${s.id}', this.value)"></div>
            <div class="skill-total">${t >= 0 ? '+' : ''}${t}</div>
        </div>`;
    });

    sHtml += `</div>`;
    document.getElementById('skillsContainer').innerHTML = sHtml;
}

function renderConditions() {
    let cHtml = ""; 
    CONDITIONS_LIST.forEach(c => cHtml += `<div class="condition-btn ${c.type} ${state.activeConditions.includes(c.id)?'active':''}" title="${c.desc}" onclick="toggleCondition('${c.id}')">${c.name}</div>`);
    document.getElementById('conditionsContainer').innerHTML = cHtml;
}

/**
 * UTILITIES
 */
const STAT_PATTERN = /\b(STR|DEX|INT|WIL|KEY|LVL)\b(?!\s+(save|check|skill))/gi;
const DICE_PATTERN = /\b(\d+d\d+)\b/gi;

function iStats(txt, level, statsMap) {
    if (!txt) return "";
    const { str, dex, int, wil } = statsMap;
    const kv = Math.max(...CLASS_CONFIG.keyStats.map(s => statsMap[s]));
    const wrap = (val, label) => `<span class="stat-hl">${val}</span><span style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${label})</span>`;

    const replacer = (match, p1) => {
        const key = p1.toUpperCase();
        if (key === 'LVL') return `<span class="stat-hl">${level}</span>`;
        if (key === 'STR') return wrap(str, 'STR');
        if (key === 'DEX') return wrap(dex, 'DEX');
        if (key === 'INT') return wrap(int, 'INT');
        if (key === 'WIL') return wrap(wil, 'WIL');
        if (key === 'KEY') return wrap(kv, 'KEY');
        return match;
    };

    return txt.replace(STAT_PATTERN, replacer).replace(DICE_PATTERN, `<span class="dice-hl">$1</span>`);
}

function bFeat(t, l, d, theme = "", skip = false, level, statsMap) {
    const desc = skip ? d : iStats(d, level, statsMap);
    return `<div class="feature ${theme}"><h3>${t} ${l ? `<span class="level-tag">Lvl ${l}</span>` : ''}</h3><p>${desc}</p></div>`;
}

function formatPips(tier) {
    const tStr = String(tier);
    const tNum = parseInt(tStr.replace(/\D/g, '')) || 0;
    let pips = "";
    if (tNum > 0) {
        for (let i = 0; i < tNum; i++) pips += "●";
    } else if (tStr.toLowerCase().includes("cantrip")) {
        pips = "○";
    }
    if (!pips) return tStr;
    return `<span style="letter-spacing:2px; color:var(--subclass-accent, var(--class-accent)); margin-right:8px;">${pips}</span> ${tStr}`;
}

/**
 * MAIN ORCHESTRATOR
 */
function render() {
    const { level, ancestry, background, subclass } = state;
    
    const str = state.baseStr + state.addStr;
    const dex = state.baseDex + state.addDex;
    const int = state.baseInt + state.addInt;
    const wil = state.baseWil + state.addWil;
    const statsMap = { str, dex, int, wil };

    // Bound helpers for this specific render pass
    const iStatsBound = (txt) => iStats(txt, level, statsMap);
    const bFeatBound = (t, l, d, theme = "", skip = false) => bFeat(t, l, d, theme, skip, level, statsMap);

    // Logic Gate for Subclass
    const subclassSelect = document.getElementById('subclass');
    if (level < 3) { 
        if (subclassSelect.value !== "None") {
            subclassSelect.value = "None";
            state.subclass = "None";
        }
        subclassSelect.disabled = true; 
    } else {
        subclassSelect.disabled = false;
    }
    
    // Logic Gate for Base Stats
    const baseLocked = level > 1;
    ['baseStr', 'baseDex', 'baseInt', 'baseWil'].forEach(id => {
      let el = document.getElementById(id); 
      if (el) {
          el.readOnly = baseLocked; 
          el.style.opacity = baseLocked ? '0.4' : '1'; 
          el.style.cursor = baseLocked ? 'not-allowed' : 'auto';
      }
    });

    const derived = CLASS_CONFIG.getDerivedStats(level, subclass, state);
    derived.size = "Med"; // Default
    derived.hdMax = level;

    // Apply Subclass Accent Color
    const subConfig = CLASS_CONFIG.subclasses.find(s => s.value === subclass);
    document.documentElement.style.setProperty('--subclass-accent', (subConfig && subConfig.accent) ? subConfig.accent : 'var(--class-accent)');
    
    if (CLASS_CONFIG.getMechanicPanelHTML) {
        document.getElementById('classMechanicPanel').innerHTML = CLASS_CONFIG.getMechanicPanelHTML(level, subclass, state, derived);
    }
    
    let classOverrides = CLASS_CONFIG.getStatOverrides ? CLASS_CONFIG.getStatOverrides(level, subclass, state, statsMap) : {};

    // Passives/Ancestry
    let init = dex + (classOverrides.init || 0); 
    let hdFace = CLASS_CONFIG.hitDie;
    derived.speed = 6 + (classOverrides.speed || 0); 

    let ancTxt = ""; let passMods = {}; SKILL_LIST.forEach(s => passMods[s.id] = 0);
    
    const ancFeat = ANCESTRY_FEATURES[ancestry];
    if (ancFeat) {
        ancTxt = ancFeat.desc;
        if (ancFeat.modInit) init += ancFeat.modInit;
        if (ancFeat.modSpeed) derived.speed += ancFeat.modSpeed;
        if (ancFeat.modWounds) derived.woundMax = Math.max(1, derived.woundMax + ancFeat.modWounds);
        if (ancFeat.modSize) derived.size = ancFeat.modSize;
        if (ancFeat.modHD) derived.hdMax += ancFeat.modHD;
        if (ancFeat.modAllSkills) SKILL_LIST.forEach(s => passMods[s.id] += ancFeat.modAllSkills);
        if (ancFeat.modSkill) passMods[ancFeat.modSkill.id] += ancFeat.modSkill.val;
        
        // Handle Hit Die step increments (e.g. Oozeling)
        if (ancFeat.modHDStep) {
            const dieSteps = [6, 8, 10, 12, 20];
            let idx = dieSteps.indexOf(hdFace);
            if (idx !== -1) {
                idx = Math.min(dieSteps.length - 1, idx + ancFeat.modHDStep);
                hdFace = dieSteps[idx];
            }
        }
    }
    
    let bgTxt = "";
    const bgFeat = BACKGROUND_FEATURES[background];
    if (bgFeat) {
        bgTxt = bgFeat.desc;
        if (bgFeat.modInit) init += bgFeat.modInit;
        if (bgFeat.modSpeed) derived.speed += bgFeat.modSpeed;
        if (bgFeat.modWounds) derived.woundMax = Math.max(1, derived.woundMax + bgFeat.modWounds);
        if (bgFeat.modSize) derived.size = bgFeat.modSize;
        if (bgFeat.modHD) derived.hdMax += bgFeat.modHD;
        if (bgFeat.modAllSkills) SKILL_LIST.forEach(s => passMods[s.id] += bgFeat.modAllSkills);
        if (bgFeat.modSkill) passMods[bgFeat.modSkill.id] += bgFeat.modSkill.val;
    }

    // Armor Calculation
    let armorVal = classOverrides.armorBase !== undefined ? classOverrides.armorBase : dex;
    let bestArmorVal = -1;
    let shieldBonus = 0;
    let armorIsLight = true;

    state.inventory.forEach(item => {
        if (!item.equipped) return;
        if (item.type === 'armor') {
            const base = parseInt(item.armor) || 0;
            const dMax = item.dexMax !== undefined ? item.dexMax : (item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0));
            const currentArmor = base + Math.min(dex, dMax);
            if (currentArmor > bestArmorVal) bestArmorVal = currentArmor;
            if (item.armorType !== 'light') armorIsLight = false;
        } else if (item.type === 'shield') {
            shieldBonus += (parseInt(item.armor) || 0);
        }
    });

    if (bestArmorVal !== -1) armorVal = bestArmorVal;
    armorVal += shieldBonus + (CLASS_CONFIG.getShieldBonus ? CLASS_CONFIG.getShieldBonus(level, subclass, statsMap) : 0);
    if (ancFeat && ancFeat.modArmor) armorVal += ancFeat.modArmor;
    if (bgFeat && bgFeat.modArmor) armorVal += bgFeat.modArmor;

    // Birdfolk flight speed logic
    if (ancFeat && ancFeat.modFlySpeed && armorIsLight) {
        derived.speed = `${derived.speed} (${derived.speed} Fly)`;
    }

    const hpPerLevelMap = { 6: 5, 8: 6, 10: 8, 12: 9, 20: 14 };
    let hpPerLevel = hpPerLevelMap[hdFace] || CLASS_CONFIG.hpPerLevel;
    let maxHP = CLASS_CONFIG.baseHp + ((level - 1) * hpPerLevel);

    if (state.hpCurrent === null) state.hpCurrent = maxHP;
    if (state.hdCurrent === null) state.hdCurrent = derived.hdMax;

    const hpEl = document.getElementById('displayCurrentHP');
    const thpEl = document.getElementById('displayTempHP');
    const hdEl = document.getElementById('displayHD');

    if (hpEl && document.activeElement !== hpEl) hpEl.value = state.hpCurrent; 
    if (thpEl && document.activeElement !== thpEl) thpEl.value = state.tempHP || 0;
    if (hdEl && document.activeElement !== hdEl) hdEl.value = state.hdCurrent; 

    document.getElementById('displayMaxHP').innerText = maxHP;
    document.getElementById('maxHD').innerText = derived.hdMax;
    document.getElementById('hitDiceLabel').innerText = `Hit Dice (d${hdFace})`;

    // Execute modular renders
    renderHeader(derived, armorVal, init);
    renderAttributes(level, statsMap);
    renderResources(level, derived, statsMap, hdFace);
    renderInventory(statsMap, armorVal, str, iStatsBound);
    renderSkills(level, statsMap, passMods);
    renderConditions();

    // Features and Spells Orchestration
    let fHtml = CLASS_CONFIG.getFeaturesHTML(level, subclass, state, derived, bFeatBound, iStatsBound, formatPips);
    
    if (bgFeat) {
        let bgDesc = bgTxt;
        if (bgFeat.customUI === "academyDropout") {
            let opts = `<option value="None">-- Select Spell --</option>`;
            Object.keys(UTILITY_SPELLS).forEach(school => {
                opts += `<optgroup label="${school}">`;
                Object.keys(UTILITY_SPELLS[school]).forEach(sName => {
                    opts += `<option value="${sName}" ${state.bgSpell === sName ? 'selected' : ''}>${sName}</option>`;
                });
                opts += `</optgroup>`;
            });
            bgDesc += `<div style="margin-top:10px;"><select onchange="updateBgSpell(this.value)" style="width:100%; background:rgba(0,0,0,0.2); color:#fff; border:1px solid var(--class-accent); padding:4px;">${opts}</select></div>`;
            
            // Add selected spell description
            if (state.bgSpell && state.bgSpell !== "None") {
                let sData = null;
                Object.values(UTILITY_SPELLS).forEach(school => { if(school[state.bgSpell]) sData = school[state.bgSpell]; });
                if (sData) bgDesc += `<div style="margin-top:8px; font-size:0.9em; border-left: 2px solid var(--class-accent); padding-left: 10px; color: var(--text-muted);">${iStatsBound(sData)}</div>`;
            }
        }
        fHtml = bFeatBound(`Background: ${background}`, "", bgDesc, "", true) + fHtml;
    }
    
    if(ancTxt) fHtml = bFeatBound(`Ancestry: ${ancestry}`, "", ancTxt, "", true) + fHtml;
    document.getElementById('featuresContainer').innerHTML = fHtml;
    
    let sHtml = (CLASS_CONFIG.getSpellCardsHTML) ? CLASS_CONFIG.getSpellCardsHTML(level, subclass, state, derived, formatPips, iStatsBound) : "";
    const sWrapper = document.getElementById('spellsColWrapper');
    if (sHtml && sHtml.trim().length > 0) {
        document.getElementById('featuresSpellsLayout').className = 'layout-2col'; 
        sWrapper.style.display = 'block';
        document.getElementById('spellsContainer').innerHTML = sHtml;
    } else { 
        document.getElementById('featuresSpellsLayout').className = 'layout-1col'; 
        sWrapper.style.display = 'none'; 
    }
}

/**
 * UTILITIES & ACTIONS
 */

function triggerAnimation(id, type) {
    const el = document.getElementById(id);
    if (!el) return;
    const cls = type === 'green' ? 'flash-green' : 'flash-red';
    el.classList.remove('flash-green', 'flash-red');
    void el.offsetWidth; // trigger reflow
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 1000);
}

function updateClassState(key, index, value) { if (!state[key]) state[key] = []; state[key][index] = value; saveState(); render(); }
function updateBgSpell(val) { state.bgSpell = val; saveState(); render(); }
function adjRes(id, amt, max, isAbsolute = false) { 
    let oldVal = state.resourceValues[id] || 0;
    state.resourceValues[id] = Math.min(max||999, Math.max(0, isAbsolute ? amt : oldVal + amt)); 
    saveState(); render(); 
}

function addQuickItem(cat, key) { 
    let t = ITEM_TEMPLATES.data[key]; 
    if (!t) return;
    state.gold = (parseInt(document.getElementById('gold').value) || 0) - (t.cost || 0);
    document.getElementById('gold').value = state.gold;
    state.inventory.push({ 
        id: Date.now(), name: t.name, type: t.type, slots: t.slots, equipped: t.equipped, 
        dmgDice: t.dmgDice||'1d6', stat: t.stat||'str', props: t.props||'', 
        armor: t.armor||0, armorType: t.armorType||'light', dexMax: t.dexMax, cost: t.cost || 0 
    }); 
    saveState(); render(); 
}

function addItem() { 
    state.inventory.push({ 
        id: Date.now(), name: 'New Item', type: 'misc', slots: 1, equipped: false, 
        dmgDice: '1d6', stat: 'str', props: '', armor: 1, armorType: 'light', cost: 0, isCustom: true
    }); 
    saveState(); render(); 
}

function deleteItem(id) { 
    let item = state.inventory.find(i => i.id === id);
    if(item) {
        state.gold = (parseInt(document.getElementById('gold').value) || 0) + (item.cost || 0);
        document.getElementById('gold').value = state.gold;
    }
    state.inventory = state.inventory.filter(i => i.id !== id); 
    saveState(); render(); 
}

function updateItem(id, field, val, check = false) { 
    let item = state.inventory.find(i => i.id === id); 
    if(item) { item[field] = check ? val : (field==='slots'||field==='armor'||field==='cost'?parseFloat(val):val); saveState(); render(); } 
}

function toggleCondition(id) { if (state.activeConditions.includes(id)) state.activeConditions = state.activeConditions.filter(c => c !== id); else state.activeConditions.push(id); saveState(); render(); }
function updateSkill(id, val) { state.skills[id] = Math.max(0, parseInt(val) || 0); saveState(); render(); }

function adjHP(a, isAbsolute = false) {
    const max = CLASS_CONFIG.baseHp + ((state.level - 1) * CLASS_CONFIG.hpPerLevel);
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
        if (dmg > 0) {
            state.hpCurrent = Math.max(0, oldHP - dmg);
        }
    } else {
        state.hpCurrent = Math.min(max, oldHP + a);
    }

    if (state.hpCurrent > oldHP) triggerAnimation('displayCurrentHP', 'green');
    else if (state.hpCurrent < oldHP) triggerAnimation('displayCurrentHP', 'red');

    saveState(); render();
}
function adjTempHP(a, isAbsolute = false) { 
    state.tempHP = Math.max(0, isAbsolute ? a : (state.tempHP||0) + a); 
    saveState(); render(); 
}

function adjHD(a, isAbsolute = false) { 
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    let max = state.level + (ancFeat?.modHD || 0); 
    state.hdCurrent = Math.min(max, Math.max(0, isAbsolute ? a : (state.hdCurrent===null?max:state.hdCurrent) + a)); 
    saveState(); render(); 
}
function handleWoundClick(i) { state.wounds = (state.wounds === i + 1) ? i : i + 1; saveState(); render(); }

window.addEventListener('wheel', (e) => { 
    if (e.target.type === 'number') { 
        e.preventDefault(); 
        let d = e.deltaY < 0 ? 1 : -1; 
        
        // Directly trigger the correct state update using relative changes
        if (e.target.id === 'displayCurrentHP') adjHP(d, false);
        else if (e.target.id === 'displayTempHP') adjTempHP(d, false);
        else if (e.target.id === 'displayHD') adjHD(d, false);
        else {
            let val = parseInt(e.target.value || 0) + d;
            let min = e.target.hasAttribute('min') ? parseInt(e.target.getAttribute('min')) : -Infinity;
            let max = e.target.hasAttribute('max') ? parseInt(e.target.getAttribute('max')) : Infinity;
            let newVal = Math.min(max, Math.max(min, val));
            e.target.value = newVal;
            e.target.dispatchEvent(new Event('change'));
        }
    } 
}, { passive: false });

/**
 * PORTABILITY & SAVING
 */
function exportCharacter() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.charName || 'Hero'}_${CLASS_CONFIG.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importCharacter(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            Object.assign(state, imported);
            saveState();
            render();
            alert("Character imported successfully!");
        } catch (err) {
            alert("Error importing character: Invalid file format.");
        }
    };
    reader.readAsText(file);
}

const debounce = (fn, ms) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), ms);
    };
};

const debouncedSaveAndRender = debounce(() => { saveState(); render(); }, 300);

document.addEventListener('DOMContentLoaded', () => { 
    loadState(); 
    render(); 
    document.querySelectorAll('input, select').forEach(el => { 
        el.addEventListener('change', () => { saveState(); render(); }); 
        el.addEventListener('input', debouncedSaveAndRender); 
    }); 
});