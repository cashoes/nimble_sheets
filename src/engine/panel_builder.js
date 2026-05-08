/**
 * Mechanic Panel Builder
 * Provides a fluent API for building class mechanic panels.
 */
class MechanicPanelBuilder {
    constructor() {
        this.sections = [];
    }
    
    /**
     * Add a resource section (mana, LoH, etc.)
     * @param {string} id - Resource ID
     * @param {string} label - Display label
     * @param {number} value - Current value
     * @param {number} max - Maximum value
     * @param {boolean} visible - Whether to show (default: true)
     */
    addResource(id, label, value, max, visible = true) {
        if (!visible || max <= 0) return this;
        
        this.sections.push(`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px; justify-content: center;">
                <label style="font-size: 0.65em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${label}</label>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div class="dark-incrementer">
                        <button onclick="adjRes('${id}', -1, ${max})">-</button>
                        <input type="number" id="res_${id}" value="${value || 0}" onchange="adjRes('${id}', parseInt(this.value), ${max}, true)">
                        <button onclick="adjRes('${id}', 1, ${max})">+</button>
                    </div>
                    <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ <span style="color: var(--text-main);">${max}</span></div>
                </div>
            </div>
        `);
        
        return this;
    }
    
    /**
     * Add a roll link display (Surge, Spirit damage, etc.)
     * @param {string} notation - Roll notation
     * @param {string} label - Display label
     * @param {string} display - Display value
     * @param {string} subtext - Subtext below (e.g., "Regain on Init")
     * @param {Object} rollContext - Context for dispatchRoll
     */
    addRollDisplay(notation, label, display, subtext = '', rollContext = {}) {
        const contextStr = Object.keys(rollContext).length > 0 
            ? `, ${JSON.stringify(rollContext).replace(/"/g, '&quot;')}` 
            : '';
        
        this.sections.push(`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                <label class="roll-link" onclick="dispatchRoll('${notation}', '${label}'${contextStr})" 
                      style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px; cursor: pointer;">
                    ${label}
                </label>
                <div class="roll-link" onclick="dispatchRoll('${notation}', '${label}'${contextStr})" 
                     style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                    ${display}
                </div>
                ${subtext ? `<div style="font-size: 0.65em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic;">${subtext}</div>` : ''}
            </div>
        `);
        
        return this;
    }
    
    /**
     * Add a dice pool display (Fury, Judgment, etc.)
     */
    addDicePool(dice, label, faces, rollFn, clearFn, toggleFn, maxDice = 0) {
        let diceHtml = "";
        
        if (dice && dice.length > 0) {
            dice.forEach((die, idx) => {
                const exploded = die.detail && die.detail.includes('!');
                diceHtml += `
                    <div onclick="event.stopPropagation(); ${toggleFn}(${idx})"
                         title="${die.detail} (Right-click to Maximize)"
                         style="background: rgba(239, 68, 68, 0.15); border: 1px solid ${exploded ? 'var(--gold-light)' : 'var(--class-accent)'}; border-radius: 4px; padding: 3px 6px; min-width: 28px; text-align: center; cursor: pointer;">
                        <span style="font-family: 'Cinzel', serif; font-weight: bold; color: #fff; font-size: 1.2em;">${die.total}</span>
                    </div>
                `;
            });
        } else {
            diceHtml = `<div style="color: var(--text-muted); font-style: italic; font-size: 0.85em; opacity: 0.5; padding: 5px;">Awaiting ${label}...</div>`;
        }
        
        this.sections.push(`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding-left: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 2px;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">${label} (${faces})</label>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="${rollFn}" style="background: rgba(239,68,68,0.15); border: 1px solid var(--class-accent); color: #fff; font-size: 0.65em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">+ Die</button>
                        <button onclick="${clearFn}" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: var(--text-muted); font-size: 0.65em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Clear</button>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; width: 100%; justify-content: center;">
                    <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; align-items: center; flex: 1;">
                        ${diceHtml}
                    </div>
                </div>
            </div>
        `);
        
        return this;
    }
    
    /**
     * Add custom HTML section
     */
    addCustom(html) {
        this.sections.push(html);
        return this;
    }
    
    /**
     * Build final HTML
     * @param {number} minHeight - Minimum height in pixels
     * @returns {string} Complete mechanic panel HTML
     */
    build(minHeight = 100) {
        return `
        <div class="panel mechanic-panel" style="min-height: ${minHeight}px; display: flex; flex-direction: column; justify-content: center; padding: 5px 15px;">
            <div style="display: flex; align-items: stretch; gap: 8px; justify-content: center;">
                ${this.sections.join('')}
            </div>
        </div>
        `;
    }
}

const PanelBuilder = MechanicPanelBuilder;
