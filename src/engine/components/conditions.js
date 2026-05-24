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
                if (cid === 'bloodied') return d().isBloodied || s().activeConditions.includes(cid);
                if (cid === 'dying') return (s().hpCurrent ?? d().maxHP) === 0 || s().activeConditions.includes(cid);
                if (cid === 'wounded') return (s().wounds || 0) > 0 || s().activeConditions.includes(cid);
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
