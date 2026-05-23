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
