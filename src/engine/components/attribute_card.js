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
