/**
 * @fileoverview SOLIDJS COMPONENTS
 * Reactive UI components for the NIMBLE tracker.
 */

const {
    html,
    createComponent: createComp
} = Solid;

/**
 * Helper to handle textarea auto-resize without inline dots.
 */
function handleAutoResize(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

/**
 * Wraps key mechanical terms in a highlighting span for better visibility.
 */
function highlightMechanicalTerms(text) {
    if (!text) return "";
    let processed = text;
    
    // 1. Highlight standard properties (Term: Value OR Value Term)
    // Supports Reach, Range, Line, DC, Armor, Damage, Actions, Targets, Allies, Area, Temp HP, HP, Advantage, Minutes, Rounds, Turns, Spaces, Feet
    const terms = "Reach|Range|Line|DC|Armor|Damage|Actions?|Targets?|Allies?|Area|Temp\\s+HP|HP|Advantage|Minutes?|Rounds?|Turns?|Spaces?|Feet";
    
    // Strict greedy value pattern (Dice w/ modifiers, Table rolls, Math, Stat tokens, Placeholders, Keywords)
    // Now explicitly includes kh/kl/dh/dl/! and table roll prefixes to avoid splitting
    const valPattern = `(?:(?:\\d+d\\d+|t\\d+)(?:kh\\d*|kl\\d*|dh\\d*|dl\\d*|!|\\s*[\\+\\-]\\s*(?:\\d+|STR|DEX|INT|WIL|KEY|LVL))*|(?:\\d+|STR|DEX|INT|WIL|KEY|LVL)(?:\\s*[\\+\\-]\\s*(?:\\d+|STR|DEX|INT|WIL|KEY|LVL))+|{.*?}|(?:Cone|Line|AoE)\\s*[\\d{}x\\+]+|AoE|Self|Single|[+-]?\\d+(?:\\.\\d+)?|[\\d+x/]+)`;
    
    // Pattern A: Term: Value (Preserving separator)
    const regA = new RegExp(`\\b(${terms})\\b(:?\\s*)(${valPattern})`, 'gi');
    processed = processed.replace(regA, (match, p1, p2, p3) => `<span class="prop-hl">${p1}${p2}${p3}</span>`);

    // Pattern B: Value [Adjective] Term
    const regB = new RegExp(`(${valPattern})\\s+(?:[\\w-]+\\s+)?\\b(${terms})\\b`, 'gi');
    processed = processed.replace(regB, (match, p1, p2) => {
        if (match.includes('class="prop-hl"')) return match;
        return `<span class="prop-hl">${match}</span>`;
    });

    return processed;
}

/**
 * Generic Action Pip Component
 */
function ActionPip(props) {
    const s = charState;
    const d = charDerived;
    const index = props.index;

    const isChecked = () => s().actionsSpent > index;
    const isAvail = () => index < d().maxActions;

    const pipOpacity = () => isAvail() ? '1' : '0.2';
    const pipCursor = () => isAvail() ? 'pointer' : 'not-allowed';
    const pipStyle = () => `opacity: ${pipOpacity()}; cursor: ${pipCursor()};`;
    const pipClick = () => toggleAction(index);

    return html`
        <input type="checkbox" class="action-pip" checked=${isChecked} 
               disabled=${() => !isAvail()} style=${pipStyle} 
               onclick=${pipClick} />
    `;
}

/**
 * Top Identity Header Component
 */
function Header() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const nameText = config.name;
    const subText = config.subtitle;

    const armorVal = () => d().armor;
    const sizeVal = () => d().size;
    const speedVal = () => d().speed;
    const initVal = () => d().initiative;
    const initLabel = () => {
        const v = initVal();
        return (v >= 0 ? "+" : "") + v;
    };

    const getHasAdv = () => {
        const ancestry = s().ancestry;
        const feat = ANCESTRY_FEATURES[ancestry];
        const base = (feat && feat.modInitAdv) || d().initAdv;
        return !!base;
    };
    const showAdv = getHasAdv;

    const getNotation = () => {
        const v = initVal();
        return `1d20${v >= 0 ? '+' : ''}${v}`;
    };
    const notation = getNotation;

    const handleRoll = () => dispatchRoll(notation(), 'Initiative', { forceAdv: showAdv() });

    const advPip = html`<span style="font-size:0.5em; vertical-align:middle; color:var(--save-adv); margin-left:2px;">▲</span>`;
    const maybeAdvPip = () => showAdv() ? advPip : '';

    const customStatsNodes = () => {
        const stats = config.customHeaderStats || [];
        const lvl = s().level;
        const subclass = s().subclass;
        const der = d();

        return stats
            .filter(stat => stat.position === 'left' && stat.isVisible(lvl, subclass))
            .map(stat => {
                const label = stat.label;
                const value = stat.getValue(der);
                const color = stat.color;
                const style = `color:${color}`;
                return html`
                    <div class="header-stat">
                        <label style=${style}>${label}</label>
                        <div class="header-stat-val" style=${style}>${value}</div>
                    </div>
                `;
            });
    };

    const actionPipsNodes = () => {
        const nodes = [];
        const potential = d().potentialActions;
        for (let i = 0; i < potential; i++) {
            nodes.push(html`<${ActionPip} index=${i} />`);
        }
        return nodes;
    };

    return html`
        <div class="header">
            <div id="headerLeftStats" class="header-left-stats">
                <div class="header-stat">
                    <label style="color:var(--gold-light)">Armor</label>
                    <div class="header-stat-val" style="color:var(--gold-light)">${armorVal}</div>
                </div>
                ${customStatsNodes}
            </div>

            <div class="header-center">
                <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
                    <h1 id="classNameDisplay">${nameText}</h1>
                    <div class="action-pips">
                        ${actionPipsNodes}
                    </div>
                </div>
                <div class="subtitle" id="classSubtitleDisplay">${subText}</div>
            </div>

            <div id="headerRightStats" class="header-right-stats">
                <div class="header-stat">
                    <label>Size</label>
                    <div class="header-stat-val">${sizeVal}</div>
                </div>
                <div class="header-stat">
                    <label>Speed</label>
                    <div class="header-stat-val">${speedVal}</div>
                </div>
                <div class="header-stat">
                    <label class="roll-link" onclick=${handleRoll}>Init</label>
                    <div class="header-stat-val roll-link" onclick=${handleRoll}>
                        ${initLabel}
                        ${maybeAdvPip}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Attribute Card Component
 */
function AttributeCard(props) {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;
    const statKey = props.stat;
    const statLabel = props.label;

    const isMain = config.keyStats.includes(statKey);
    const getStatVal = () => d().statsMap[statKey];
    const statVal = getStatVal;

    const getAdvStatus = () => {
        let base = 0;
        const saves = config.saves;
        if (saves.adv === statKey) base = 1;
        if (saves.dis === statKey) base = -1;
        const der = d();
        return base + (der.allSaveAdv ? 1 : 0) + (der.allSaveDis ? -1 : 0);
    };

    const getNotation = () => `1d20+${statVal()}`;
    const notation = getNotation;
    const rollLabel = statLabel.toUpperCase() + " Save";
    const baseAdv = config.saves.adv === statKey ? 1 : (config.saves.dis === statKey ? -1 : 0);
    const handleRoll = () => dispatchRoll(notation(), rollLabel, { inherentAdv: baseAdv });

    const cardId = 'statCard_' + statKey;
    const cardCss = () => {
        const adv = getAdvStatus();
        const base = `core-stat ${isMain ? 'key-stat' : ''}`;
        if (adv > 0) return base + ' save-adv';
        if (adv < 0) return base + ' save-dis';
        return base;
    };

    const advStatus = getAdvStatus;
    const advIcon = () => {
        const status = advStatus();
        if (status > 0) return html`<span style="color: var(--save-adv); font-size: 0.6em; vertical-align: middle; margin-left: 4px;">▲</span>`;
        if (status < 0) return html`<span style="color: var(--save-dis); font-size: 0.6em; vertical-align: middle; margin-left: 4px;">▼</span>`;
        return '';
    };

    const baseId = 'base' + statLabel;
    const addId = 'add' + statLabel;

    const baseVal = () => s()[baseId] || 0;
    const addVal = () => s()[addId] || 0;
    const isLevel1 = () => s().level === 1;

    const handleBase = (e) => dispatch({ type: 'SET_STATE_KEY', payload: { key: baseId, value: parseInt(e.target.value) || 0 } });
    const handleAdd = (e) => dispatch({ type: 'SET_STATE_KEY', payload: { key: addId, value: parseInt(e.target.value) || 0 } });

    return html`
        <div id=${cardId} class=${cardCss}>
            <div class="save-indicator"></div>
            ${() => isMain ? html`<div class="key-stat-tag">KEY</div>` : ''}
            <label class="roll-link" onclick=${handleRoll}>${statLabel}</label>
            <div class="core-stat-total roll-link" id=${'display' + statLabel} onclick=${handleRoll}>
                ${() => statVal()}
                ${advIcon}
            </div>
            <div class="core-stat-inputs">
                <input type="number" id=${baseId} value=${() => baseVal()} 
                       onchange=${handleBase}
                       disabled=${() => !isLevel1()} 
                       style=${() => `opacity: ${isLevel1() ? '1' : '0.6'}; cursor: ${isLevel1() ? 'text' : 'not-allowed'};`} />
                <span style="font-size: 0.8em; opacity: 0.5;">+</span>
                <input type="number" id=${addId} value=${() => addVal()} min="0" onchange=${handleAdd} />
            </div>
        </div>
    `;
}

/**
 * Attributes Section Component
 */
function AttributesSection() {
    const s = charState;
    const d = charDerived;

    const unspentText = () => {
        const der = d();
        const k = der.keyUnspent || 0;
        const sc = der.secUnspent || 0;
        const f = der.flexRemaining || 0;

        let parts = [];
        if (k > 0) parts.push(`+${k} KEY`);
        if (sc > 0) parts.push(`+${sc} SEC`);
        if (f > 0) parts.push(`+${f} FLEX`);

        return parts.length > 0 ? parts.join(' | ') : "MAXED OUT";
    };

    const color = () => {
        const der = d();
        if (der.flexRemaining < 0 || der.keyUnspent < 0 || der.secUnspent < 0) {
            return 'var(--save-dis)';
        }
        return 'var(--class-accent)';
    };

    return html`
        <div style="width: 100%; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-family: 'Cinzel', serif; font-size: 0.9em; font-weight: bold; color: var(--text-main); letter-spacing: 1px;">ATTRIBUTES</span>
                <span style=${() => `font-family: 'Cinzel', serif; font-size: 0.85em; font-weight: bold; color: ${color()};`}>
                    UNSPENT: ${unspentText}
                </span>
            </div>
            <div class="core-stats-row" style="border-bottom: none; width: 100%;">
                <${AttributeCard} stat="str" label="Str" />
                <${AttributeCard} stat="dex" label="Dex" />
                <${AttributeCard} stat="int" label="Int" />
                <${AttributeCard} stat="wil" label="Wil" />
            </div>
        </div>
    `;
}

/**
 * HP and Resource Tracker Component
 */
function HPTracker() {
    const s = charState;
    const d = charDerived;

    const hpVal = () => s().hpCurrent ?? d().maxHP;
    const hpMaxVal = () => d().maxHP;
    const tempVal = () => s().tempHP;
    const hdVal = () => s().hdCurrent ?? d().hdMax;
    const hdMaxVal = () => d().hdMax;
    const hdFace = () => d().hdFace;
    const hdNot = () => d().hdNotation;

    const hpDown = () => adjHP(-1);
    const hpUp = () => adjHP(1);
    const hpSet = (e) => adjHP(parseInt(e.target.value), true);

    const thpDown = () => adjTempHP(-1);
    const thpUp = () => adjTempHP(1);
    const thpSet = (e) => adjTempHP(parseInt(e.target.value), true);

    const hdDown = () => adjHD(-1);
    const hdUp = () => adjHD(1);
    const hdSet = (e) => adjHD(parseInt(e.target.value), true);

    const rollHD = () => {
        if (hdVal() > 0) {
            adjHD(-1);
            dispatchRoll(hdNot(), 'Hit Die Recovery', { type: 'rest' });
        } else {
            alert("No Hit Dice remaining!");
        }
    };

    return html`
        <div class="res-row" style="align-items: stretch; margin-bottom: 12px;">
            <div style="display: flex; flex-1; justify-content: space-between; align-items: center; padding-right: 15px; border-right: 1px dashed rgba(255,255,255,0.15);">
                <label style="color: var(--class-accent);">Hit Points</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="res-val dark-incrementer">
                        <button onclick=${hpDown}>-</button>
                        <input type="number" id="displayCurrentHP" value=${hpVal} onchange=${hpSet} />
                        <button onclick=${hpUp}>+</button>
                    </div>
                    <div class="max-text">/ <span id="displayMaxHP" style="color:var(--text-main);">${hpMaxVal}</span></div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 15px; gap: 8px;">
                <label style="color: var(--text-muted); font-size: 0.8em; margin:0;">Temp HP</label>
                <div class="dark-incrementer">
                    <button onclick=${thpDown}>-</button>
                    <input type="number" id="displayTempHP" value=${tempVal} onchange=${thpSet} style="color: var(--class-accent);" />
                    <button onclick=${thpUp}>+</button>
                </div>
            </div>
        </div>

        <div class="res-row">
            <label id="hitDiceLabel" class="roll-link" onclick=${rollHD}>Hit Dice (d${hdFace})</label>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="res-val dark-incrementer">
                    <button onclick=${hdDown}>-</button>
                    <input type="number" id="displayHD" value=${hdVal} onchange=${hdSet} />
                    <button onclick=${hdUp}>+</button>
                </div>
                <div class="max-text">/ <span id="maxHD" style="color:var(--text-main);">${hdMaxVal}</span></div>
            </div>
        </div>
    `;
}

/**
 * Wound Tracker Component (Pip-based)
 */
function WoundTracker() {
    const s = charState;
    const d = charDerived;

    const pipsNodes = () => {
        const count = d().woundMax;
        const current = s().wounds;
        let items = [];
        for (let i = 1; i <= count; i++) {
            const idx = i;
            const isChecked = current >= idx;
            const handleClick = () => adjWounds(isChecked ? idx - 1 : idx, true);
            items.push(html`
                <input type="checkbox" class="pip wound" checked=${isChecked} onclick=${handleClick} />
            `);
        }
        return items;
    };

    return html`
        <div class="res-row" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; padding: 10px 12px; margin-bottom: 15px;">
            <label style="color: var(--save-dis); font-size: 1.1em; letter-spacing: 2px; text-shadow: 0 0 8px rgba(239, 68, 68, 0.6); margin: 0;">Wounds</label>
            <div class="pips" id="woundsContainer">
                ${pipsNodes}
            </div>
        </div>
    `;
}

/**
 * Combat Controls Component (Advantage/Disadvantage)
 */
function CombatControls() {
    const s = charState;
    const getVal = () => s().advantage;
    const getLabel = () => {
        const v = getVal();
        return v === 0 ? 'Normal' : (v > 0 ? 'Adv +' + v : 'Dis ' + v);
    };
    const getCss = () => {
        const v = getVal();
        return v > 0 ? 'positive' : (v < 0 ? 'negative' : '');
    };
    const handleDown = () => adjAdv(-1);
    const handleUp = () => adjAdv(1);

    return html`
        <div class="advantage-controls">
            <button class="adv-btn" onclick=${handleDown}>-</button>
            <div id="advDisplay" class=${() => `adv-val ${getCss()}`}>${getLabel}</div>
            <button class="adv-btn" onclick=${handleUp}>+</button>
        </div>
    `;
}

/**
 * Inventory Item Row Component
 */
function InventoryRow(props) {
    const d = charDerived;
    const item = props.item;
    const id = item.id;
    const nameStr = item.name;
    const typeStr = item.type;
    const armorStr = item.armor;
    const atypeStr = item.armorType;
    const diceStr = item.dmgDice;
    const statKey = item.stat;
    const propsVal = item.props;
    const costVal = item.cost;
    const slotsVal = item.slots;

    const isEquipped = () => item.equipped;
    const rowClass = () => `inv-row ${isEquipped() ? 'equipped' : ''}`;

    const handleEquip = (e) => updateItem(id, 'equipped', e.target.checked, true);
    const handleName = (e) => updateItem(id, 'name', e.target.value);
    const handleProps = (e) => updateItem(id, 'props', e.target.value);
    const handleCost = (e) => updateItem(id, 'cost', e.target.value);
    const handleSlots = (e) => updateItem(id, 'slots', e.target.value);
    const handleDel = () => deleteItem(id);

    const handleCategory = (e) => updateItem(id, 'category', e.target.value);
    const handleType = (e) => updateItem(id, 'type', e.target.value);
    const handleDice = (e) => updateItem(id, 'dmgDice', e.target.value);
    const handleStat = (e) => updateItem(id, 'stat', e.target.value);
    const handleArmor = (e) => updateItem(id, 'armor', e.target.value);
    const handleArmorType = (e) => updateItem(id, 'armorType', e.target.value);
    const handleReach = (e) => updateItem(id, 'reach', e.target.value);

    const isLib = () => !!item.isLibraryItem;

    const reachNode = () => {
        if (typeStr !== 'weapon') return '-';
        if (isLib()) return item.reach || '-';
        return html`<input type="text" class="inv-input" value=${() => item.reach || '1'} style="text-align:center;" onchange=${handleReach} />`;
    };

    const effectNode = () => {
        if (!isEquipped()) return '-';
        const smap = d().statsMap;
        if (typeStr === 'weapon') {
            const mod = smap[statKey];
            const not = `${diceStr}${mod >= 0 ? '+' : ''}${mod}`;
            // Pass weapon context (melee/ranged) for automation
            const weaponType = (item.category || "").toLowerCase().includes('ranged') ? 'ranged' : 'melee';
            const click = () => dispatchRoll(not, nameStr, { 
                stat: statKey, 
                type: 'attack',
                metadata: { weaponType } 
            });
            return html`<span class="roll-link" onclick=${click}>⚔️ ${not}</span>`;
        }
        if (typeStr === 'armor') {
            const base = parseInt(armorStr) || 0;
            const dmax = atypeStr === 'light' ? 99 : (atypeStr === 'medium' ? 2 : 0);
            const ac = base + Math.min(smap.dex, dmax);
            return `🛡️ ${ac} AC`;
        }
        if (typeStr === 'shield') return `🛡️ +${armorStr} AC`;
        return '-';
    };

    const statsNode = () => {
        const smap = d().statsMap;
        if (typeStr === 'weapon') {
            if (isLib()) {
                const val = smap[statKey];
                const lab = (val >= 0 ? '+' : '') + val;
                const snam = statKey.toUpperCase();
                return html`<span>${diceStr} (<span class="stat-hl">${lab}</span> ${snam})</span>`;
            } else {
                return html`
                    <div style="display:flex; flex-direction:row; align-items:center; gap:4px; width:100%;">
                        <input type="text" class="inv-input" value=${() => diceStr} style="flex:1; min-width:0;" onchange=${handleDice} />
                        <select class="inv-input" style="flex:1; min-width:0; padding:0;" onchange=${handleStat}>
                            <option value="str" selected=${() => statKey === 'str'}>STR</option>
                            <option value="dex" selected=${() => statKey === 'dex'}>DEX</option>
                            <option value="int" selected=${() => statKey === 'int'}>INT</option>
                            <option value="wil" selected=${() => statKey === 'wil'}>WIL</option>
                        </select>
                    </div>
                `;
            }
        }
        if (typeStr === 'armor') {
            if (isLib()) {
                const dval = smap.dex;
                const dlab = (dval >= 0 ? '+' : '') + dval;
                const dnode = html`<span class="stat-hl">${dlab}</span> DEX`;
                if (atypeStr === 'light') return html`<span>+${armorStr} (${dnode})</span>`;
                if (atypeStr === 'medium') return html`<span>+${armorStr} max(${dnode}, 2)</span>`;
                return `+${armorStr}`;
            } else {
                return html`
                    <div style="display:flex; flex-direction:row; align-items:center; gap:4px; width:100%;">
                        <input type="number" class="inv-input" value=${() => armorStr} style="flex:0.5; min-width:0;" onchange=${handleArmor} />
                        <select class="inv-input" style="flex:1.5; min-width:0; padding:0;" onchange=${handleArmorType}>
                            <option value="light" selected=${() => atypeStr === 'light'}>Cloth/Leather</option>
                            <option value="medium" selected=${() => atypeStr === 'medium'}>Mail</option>
                            <option value="heavy" selected=${() => atypeStr === 'heavy'}>Plate</option>
                        </select>
                    </div>
                `;
            }
        }
        if (typeStr === 'shield' && !isLib()) {
            return html`<input type="number" class="inv-input" value=${() => armorStr} style="width:30px;" onchange=${handleArmor} />`;
        }
        return '-';
    };

    const typeNode = () => {
        if (isLib()) {
            return html`<div style="color:var(--text-muted); text-transform:capitalize; text-align:center; line-height:1.2;">
                ${item.category || (typeStr === 'armor' ? atypeStr + ' ' : '') + typeStr}
            </div>`;
        }
        return html`
            <div style="width:100%; text-align:center;">
                <select class="inv-input" style="text-align-last: center;" onchange=${handleType}>
                    <option value="weapon" selected=${() => typeStr === 'weapon'}>Weapon</option>
                    <option value="armor" selected=${() => typeStr === 'armor'}>Armor</option>
                    <option value="shield" selected=${() => typeStr === 'shield'}>Shield</option>
                    <option value="misc" selected=${() => typeStr === 'misc'}>Misc</option>
                </select>
            </div>
        `;
    };

    let taRef;
    Solid.onMount(() => {
        if (taRef) handleAutoResize({ target: taRef });
    });

    return html`
        <div class=${rowClass}>
            <div style="display:flex; justify-content:center;">
                <input type="checkbox" checked=${isEquipped} onchange=${handleEquip} />
            </div>
            <div>
                <input type="text" class="inv-input" value=${() => nameStr} style="text-align:left;" onchange=${handleName} />
            </div>
            ${typeNode}
            <div>
                <textarea ref=${el => taRef = el} class="inv-input" 
                          rows="1"
                          style="resize:none; overflow:hidden; text-align:left;" 
                          oninput=${handleAutoResize}
                          onchange=${handleProps}>${() => propsVal || ''}</textarea>
            </div>
            <div style="text-align:center; color:var(--text-muted);">
                ${reachNode}
            </div>
            <div style="display:flex; justify-content:center;">
                ${() => isLib() ? html`<span style="opacity:0.8;">${costVal || 0}</span>` : html`
                    <input type="number" class="inv-input" value=${() => costVal || 0} onchange=${handleCost} />
                `}
            </div>
            <div style="display:flex; justify-content:center;">
                ${() => isLib() ? html`<span style="opacity:0.8;">${slotsVal}</span>` : html`
                    <input type="number" class="inv-input" value=${() => slotsVal} onchange=${handleSlots} />
                `}
            </div>
            <div style="text-align:center; line-height:1.2;">
                ${statsNode}
            </div>
            <div style="font-weight:bold; color:var(--class-accent); text-align:center;">
                ${effectNode}
            </div>
            <div style="display:flex; justify-content:center;">
                <button onclick=${handleDel} style="background:none; border:none; color:var(--save-dis); cursor:pointer;">×</button>
            </div>
        </div>
    `;
}

/**
 * Inventory Section Component
 */
function Inventory() {
    const s = charState;
    const itemNodes = () => s().inventory.map(item => html`<${InventoryRow} item=${item} />`);

    return html`
        <div id="inventoryContainer">
            <div class="inv-header">
                <div></div>
                <div>Item</div>
                <div style="text-align:center;">Type</div>
                <div>Description</div>
                <div style="text-align:center;">Rch</div>
                <div style="text-align:center;">GP</div>
                <div style="text-align:center;">Wt</div>
                <div style="text-align:center;">Stats</div>
                <div style="text-align:center;">Effect</div>
                <div></div>
            </div>
            ${itemNodes}
        </div>
    `;
}

/**
 * Inventory Section Component (Wraps title, gold, slots, list, and add buttons)
 */
function InventorySection() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const goldVal = () => s().gold;
    const handleGold = (e) => dispatch({ type: 'SET_STATE_KEY', payload: { key: 'gold', value: parseInt(e.target.value) || 0 } });

    const totalSlots = () => s().inventory.reduce((sum, item) => sum + (parseInt(item.slots) || 0), 0);
    const maxSlots = 10;
    const slotsColor = () => totalSlots() > maxSlots ? 'var(--save-dis)' : 'var(--class-accent)';

    const handleMelee = (e) => { addQuickItem('melee', e.target.value); e.target.value = ''; };
    const handleRanged = (e) => { addQuickItem('ranged', e.target.value); e.target.value = ''; };
    const handleArmor = (e) => { addQuickItem('armor', e.target.value); e.target.value = ''; };

    const meleeGroups = () => {
        let items = [html`<option value="" disabled selected>+ Melee Weapon</option>`];
        const meleeData = ITEM_TEMPLATES.melee;
        Object.keys(meleeData).forEach(group => {
            const opts = meleeData[group].map(k => html`<option value=${k}>${ITEM_TEMPLATES.data[k].name}</option>`);
            items.push(html`<optgroup label=${group}>${opts}</optgroup>`);
        });
        return items;
    };

    const rangedGroups = () => {
        let items = [html`<option value="" disabled selected>+ Ranged Weapon</option>`];
        const rangedData = ITEM_TEMPLATES.ranged;
        Object.keys(rangedData).forEach(group => {
            const opts = rangedData[group].map(k => html`<option value=${k}>${ITEM_TEMPLATES.data[k].name}</option>`);
            items.push(html`<optgroup label=${group}>${opts}</optgroup>`);
        });
        return items;
    };

    const armorGroups = () => {
        let items = [html`<option value="" disabled selected>+ Armor/Shield</option>`];
        const armorData = ITEM_TEMPLATES.armor;
        Object.keys(armorData).forEach(group => {
            const opts = armorData[group].map(k => html`<option value=${k}>${ITEM_TEMPLATES.data[k].name}</option>`);
            items.push(html`<optgroup label=${group}>${opts}</optgroup>`);
        });
        return items;
    };

    return html`
        <div class="skills-box" style="padding: 15px; height: auto; border: 1px solid var(--class-border); border-radius: 6px; background: var(--class-panel-bg);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h2 class="section-header" style="font-size: 1.1em; margin: 0; border: none;">INVENTORY & EQUIPMENT</h2>
                <div style="display:flex; align-items:center; gap: 15px;">
                    <span style=${() => `color:${slotsColor()}; font-weight:bold; letter-spacing:1px; font-size: 0.9em;`}>
                        SLOTS: ${totalSlots} / ${maxSlots}
                    </span>
                    <div style="display:flex; align-items:center; border: 1px solid var(--gold-dim); background: linear-gradient(145deg, var(--slate-mid), var(--slate-dark)); border-radius: 4px; padding: 2px 8px; gap: 6px;">
                        <label style="color: var(--gold-light); font-family: 'Cinzel', serif; font-size: 0.8em; font-weight: bold; margin: 0; text-transform: uppercase;">Gold</label>
                        <input type="number" value=${goldVal} oninput=${handleGold}
                               style="width: 65px; font-size: 1.1em; padding: 0; border: none; border-bottom: 1px solid var(--gold-dim); background: transparent; color: #fff; font-family: 'Crimson Text', serif; font-weight: bold; text-align: center;" />
                    </div>
                </div>
            </div>
            
            <${Inventory} />

            <div style="display: flex; gap: 8px; margin-top: 10px;">
                <select class="add-item-btn" onchange=${handleMelee}>
                    ${meleeGroups}
                </select>
                <select class="add-item-btn" onchange=${handleRanged}>
                    ${rangedGroups}
                </select>
                <select class="add-item-btn" onchange=${handleArmor}>
                    ${armorGroups}
                </select>
                <button class="add-item-btn" onclick=${addItem}>+ Custom</button>
            </div>
        </div>
    `;
}

/**
 * Skill Row Component
 */
function SkillRow(props) {
    const s = charState;
    const d = charDerived;
    const skill = props.skill;
    const sid = skill.id;
    const sname = skill.name;
    const sstat = skill.stat;

    const curPts = () => s().skills[sid] || 0;
    const totalModVal = () => (d().statsMap[sstat] || 0) + curPts() + (d().passMods[sid] || 0);
    const modLabel = () => {
        const v = totalModVal();
        return (v >= 0 ? '+' : '') + v;
    };
    const notation = () => {
        const v = totalModVal();
        return `1d20${v >= 0 ? '+' : ''}${v}`;
    };
    const click = () => dispatchRoll(notation(), `${sname} Skill Check`);
    const change = (e) => updateSkill(sid, e.target.value);

    return html`
        <div class="skill-row">
            <div class="skill-name">${sname} <span class="skill-stat">${sstat.toUpperCase()}</span></div>
            <div class="skill-pts">
                <input type="number" value=${() => curPts()} onchange=${change} />
            </div>
            <div class="skill-total roll-link" onclick=${click}>
                ${() => modLabel()}
            </div>
        </div>
    `;
}

/**
 * Skills Section Component
 */
function Skills() {
    const s = charState;

    const unspentVal = () => {
        const lvl = s().level;
        const sks = s().skills;
        const tot = 4 + (lvl - 1);
        const spent = SKILL_LIST.reduce((sum, sk) => sum + (sks[sk.id] || 0), 0);
        return tot - spent;
    };
    const color = () => unspentVal() < 0 ? 'var(--save-dis)' : 'var(--class-accent)';
    const nodes = SKILL_LIST.map(sk => html`<${SkillRow} skill=${sk} />`);

    return html`
        <div class="skill-header">
            <span>SKILLS</span>
            <span style=${() => `color: ${color()}; font-family: 'Cinzel', serif; font-size: 0.85em; font-weight: bold;`}>
                UNSPENT: ${unspentVal}
            </span>
        </div>
        <div class="skills-grid">
            ${nodes}
        </div>
    `;
}

/**
 * Conditions Section Component
 */
function Conditions() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const conditionNodes = () => {
        const lvl = s().level;
        const sub = s().subclass;
        const state = s();
        const der = d();

        const extra = (config.getExtraConditions ? config.getExtraConditions(lvl, sub, state, der) : []) || [];
        const all = [...CONDITIONS_LIST, ...extra];
        return all.map(condition => {
            const cid = condition.id;
            const ctype = condition.type;
            const cname = condition.name;
            const cdesc = condition.desc;
            
            // Auto-activate certain conditions based on vitals
            const active = () => {
                if (cid === 'bloodied') return d().isBloodied;
                if (cid === 'dying') return (s().hpCurrent ?? d().maxHP) === 0;
                if (cid === 'wounded') return (s().wounds || 0) > 0;
                return s().activeConditions.includes(cid);
            };

            const css = () => `condition-btn ${ctype} ${active() ? 'active' : ''}`;
            const click = () => toggleCondition(cid);
            return html`
                <div class=${css} title=${cdesc} onclick=${click}>${cname}</div>
            `;
        });
    };

    return html`
        <div class="conditions-flex" id="conditionsContainer">
            ${conditionNodes}
        </div>
    `;
}

/**
 * Single Spell Card Component
 */
function SpellCard(props) {
    const s = charState;
    const d = charDerived;
    const spell = props.spell;
    const nameStr = spell.name;

    // 1. Determine Tier Boundaries
    const baseTier = parseInt(spell.tier.replace(/\D/g, '')) || 0;
    const isCantrip = (spell.tier || "").toLowerCase().includes("cantrip");
    const isUtility = (spell.tier || "").toLowerCase().includes("utility");
    const isTiered = !isCantrip && !isUtility;
    
    // Shadowmancer forces max tier
    const isShadowmancerCaster = CLASS_CONFIG.name === "Shadowmancer" && s().subclass !== "Reaver";
    const maxUnlocked = d().maxTier;

    // 2. Get Upcast State
    const upcastState = () => s().spellUpcasts?.[nameStr] || { tier: baseTier, choiceId: null };
    const currentCastTier = () => {
        if (isShadowmancerCaster && isTiered) return maxUnlocked;
        return upcastState().tier;
    };
    const selectedChoiceId = () => upcastState().choiceId || (spell.upcastChoices?.[0]?.id || null);

    // 3. Resolve scaling
    const resolved = () => resolveUpcast(spell, currentCastTier(), selectedChoiceId());
    
    const isUpcastActive = () => currentCastTier() > baseTier;
    const schoolLow = (spell.school || "").toLowerCase();
    const cardCss = () => `spell-card ${schoolLow} ${isUpcastActive() ? 'upcast-active' : ''}`;

    // 4. Pip Logic
    const pipNodes = () => {
        if (!isTiered) return html`<span>${formatPips(spell.tier, spell.school)}</span>`;
        
        const nodes = [];
        const cur = currentCastTier();
        const max = maxUnlocked;
        
        const pipStyBase = "display:inline-block; width:1.2em; text-align:center; font-size:1.1em; line-height:1;";

        // Base pips (●)
        for (let i = 1; i <= baseTier; i++) {
            nodes.push(html`<span style=${`color:var(--text-main); ${pipStyBase}`}>●</span>`);
        }
        // Potential upcast pips (○ or ● if selected)
        for (let i = baseTier + 1; i <= max; i++) {
            const idx = i;
            const isF = cur >= idx;
            const click = () => {
                if (isShadowmancerCaster) return;
                const next = (isF && cur === idx) ? idx - 1 : idx;
                setSpellUpcast(nameStr, next, selectedChoiceId());
            };
            
            nodes.push(html`<span onclick=${click} 
                                 style=${() => `cursor:${isShadowmancerCaster ? 'default' : 'pointer'}; 
                                        color:${isF ? 'var(--school-color)' : 'var(--text-muted)'}; 
                                        transition: 0.2s; ${pipStyBase}`}>
                ${() => isF ? '●' : '○'}
            </span>`);
        }
        return html`<div style="display:flex; gap:0; align-items:center;">${nodes}</div>`;
    };

    // 5. Choice Logic
    const choiceNodes = () => {
        if (!spell.upcastChoices || currentCastTier() <= baseTier) return null;
        
        return html`
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px; padding:6px; background:rgba(0,0,0,0.2); border-radius:4px;">
                <div style="font-size:0.65em; text-transform:uppercase; color:var(--gold-light); font-weight:bold; letter-spacing:0.5px; margin-bottom:2px;">Select Upcast Bonus</div>
                ${spell.upcastChoices.map(c => {
                    const isSel = () => selectedChoiceId() === c.id;
                    const click = () => setSpellUpcast(nameStr, currentCastTier(), c.id);
                    return html`
                        <div onclick=${click} style=${() => `display:flex; align-items:center; gap:8px; cursor:pointer; opacity:${isSel() ? 1 : 0.6}; transition:0.2s;`}>
                            <input type="radio" checked=${isSel} style="pointer-events:none;" />
                            <span style=${() => `font-size:0.85em; color:${isSel() ? '#fff' : 'var(--text-muted)'};`}>${c.label}</span>
                        </div>
                    `;
                })}
            </div>
        `;
    };

    const descriptionNode = () => {
        const res = resolved();
        const dsc = res.desc;
        const bData = res.baseData;
        const lvl = s().level;
        const smap = d().statsMap;
        
        // Merge upcast data into the roll context
        const rollCtx = { 
            name: nameStr,
            ...(isCantrip ? { type: 'cantrip', school: spell.school } : {}),
            ...bData 
        };
        
        // HIGHLIGHT FIRST, then resolve stats
        let htmlContent = highlightMechanicalTerms(dsc);
        htmlContent = iStats(htmlContent, lvl, smap, rollCtx);
        
        if (bData.DC) {
            const resolvedDC = iStats(bData.DC, lvl, smap, rollCtx);
            htmlContent += `<div style="margin-top:8px; font-weight:bold; color:var(--gold-light); display:flex; align-items:center; gap:8px;">
                <span>Difficulty Class:</span>
                <span class="prop-hl">DC ${resolvedDC}</span>
            </div>`;
        }
        
        return htmlContent;
    };

    return html`
        <div class=${cardCss} style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: all 0.3s ease;">
            <h4 style="display:flex; justify-content:space-between; align-items:center;">
                <span style="display:flex; align-items:center; gap:8px;">
                    ${nameStr}
                    ${() => isUpcastActive() ? html`<span style="font-size:0.6em; background:var(--class-accent); color:#000; padding:1px 4px; border-radius:3px; font-weight:900;">UPCAST</span>` : ''}
                </span>
                <span class="tier-tag">${() => pipNodes()}</span>
            </h4>
            <div class="spell-desc" style="font-size: 0.85em;" innerHTML=${descriptionNode}></div>
            ${choiceNodes}
        </div>
    `;
}

/**
 * Spells Section Component
 */
function Spells() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const spellNodes = () => {
        const lvl = s().level;
        const sub = s().subclass;
        const state = s();
        const der = d();

        let list = [];
        if (config.getAvailableSpells) {
            list = config.getAvailableSpells(lvl, sub, state, der);
        }
        if (!list) return [];

        const getTierWeight = (tier) => {
            if (!tier) return 99;
            const t = tier.toString();
            if (t === "Utility") return 0;
            if (t.toLowerCase().includes("cantrip")) return 1;
            const match = t.match(/Tier (\d+)/i);
            if (match) return parseInt(match[1]) + 1;
            return 99;
        };

        const sorted = [...list].sort((a, b) => {
            const wa = getTierWeight(a.tier);
            const wb = getTierWeight(b.tier);
            if (wa !== wb) return wa - wb;

            const schA = (a.school || "").toLowerCase();
            const schB = (b.school || "").toLowerCase();
            if (schA !== schB) return schA.localeCompare(schB);

            const nA = (a.name || "").toLowerCase();
            const nB = (b.name || "").toLowerCase();
            return nA.localeCompare(nB);
        });

        return sorted.map(spell => html`<${SpellCard} spell=${spell} />`);
    };

    return html`
        <div class="spell-grid">
            ${spellNodes}
        </div>
    `;
}

/**
 * Features Section Component
 */
function Features() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const spellGen = (spell, level, statsMap) => {
        const n = spell.name;
        const t = spell.tier;
        const sch = spell.school;
        const pips = formatPips(t, sch);
        const low = (sch || "").toLowerCase();
        const cls = `spell-card ${low}`;

        const isCantrip = (t || "").toLowerCase().includes("cantrip") || n === "Vicious Mockery";
        const ctx = { name: n, type: isCantrip ? 'cantrip' : undefined, school: sch };
        const dsc = spell.customHtml ? spell.customHtml : (spell.desc ? iStats(spell.desc, level, statsMap, ctx) : "");
        return `<div class="${cls}" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            <h4>${n} <span class="tier-tag">${pips}</span></h4>
            <div class="spell-desc" style="font-size: 0.85em;">${dsc}</div>
        </div>`;
    };

    const [htmlContent, setHtmlContent] = Solid.createSignal("");

    Solid.createEffect(() => {
        const lvl = s().level;
        const sub = s().subclass;
        const stats = d().statsMap;
        const state = s();
        const der = d();

        const buildBound = (t, lTag, desc, theme = "", skip = false, l2, sm, ctx) =>
            buildFeatureHtml(t, lTag, desc, theme, skip, l2 || lvl, sm || stats, ctx || {});
        const statsBound = (txt, l, sm, ctx) =>
            iStats(txt, l || lvl, sm || stats, ctx || {});

        try {
            let htmlStr = config.getFeaturesHTML(lvl, sub, state, der, buildBound, statsBound, formatPips, spellGen);
            const bgHtml = renderBackgroundFeature(state, lvl, stats, statsBound, buildBound, spellGen);
            const ancHtml = renderAncestryFeature(state, buildBound);

            const final = bgHtml + ancHtml + htmlStr;
            setHtmlContent(final);
        } catch (e) {
            console.error("Error generating features HTML:", e);
            setHtmlContent(`<div style="color:var(--save-dis); padding: 10px; border: 1px solid var(--save-dis); border-radius: 4px; font-style: italic;">Error loading features. Please check console.</div>`);
        }
    });

    return html`
        <div id="featuresContainer" innerHTML=${() => htmlContent()}></div>
    `;
}

/**
 * Main Features and Spells Layout Component
 */
function FeaturesAndSpellsLayout() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const getHasSpells = () => {
        const lvl = s().level;
        const sub = s().subclass;
        const state = s();
        const der = d();
        if (!config.getAvailableSpells) return false;
        const list = config.getAvailableSpells(lvl, sub, state, der);
        return list && list.length > 0;
    };

    const layoutCls = () => getHasSpells() ? 'layout-2col' : 'layout-1col';
    const tierLabel = () => d().maxTier > 0 ? `(Max Tier: ${d().maxTier})` : "";
    const showMinorVal = () => !!s().showMinor;

    const handleMinor = (e) => {
        dispatch({ type: 'SET_STATE_KEY', payload: { key: 'showMinor', value: e.target.checked } });
    };

    Solid.createEffect(() => {
        const active = !!s().showMinor;
        document.body.classList.toggle('show-minor', active);
    });

    return html`
        <div class=${layoutCls}>
            <div class="left-col">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 2px solid var(--class-accent-dim); margin-bottom: 12px; padding-bottom: 4px; height: 35px; box-sizing: border-box;">
                    <h2 class="section-header" style="border: none; margin: 0; padding: 0;">Features & Traits</h2>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85em; color: var(--class-accent); cursor: pointer; font-family: 'Cinzel', serif; font-weight: bold; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--class-border);">
                        <input type="checkbox" id="toggleMinorFeatures" checked=${showMinorVal} oninput=${handleMinor} style="margin: 0; cursor: pointer; flex-shrink: 0;" />
                        <span style="margin-top: 1px;">Show All</span>
                    </label>
                </div>
                <${Features} />
            </div>
            ${() => getHasSpells() ? html`
                <div class="right-col">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 2px solid var(--class-accent-dim); margin-bottom: 12px; padding-bottom: 4px; height: 35px; box-sizing: border-box;">
                        <h2 class="section-header" style="border: none; margin: 0; padding: 0;">Spells</h2>
                        <span style="font-size:0.6em; opacity:0.7; font-weight:normal; color:var(--gold-light); font-family: 'Cinzel', serif; text-transform: uppercase; margin-bottom: 4px;">
                            ${tierLabel}
                        </span>
                    </div>
                    <${Spells} />
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Identity Bar Component (Hero Name, Level, Ancestry, etc.)
 */
function IdentityBar() {
    const s = charState;
    const config = CLASS_CONFIG;

    const handleSet = (key, val) => dispatch({ type: 'SET_STATE_KEY', payload: { key, value: val } });

    const ancGroups = () => {
        let items = [html`<option value="None">None</option>`];
        Object.keys(ANCESTRIES).forEach(group => {
            const opts = ANCESTRIES[group].map(a => html`<option value=${a} selected=${() => s().ancestry === a}>${a}</option>`);
            items.push(html`<optgroup label=${group}>${opts}</optgroup>`);
        });
        return items;
    };

    const bgGroups = () => {
        let items = [html`<option value="None">None</option>`];
        Object.keys(BACKGROUNDS).forEach(group => {
            const opts = BACKGROUNDS[group].map(b => html`<option value=${b} selected=${() => s().background === b}>${b}</option>`);
            items.push(html`<optgroup label=${group}>${opts}</optgroup>`);
        });
        return items;
    };

    const subOpts = () => config.subclasses.map(sc => html`<option value=${sc.value} selected=${() => s().subclass === sc.value}>${sc.label}</option>`);
    const isSubDisabled = () => s().level < 3;

    return html`
        <div class="top-bar" style="margin-bottom: 15px;">
            <div class="panel">
                <label class="panel-title">Hero Name</label>
                <input type="text" id="charName" placeholder="Enter Name..." value=${() => s().charName} oninput=${(e) => handleSet('charName', e.target.value)} />
            </div>
            <div class="panel">
                <label class="panel-title">Level</label>
                <input type="number" id="level" min="1" max="20" value=${() => s().level} oninput=${(e) => handleSet('level', parseInt(e.target.value))} />
            </div>
            <div class="panel">
                <label class="panel-title">Ancestry</label>
                <select id="ancestry" onchange=${(e) => handleSet('ancestry', e.target.value)}>
                    ${ancGroups}
                </select>
            </div>
            <div class="panel">
                <label class="panel-title">Background</label>
                <select id="background" onchange=${(e) => handleSet('background', e.target.value)}>
                    ${bgGroups}
                </select>
            </div>
            <div class="panel">
                <label class="panel-title">Subclass</label>
                <select id="subclass" onchange=${(e) => handleSet('subclass', e.target.value)} disabled=${isSubDisabled}>
                    ${subOpts}
                </select>
            </div>
        </div>
    `;
}

/**
 * SVG Die Component
 */
function Die(props) {
    const faces = () => parseInt(props.faces);
    const color = () => props.color || 'var(--class-accent)';
    const isFilled = () => props.isFilled;

    const getSvgInner = () => {
        const f = faces();
        const c = color();
        const filled = isFilled();
        const fill = filled ? c : 'transparent';

        let shape = '';
        let glow = '';

        if (f === 4) {
            shape = `<polygon points="24,45 3,6 45,6" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,45 3,6 45,6" fill="url(#grad_${f})" />`;
        } else if (f === 8) {
            shape = `<polygon points="24,3 3,24 24,45 45,24" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 3,24 24,45 45,24" fill="url(#grad_${f})" />`;
        } else if (f === 10) {
            shape = `<polygon points="24,3 42,18 24,45 6,18" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 42,18 24,45 6,18" fill="url(#grad_${f})" />`;
        } else if (f === 12) {
            shape = `<polygon points="24,3 43.5,15 36,42 12,42 4.5,15" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 43.5,15 36,42 12,42 4.5,15" fill="url(#grad_${f})" />`;
        } else if (f === 20) {
            shape = `<polygon points="24,3 45,15 45,33 24,45 3,33 3,15" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 45,15 45,33 24,45 3,33 3,15" fill="url(#grad_${f})" />`;
        } else {
            shape = `<rect x="6" y="6" width="36" height="36" rx="3" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<rect x="6" y="6" width="36" height="36" rx="3" fill="url(#grad_${f})" />`;
        }

        return `
            <defs>
                <linearGradient id="grad_${f}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(0,0,0,0.2);stop-opacity:1" />
                </linearGradient>
            </defs>
            ${shape}
            ${glow}
        `;
    };

    return html`
        <svg viewBox="0 0 48 48" style="width: 48px; height: 48px; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" innerHTML=${getSvgInner}></svg>
    `;
}

