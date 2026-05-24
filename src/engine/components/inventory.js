/**
 * Inventory Item Row Component
 */
function InventoryRow(props) {
    const s = charState;
    const d = charDerived;
    const item = props.item;
    const id = item.id;

    const isLib = () => !item.isCustom;

    const isEquipped = () => item.equipped;
    const nameStr = () => item.name || '';
    const typeStr = () => item.type || 'misc';
    const atypeStr = () => item.armorType || 'light';
    const propsVal = () => item.props || '';
    const costVal = () => item.cost || 0;
    const slotsVal = () => item.slots || 1;
    const armorStr = () => item.armor || '';
    const statKey = () => item.stat || 'str';

    const diceStr = () => {
        if (!item.isCustom) return item.dmgDice || '';
        return `${item.dmgNum || 1}d${item.dmgDieType || 6}`;
    };

    const rowClass = () => `inv-row ${isEquipped() ? 'equipped' : ''} ${isLib() ? 'library-item' : ''}`;

    const handleEquip = (e) => updateItem(id, 'equipped', e.target.checked, true);
    const handleName = (e) => updateItem(id, 'name', e.target.value);
    const handleProps = (e) => updateItem(id, 'props', e.target.value);
    const handleCost = (e) => updateItem(id, 'cost', parseInt(e.target.value) || 0);
    const handleSlots = (e) => updateItem(id, 'slots', parseInt(e.target.value) || 0);
    const handleArmor = (e) => updateItem(id, 'armor', parseInt(e.target.value) || 0);
    const handleStat = (e) => updateItem(id, 'stat', e.target.value);
    const handleDel = () => deleteItem(id);

    const isWeapon = () => typeStr() === 'melee' || typeStr() === 'ranged';
    const handleReach = (e) => updateItem(id, 'reach', e.target.value);
    const reachNode = () => {
        if (!isWeapon()) return '-';
        if (isLib()) {
            if (typeStr() === 'melee') return item.reach || '1';
            if (typeStr() === 'ranged') return item.range || '5/10';
            return '-';
        }
        return html`<input type="text" class="inv-input" value=${() => item.reach || '1'} style="text-align:center;" onchange=${handleReach} />`;
    };

    const getDisplayType = () => {
        if (typeStr() === 'melee') return 'melee';
        if (typeStr() === 'ranged') return 'ranged';
        if (typeStr() === 'shield') return 'shields';
        if (typeStr() === 'armor') {
            const cat = (item.category || "").toLowerCase();
            if (cat.includes('cloth')) return 'cloth';
            if (cat.includes('leather')) return 'leather';
            if (cat.includes('mail')) return 'mail';
            if (cat.includes('plate')) return 'plate';
            return atypeStr() + ' armor';
        }
        return item.category || typeStr() || 'misc';
    };

    const isProficientInArmor = (category) => {
        const profs = d().profArmor || [];
        const catLower = (category || "").toLowerCase();
        
        let allowed = new Set();
        profs.forEach(p => {
            const pLower = p.toLowerCase();
            if (pLower.includes("all armor") || pLower.includes("plate")) {
                allowed.add("cloth").add("leather").add("mail").add("plate").add("shields").add("light").add("medium").add("heavy");
            }
            if (pLower.includes("mail")) {
                allowed.add("cloth").add("leather").add("mail").add("light").add("medium");
            }
            if (pLower.includes("leather")) {
                allowed.add("cloth").add("leather").add("light");
            }
            if (pLower.includes("cloth")) {
                allowed.add("cloth").add("light");
            }
            if (pLower.includes("shields") || pLower.includes("shield")) {
                allowed.add("shields");
            }
        });

        const targetCat = catLower.includes("shield") ? "shields" : catLower;
        return Array.from(allowed).some(a => {
            if (a === 'shields') return targetCat.includes('shield');
            return targetCat.includes(a);
        });
    };

    const weaponStatsEdit = () => html`
        <div style="display:flex; flex-direction:row; gap:3px; width:100%; align-items:center; justify-content:center;">
            <select class="inv-input" style="width:36px; padding:0; text-align-last:center;" onchange=${(e) => {
                const val = e.target.value;
                updateItem(id, 'type', val);
                updateItem(id, 'weaponType', val);
                updateItem(id, 'category', val);
            }}>
                <option value="melee" selected=${() => typeStr() === 'melee'}>M</option>
                <option value="ranged" selected=${() => typeStr() === 'ranged'}>R</option>
            </select>
            <input type="number" class="inv-input" value=${() => item.dmgNum || 1} min="1" max="10" style="width:22px; text-align:center; padding:0;" 
                   onchange=${(e) => updateItem(id, 'dmgNum', parseInt(e.target.value) || 1)} />
            <span style="font-size:0.85em; opacity:0.8;">d</span>
            <select class="inv-input" style="width:36px; padding:0; text-align-last:center;" onchange=${(e) => updateItem(id, 'dmgDieType', e.target.value)}>
                <option value="4" selected=${() => item.dmgDieType === '4'}>4</option>
                <option value="6" selected=${() => item.dmgDieType === '6'}>6</option>
                <option value="8" selected=${() => item.dmgDieType === '8'}>8</option>
                <option value="10" selected=${() => item.dmgDieType === '10'}>10</option>
                <option value="12" selected=${() => item.dmgDieType === '12'}>12</option>
                <option value="20" selected=${() => item.dmgDieType === '20'}>20</option>
            </select>
            <select class="inv-input" style="width:42px; padding:0; text-align-last:center;" onchange=${handleStat}>
                <option value="str" selected=${() => statKey() === 'str'}>STR</option>
                <option value="dex" selected=${() => statKey() === 'dex'}>DEX</option>
                <option value="int" selected=${() => statKey() === 'int'}>INT</option>
                <option value="wil" selected=${() => statKey() === 'wil'}>WIL</option>
            </select>
        </div>
    `;

    const armorStatsEdit = () => html`
        <div style="display:flex; flex-direction:row; gap:4px; width:100%; align-items:center; justify-content:center;">
            <select class="inv-input" style="flex:1; min-width:0; padding:0; text-align-last:center;" onchange=${(e) => {
                const val = e.target.value;
                updateItem(id, 'type', val === 'shield' ? 'shield' : 'armor');
                updateItem(id, 'category', val === 'shield' ? 'Shields' : val.charAt(0).toUpperCase() + val.slice(1));
                updateItem(id, 'armorType', val === 'cloth' || val === 'leather' ? 'light' : (val === 'mail' ? 'medium' : (val === 'plate' ? 'heavy' : '')));
            }}>
                <option value="cloth" selected=${() => (item.category || '').toLowerCase() === 'cloth'}>Cloth</option>
                <option value="leather" selected=${() => (item.category || '').toLowerCase() === 'leather'}>Leather</option>
                <option value="mail" selected=${() => (item.category || '').toLowerCase() === 'mail'}>Mail</option>
                <option value="plate" selected=${() => (item.category || '').toLowerCase() === 'plate'}>Plate</option>
                <option value="shield" selected=${() => (item.category || '').toLowerCase().includes('shield')}>Shield</option>
            </select>
            <input type="number" class="inv-input" value=${() => armorStr()} style="width:26px; text-align:center; padding:0;" onchange=${handleArmor} />
            <span style="font-size:0.85em; opacity:0.8;">AC</span>
        </div>
    `;

    const effectNode = () => {
        const smap = d().statsMap;
        const isProf = isProficientInArmor(item.category);
        
        if (isWeapon()) {
            const val = smap[statKey()];
            const lab = (val >= 0 ? '+' : '') + val;
            const displayFormula = `${diceStr()}${lab}`;
            
            let weaponType = typeStr() === 'ranged' ? 'ranged' : (typeStr() === 'melee' ? 'melee' : null);
            if (!weaponType) {
                weaponType = (item.category || "").toLowerCase().includes('ranged') ? 'ranged' : 'melee';
            }
            
            const click = () => dispatchRoll(displayFormula, nameStr(), { 
                stat: statKey(), 
                type: 'attack',
                metadata: { weaponType } 
            });
            return html`<span class="roll-link" onclick=${click}>⚔️ ${displayFormula}</span>`;
        }
        if (typeStr() === 'armor') {
            const base = parseInt(armorStr()) || 0;
            const dmax = atypeStr() === 'light' ? 99 : (atypeStr() === 'medium' ? 2 : 0);
            const ac = base + Math.min(smap.dex, dmax);
            return html`<span>🛡️ ${ac} AC ${!isProf && isEquipped() ? html`<span style="color:var(--save-dis); margin-left:4px; cursor:help;" title="Warning: Wearing non-proficient armor!">⚠️</span>` : ''}</span>`;
        }
        if (typeStr() === 'shield') {
            return html`<span>🛡️ +${armorStr()} AC ${!isProf && isEquipped() ? html`<span style="color:var(--save-dis); margin-left:4px; cursor:help;" title="Warning: Wearing non-proficient shield!">⚠️</span>` : ''}</span>`;
        }
        return '-';
    };

    const statsNode = () => {
        const smap = d().statsMap;
        if (isWeapon()) {
            if (isLib()) {
                const val = smap[statKey()];
                const lab = (val >= 0 ? '+' : '') + val;
                const snam = statKey().toUpperCase();
                return html`<span>${diceStr()} (<span class="stat-hl">${lab}</span> ${snam})</span>`;
            } else {
                return weaponStatsEdit();
            }
        }
        if (typeStr() === 'armor' || typeStr() === 'shield') {
            if (isLib()) {
                const dval = smap.dex;
                const dlab = (dval >= 0 ? '+' : '') + dval;
                const dnode = html`<span class="stat-hl">${dlab}</span> DEX`;
                if (atypeStr() === 'light') return html`<span>+${armorStr()} (${dnode})</span>`;
                if (atypeStr() === 'medium') return html`<span>+${armorStr()} max(${dnode}, 2)</span>`;
                return `+${armorStr()}`;
            } else {
                return armorStatsEdit();
            }
        }
        return '-';
    };

    const handleType = (e) => {
        const val = e.target.value;
        if (val === 'weapon') {
            updateItem(id, 'type', 'melee'); // default to melee
            updateItem(id, 'weaponType', 'melee');
            updateItem(id, 'category', 'melee');
            updateItem(id, 'dmgNum', 1);
            updateItem(id, 'dmgDieType', '6');
        } else if (val === 'armor') {
            updateItem(id, 'type', 'armor');
            updateItem(id, 'category', 'Cloth'); // default to Cloth
            updateItem(id, 'armorType', 'light');
            updateItem(id, 'armor', 0);
        } else {
            updateItem(id, 'type', 'misc');
            updateItem(id, 'category', 'Misc');
        }
    };

    const typeNode = () => {
        if (isLib()) {
            return html`<div style="color:var(--text-muted); text-transform:capitalize; text-align:center; line-height:1.2;">
                ${getDisplayType()}
            </div>`;
        }
        return html`
            <div style="width:100%; text-align:center;">
                <select class="inv-input" style="text-align-last: center;" onchange=${handleType}>
                    <option value="misc" selected=${() => typeStr() === 'misc'}>Misc</option>
                    <option value="weapon" selected=${() => typeStr() === 'melee' || typeStr() === 'ranged'}>Weapon</option>
                    <option value="armor" selected=${() => typeStr() === 'armor' || typeStr() === 'shield'}>Armor</option>
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
                ${() => isLib() ? 
                    html`<div style="font-weight:bold; color:#fff; text-align:left; padding: 4px 0;">${nameStr()}</div>` : 
                    html`<input type="text" class="inv-input" value=${() => nameStr()} style="text-align:left;" onchange=${handleName} />`
                }
            </div>
            ${typeNode}
            <div>
                ${() => isLib() ? 
                    html`<div style="font-size:0.85em; color:var(--text-muted); text-align:left; line-height:1.2; padding: 4px 0;">${propsVal() || ''}</div>` : 
                    html`<textarea ref=${el => taRef = el} class="inv-input" 
                          rows="1"
                          style="resize:none; overflow:hidden; text-align:left;" 
                          oninput=${handleAutoResize}
                          onchange=${handleProps}>${() => propsVal() || ''}</textarea>`
                }
            </div>
            <div style="text-align:center; color:var(--text-muted);">
                ${reachNode}
            </div>
            <div style="display:flex; justify-content:center;">
                ${() => isLib() ? html`<span style="opacity:0.8;">${costVal() || 0}</span>` : html`
                    <input type="number" class="inv-input" value=${() => costVal() || 0} onchange=${handleCost} />
                `}
            </div>
            <div style="display:flex; justify-content:center;">
                ${() => isLib() ? html`<span style="opacity:0.8;">${slotsVal()}</span>` : html`
                    <input type="number" class="inv-input" value=${() => slotsVal()} onchange=${handleSlots} />
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
 * Inventory List Component
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
