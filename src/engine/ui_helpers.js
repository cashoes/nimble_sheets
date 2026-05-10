/**
 * UI HELPERS MODULE
 * A collection of utility functions for handling UI interactions,
 * animations, theme application, and complex dice pool mechanics.
 */

/**
 * Renders the primary combat modifier selector (Advantage/Disadvantage).
 */
function renderModField() {
    const displayValue = state.advantage === 0 ? 'Normal' : (state.advantage > 0 ? 'Adv +' + state.advantage : 'Dis ' + state.advantage);
    const statusClass = state.advantage > 0 ? 'positive' : (state.advantage < 0 ? 'negative' : '');
    
    const html = `
        <div class="advantage-controls">
            <button class="adv-btn" onclick="adjAdv(-1)">-</button>
            <div id="advDisplay" class="adv-val ${statusClass}">${displayValue}</div>
            <button class="adv-btn" onclick="adjAdv(1)">+</button>
        </div>`;
        
    const container = document.getElementById('combatControlsContainer');
    if (container) { 
        container.innerHTML = html; 
    }
}

/**
 * Adjusts the global Advantage/Disadvantage level.
 */
function adjAdv(amt) { 
    state.advantage = Math.min(3, Math.max(-3, state.advantage + amt)); 
    renderModField(); 
    saveState(); 
}

/**
 * Formats spell tier string into graphical pips or utility label.
 * @param {string} tier - The tier name (e.g., "Tier 3", "Utility").
 * @param {string} school - The magic school (for coloring).
 * @returns {string} HTML string containing pips or text.
 */
function formatPips(tier, school) {
    if (!tier) return "";
    if (tier.toLowerCase().includes('utility')) return "Utility";
    if (tier.toLowerCase().includes('cantrip')) return "Cantrip";
    
    const tierNum = parseInt(tier.replace(/\D/g, '')) || 0;
    let pips = "";
    for (let i = 0; i < tierNum; i++) {
        pips += "●";
    }
    return pips;
}

/**
 * Toggles an action point on the tracker.
 */
function toggleAction(idx) { 
    state.actionsSpent = (state.actionsSpent > idx) ? idx : idx + 1; 
    for (let i = 0; i < 3; i++) { 
        const ap = document.getElementById(`action${i + 1}`); 
        if (ap) ap.checked = (state.actionsSpent > i); 
    } 
    saveState(); 
}

/**
 * Applies a CSS theme object to the document root.
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
 * Triggers a color-flash animation on a specific element.
 */
function triggerAnimation(id, type) { 
    const el = document.getElementById(id); 
    if (!el) return; 
    const cls = type === 'green' ? 'flash-green' : 'flash-red'; 
    el.classList.remove('flash-green', 'flash-red'); 
    void el.offsetWidth; // Force reflow
    el.classList.add(cls); 
    setTimeout(() => el.classList.remove(cls), 1000); 
}

/**
 * Updates a multi-selection state array at a specific index.
 */
function updateClassState(key, index, value) { 
    if (!state[key]) state[key] = []; 
    state[key][index] = value; 
    saveState(); 
    render(); 
}

/**
 * Toggles circular "pip" indicators in feature cards.
 */
function toggleBgPip(key, idx) { 
    const val = state[key] || 0; 
    state[key] = (val === idx + 1) ? idx : idx + 1; 
    saveState(); 
    render(); 
}

/** Updates a generic choice state key and refreshes UI. */
function updateBgChoice(key, val) { 
    state[key] = val; 
    saveState(); 
    render(); 
}

/** Updates the background spell selection. */
function updateBgSpell(val) { 
    state.bgSpell = val; 
    saveState(); 
    render(); 
}

/**
 * Adjusts a class-specific resource (Mana, Lay on Hands, etc.).
 */
function adjRes(id, amt, max, isAbsolute = false) { 
    let oldVal = state.resourceValues[id] || 0; 
    state.resourceValues[id] = Math.min(max || 999, Math.max(0, isAbsolute ? amt : oldVal + amt)); 
    saveState(); 
    render(); 
}

/**
 * Spawns a pre-defined item from the template library.
 */
function addQuickItem(cat, key) {
    let t = ITEM_TEMPLATES.data[key];
    if (!t) return;
    
    state.gold -= (t.cost || 0);
    if (document.getElementById('gold')) {
        document.getElementById('gold').value = state.gold;
    }
    
    state.inventory.push({ 
        id: Date.now(), 
        name: t.name, 
        type: t.type, 
        slots: t.slots, 
        equipped: t.equipped, 
        dmgDice: t.dmgDice || '1d6', 
        stat: t.stat || 'str', 
        props: t.props || '', 
        armor: t.armor || 0, 
        armorType: t.armorType || (t.type === 'armor' ? 'light' : ''), 
        cost: t.cost || 0 
    });
    
    saveState(); 
    render();
}