/**
 * Mechanic Panel Sub-Components
 */
const PanelComponents = {
    Resource: (props) => {
        const id = props.id;
        const label = props.label;
        const max = props.max;
        const val = () => props.value || 0;
        const opt = props.options;
        const sub = opt.subtext;

        const down = () => adjRes(id, -1, max);
        const up = () => adjRes(id, 1, max);
        const set = (e) => adjRes(id, parseInt(e.target.value), max, true);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${label}</label>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div class="dark-incrementer">
                        <button onclick=${down}>-</button>
                        <input type="number" value=${val} onchange=${set} />
                        <button onclick=${up}>+</button>
                    </div>
                    <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ <span style="color: var(--text-main);">${max}</span></div>
                </div>
                ${sub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-style: italic; margin-top: 4px; line-height: 1.1;">${sub}</div>` : ''}
            </div>
        `;
    },

    Roll: (props) => {
        const not = props.notation;
        const lab = props.label;
        const disp = props.display;
        const sub = props.subtext;
        const ctx = props.rollContext;
        const click = () => dispatchRoll(not, lab, ctx);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <label class="roll-link" onclick=${click} 
                      style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px; cursor: pointer;">
                    ${lab}
                </label>
                <div class="roll-link" onclick=${click} 
                     style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                    ${disp}
                </div>
                ${sub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; line-height: 1.1; margin-top: 4px;">${sub}</div>` : ''}
            </div>
        `;
    },

    Stat: (props) => {
        const lab = props.label;
        const sub = props.subtext;
        const opt = props.options;
        const indList = opt.indicators;

        const curVal = () => props.value;
        const colorVal = opt.color || 'var(--gold-light)';
        const valCol = () => curVal() > 0 ? colorVal : '#fff';
        const valLab = () => (curVal() >= 0 ? '+' : '') + curVal();
        
        const vSize = opt.fontSize || '2.2em';
        const valSty = () => `font-size: ${vSize}; font-family: 'Cinzel', serif; font-weight: 900; color: ${valCol()}; line-height: 1;`;

        const iNodes = () => (indList || []).map(ind => {
            const iLab = ind.label;
            const iCol = ind.color;
            const tKey = ind.toggleKey;

            const isActive = () => tKey ? charState()[tKey] === 'BOOM' : ind.active;
            const iSty = () => `display: flex; align-items: center; gap: 6px; cursor: ${tKey ? 'pointer' : 'default'}; opacity: ${isActive() ? '1' : '0.2'};`;
            const lSty = () => `font-size: 0.6em; color: ${isActive() ? iCol : 'var(--text-muted)'}; text-transform: uppercase; font-family: 'Cinzel'; font-weight: bold; letter-spacing: 0.5px;`;
            const pSty = () => `width: 6px; height: 6px; border-radius: 50%; background: ${iCol}; box-shadow: ${isActive() ? `0 0 6px ${iCol}` : ''};`;
            const clickFn = () => tKey ? updateBgChoice(tKey, charState()[tKey] === 'BOOM' ? 'OFF' : 'BOOM') : undefined;

            return html`
                <div onclick=${clickFn} style=${iSty}>
                    <span style=${lSty}>${iLab}</span>
                    <div style=${pSty}></div>
                </div>
            `;
        });

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 80px;">
                <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${lab}</label>
                <span style=${valSty}>${valLab}</span>
                ${sub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-style: italic; text-align: center; line-height: 1.1; margin-top: 4px;">${sub}</div>` : ''}
                ${() => indList ? html`
                    <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 6px; width: 100%; align-items: flex-end;">
                        ${iNodes}
                    </div>
                ` : ''}
            </div>
        `;
    },

    DicePool: (props) => {
        const s = charState;
        const flab = props.label;
        const skey = props.stateKey;
        const maxDiceCount = props.maxDice;
        const opt = props.options;
        const diceVal = () => props.dice;

        const facesCount = parseInt(props.faces.toString().replace(/\D/g, '')) || 6;

        const dieGenerator = (die, idx, place = false) => {
            const expFn = () => (die && die.detail) && die.detail.includes('!');
            const colFn = () => expFn() ? 'var(--gold-light)' : 'var(--class-accent)';

            const remFlag = opt.disableRemove;
            const maxFlag = opt.disableMaximize;
            const statFlag = opt.static;

            const canRem = !place && !remFlag;
            const canMax = !place && !maxFlag;

            const vTot = die ? die.total : "";
            const vDet = die ? die.detail : "";

            const dStyFn = () => `position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: ${canRem || canMax ? 'pointer' : 'default'}; opacity: ${place ? 0.3 : 1};`;

            const clickFn = () => canRem ? removePoolDie(skey, idx, statFlag) : undefined;
            const ctxFn = (e) => { e.preventDefault(); if (canMax) maximizePoolDie(skey, idx, facesCount); };
            const titStr = place ? 'Empty Slot' : `${vDet || vTot}${!canMax ? '' : ' (Right-click to Maximize)'}`;

            return html`
                <div onclick=${clickFn} oncontextmenu=${ctxFn} title=${titStr} style=${dStyFn}>
                    <${Die} faces=${facesCount} isFilled=${!place} color=${colFn()} />
                    ${!place ? html`<span style="position: absolute; font-family: 'Cinzel', serif; font-weight: 900; color: #fff; font-size: 1.4em; text-shadow: 0 0 4px rgba(0,0,0,0.8); pointer-events: none;">${vTot}</span>` : ''}
                </div>
            `;
        };

        const dNodes = () => {
            const list = diceVal();
            if (opt.static) {
                let items = [];
                for (let i = 0; i < maxDiceCount; i++) items.push(dieGenerator(list[i], i, !list[i]));
                return items;
            }
            return (list && list.length > 0) ? list.map((d, i) => dieGenerator(d, i)) : html`<div style="color: var(--text-muted); font-style: italic; font-size: 0.9em; opacity: 0.5; padding: 5px;">Awaiting ${flab}...</div>`;
        };

        const indList = opt.indicators || [];
        const indNodes = () => indList.map(ind => {
            const iLab = ind.label;
            const iCol = ind.color;
            const tKey = ind.toggleKey;
            const isAct = () => tKey ? s()[tKey] === 'BOOM' : ind.active;
            const iSty = () => `width: 8px; height: 8px; border-radius: 50%; background: ${iCol}; box-shadow: ${isAct() ? `0 0 8px ${iCol}` : ''}; opacity: ${isAct() ? '1' : '0.2'}; cursor: ${tKey ? 'pointer' : 'default'};`;
            const clickFn = () => tKey ? updateBgChoice(tKey, charState()[tKey] === 'BOOM' ? 'OFF' : 'BOOM') : undefined;
            return html`
                <div onclick=${clickFn} title=${() => `${iLab}: ${isAct() ? 'ON' : 'OFF'}`} style=${iSty}></div>
            `;
        });

        const rallFlag = opt.rollAll;
        const btnNode = () => {
            if (rallFlag) {
                const click = () => rollPool(skey, maxDiceCount, facesCount);
                return html`<button onclick=${click} style="background: rgba(255,255,255,0.1); border: 1px solid var(--class-accent); color: #fff; font-size: 0.7em; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Roll</button>`;
            }
            const click = () => addPoolDie(skey, maxDiceCount, facesCount);
            return html`<button onclick=${click} style="background: rgba(255,255,255,0.1); border: 1px solid var(--class-accent); color: #fff; font-size: 0.7em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">+ Die</button>`;
        };

        const clearBtnNode = () => {
            const click = () => clearPool(skey);
            return html`<button onclick=${click} style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: var(--text-muted); font-size: 0.7em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Clear</button>`;
        };

        return html`
            <div style="display: flex; flex-direction: column; align-items: stretch;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">${flab} (${facesCount})</label>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            ${indNodes}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        ${btnNode}
                        ${clearBtnNode}
                    </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; min-height: 58px; background: rgba(0,0,0,0.2); border-radius: 4px; padding: 4px;">
                    <div style=${() => `display: flex; gap: 4px; flex-wrap: ${maxDiceCount <= 6 ? 'nowrap' : 'wrap'}; justify-content: center; align-items: center; width: 100%;`}>
                        ${dNodes}
                    </div>
                </div>
            </div>
        `;
    },

    Toggle: (props) => {
        const s = charState;
        const lab = props.label;
        const optList = props.options;
        const skey = props.stateKey;

        const curVal = () => s()[skey] || optList[0];
        const btnNodes = () => optList.map(opt => {
            const bSty = () => `flex: 1; background: ${curVal() === opt ? 'var(--class-accent)' : 'transparent'}; border: 1px solid ${curVal() === opt ? 'var(--class-accent)' : 'rgba(255,255,255,0.2)'}; color: ${curVal() === opt ? '#000' : 'var(--text-muted)'}; font-size: 0.7em; padding: 4px; border-radius: 4px; cursor: pointer; font-family: 'Cinzel'; font-weight: bold;`;
            const click = () => updateBgChoice(skey, opt);
            return html`
                <button onclick=${click} style=${bSty}>${opt}</button>
            `;
        });

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1.2;">
                <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">${lab}</label>
                <div style="display: flex; gap: 4px; width: 100%;">
                    ${btnNodes}
                </div>
            </div>
        `;
    },

    Select: (props) => {
        const sid = props.id;
        const slab = props.label;
        const optList = props.options;
        const scur = props.current;
        const ssub = props.subtext;

        const optNodes = optList.map(opt => html`<option value=${opt} selected=${() => opt === scur}>${opt}</option>`);
        const changeFn = (e) => updateClassState(sid, 0, e.target.value);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1.6;">
                <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${slab}</label>
                <select onchange=${changeFn} style="border-bottom-color: var(--class-accent); font-size: 0.9em; width: 100%;">
                    ${optNodes}
                </select>
                ${ssub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; line-height: 1.1; margin-top: 4px;">${ssub}</div>` : ''}
            </div>
        `;
    },

    RollWithResource: (props) => {
        const s = charState;
        const not = props.notation;
        const lab = props.label;
        const disp = props.display;
        const rid = props.resourceId;
        const rmax = props.resourceMax;
        const rctx = props.rollContext;

        const curVal = () => s().resourceValues[rid] || 0;
        const clickFn = () => dispatchRoll(not, lab, rctx);
        const handleDown = () => adjRes(rid, -1, rmax);
        const handleUp = () => adjRes(rid, 1, rmax);
        const handleSet = (e) => adjRes(rid, parseInt(e.target.value), rmax, true);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1.2;">
                <label class="roll-link" onclick=${clickFn} 
                      style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px; cursor: pointer;">
                    ${lab}
                </label>
                <div class="roll-link" onclick=${clickFn} 
                     style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                    ${disp}
                </div>
                <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                    <div class="dark-incrementer">
                        <button onclick=${handleDown}>-</button>
                        <input type="number" value=${curVal} onchange=${handleSet} />
                        <button onclick=${handleUp}>+</button>
                    </div>
                    <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ ${rmax}</div>
                </div>
            </div>
        `;
    },

    Html: (props) => {
        const raw = props.html;
        return html`<div innerHTML=${raw} style="flex: 1;"></div>`;
    }
};

