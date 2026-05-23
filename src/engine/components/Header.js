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
