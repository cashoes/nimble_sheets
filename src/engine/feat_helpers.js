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
    let count = (feat.type === "dynamic_choice" || feat.type === "spell_choice") ? (typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1)) : (feat.count || 1);
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

    if (feat.type === "choice" || feat.type === "dynamic_choice" || feat.type === "spell_choice") {
        let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
        let selection = state[feat.stateKey] || [];
        
        if (feat.type === "spell_choice") {
            // Refined spell selection UI: No embedded cards, supports multiple dropdowns
            let schools = Array.isArray(feat.schools) ? feat.schools : [feat.schools];
            
            // Filter by known schools if filterKnown is true
            if (feat.filterKnown && configRef && configRef.getKnownSchools) {
                const known = configRef.getKnownSchools(level, subclass, state);
                schools = schools.filter(school => known.includes(school));
            }

            const isUtility = feat.spellType === "utility";
            const isSchool = feat.spellType === "school";
            const isCantrip = feat.spellType === "cantrip";
            
            if (feat.perSchool && configRef && configRef.getKnownSchools) {
                // SPECIAL MODE: One (or more) dropdowns PER school known
                const known = configRef.getKnownSchools(level, subclass, state);
                const multiplier = typeof feat.multiplier === 'function' ? feat.multiplier(level, subclass, state) : (feat.multiplier || 1);
                
                if (multiplier > 0) {
                    let totalIdx = 0;
                    for (let m = 0; m < multiplier; m++) {
                        known.forEach(school => {
                            if (!UTILITY_SPELLS[school]) return;
                            
                            let idx = (feat.startIndex || 0) + totalIdx;
                            let val = selection[idx] || "None";
                            let optsHtml = `<option value="None">-- Select ${school} Utility --</option>`;
                            
                            Object.keys(UTILITY_SPELLS[school]).forEach(sName => {
                                optsHtml += `<option value="${sName}" ${val === sName ? 'selected' : ''}>${sName}</option>`;
                            });

                            choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                                <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; display: block; margin-bottom: 4px;">${school} School</label>
                                <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                            </div>`;
                            totalIdx++;
                        });
                    }
                }
            } else {
                // REGULAR MODE: count dropdowns from schools list
                const isPaired = feat.spellType === "paired";
                
                for (let i = 0; i < count; i++) {
                    let idx = (feat.startIndex || 0) + i;
                    let val = selection[idx] || "None";
                    
                    // For paired mode, alternating dropdowns are Utility then Tiered
                    const effectiveType = isPaired ? (i % 2 === 0 ? "utility" : "tiered") : feat.spellType;
                    const effectiveTier = isPaired ? (i % 2 === 0 ? null : (feat.tiers ? feat.tiers[Math.floor(i/2)] : feat.tier)) : feat.tier;
                    
                    let selectLabel = isSchool ? 'School' : (effectiveType === 'cantrip' ? 'Cantrip' : (effectiveType === 'utility' ? 'Utility' : 'Spell'));
                    let optsHtml = `<option value="None">-- Select ${selectLabel} --</option>`;
                    if (isSchool) {
                        schools.forEach(school => {
                            optsHtml += `<option value="${school}" ${val === school ? 'selected' : ''}>${school}</option>`;
                        });
                    } else {
                        schools.forEach(school => {
                            const source = (effectiveType === "utility") ? UTILITY_SPELLS : SPELL_REGISTRY;
                            if (source[school]) {
                                let spells = Object.entries(source[school]);
                                if (effectiveType === "cantrip") {
                                    spells = spells.filter(([_, data]) => data.tier.toLowerCase().includes('cantrip'));
                                } else if (effectiveTier) {
                                    spells = spells.filter(([_, data]) => data.tier === `Tier ${effectiveTier}`);
                                }

                                if (spells.length > 0) {
                                    optsHtml += `<optgroup label="${school}">`;
                                    spells.forEach(([sName, _]) => {
                                        optsHtml += `<option value="${sName}" ${val === sName ? 'selected' : ''}>${sName}</option>`;
                                    });
                                    optsHtml += `</optgroup>`;
                                }
                            }
                        });
                    }

                    choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        ${isPaired ? `<label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; display: block; margin-bottom: 4px;">${effectiveType} Selection</label>` : ''}
                        <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                    </div>`;
                }
            }
        } else {
            // Existing option selection UI
            let options = Object.keys(optionsRef[collection] || {});
            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && optionsRef[collection][val]) ? optionsRef[collection][val].desc : "";
                if (typeof d === "function") d = d(level, subclass, state, derived, rSSC);

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, statsMap, context)}</div>
                </div>`;
            }
        }
        desc += choiceHtml + `</div>`;
    }

    let displayLevel = feat.level || "";
    if (feat.milestones && Array.isArray(feat.milestones)) {
        displayLevel = feat.milestones.filter(m => level >= m).pop() || displayLevel;
    }

    return bFeat(feat.name, displayLevel, desc, finalCssClass, false, level, statsMap, context);
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
                    if (feat.level === undefined) feat.level = l;
                    fHtml += renderFn(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, "", optionsRef, configRef);
                }
            });
        }
        if (subData[l]) {
            subData[l].forEach(feat => {
                if (feat.level === undefined) feat.level = l;
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