/**
 * Class Mechanic Panel Component
 */
function MechanicPanel() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const data = () => {
        if (!config.getMechanicPanelHTML) return null;
        return config.getMechanicPanelHTML(s().level, s().subclass, s(), d());
    };

    const hasData = () => {
        const d = data();
        return d && d.sections && d.sections.length > 0;
    };

    const pSty = () => {
        const d = data();
        if (!d) return 'display: none;';
        return `min-height: ${d.minHeight}px; display: flex; flex-direction: column; justify-content: center; padding: 5px 15px;`;
    };

    const secNodes = () => {
        const d = data();
        if (!d || !d.sections) return [];

        return d.sections.map((sec, idx) => {
            const styp = sec.type;
            const sflx = sec.flex;
            const saln = sec.align;
            const smw = sec.minWidth;
            const sprop = sec.props;
            const Comp = PanelComponents[styp];

            const divNode = idx > 0 ? html`<div style="width: 1px; background: rgba(255,255,255,0.15); align-self: center; height: 60px; margin: 0 5px;"></div>` : '';
            const sSty = `flex: ${sflx}; display: flex; flex-direction: column; align-items: ${saln}; justify-content: center; text-align: center; ${smw ? `min-width: ${smw}px;` : ''}`;

            return html`
                ${divNode}
                <div style=${sSty}>
                    ${() => createComp(Comp, sprop)}
                </div>
            `;
        });
    };

    return html`
        <div class="panel mechanic-panel" style=${pSty}>
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                ${secNodes}
            </div>
        </div>
    `;
}

