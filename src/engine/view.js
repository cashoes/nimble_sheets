/**
 * @fileoverview UI RENDERING ENGINE MODULE
 * Handles the generation and updates of the tracker's HTML interface
 * based on the current character state and class configuration.
 */

/**
 * Renders the top identity header including Armor, Size, Speed, and Initiative.
 * @param {Object} derived - Derived character data.
 * @param {number} armorVal - Calculated armor value.
 * @param {number} init - Initiative modifier.
 * @param {Object} state - Current character state.
 * @param {Object} config - Class configuration.
 */
function renderHeader(derived, armorVal, init, state, config) {
    let leftStats = `<div class="header-stat"><label style="color:var(--gold-light)">Armor</label><div class="header-stat-val" style="color:var(--gold-light)">${armorVal}</div></div>`;

    if (config.customHeaderStats) {
        config.customHeaderStats
            .filter(stat => stat.position === 'left')
            .forEach(stat => {
                if (stat.isVisible(stateObj.level, stateObj.subclass)) {
                    leftStats += `<div class="header-stat"><label style="color:${stat.color}">${stat.label}</label><div class="header-stat-val" style="color:${stat.color}">${stat.getValue(derived)}</div></div>`;
                }
            });
    }

    const headerLeft = document.getElementById('headerLeftStats');
    if (headerLeft) {
        headerLeft.innerHTML = leftStats;
    }

    const ancestryFeat = ANCESTRY_FEATURES[stateObj.ancestry];
    const hasInitAdv = (ancestryFeat && ancestryFeat.modInitAdv) || derived.initAdv;
    const initAdvIcon = hasInitAdv ? '<span style="font-size:0.5em; vertical-align:middle; color:var(--save-adv); margin-left:2px;">▲</span>' : '';
    const initNotation = `1d20${init >= 0 ? '+' : ''}${init}`;

    const headerRight = document.getElementById('headerRightStats');
    if (headerRight) {
        headerRight.innerHTML = `
            <div class="header-stat"><label>Size</label><div class="header-stat-val">${derived.size}</div></div>
            <div class="header-stat"><label>Speed</label><div class="header-stat-val">${derived.speed}</div></div>
            <div class="header-stat"><label class="roll-link" onclick="dispatchRoll('${initNotation}', 'Initiative', { forceAdv: ${!!hasInitAdv} })">Init</label>
                <div class="header-stat-val roll-link" onclick="dispatchRoll('${initNotation}', 'Initiative', { forceAdv: ${!!hasInitAdv} })">
                    ${init >= 0 ? "+" : ""}${init}${initAdvIcon}
                </div>
            </div>`;
    }

    renderModField();
}

/**
 * Renders the core attribute cards and handles point-buy overspent checks.
 * @param {number} level - Current character level.
 * @param {Object} statsMap - Current attribute map.
 * @param {Object} derived - Derived statistics.
 */