/** Spawns a blank custom item in the inventory. */
function addItem() { 
    state.inventory.push({ 
        id: Date.now(), 
        name: 'New Item', 
        type: 'misc', 
        slots: 1, 
        equipped: false, 
        dmgDice: '1d6', 
        stat: 'str', 
        props: '', 
        armor: 1, 
        armorType: '', 
        cost: 0, 
        isCustom: true 
    }); 
    saveState(); 
    render(); 
}

/**
 * Deletes an item and refunds its value if possible.
 */
function deleteItem(id) {
    let item = state.inventory.find(i => i.id === id);
    if (item) {
        state.gold += (item.cost || 0);
        if (document.getElementById('gold')) {
            document.getElementById('gold').value = state.gold;
        }
    }
    state.inventory = state.inventory.filter(i => i.id !== id);
    saveState(); 
    render();
}

/** Updates a specific field of an inventory item. */
function updateItem(id, field, val, check = false) { 
    let item = state.inventory.find(i => i.id === id); 
    if (item) { 
        item[field] = check ? val : (field === 'slots' || field === 'armor' || field === 'cost' ? parseFloat(val) : val); 
        saveState(); 
        render(); 
    } 
}

/** Toggles a condition (Blinded, Burned, etc.) on the character. */
function toggleCondition(id) { 
    if (state.activeConditions.includes(id)) {
        state.activeConditions = state.activeConditions.filter(c => c !== id);
    } else {
        state.activeConditions.push(id);
    }
    saveState(); 
    render(); 
}

/** Updates a skill proficiency level. */
function updateSkill(id, val) { 
    state.skills[id] = parseInt(val) || 0; 
    saveState(); 
    render(); 
}

/**
 * Adjusts character HP, handling damage, healing, and Temp HP absorption.
 */
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
        if (dmg > 0) {
            state.hpCurrent = Math.max(0, oldHP - dmg);
        }
    } else {
        state.hpCurrent = Math.min(max, oldHP + a);
    }
    
    if (state.hpCurrent > oldHP) {
        triggerAnimation('displayCurrentHP', 'green');
    } else if (state.hpCurrent < oldHP) {
        triggerAnimation('displayCurrentHP', 'red');
    }
    
    saveState(); 
    render();
}

/** Adjusts Temp HP total. */
function adjTempHP(a, isAbsolute = false) {
    state.tempHP = Math.max(0, isAbsolute ? a : (state.tempHP || 0) + a);
    saveState(); 
    render();
}

/** Adjusts current Hit Dice pool. */
function adjHD(a, isAbsolute = false) {
    const derived = computeDerived(state);
    const max = derived.hdMax;
    state.hdCurrent = Math.min(max, Math.max(0, isAbsolute ? a : (state.hdCurrent === null ? max : state.hdCurrent) + a));
    saveState(); 
    render();
}

/** Toggles wound status pips. */
function handleWoundClick(i) { 
    state.wounds = (state.wounds === i + 1) ? i : i + 1; 
    saveState(); 
    render(); 
}

/**
 * Recursive die roller with support for exploding dice.
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

/**
 * Adds a die to a specified pool.
 */
function addPoolDie(key, max, faces) {
    if (!state[key]) state[key] = [];

    const allowExplode = (key === 'furyDice' && state.furyBoom === 'BOOM') ||
        (key === 'judgmentDice' && state.judgmentBoom === 'BOOM');
    const roll = _rollDie(faces, allowExplode);

    const emptyIdx = state[key].findIndex(d => d === null);
    if (emptyIdx !== -1) {
        state[key][emptyIdx] = roll;
    } else if (state[key].length < max) {
        state[key].push(roll);
    }

    saveState(); 
    render();
}

/**
 * Removes a die from a pool.
 */
function removePoolDie(key, idx, isStatic = false) {
    if (!state[key]) return;
    if (isStatic) {
        state[key][idx] = null;
    } else {
        state[key].splice(idx, 1);
    }
    saveState(); 
    render();
}

/** Clears an entire dice pool. */
function clearPool(key) {
    state[key] = [];
    saveState(); 
    render();
}

/** Manually sets a die to its maximum possible value. */
function maximizePoolDie(key, idx, faces) {
    if (!state[key] || !state[key][idx]) return;
    state[key][idx].total = faces;
    state[key][idx].detail = `${faces} (Maxed)`;
    saveState(); 
    render();
}

/**
 * Rolls an entire pool at once.
 */
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
    saveState(); 
    render();
}
