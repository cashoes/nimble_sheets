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
            <div id="advDisplay" class=${() => `adv-val ${getCss()}`}>{${getLabel}}</div>
            <button class="adv-btn" onclick=${handleUp}>+</button>
        </div>
    `;
}
