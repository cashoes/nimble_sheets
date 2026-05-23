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
