/**
 * UI RENDERING ENGINE MODULE
 */
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