/**
 * Proficiency Row Component (Weapons and Armor)
 */
function ProficiencyRow() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const weapons = () => d().profWeapons || config.proficiencies?.weapons || "--";
    const armor = () => d().profArmor || config.proficiencies?.armor || "--";

    return html`
        <div class="proficiency-row"
            style="margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; align-items: baseline; font-family: 'Cinzel', serif; font-size: 0.8em; color: var(--text-muted); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            <div style="text-align: left; flex: 1.5;"> WEAPONS: <span style="color: #fff;">${weapons}</span></div>
            <div style="text-align: right; flex: 1;"> ARMOR: <span style="color: #fff;">${armor}</span> </div>
        </div>
    `;
}

/**
 * Subtle Debug Readout for OBR Roll Results
 */
function RollResultReadout() {
    const data = lastRollResult;
    
    const getSummary = () => {
        const d = data();
        if (!d || !d.result) return null;
        
        // Extract label from notation if possible: "1d20+2 [WIL Save]" -> "WIL Save"
        const notation = d.result.diceNotation || "";
        const labelMatch = notation.match(/\[(.*?)\]/);
        const label = labelMatch ? labelMatch[1] : "Roll";
        
        return {
            label,
            total: d.result.totalValue,
            summary: d.result.rollSummary
        };
    };

    const info = getSummary;
    
    return html`
        <span style=${() => `
            display: ${data() ? 'inline-flex' : 'none'};
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 0.95em;
            opacity: 0.8;
            animation: fadeIn 0.3s ease;
        `}>
            <span>|</span>
            <span style="font-weight: bold; color: var(--gold-light);">${() => info()?.label}: ${() => info()?.total}</span>
            <span style="font-size: 0.9em; font-style: italic; opacity: 0.6;">(${() => info()?.summary})</span>
            <span onclick=${() => setLastRollResult(null)} 
                    style="cursor: pointer; font-size: 1.2em; line-height: 1; padding: 0 4px; transition: 0.2s;"
                    onmouseover=${(e) => e.target.style.color = '#fff'}
                    onmouseout=${(e) => e.target.style.color = 'var(--text-muted)'}>
                ×
            </span>
        </span>
    `;
}

