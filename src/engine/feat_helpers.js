/**
 * CORE HELPERS MODULE
 */
function bFeat(t, l, d, theme = "", skip = false, level, statsMap, context = {}) { 
    const featContext = { ...context, name: t };
    const desc = skip ? d : iStats(d, level, statsMap, featContext); 
    return `<div class="feature ${theme}"><h3>${t} ${l ? `<span class="level-tag">Lvl ${l}</span>` : ''}</h3><div class="feature-desc">${desc}</div></div>`; 
}

function defaultRenderFeature(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, optionsRef, configRef) {
    const statsMap = derived.statsMap;
    let isChoice = feat.type === "choice" || feat.type === "dynamic_choice";
    let count = feat.type === "dynamic_choice" ? feat.getCount(level, subclass, state) : (feat.count || 1);
    let collection = feat.collection;
    let context = feat.context || {};
    
    // Auto-detect attack context for certain common IDs if not specified
    if (!feat.context && (feat.id === "zealot" || feat.id === "torment" || feat.id === "tactics" || feat.id === "rage" || feat.id?.startsWith("sneak_attack") || feat.id === "minions" || feat.id === "conduit")) {
        if (feat.id === "minions") context = { isMinion: true };
        else if (feat.id === "conduit") context = { type: 'attack', stat: 'int' };
        else context = { type: 'attack', stat: (feat.id === 'zealot' || feat.id === 'torment' || feat.id === 'rage') ? 'str' : (feat.id?.startsWith("sneak_attack") ? 'dex' : undefined) };
    }

    let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, derived, rSSC) : (feat.desc || "");

    let finalCssClass = cssClass || "";
    if (feat.minor) finalCssClass += " minor-feature";

    if (feat.type === "choice" || feat.type === "dynamic_choice") {
        let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
        let selection = state[feat.stateKey] || [];
        let options = Object.keys(optionsRef[collection] || {});

        let optsHtml = `<option value="None">-- Select Option --</option>`;
        options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

        for (let i = 0; i < count; i++) {
            let idx = (feat.startIndex || 0) + i;
            let val = selection[idx] || "None";
            let d = (val !== "None" && optionsRef[collection][val]) ? optionsRef[collection][val].desc : "";

            choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, statsMap, context)}</div>
            </div>`;
        }
        desc += choiceHtml + `</div>`;
    }

    return bFeat(feat.name, feat.level || "", desc, finalCssClass, false, level, statsMap, context);
}

function defaultGetFeaturesHTML(level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, featuresRef, optionsRef, configRef) {
    let fHtml = "";
    const sCls = "subclass-feature";
    const subData = featuresRef.subclasses[subclass] || {};
    const replacedIds = new Set();

    // 1. Identify replaced core features
    Object.values(subData).forEach(lvlFeats => {
        lvlFeats.forEach(f => {
            if (f.replaces) {
                if (Array.isArray(f.replaces)) f.replaces.forEach(id => replacedIds.add(id));
                else replacedIds.add(f.replaces);
            }
        });
    });

    // 2. Render level by level
    const renderFn = configRef.renderFeature ? configRef.renderFeature.bind(configRef) : defaultRenderFeature;
    for (let l = 1; l <= level; l++) {
        if (featuresRef.core[l]) {
            featuresRef.core[l].forEach(feat => {
                if (!replacedIds.has(feat.id)) {
                    fHtml += renderFn(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, "", optionsRef, configRef);
                }
            });
        }
        if (subData[l]) {
            subData[l].forEach(feat => {
                fHtml += renderFn(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, sCls, optionsRef, configRef);
            });
        }
    }

    return fHtml;
}

function formatPips(tier, school = null) { 
    const tStr = String(tier); 
    const tNum = parseInt(tStr.replace(/\D/g, '')) || 0; 
    let pips = ""; 
    if (tNum > 0) { for (let i = 0; i < tNum; i++) pips += "●"; } 
    else if (tStr.toLowerCase().includes("cantrip")) { pips = "○"; } 
    if (!pips) return tStr; 
    
    let color = 'var(--subclass-accent, var(--class-accent))';
    if (school) {
        const s = school.toLowerCase();
        if (['fire', 'ice', 'lightning', 'wind', 'radiant', 'necrotic'].includes(s)) {
            color = `var(--${s}-school)`;
        }
    }

    return `${tStr} <span style="letter-spacing:2px; color:${color}; margin-left:8px;">${pips}</span>`; 
}
