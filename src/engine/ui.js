/**
 * @fileoverview UI TOOLKIT MODULE
 * Provides a fluent API for building mechanic panels and a collection of 
 * utility functions for animations, themes, and complex UI interactions.
 */

/**
 * Class for building class mechanic panels with resources, dice pools, and stat displays.
 * Refactored for SolidJS: now returns structured data instead of HTML strings.
 */
class MechanicPanelBuilder {
    constructor() {
        this.sections = [];
    }

    _addSection(type, props, { flex = 1, minWidth = null, align = 'center' } = {}) {
        this.sections.push({ type, props, flex, minWidth, align });
    }

    addResource(id, label, value, max, options = {}) {
        const visible = options.visible !== false;
        if (!visible || max <= 0) return this;
        this._addSection('Resource', { id, label, value, max, options }, { flex: 1 });
        return this;
    }

    addRollDisplay(notation, label, display, subtext = '', rollContext = {}) {
        this._addSection('Roll', { notation, label, display, subtext, rollContext }, { flex: 1 });
        return this;
    }

    addDicePool(dice, label, faces, stateKey, maxDice = 99, options = {}) {
        this._addSection('DicePool', { dice, label, faces, stateKey, maxDice, options }, { flex: 1.5, align: 'stretch' });
        return this;
    }

    addStatDisplay(value, label, subtext = '', options = {}) {
        this._addSection('Stat', { value, label, subtext, options }, { minWidth: 80 });
        return this;
    }

    addToggleDisplay(id, label, options, stateKey) {
        this._addSection('Toggle', { id, label, options, stateKey }, { flex: 1.2 });
        return this;
    }

    addSelectDisplay(id, label, options, current, subtext = '') {
        this._addSection('Select', { id, label, options, current, subtext }, { flex: 1.6 });
        return this;
    }

    /**
     * Add a combined roll and resource incrementer display (Shadowmancer minions, etc.)
     */
    addRollWithResource(notation, label, display, resourceId, resourceMax, options = {}) {
        this._addSection('RollWithResource', { notation, label, display, resourceId, resourceMax, options }, { flex: 1.2 });
        return this;
    }

    addHtml(html, options = {}) {
        this._addSection('Html', { html }, options);
        return this;
    }

    build(minHeight = 100) {
        return {
            minHeight,
            sections: this.sections
        };
    }
}

const PanelBuilder = MechanicPanelBuilder;

/**
 * Adjusts the global Advantage/Disadvantage level.
 */
function adjAdv(amt) {
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'advantage', value: Math.min(3, Math.max(-3, state.advantage + amt)) } });
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
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'actionsSpent', value: (state.actionsSpent > idx) ? idx : idx + 1 } });
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
    dispatch({ type: 'UPDATE_CLASS_STATE', payload: { key, index, value } });
}

/**
 * Toggles circular "pip" indicators in feature cards.
 */
function toggleBgPip(key, idx) {
    dispatch({ type: 'TOGGLE_BG_PIP', payload: { key, idx } });
}

/** Updates a generic choice state key and refreshes UI. */
function updateBgChoice(key, val) {
    dispatch({ type: 'SET_STATE_KEY', payload: { key, value: val } });
}

/** Updates the background spell selection. */
function updateBgSpell(val) {
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'bgSpell', value: val } });
}

/**
 * Adjusts a class-specific resource (Mana, Lay on Hands, etc.).
 */
function adjRes(id, amt, max, isAbsolute = false) {
    dispatch({ type: 'ADJ_RES', payload: { id, amount: amt, max, isAbsolute } });
}

/**
 * Spawns a pre-defined item from the template library.
 */
function addQuickItem(cat, key) {
    let t = ITEM_TEMPLATES.data[key];
    if (!t) return;

    dispatch({ type: 'ADD_QUICK_ITEM', payload: { itemData: t } });
}

/** Spawns a blank custom item in the inventory. */
function addItem() {
    dispatch({
        type: 'ADD_ITEM', payload: {
            item: {
                name: 'New Item',
                type: 'misc',
                category: 'Misc',
                slots: 1,
                equipped: false,
                dmgDice: '1d6',
                stat: 'str',
                reach: '1',
                props: '',
                armor: 0,
                armorType: 'light',
                cost: 0,
                isCustom: true
            }
        }
    });
}
/**
 * Deletes an item and refunds its value if possible.
 */
function deleteItem(id) {
    dispatch({ type: 'DELETE_ITEM', payload: { id } });
}

/** Updates a specific field of an inventory item. */
function updateItem(id, field, val, check = false) {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, field, val, check } });
}