function renderAttributes(level, statsMap, derived) {
    ['str', 'dex', 'int', 'wil'].forEach(stat => {
        const card = document.getElementById(`statCard_${stat}`);
        if (card) {
            if (CLASS_CONFIG.keyStats.includes(stat)) {
                card.classList.add('key-stat');
            } else {
                card.classList.remove('key-stat');
            }

            card.classList.remove('save-adv', 'save-dis');
            let baseAdv = 0;
            if (CLASS_CONFIG.saves.adv === stat) baseAdv = 1;
            if (CLASS_CONFIG.saves.dis === stat) baseAdv = -1;

            const currentTotalAdv = baseAdv + (derived.allSaveAdv ? 1 : 0) + (derived.allSaveDis ? -1 : 0);
            if (currentTotalAdv > 0) card.classList.add('save-adv');
            else if (currentTotalAdv < 0) card.classList.add('save-dis');

            card.setAttribute('onclick', `dispatchRoll('1d20+${statsMap[stat]}', '${stat.toUpperCase()} Save', { inherentAdv: ${baseAdv} })`);
            card.style.cursor = 'pointer';
        }
    });

    if (document.getElementById('displayStr')) {
        document.getElementById('displayStr').innerText = statsMap.str;
    }
    if (document.getElementById('displayDex')) {
        document.getElementById('displayDex').innerText = statsMap.dex;
    }
    if (document.getElementById('displayInt')) {
        document.getElementById('displayInt').innerText = statsMap.int;
    }
    if (document.getElementById('displayWil')) {
        document.getElementById('displayWil').innerText = statsMap.wil;
    }

    // 1. Base Attribute Locking (Level 1 only)
    const isLevel1 = level === 1;
    ['Str', 'Dex', 'Int', 'Wil'].forEach(s => {
        const bEl = document.getElementById(`base${s}`);
        if (bEl) {
            bEl.disabled = !isLevel1;
            bEl.style.opacity = isLevel1 ? '1' : '0.6';
            bEl.style.cursor = isLevel1 ? 'text' : 'not-allowed';
            bEl.title = isLevel1 ? '' : 'Base stats can only be modified at Level 1.';
        }
    });

    // 2. Bonus Attribute Budgets
    let keyAllowed = Math.min(4, Math.floor(level / 4));
    let secondaryAllowed = Math.min(4, Math.floor((level - 1) / 4));
    let flexAllowed = (level >= 20) ? 2 : 0;

    let keySpent = 0;
    let secondarySpent = 0;

    CLASS_CONFIG.keyStats.forEach(stat => {
        keySpent += stateObj[`add${stat.charAt(0).toUpperCase() + stat.slice(1)}`];
    });

    ['str', 'dex', 'int', 'wil']
        .filter(stat => !CLASS_CONFIG.keyStats.includes(stat))
        .forEach(stat => {
            secondarySpent += stateObj[`add${stat.charAt(0).toUpperCase() + stat.slice(1)}`];
        });

    let flexSpent = Math.max(0, keySpent - keyAllowed) + Math.max(0, secondarySpent - secondaryAllowed);

    document.querySelectorAll('.core-stat-inputs input[id^="add"]').forEach(el => el.classList.remove('error-glow'));

    const unspentLabel = document.getElementById('unspentStats');
    if (unspentLabel) {
        if (flexSpent > flexAllowed) {
            unspentLabel.innerHTML = `<span style='color:var(--save-dis)'>OVERSPENT: ${flexAllowed - flexSpent} Pts</span>`;
            document.querySelectorAll('.core-stat-inputs input[id^="add"]').forEach(el => el.classList.add('error-glow'));
        } else {
            unspentLabel.innerHTML = `<span style='color:var(--class-accent)'>UNSPENT: ${Math.max(0, keyAllowed - keySpent)} Key, ${Math.max(0, secondaryAllowed - secondarySpent)} Sec${level >= 20 ? `, ${flexAllowed - flexSpent} Flex` : ''}</span>`;
        }
    }

    // 3. Dynamic Proficiencies (v2.2.5)
    if (document.getElementById('profArmor')) {
        document.getElementById('profArmor').innerText = derived.profArmor || (CLASS_CONFIG.proficiencies ? CLASS_CONFIG.proficiencies.armor : "--");
    }
    if (document.getElementById('profWeapons')) {
        document.getElementById('profWeapons').innerText = derived.profWeapons || (CLASS_CONFIG.proficiencies ? CLASS_CONFIG.proficiencies.weapons : "--");
    }
}

/**
 * Renders resource rows including Wounds, Hit Dice, and class-specific resources.
 * @param {number} level - Current level.
 * @param {Object} derived - Derived statistics.
 * @param {Object} statsMap - Current attribute map.
 * @param {number} hdFace - Hit Die faces (e.g., 10 for d10).
 */
