/**
 * Single Spell Card Component
 */
function SpellCard(props) {
    const s = charState;
    const d = charDerived;
    const spell = props.spell;
    const nameStr = spell.name;

    // 1. Determine Tier Boundaries
    const baseTier = parseInt(spell.tier.replace(/\D/g, '')) || 0;
    const isCantrip = (spell.tier || "").toLowerCase().includes("cantrip");
    const isUtility = (spell.tier || "").toLowerCase().includes("utility");
    const isTiered = !isCantrip && !isUtility;
    
    // Shadowmancer forces max tier
    const isShadowmancerCaster = CLASS_CONFIG.name === "Shadowmancer" && s().subclass !== "Reaver";
    const maxUnlocked = d().maxTier;

    // 2. Get Upcast State
    const upcastState = () => s().spellUpcasts?.[nameStr] || { tier: baseTier, choiceId: null };
    const currentCastTier = () => {
        if (isShadowmancerCaster && isTiered) return maxUnlocked;
        return upcastState().tier;
    };
    const selectedChoiceId = () => upcastState().choiceId || (spell.upcastChoices?.[0]?.id || null);

    // 3. Resolve scaling
    const resolved = () => resolveUpcast(spell, currentCastTier(), selectedChoiceId());
    
    const isUpcastActive = () => currentCastTier() > baseTier;
    const schoolLow = (spell.school || "").toLowerCase();
    const cardCss = () => `spell-card ${schoolLow} ${isUpcastActive() ? 'upcast-active' : ''}`;

    // 4. Pip Logic
    const pipNodes = () => {
        if (!isTiered) return html`<span>${formatPips(spell.tier, spell.school)}</span>`;
        
        const nodes = [];
        const cur = currentCastTier();
        const max = maxUnlocked;
        
        const pipStyBase = "display:inline-block; width:1.2em; text-align:center; font-size:1.1em; line-height:1;";

        // Base pips (●)
        for (let i = 1; i <= baseTier; i++) {
            nodes.push(html`<span style=${`color:var(--text-main); ${pipStyBase}`}>●</span>`);
        }
        // Potential upcast pips (○ or ● if selected)
        for (let i = baseTier + 1; i <= max; i++) {
            const idx = i;
            const isF = cur >= idx;
            const click = () => {
                if (isShadowmancerCaster) return;
                const next = (isF && cur === idx) ? idx - 1 : idx;
                setSpellUpcast(nameStr, next, selectedChoiceId());
            };
            
            nodes.push(html`<span onclick=${click} 
                                 style=${() => `cursor:${isShadowmancerCaster ? 'default' : 'pointer'}; 
                                        color:${isF ? 'var(--school-color)' : 'var(--text-muted)'}; 
                                        transition: 0.2s; ${pipStyBase}`}>
                ${() => isF ? '●' : '○'}
            </span>`);
        }
        return html`<div style="display:flex; gap:0; align-items:center;">${nodes}</div>`;
    };

    // 5. Choice Logic
    const choiceNodes = () => {
        if (!spell.upcastChoices || currentCastTier() <= baseTier) return null;
        
        return html`
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px; padding:6px; background:rgba(0,0,0,0.2); border-radius:4px;">
                <div style="font-size:0.65em; text-transform:uppercase; color:var(--gold-light); font-weight:bold; letter-spacing:0.5px; margin-bottom:2px;">Select Upcast Bonus</div>
                ${spell.upcastChoices.map(c => {
                    const isSel = () => selectedChoiceId() === c.id;
                    const click = () => setSpellUpcast(nameStr, currentCastTier(), c.id);
                    return html`
                        <div onclick=${click} style=${() => `display:flex; align-items:center; gap:8px; cursor:pointer; opacity:${isSel() ? 1 : 0.6}; transition:0.2s;`}>
                            <input type="radio" checked=${isSel} style="pointer-events:none;" />
                            <span style=${() => `font-size:0.85em; color:${isSel() ? '#fff' : 'var(--text-muted)'};`}>${c.label}</span>
                        </div>
                    `;
                })}
            </div>
        `;
    };

    const descriptionNode = () => {
        const res = resolved();
        const dsc = res.desc;
        const bData = res.baseData;
        const lvl = s().level;
        const smap = d().statsMap;
        
        // Merge upcast data into the roll context
        const rollCtx = { 
            name: nameStr,
            ...(isCantrip ? { type: 'cantrip', school: spell.school } : {}),
            ...bData,
            metadata: { weaponType: 'ranged' } // Tiered spells are treated as ranged for automation
        };
        
        // HIGHLIGHT FIRST, then resolve stats
        let htmlContent = highlightMechanicalTerms(dsc);
        htmlContent = iStats(htmlContent, lvl, smap, rollCtx);
        
        if (bData.DC) {
            const resolvedDC = iStats(bData.DC, lvl, smap, rollCtx);
            htmlContent += `<div style="margin-top:8px; font-weight:bold; color:var(--gold-light); display:flex; align-items:center; gap:8px;">
                <span>Difficulty Class:</span>
                <span class="prop-hl">DC ${resolvedDC}</span>
            </div>`;
        }
        
        return htmlContent;
    };

    return html`
        <div class=${cardCss} style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: all 0.3s ease;">
            <h4 style="display:flex; justify-content:space-between; align-items:center;">
                <span style="display:flex; align-items:center; gap:8px;">
                    ${nameStr}
                    ${() => isUpcastActive() ? html`<span style="font-size:0.6em; background:var(--class-accent); color:#000; padding:1px 4px; border-radius:3px; font-weight:900;">UPCAST</span>` : ''}
                </span>
                <span class="tier-tag">${() => pipNodes()}</span>
            </h4>
            <div class="spell-desc" style="font-size: 0.85em;" innerHTML=${descriptionNode}></div>
            ${choiceNodes}
        </div>
    `;
}

/**
 * Spells Section Component
 */
function Spells() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const spellNodes = () => {
        const lvl = s().level;
        const sub = s().subclass;
        const state = s();
        const der = d();

        let list = [];
        if (config.getAvailableSpells) {
            list = config.getAvailableSpells(lvl, sub, state, der);
        }
        if (!list) return [];

        const getTierWeight = (tier) => {
            if (!tier) return 99;
            const t = tier.toString();
            if (t === "Utility") return 0;
            if (t.toLowerCase().includes("cantrip")) return 1;
            const match = t.match(/Tier (\d+)/i);
            if (match) return parseInt(match[1]) + 1;
            return 99;
        };

        const sorted = [...list].sort((a, b) => {
            const wa = getTierWeight(a.tier);
            const wb = getTierWeight(b.tier);
            if (wa !== wb) return wa - wb;

            const schA = (a.school || "").toLowerCase();
            const schB = (b.school || "").toLowerCase();
            if (schA !== schB) return schA.localeCompare(schB);

            const nA = (a.name || "").toLowerCase();
            const nB = (b.name || "").toLowerCase();
            return nA.localeCompare(nB);
        });

        return sorted.map(spell => html`<${SpellCard} spell=${spell} />`);
    };

    return html`
        <div class="spell-grid">
            ${spellNodes}
        </div>
    `;
}
