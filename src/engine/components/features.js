/**
 * Features Section Component
 */
function Features() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const spellGen = (spell, level, statsMap) => {
        const n = spell.name;
        const t = spell.tier;
        const sch = spell.school;
        const pips = formatPips(t, sch);
        const low = (sch || "").toLowerCase();
        const cls = `spell-card ${low}`;

        const isCantrip = (t || "").toLowerCase().includes("cantrip") || n === "Vicious Mockery";
        const ctx = { name: n, type: isCantrip ? 'cantrip' : undefined, school: sch };
        const dsc = spell.customHtml ? spell.customHtml : (spell.desc ? iStats(spell.desc, level, statsMap, ctx) : "");
        return `<div class="${cls}" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            <h4>${n} <span class="tier-tag">${pips}</span></h4>
            <div class="spell-desc" style="font-size: 0.85em;">${dsc}</div>
        </div>`;
    };

    const [htmlContent, setHtmlContent] = Solid.createSignal("");

    Solid.createEffect(() => {
        const lvl = s().level;
        const sub = s().subclass;
        const stats = d().statsMap;
        const state = s();
        const der = d();

        const buildBound = (t, lTag, desc, theme = "", skip = false, l2, sm, ctx) =>
            buildFeatureHtml(t, lTag, desc, theme, skip, l2 || lvl, sm || stats, ctx || {});
        const statsBound = (txt, l, sm, ctx) =>
            iStats(txt, l || lvl, sm || stats, ctx || {});

        try {
            let htmlStr = config.getFeaturesHTML(lvl, sub, state, der, buildBound, statsBound, formatPips, spellGen);
            const bgHtml = renderBackgroundFeature(state, lvl, stats, statsBound, buildBound, spellGen);
            const ancHtml = renderAncestryFeature(state, buildBound);

            const final = bgHtml + ancHtml + htmlStr;
            
            const hasSpells = (() => {
                if (!config.getAvailableSpells) return false;
                const list = config.getAvailableSpells(lvl, sub, state, der);
                return list && list.length > 0;
            })();

            if (hasSpells) {
                setHtmlContent(`<div class="features-col-single">${final}</div>`);
            } else {
                // Split final HTML into individual feature cards using lookahead split
                const cards = final.split(/(?=<div class="feature[\s"])/).filter(Boolean);
                const leftCards = [];
                const rightCards = [];
                cards.forEach((card, idx) => {
                    if (idx % 2 === 0) leftCards.push(card);
                    else rightCards.push(card);
                });
                
                setHtmlContent(`
                    <div class="martial-features-container">
                        <div class="features-col-left">${leftCards.join('')}</div>
                        <div class="features-col-right">${rightCards.join('')}</div>
                    </div>
                `);
            }
        } catch (e) {
            console.error("Error generating features HTML:", e);
            setHtmlContent(`<div style="color:var(--save-dis); padding: 10px; border: 1px solid var(--save-dis); border-radius: 4px; font-style: italic;">Error loading features. Please check console.</div>`);
        }
    });

    return html`
        <div id="featuresContainer" innerHTML=${() => htmlContent()}></div>
    `;
}

/**
 * Main Features and Spells Layout Component
 */
function FeaturesAndSpellsLayout() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const getHasSpells = () => {
        const lvl = s().level;
        const sub = s().subclass;
        const state = s();
        const der = d();
        if (!config.getAvailableSpells) return false;
        const list = config.getAvailableSpells(lvl, sub, state, der);
        return list && list.length > 0;
    };

    const layoutCls = () => getHasSpells() ? 'layout-2col' : 'layout-1col';
    const tierLabel = () => d().maxTier > 0 ? `(Max Tier: ${d().maxTier})` : "";
    const showMinorVal = () => !!s().showMinor;

    const handleMinor = (e) => {
        dispatch({ type: 'SET_STATE_KEY', payload: { key: 'showMinor', value: e.target.checked } });
    };

    Solid.createEffect(() => {
        const active = !!s().showMinor;
        document.body.classList.toggle('show-minor', active);
    });

    return html`
        <div class=${layoutCls}>
            <div class="left-col">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 2px solid var(--class-accent-dim); margin-bottom: 12px; padding-bottom: 4px; height: 35px; box-sizing: border-box;">
                    <h2 class="section-header" style="border: none; margin: 0; padding: 0;">Features & Traits</h2>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85em; color: var(--class-accent); cursor: pointer; font-family: 'Cinzel', serif; font-weight: bold; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--class-border);">
                        <input type="checkbox" id="toggleMinorFeatures" checked=${showMinorVal} oninput=${handleMinor} style="margin: 0; cursor: pointer; flex-shrink: 0;" />
                        <span style="margin-top: 1px;">Show All</span>
                    </label>
                </div>
                <${Features} />
            </div>
            ${() => getHasSpells() ? html`
                <div class="right-col">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 2px solid var(--class-accent-dim); margin-bottom: 12px; padding-bottom: 4px; height: 35px; box-sizing: border-box;">
                        <h2 class="section-header" style="border: none; margin: 0; padding: 0;">Spells</h2>
                        <span style="font-size:0.6em; opacity:0.7; font-weight:normal; color:var(--gold-light); font-family: 'Cinzel', serif; text-transform: uppercase; margin-bottom: 4px;">
                            ${tierLabel}
                        </span>
                    </div>
                    <${Spells} />
                </div>
            ` : ''}
        </div>
    `;
}
