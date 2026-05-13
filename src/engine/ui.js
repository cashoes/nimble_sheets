/**
 * @fileoverview UI TOOLKIT MODULE
 * Provides a fluent API for building mechanic panels and a collection of 
 * utility functions for animations, themes, and complex UI interactions.
 */

/**
 * Class for building class mechanic panels with resources, dice pools, and stat displays.
 */
class MechanicPanelBuilder {
    /**
     * Initializes a new instance of MechanicPanelBuilder.
     */
    constructor() {
        this.sections = [];
    }

    /**
     * Internal helper to add a section to the pool.
     * @param {string} html - Inner HTML of the section.
     * @param {Object} options - Layout options.
     * @private
     */
    _addSection(html, { flex = 1, minWidth = null, align = 'center' } = {}) {
        this.sections.push({ html, flex, minWidth, align });
    }

    /**
     * Add a resource section (mana, LoH, etc.)
     * @param {string} id - Resource ID.
     * @param {string} label - Display label.
     * @param {number} value - Current value.
     * @param {number} max - Maximum value.
     * @param {Object} [options={}] - Display options.
     * @returns {MechanicPanelBuilder} The builder instance.
     */
    addResource(id, label, value, max, options = {}) {
        const visible = options.visible !== false;
        if (!visible || max <= 0) {
            return this;
        }

        const html = `
            <label style="font-size: 0.65em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${label}</label>
            <div style="display: flex; align-items: center; gap: 4px;">
                <div class="dark-incrementer">
                    <button onclick="adjRes('${id}', -1, ${max})">-</button>
                    <input type="number" id="res_${id}" value="${value || 0}" onchange="adjRes('${id}', parseInt(this.value), ${max}, true)">
                    <button onclick="adjRes('${id}', 1, ${max})">+</button>
                </div>
                <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ <span style="color: var(--text-main);">${max}</span></div>
            </div>
            ${options.subtext ? `<div style="font-size: 0.55em; color: var(--text-muted); font-style: italic; margin-top: 2px;">${options.subtext}</div>` : ''}
        `;

        this._addSection(html, { flex: 1 });
        return this;
    }

    /**
     * Add a roll link display (Surge, Spirit damage, etc.)
     * @param {string} notation - Roll notation.
     * @param {string} label - Display label.
     * @param {string} display - Display value.
     * @param {string} [subtext=''] - Subtext below (e.g., "Regain on Init").
     * @param {Object} [rollContext={}] - Context for dispatchRoll.
     * @returns {MechanicPanelBuilder} The builder instance.
     */
    addRollDisplay(notation, label, display, subtext = '', rollContext = {}) {
        const contextStr = Object.keys(rollContext).length > 0
            ? `, ${JSON.stringify(rollContext).replace(/"/g, '&quot;')}`
            : '';

        const html = `
            <label class="roll-link" onclick="dispatchRoll('${notation}', '${label}'${contextStr})" 
                  style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px; cursor: pointer;">
                ${label}
            </label>
            <div class="roll-link" onclick="dispatchRoll('${notation}', '${label}'${contextStr})" 
                 style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                ${display}
            </div>
            ${subtext ? `<div style="font-size: 0.65em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic;">${subtext}</div>` : ''}
        `;

        this._addSection(html, { flex: 1 });
        return this;
    }

    /**
     * Internal helper to get die shape SVG.
     */
    _getDieShape(faces, isFilled = true, color = 'currentColor') {
        const svgStyle = `width: 48px; height: 48px; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));`;
        const fill = isFilled ? color : 'transparent';
        const stroke = color;
        const strokeWidth = 2.0;
        const facesNum = parseInt(faces);

        const filters = `
            <defs>
                <linearGradient id="grad_${facesNum}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(0,0,0,0.2);stop-opacity:1" />
                </linearGradient>
                <filter id="shadow_${facesNum}">
                    <feOffset dx="0" dy="1" />
                    <feGaussianBlur stdDeviation="1" result="offset-blur" />
                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                    <feFlood flood-color="black" flood-opacity="0.5" result="color" />
                    <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                    <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
            </defs>
        `;

        const shapes = {
            4: `<polygon points="24,3 3,42 45,42" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow_${facesNum})" />
                ${isFilled ? `<polygon points="24,3 3,42 45,42" fill="url(#grad_${facesNum})" />` : ''}`,
            6: `<rect x="6" y="6" width="36" height="36" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow_${facesNum})" />
                ${isFilled ? `<rect x="6" y="6" width="36" height="36" rx="3" fill="url(#grad_${facesNum})" />` : ''}`,
            8: `<polygon points="24,3 3,24 24,45 45,24" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow_${facesNum})" />
                ${isFilled ? `<polygon points="24,3 3,24 24,45 45,24" fill="url(#grad_${facesNum})" />` : ''}`,
            10: `<polygon points="24,3 42,18 24,45 6,18" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow_${facesNum})" />
                ${isFilled ? `<polygon points="24,3 42,18 24,45 6,18" fill="url(#grad_${facesNum})" />` : ''}`,
            12: `<polygon points="24,3 43.5,15 36,42 12,42 4.5,15" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow_${facesNum})" />
                ${isFilled ? `<polygon points="24,3 43.5,15 36,42 12,42 4.5,15" fill="url(#grad_${facesNum})" />` : ''}`,
            20: `<polygon points="24,3 45,15 45,33 24,45 3,33 3,15" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow_${facesNum})" />
                ${isFilled ? `<polygon points="24,3 45,15 45,33 24,45 3,33 3,15" fill="url(#grad_${facesNum})" />` : ''}`
        };

        return `<svg viewBox="0 0 48 48" style="${svgStyle}">${filters}${shapes[facesNum] || shapes[6]}</svg>`;
    }

