/**
 * @fileoverview Mechanic Panel Builder
 * Provides a fluent API for building class-specific mechanic panels in the UI.
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
     * @param {boolean} [visible=true] - Whether the section is visible.
     * @returns {MechanicPanelBuilder} The builder instance.
     */
    addResource(id, label, value, max, visible = true) {
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
     * Build final HTML.
     */
    build(minHeight = 100) {
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