/**
 * Subtle Action Log Feed
 * Displays auto-clearing notifications for background events.
 */
function LogFeed() {
    const s = charState;
    const [visibleMsg, setVisibleMsg] = Solid.createSignal(null);
    const [lastProcessedId, setLastProcessedId] = Solid.createSignal(0);
    let timer = null;

    Solid.createEffect(() => {
        const logs = s().logs || [];
        if (logs.length > 0) {
            const latest = logs[0];
            if (latest.id !== lastProcessedId()) {
                setVisibleMsg(latest.msg);
                setLastProcessedId(latest.id);
                
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => setVisibleMsg(null), 15000);
            }
        }
    });

    const dismiss = () => setVisibleMsg(null);

    return html`
        <span onclick=${dismiss} 
              title="Click to dismiss"
              style=${() => `
            display: ${visibleMsg() ? 'inline-flex' : 'none'};
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 0.9em;
            font-style: italic;
            opacity: 0.8;
            animation: fadeIn 0.3s ease;
            cursor: pointer;
        `}>
            <span>»</span>
            <span onmouseover=${(e) => e.target.style.color = '#fff'}
                  onmouseout=${(e) => e.target.style.color = 'var(--text-muted)'}
                  style="transition: 0.2s;">
                ${visibleMsg}
            </span>
            <span style="font-size: 1.1em; line-height: 1; padding: 0 4px; opacity: 0.5;">
                ×
            </span>
        </span>
    `;
}

window.NIMBLE_COMPONENTS = {
    Header,
    IdentityBar,
    AttributesSection,
    HPTracker,
    WoundTracker,
    ProficiencyRow,
    InventorySection,
    Skills,
    Conditions,
    CombatControls,
    ActionPip,
    Features,
    FeaturesAndSpellsLayout,
    MechanicPanel,
    RollResultReadout,
    LogFeed
};
