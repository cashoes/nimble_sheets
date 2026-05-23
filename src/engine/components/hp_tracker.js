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
                    <${NumberSpinner} id="displayCurrentHP" value=${hpVal} onAdjust=${adjHP} onSet=${(val) => adjHP(val, true)} />
                    <div class="max-text">/ <span id="displayMaxHP" style="color:var(--text-main);">${hpMaxVal}</span></div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 15px; gap: 8px;">
                <label style="color: var(--text-muted); font-size: 0.8em; margin:0;">Temp HP</label>
                <${NumberSpinner} id="displayTempHP" value=${tempVal} onAdjust=${adjTempHP} onSet=${(val) => adjTempHP(val, true)} style="color: var(--class-accent);" />
            </div>
        </div>

        <div class="res-row">
            <label id="hitDiceLabel" class="roll-link" onclick=${rollHD}>Hit Dice (d${hdFace})</label>
            <div style="display: flex; align-items: center; gap: 8px;">
                <${NumberSpinner} id="displayHD" value=${hdVal} onAdjust=${adjHD} onSet=${(val) => adjHD(val, true)} />
                <div class="max-text">/ <span id="maxHD" style="color:var(--text-main);">${hdMaxVal}</span></div>
            </div>
        </div>
    `;
}