    /**
     * Add a dice pool display (Fury, Judgment, etc.)
     * @param {Array} dice - Current dice in the pool.
     * @param {string} label - Display label.
     * @param {string|number} faces - Number of faces for dice in the pool.
     * @param {string} stateKey - Key in the state object where pool is stored.
     * @param {number} [maxDice=99] - Maximum number of dice allowed in the pool.
     * @param {Object} [options={}] - Additional display options.
     * @returns {MechanicPanelBuilder} The builder instance.
     */
    addDicePool(dice, label, faces, stateKey, maxDice = 99, options = {}) {
        let diceHtml = "";
        const facesNum = parseInt(faces.toString().replace(/\D/g, '')) || 6;
        const isStaticPool = options.static || false;
        const rollAll = options.rollAll || false;

        let indicatorsHtml = "";
        if (options.indicators) {
            options.indicators.forEach(indicator => {
                const isActive = indicator.active;
                const glow = isActive ? `box-shadow: 0 0 8px ${indicator.color};` : '';
                const opacity = isActive ? '1' : '0.2';
                const onClick = indicator.toggleKey ? `onclick="updateBgChoice('${indicator.toggleKey}', state['${indicator.toggleKey}'] === 'BOOM' ? 'OFF' : 'BOOM')"` : '';

                indicatorsHtml += `
                    <div ${onClick} title="${indicator.label}: ${isActive ? 'ON' : 'OFF'}"
                         style="width: 8px; height: 8px; border-radius: 50%; background: ${indicator.color}; ${glow} opacity: ${opacity}; cursor: ${indicator.toggleKey ? 'pointer' : 'default'};"></div>
                `;
            });
        }

        const renderDie = (die, idx, isPlaceholder = false) => {
            const exploded = die?.detail && die.detail.includes('!');
            const color = exploded ? 'var(--gold-light)' : 'var(--class-accent)';
            const shapeSvg = this._getDieShape(facesNum, !isPlaceholder, color);

            const canRemove = !isPlaceholder && !options.disableRemove;
            const canMaximize = !isPlaceholder && !options.disableMaximize;

            return `
                <div onclick="${canRemove ? `removePoolDie('${stateKey}', ${idx}, ${isStaticPool})` : ''}"
                     oncontextmenu="event.preventDefault(); ${canMaximize ? `maximizePoolDie('${stateKey}', ${idx}, ${facesNum})` : ''}"
                     title="${isPlaceholder ? 'Empty Slot' : `${die.detail || die.total}${!canMaximize ? '' : ' (Right-click to Maximize)'}`}"
                     style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: ${canRemove || canMaximize ? 'pointer' : 'default'}; opacity: ${isPlaceholder ? 0.3 : 1};">
                    ${shapeSvg}
                    ${isPlaceholder ? '' : `<span style="position: absolute; font-family: 'Cinzel', serif; font-weight: 900; color: #fff; font-size: 1.4em; text-shadow: 0 0 4px rgba(0,0,0,0.8); pointer-events: none;">${die.total}</span>`}
                </div>
            `;
        };

        if (isStaticPool) {
            for (let i = 0; i < maxDice; i++) {
                diceHtml += renderDie(dice[i], i, !dice[i]);
            }
        } else if (dice && dice.length > 0) {
            dice.forEach((die, idx) => {
                diceHtml += renderDie(die, idx);
            });
        } else {
            diceHtml = `<div style="color: var(--text-muted); font-style: italic; font-size: 0.85em; opacity: 0.5; padding: 5px;">Awaiting ${label}...</div>`;
        }

        const actionBtn = rollAll ?
            `<button onclick="rollPool('${stateKey}', ${maxDice}, ${facesNum})" style="background: rgba(255,255,255,0.1); border: 1px solid var(--class-accent); color: #fff; font-size: 0.65em; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Roll</button>` :
            `<button onclick="addPoolDie('${stateKey}', ${maxDice}, ${facesNum})" style="background: rgba(255,255,255,0.1); border: 1px solid var(--class-accent); color: #fff; font-size: 0.65em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">+ Die</button>`;

        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 2px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">${label} (${faces})</label>
                    <div style="display: flex; gap: 4px; align-items: center;">${indicatorsHtml}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    ${actionBtn}
                    <button onclick="clearPool('${stateKey}')" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: var(--text-muted); font-size: 0.65em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Clear</button>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; width: 100%; justify-content: center;">
                <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; align-items: center; flex: 1;">
                    ${diceHtml}
                </div>
            </div>
        `;

        this._addSection(html, { flex: 1.5, align: 'stretch' });
        return this;
    }

    /**
     * Add a large stat display (Total Damage, DC, etc.)
     */
    addStatDisplay(value, label, subtext = '', options = {}) {
        const color = options.color || 'var(--gold-light)';

        let indicatorsHtml = "";
        if (options.indicators) {
            indicatorsHtml = `<div style="display: flex; flex-direction: column; gap: 3px; margin-top: 6px; width: 100%; align-items: center;">`;
            options.indicators.forEach(indicator => {
                const isActive = indicator.active;
                const glow = isActive ? `box-shadow: 0 0 6px ${indicator.color};` : '';
                const opacity = isActive ? '1' : '0.2';
                const textColor = isActive ? indicator.color : 'var(--text-muted)';
                const onClick = indicator.toggleKey ? `onclick="updateBgChoice('${indicator.toggleKey}', state['${indicator.toggleKey}'] === 'BOOM' ? 'OFF' : 'BOOM')"` : '';

                indicatorsHtml += `
                    <div ${onClick} style="display: flex; align-items: center; gap: 6px; cursor: ${indicator.toggleKey ? 'pointer' : 'default'}; opacity: ${opacity};">
                        <span style="font-size: 0.5em; color: ${textColor}; text-transform: uppercase; font-family: 'Cinzel'; font-weight: bold; letter-spacing: 0.5px;">${indicator.label}</span>
                        <div style="width: 6px; height: 6px; border-radius: 50%; background: ${indicator.color}; ${glow}"></div>
                    </div>
                `;
            });
            indicatorsHtml += `</div>`;
        }

        const html = `
            <span style="font-size: 2.2em; font-family: 'Cinzel', serif; font-weight: 900; color: ${value > 0 ? color : '#fff'}; line-height: 1;">${value >= 0 ? '+' : ''}${value}</span>
            <span style="font-size: 0.6em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-top: 4px; white-space: nowrap;">${label}</span>
            ${subtext ? `<div style="font-size: 0.55em; color: var(--text-muted); font-style: italic; text-align: center; line-height: 1.1; margin-top: 6px;">${subtext}</div>` : ''}
            ${indicatorsHtml}
        `;

        this._addSection(html, { minWidth: 80 });
        return this;
    }

    /**
     * Add a toggle/mode selector display.
     */
    addToggleDisplay(id, label, options, stateKey) {
        const current = state[stateKey] || options[0];
        const buttons = options.map(opt => `
            <button onclick="updateBgChoice('${stateKey}', '${opt}')" 
                    style="flex: 1; background: ${current === opt ? 'var(--class-accent)' : 'transparent'}; 
                           border: 1px solid ${current === opt ? 'var(--class-accent)' : 'rgba(255,255,255,0.2)'}; 
                           color: ${current === opt ? '#000' : 'var(--text-muted)'}; 
                           font-size: 0.65em; padding: 4px; border-radius: 4px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">
                ${opt}
            </button>
        `).join('');

        const html = `
            <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">${label}</label>
            <div style="display: flex; gap: 4px; width: 100%;">
                ${buttons}
            </div>
        `;

        this._addSection(html, { flex: 1.2 });
        return this;
    }

    /**
     * Add a selection display (Form selector, etc.)
     */
    addSelectDisplay(id, label, options, current, subtext = '') {
        const optsHtml = options.map(opt => `<option value="${opt}" ${opt === current ? 'selected' : ''}>${opt}</option>`).join('');
        const html = `
            <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel'; font-weight: bold; margin-bottom: 2px;">${label}</label>
            <select onchange="updateClassState('${id}', 0, this.value)" style="border-bottom-color: var(--class-accent); font-size: 0.85em; width: 100%;">${optsHtml}</select>
            ${subtext ? `<div style="font-size: 0.6em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; line-height: 1.1; margin-top: 4px;">${subtext}</div>` : ''}
        `;

        this._addSection(html, { flex: 1.6 });
        return this;
    }

    /**
     * Add a custom HTML section.
     */
    addHtml(html, options = {}) {
        this._addSection(html, options);
        return this;
    }

    /**
     * Build final HTML.
     */
    build(minHeight = 100) {
        if (this.sections.length === 0) return "";

        const rendered = [];
        this.sections.forEach((sec, idx) => {
            // Only add divider between elements
            if (idx > 0) {
                rendered.push(`
                    <div style="width: 1px; background: rgba(255,255,255,0.15); align-self: center; height: 60px; margin: 0 5px;"></div>
                `);
            }
            
            const style = `flex: ${sec.flex}; display: flex; flex-direction: column; align-items: ${sec.align}; justify-content: center; text-align: center; ${sec.minWidth ? `min-width: ${sec.minWidth}px;` : ''}`;
            rendered.push(`<div style="${style}">${sec.html}</div>`);
        });

        return `
        <div class="panel mechanic-panel" style="min-height: ${minHeight}px; display: flex; flex-direction: column; justify-content: center; padding: 5px 15px;">
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                ${rendered.join('')}
            </div>
        </div>
        `;
    }
}

const PanelBuilder = MechanicPanelBuilder;

/**
 * Renders the primary combat modifier selector (Advantage/Disadvantage).
 * @param {Object} stateObj - Current character state.
 */
function renderModField(stateObj) {
    const displayValue = stateObj.advantage === 0 ? 'Normal' : (stateObj.advantage > 0 ? 'Adv +' + stateObj.advantage : 'Dis ' + stateObj.advantage);
    const statusClass = stateObj.advantage > 0 ? 'positive' : (stateObj.advantage < 0 ? 'negative' : '');

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
    }
/**
 * Toggles circular "pip" indicators in feature cards.
 */
function toggleBgPip(key, idx) { 
    const val = state[key] || 0; 
    state[key] = (val === idx + 1) ? idx : idx + 1; 
    saveState();
    }
/** Updates a generic choice state key and refreshes UI. */
function updateBgChoice(key, val) { 
    state[key] = val; 
    saveState();
    }
/** Updates the background spell selection. */
function updateBgSpell(val) { 
    state.bgSpell = val; 
    saveState();
    }
/**
 * Adjusts a class-specific resource (Mana, Lay on Hands, etc.).
 */
function adjRes(id, amt, max, isAbsolute = false) { 
    let oldVal = state.resourceValues[id] || 0; 
    state.resourceValues[id] = Math.min(max || 999, Math.max(0, isAbsolute ? amt : oldVal + amt)); 
    saveState();
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
    }
/** Updates a specific field of an inventory item. */
function updateItem(id, field, val, check = false) { 
    let item = state.inventory.find(i => i.id === id); 
    if (item) { 
        item[field] = check ? val : (field === 'slots' || field === 'armor' || field === 'cost' ? parseFloat(val) : val); 
        saveState(); 
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
    }
/** Updates a skill proficiency level. */
function updateSkill(id, val) { 
    state.skills[id] = parseInt(val) || 0; 
    saveState();
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
    }
/** Adjusts Temp HP total. */
function adjTempHP(a, isAbsolute = false) {
    state.tempHP = Math.max(0, isAbsolute ? a : (state.tempHP || 0) + a);
    saveState();
    }
/** Adjusts current Hit Dice pool. */
function adjHD(a, isAbsolute = false) {
    const derived = computeDerived(state);
    const max = derived.hdMax;
    state.hdCurrent = Math.min(max, Math.max(0, isAbsolute ? a : (state.hdCurrent === null ? max : state.hdCurrent) + a));
    saveState();
    }
/** Toggles wound status pips. */
function handleWoundClick(i) { 
    state.wounds = (state.wounds === i + 1) ? i : i + 1; 
    saveState();
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
    }
/** Clears an entire dice pool. */
function clearPool(key) {
    state[key] = [];
    saveState();
    }
/** Manually sets a die to its maximum possible value. */
function maximizePoolDie(key, idx, faces) {
    if (!state[key] || !state[key][idx]) return;
    state[key][idx].total = faces;
    state[key][idx].detail = `${faces} (Maxed)`;
    saveState();
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
}
