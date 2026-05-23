/**
 * Generic Number Spinner Component
 * Reusable control for adjusting resource, HP, Temp HP, or Hit Dice.
 * 
 * Props:
 *  - id: optional string for element ID
 *  - value: Solid accessor or value
 *  - onAdjust: function(amount) to increment/decrement
 *  - onSet: function(value) to set a specific numeric value
 *  - class: optional css class string
 *  - style: optional css style string
 */
function NumberSpinner(props) {
    return html`<div class=${`dark-incrementer ${props.class || ''}`}><button onclick=${() => props.onAdjust(-1)}>-</button><input type="number" id=${props.id || ''} value=${() => typeof props.value === 'function' ? props.value() : props.value} onchange=${(e) => { const v = parseInt(e.target.value); props.onSet(isNaN(v) ? 0 : v); }} style=${props.style || ''} /><button onclick=${() => props.onAdjust(1)}>+</button></div>`;
}
