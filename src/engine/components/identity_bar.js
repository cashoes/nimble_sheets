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