function renderResources(level, derived, statsMap, hdFace) {
    const hitDieLabel = document.getElementById('hitDiceLabel');
    if (hitDieLabel) {
        hitDieLabel.innerHTML = `<span class="roll-link" onclick="dispatchRoll('1d${hdFace}${statsMap.str >= 0 ? '+' : ''}${statsMap.str}', 'Hit Die Rest')">Hit Dice (d${hdFace})</span>`;
    }

    let woundsHtml = "";
    for (let i = 0; i < derived.woundMax; i++) {
        woundsHtml += `<input type="checkbox" class="pip wound" ${i < stateObj.wounds ? 'checked' : ''} onclick="handleWoundClick(${i})">`;
    }

    const woundsContainer = document.getElementById('woundsContainer');
    if (woundsContainer) {
        woundsContainer.innerHTML = woundsHtml;
    }

    let resourcesHtml = "";
    (CLASS_CONFIG.resources || []).forEach(resource => {
        if (resource.manual) {
            return;
        }

        let max = derived.resourceMaxes[resource.id];
        if (max <= 0) {
            return;
        }

        resourcesHtml += `
            <div class="res-row">
                <label>${resource.label}</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="res-val dark-incrementer">
                        <button onclick="adjRes('${resource.id}', -1)">-</button>
                        <input type="number" id="res_${resource.id}" value="${stateObj.resourceValues[resource.id]}" onchange="adjRes('${resource.id}', parseInt(this.value), ${max}, true)">
                        <button onclick="adjRes('${resource.id}', 1, ${max})">+</button>
                    </div>
                    <div class="max-text">/ <span style="color:var(--text-main);">${max}</span></div>
                </div>
            </div>`;
    });

    const dynamicResources = document.getElementById('dynamicResourcesContainer');
    if (dynamicResources) {
        dynamicResources.innerHTML = resourcesHtml;
    }
}

/**
 * Renders an individual inventory row.
 * @param {Object} item - Item data object.
 * @param {Object} statsMap - Current attribute map.
 * @param {Function} iStats - Callback to parse stat tokens.
 * @returns {string} HTML string for the row.
 */