/** Toggles a condition (Blinded, Burned, etc.) on the character. */
function toggleCondition(id) {
    dispatch({ type: 'TOGGLE_CONDITION', payload: { id } });
}

/** Updates a skill proficiency level. */
function updateSkill(id, val) {
    dispatch({ type: 'UPDATE_SKILL', payload: { id, val } });
}

/**
 * Adjusts character HP, handling damage, healing, and Temp HP absorption.
 */
function adjHP(a, isAbsolute = false) {
    dispatch({ type: 'ADJ_HP', payload: { amount: a, isAbsolute } });
}

/** Adjusts Temp HP total. */
function adjTempHP(a, isAbsolute = false) {
    dispatch({ type: 'ADJ_TEMP_HP', payload: { amount: a, isAbsolute } });
}

/** Adjusts current Hit Dice pool. */
function adjHD(a, isAbsolute = false) {
    dispatch({ type: 'ADJ_HD', payload: { amount: a, isAbsolute } });
}

/** Toggles wound status pips. */
function adjWounds(a, isAbsolute = false) {
    dispatch({ type: 'HANDLE_WOUND_CLICK', payload: { i: a, isAbsolute } });
}

/**
 * Recursive die roller with support for exploding dice and a minimum floor.
 */
function _rollDie(faces, allowExplode = false, floor = 1) {
    let total = Math.floor(Math.random() * faces) + 1;
    if (total < floor) total = floor;
    let detail = total.toString();

    if (allowExplode && total === faces) {
        const next = _rollDie(faces, true, floor);
        total += next.total;
        detail = `${detail}! + ${next.detail}`;
    }
    return { total, detail };
}

/**
 * Adds a die to a specified pool.
 */
function addPoolDie(key, max, faces) {
    if (!state[key]) state[key] = []; // Guard for reducer logic if needed
    const currentPool = state[key] || [];

    const allowExplode = (key === 'furyDice' && state.furyBoom === 'BOOM') ||
        (key === 'judgmentDice' && state.judgmentBoom === 'BOOM');

    let floor = 1;
    if (key === 'furyDice' && CLASS_CONFIG.name === 'Berserker' && state.level >= 20) {
        floor = 6;
    }

    const roll = _rollDie(faces, allowExplode, floor);

    const newDice = [...currentPool];
    const emptyIdx = newDice.findIndex(d => d === null);
    if (emptyIdx !== -1) {
        newDice[emptyIdx] = roll;
    } else if (newDice.length < max) {
        newDice.push(roll);
    }

    dispatch({ type: 'UPDATE_POOL', payload: { key, dice: newDice } });
}

/**
 * Removes a die from a pool.
 */
function removePoolDie(key, idx, isStatic = false) {
    const currentPool = state[key] || [];
    if (!currentPool.length) return;

    const newDice = [...currentPool];
    if (isStatic) {
        newDice[idx] = null;
    } else {
        newDice.splice(idx, 1);
    }
    dispatch({ type: 'UPDATE_POOL', payload: { key, dice: newDice } });
}

/** Clears an entire dice pool. */
function clearPool(key) {
    dispatch({ type: 'UPDATE_POOL', payload: { key, dice: [] } });
}

/** Manually sets a die to its maximum possible value. */
function maximizePoolDie(key, idx, faces) {
    const currentPool = state[key] || [];
    if (!currentPool[idx]) return;

    const newDice = [...currentPool];
    newDice[idx] = {
        total: faces,
        detail: `${faces} (Maxed)`
    };
    dispatch({ type: 'UPDATE_POOL', payload: { key, dice: newDice } });
}

/**
 * Rolls an entire pool at once.
 */
function rollPool(key, count, faces) {
    let finalDice = [];
    const hasAdv = (key === 'judgmentDice' && state.selectedDecrees?.includes("Reliable Justice"));
    const allowExplode = (key === 'furyDice' && state.furyBoom === 'BOOM') ||
        (key === 'judgmentDice' && state.judgmentBoom === 'BOOM');

    let floor = 1;
    if (key === 'furyDice' && CLASS_CONFIG.name === 'Berserker' && state.level >= 20) {
        floor = 6;
    }

    let rollCount = hasAdv ? count + 1 : count;

    for (let i = 0; i < rollCount; i++) {
        finalDice.push(_rollDie(faces, allowExplode, floor));
    }

    if (hasAdv) {
        let minVal = Math.min(...finalDice.map(d => d.total));
        let minIdx = finalDice.findIndex(d => d.total === minVal);
        finalDice.splice(minIdx, 1);
    }

    dispatch({ type: 'UPDATE_POOL', payload: { key, dice: finalDice } });
}