function renderInventoryRow(item, statsMap, iStats) {
    let effectHtml = '-';
    if (item.type === 'weapon' && item.equipped) {
        const totalMod = statsMap[item.stat];
        const notation = `${item.dmgDice}${totalMod >= 0 ? '+' : ''}${totalMod}`;
        const label = item.name.replace(/'/g, "\\'");
        effectHtml = `<span class="roll-link" onclick="dispatchRoll('${notation}', '${label}', { stat: '${item.stat}', type: 'attack' })">⚔️ ${notation}</span>`;
    } else if (item.type === 'armor' && item.equipped) {
        const dexMax = item.armorType === 'light' ? 99 : (item.armorType === 'medium' ? 2 : 0);
        const finalAC = (parseInt(item.armor) || 0) + Math.min(statsMap.dex, dexMax);
        effectHtml = `🛡️ ${finalAC} AC`;
    } else if (item.type === 'shield' && item.equipped) {
        effectHtml = `🛡️ +${item.armor} AC`;
    }

    let typeCell = `<div style="font-size:0.9em; color:var(--text-muted); text-transform:capitalize; text-align:left; min-height:26px; display:flex; align-items:center; padding:2px 0; line-height:1.2;">${item.type === 'armor' ? (item.armorType || '') + ' ' : ''}${item.type}</div>`;
    let dexDisplay = `<span class="stat-hl">${statsMap.dex >= 0 ? '+' : ''}${statsMap.dex}</span> DEX`;
    let statsContent = '-';

    if (item.type === 'weapon') {
        const statVal = statsMap[item.stat];
        statsContent = `${item.dmgDice} (<span class="stat-hl">${statVal >= 0 ? '+' : ''}${statVal}</span> ${item.stat.toUpperCase()})`;
    } else if (item.type === 'armor') {
        if (item.armorType === 'light') {
            statsContent = `+${item.armor} (${dexDisplay})`;
        } else if (item.armorType === 'medium') {
            statsContent = `+${item.armor} max(${dexDisplay}, 2)`;
        } else {
            statsContent = `+${item.armor}`;
        }
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
        <div style="font-weight:bold; color:var(--class-accent); display:flex; justify-content:center; align-items:center; min-height:26px;">${effectHtml}</div>
        <div style="display:flex; justify-content:center; align-items:center; min-height:26px;"><button onclick="deleteItem(${item.id})" style="background:none; border:none; color:var(--save-dis); cursor:pointer;">×</button></div>
    </div>`;
}

/**
 * Renders the inventory table and slot counter.
 * @param {Object} statsMap - Current attribute map.
 * @param {number} armorVal - Calculated armor value.
 * @param {number} str - Strength value for slot calculation.
 * @param {Function} iStats - Callback to parse stat tokens.
 */
function renderInventory(statsMap, armorVal, str, iStats) {
    let maxSlots = 10 + str;
    let slotsUsed = 0;
    stateObj.inventory.forEach(item => {
        slotsUsed += (parseFloat(item.slots) || 0);
    });

    let html = `
        <div class="inv-header">
            <div></div>
            <div>Item</div>
            <div>Type</div>
            <div>Description</div>
            <div style="text-align:center;">GP</div>
            <div style="text-align:center;">Wt</div>
            <div style="text-align:center;">Stats</div>
            <div style="text-align:center;">Effect</div>
            <div></div>
        </div>`;

    html += stateObj.inventory.map(item => renderInventoryRow(item, statsMap, iStats)).join('');

    const inventoryContainer = document.getElementById('inventoryContainer');
    if (inventoryContainer) {
        inventoryContainer.innerHTML = html;
    }

    document.querySelectorAll('#inventoryContainer textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    const slotIndicator = document.getElementById('inventorySlots');
    if (slotIndicator) {
        slotIndicator.innerHTML = `SLOTS: <span style="color:${slotsUsed > maxSlots ? 'var(--save-dis)' : 'var(--class-accent)'}">${slotsUsed} / ${maxSlots}</span>`;
    }
}

/**
 * Renders the skills grid and calculates available points.
 * @param {number} level - Current level.
 * @param {Object} statsMap - Current attribute map.
 * @param {Object} passMods - Passive skill modifiers.
 */
function renderSkills(level, statsMap, passMods) {
    let totalPoints = 3 + level;
    let spentPoints = 0;

    SKILL_LIST.forEach(skill => {
        let points = stateObj.skills[skill.id] || 0;
        let base = statsMap[skill.stat] + passMods[skill.id];
        points = Math.min(12 - base, Math.max(Math.min(0, -base), points));
        stateObj.skills[skill.id] = points;
        spentPoints += points;
    });

    let skillsHtml = `
        <div class="skill-header">
            <span>SKILLS</span>
            <span style="color:${(totalPoints - spentPoints) < 0 ? 'var(--save-dis)' : 'var(--class-accent)'}">UNSPENT: ${totalPoints - spentPoints}</span>
        </div>
        <div class="skills-grid">`;

    SKILL_LIST.forEach(skill => {
        let totalMod = statsMap[skill.stat] + (stateObj.skills[skill.id] || 0) + passMods[skill.id];
        skillsHtml += `
            <div class="skill-row">
                <div class="skill-name">${skill.name} <span class="skill-stat">${skill.stat.toUpperCase()}</span></div>
                <div class="skill-pts"><input type="number" value="${stateObj.skills[skill.id] || 0}" onchange="updateSkill('${skill.id}', this.value)"></div>
                <div class="skill-total roll-link" onclick="dispatchRoll('1d20${totalMod >= 0 ? '+' : ''}${totalMod}', '${skill.name} Skill Check')">${totalMod >= 0 ? '+' : ''}${totalMod}</div>
            </div>`;
    });

    const skillsContainer = document.getElementById('skillsContainer');
    if (skillsContainer) {
        skillsContainer.innerHTML = skillsHtml + `</div>`;
    }
}

/**
 * Renders condition toggle buttons.
 */
function renderConditions(derived) {
    let conditionsHtml = "";
    const extraConditions = (config.getExtraConditions ? config.getExtraConditions(stateObj.level, stateObj.subclass, stateObj, derived) : []) || [];
    const allConditions = [...CONDITIONS_LIST, ...extraConditions];

    allConditions.forEach(condition => {
        const isActive = condition.id === 'bloodied' ? derived.isBloodied : stateObj.activeConditions.includes(condition.id);
        conditionsHtml += `<div class="condition-btn ${condition.type} ${isActive ? 'active' : ''}" title="${condition.desc}" onclick="toggleCondition('${condition.id}')">${condition.name}</div>`;
    });

    const container = document.getElementById('conditionsContainer');
    if (container) {
        container.innerHTML = conditionsHtml;
    }
}

/**
 * Renders a single spell card HTML.
 * @param {Object} spell - Spell data.
 * @param {number} level - Current character level.
 * @param {Object} statsMap - Current attribute map.
 * @param {Object} [contextOverride=null] - Optional roll context.
 * @returns {string} HTML string for the card.
 */
function renderSingleSpellCard(spell, level, statsMap, contextOverride = null) {
    const schoolClass = (spell.school || "").toLowerCase();
    const isCantrip = (spell.tier || "").toLowerCase().includes("cantrip") || spell.name === "Vicious Mockery";
    const context = contextOverride || (isCantrip ? { type: 'cantrip', name: spell.name, school: spell.school } : { name: spell.name });
    const description = spell.customHtml ? spell.customHtml : (spell.desc ? iStats(spell.desc, level, statsMap, context) : "");

    return `
        <div class="spell-card ${schoolClass}" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            <h4>${spell.name ? `${spell.name} ` : ""}<span class="tier-tag">${formatPips(spell.tier, spell.school)}</span></h4>
            <div class="spell-desc" style="font-size: 0.85em;">${description}</div>
        </div>`;
}

/**
 * Renders the complete spells section.
 * @param {number} level - Current level.
 * @param {string} subclass - Selected subclass.
 * @param {Object} state - Current character state.
 * @param {Object} derived - Derived statistics.
 * @param {Function} iStats - Callback to parse stat tokens.
 * @returns {string} HTML string for the spells column.
 */
function renderSpells(level, subclass, state, derived, config, iStats) {
    let spells = [];
    if (config.getAvailableSpells) {
        spells = config.getAvailableSpells(level, subclass, state, derived);
    }

    if (!spells || spells.length === 0) {
        return "";
    }

    const tierOrder = { "Utility": 0, "Cantrip": 1, "Tier 1": 2, "Tier 2": 3, "Tier 3": 4, "Tier 4": 5, "Tier 5": 6, "Tier 6": 7, "Tier 7": 8, "Tier 8": 9, "Tier 9": 10 };

    spells.sort((a, b) => {
        let aOrder = tierOrder[a.tier] ?? 99;
        let bOrder = tierOrder[b.tier] ?? 99;
        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        if (a.school !== b.school) {
            return (a.school || "").localeCompare(b.school || "");
        }
        return (a.name || "").localeCompare(b.name || "");
    });

    return spells.map(spell => renderSingleSpellCard(spell, level, derived.statsMap)).join("");
}

/**
 * Master render function that updates the entire UI based on current state.
 * @param {Object} stateObj - Current character state.
 * @param {Object} config - Class configuration.
 */
function render(stateObj, config) {
    const derived = computeDerived(stateObj);
    const { level, statsMap, armor, initiative, speed, hdFace, maxHP, hdMax, woundMax, maxActions, maxTier, passMods } = derived;

    const subclassSelect = document.getElementById('subclass');
    if (level < 3) {
        if (subclassSelect && subclassSelect.value !== "None") {
            subclassSelect.value = "None";
            stateObj.subclass = "None";
        }
        if (subclassSelect) {
            subclassSelect.disabled = true;
        }
    } else {
        if (subclassSelect) {
            subclassSelect.disabled = false;
        }
    }

    const subConfig = config.subclasses.find(s => s.value === stateObj.subclass);
    document.documentElement.style.setProperty('--subclass-accent', (subConfig && subConfig.accent) ? subConfig.accent : 'var(--class-accent)');

    const mechanicPanel = document.getElementById('classMechanicPanel');
    if (config.getMechanicPanelHTML && mechanicPanel) {
        mechanicPanel.innerHTML = config.getMechanicPanelHTML(level, stateObj.subclass, stateObj, derived);
    }

    for (let i = 0; i < 3; i++) {
        const pip = document.getElementById(`action${i + 1}`);
        if (pip) {
            pip.disabled = (i >= maxActions);
            pip.style.opacity = (i >= maxActions) ? '0.2' : '1';
            pip.style.cursor = (i >= maxActions) ? 'not-allowed' : 'pointer';
            if (i >= maxActions && pip.checked) {
                pip.checked = false;
                if (stateObj.actionsSpent > i) {
                    stateObj.actionsSpent = i;
                }
            }
        }
    }

    const currentHPEl = document.getElementById('displayCurrentHP');
    const tempHPEl = document.getElementById('displayTempHP');
    const currentHDEl = document.getElementById('displayHD');

    if (currentHPEl && document.activeElement !== currentHPEl) {
        currentHPEl.value = stateObj.hpCurrent;
    }
    if (tempHPEl && document.activeElement !== tempHPEl) {
        tempHPEl.value = stateObj.tempHP || 0;
    }
    if (currentHDEl && document.activeElement !== currentHDEl) {
        currentHDEl.value = stateObj.hdCurrent;
    }

    const maxHPEl = document.getElementById('displayMaxHP');
    if (maxHPEl) {
        maxHPEl.innerText = maxHP;
    }
    const maxHDEl = document.getElementById('maxHD');
    if (maxHDEl) {
        maxHDEl.innerText = hdMax;
    }

    const parseStatsBound = (txt, l, sm, ctx) => iStats(txt, l || level, sm || statsMap, ctx || {});
    const buildFeatureHtmlBound = (title, lTag, desc, theme = "", skip = false, l2, sm, ctx) => buildFeatureHtml(title, lTag, desc, theme, skip, l2 || level, sm || statsMap, ctx || {});

    renderHeader(derived, armor, initiative, stateObj, config);
    renderAttributes(level, statsMap, derived);
    renderResources(level, derived, statsMap, hdFace);
    renderInventory(statsMap, armor, statsMap.str, parseStatsBound);
    renderSkills(level, statsMap, passMods);
    renderConditions(derived);

    const minorToggle = document.getElementById('toggleMinorFeatures');
    if (minorToggle) {
        minorToggle.checked = stateObj.showMinor || false;
    }
    document.body.classList.toggle('show-minor', stateObj.showMinor);

    let featuresHtml = config.getFeaturesHTML(level, stateObj.subclass, stateObj, derived, buildFeatureHtmlBound, parseStatsBound, formatPips, renderSingleSpellCard);

    // Add background and ancestry features to the top
    featuresHtml = renderBackgroundFeature(stateObj, level, statsMap, parseStatsBound, buildFeatureHtmlBound, renderSingleSpellCard) + featuresHtml;
    featuresHtml = renderAncestryFeature(stateObj, buildFeatureHtmlBound) + featuresHtml;

    const featuresContainer = document.getElementById('featuresContainer');
    if (featuresContainer) {
        featuresContainer.innerHTML = featuresHtml;
    }

    const maxTierEl = document.getElementById('maxTierDisplay');
    if (maxTierEl) {
        maxTierEl.innerText = maxTier > 0 ? `(Max Tier: ${maxTier})` : "";
    }

    let spellsHtml = renderSpells(level, stateObj.subclass, stateObj, derived, config, parseStatsBound);
    const spellsWrapper = document.getElementById('spellsColWrapper');
    if (spellsHtml && spellsHtml.trim().length > 0) {
        if (document.getElementById('featuresSpellsLayout')) {
            document.getElementById('featuresSpellsLayout').className = 'layout-2col';
        }
        if (spellsWrapper) {
            spellsWrapper.style.display = 'block';
        }
        const spellsContainer = document.getElementById('spellsContainer');
        if (spellsContainer) {
            spellsContainer.innerHTML = spellsHtml;
        }
    } else {
        if (document.getElementById('featuresSpellsLayout')) {
            document.getElementById('featuresSpellsLayout').className = 'layout-1col';
        }
        if (spellsWrapper) {
            spellsWrapper.style.display = 'none';
        }
    }
}

