/**
 * @fileoverview CORE HELPERS MODULE
 * Provides helper functions for building feature HTML, rendering class features,
 * and formatting UI elements like spell pips.
 */

/**
 * Builds the HTML structure for a feature block.
 */
function buildFeatureHtml(title, levelTag, description, theme = "", skip = false, level, statsMap, context = {}) { 
    const featContext = { ...context, name: title };
    const desc = skip ? description : iStats(description, level, statsMap, featContext); 
    return `<div class="feature ${theme}"><h3>${title} ${levelTag ? `<span class="level-tag">Lvl ${levelTag}</span>` : ''}</h3><div class="feature-desc">${desc}</div></div>`; 
}

/**
 * Default renderer for individual features.
 */
function defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef, configRef, sourceLevel) {
    const statsMap = derived.statsMap;
    
    // Evaluate function properties (v2.2)
    const fName = (typeof feat.name === "function") ? feat.name(level, subclass, state, derived, configRef) : (feat.name || "");
    const fLevel = (typeof feat.level === "function") ? feat.level(level, subclass, state, derived, configRef) : (feat.level || sourceLevel);
    
    // Evaluate description
    let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, derived, renderSingleSpellCard, configRef) : (feat.desc || "");

    const count = (feat.type === "dynamic_choice" || feat.type === "spell_choice") 
        ? (typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1)) 
        : (feat.count || 1);
    
    let collection = (typeof feat.collection === "function") ? feat.collection(level, subclass, state) : feat.collection;
    let sKey = (typeof feat.stateKey === "function") ? feat.stateKey(level, subclass, state) : feat.stateKey;
    let context = feat.context || {};
    
    let finalCssClass = (cssClass || "") + (feat.minor ? " minor-feature" : "");

    // 1. Resource Rendering (if applicable)
    let resourceHtml = "";
    if (feat.resourceId && configRef && configRef.resources) {
        const resConfig = configRef.resources.find(r => r.id === feat.resourceId);
        if (resConfig) {
            const current = state.resourceValues[feat.resourceId] || 0;
            const max = typeof resConfig.calcMax === 'function' ? resConfig.calcMax(level, statsMap, state, subclass, derived) : (resConfig.max || 1);
            
            resourceHtml = `
                <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid var(--class-border); display: flex; align-items: center; justify-content: space-between;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel'; font-weight: bold;">Remaining ${resConfig.label}</label>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="dark-incrementer">
                            <button onclick="adjRes('${feat.resourceId}', -1, ${max})">-</button>
                            <input type="number" value="${current}" onchange="adjRes('${feat.resourceId}', parseInt(this.value), ${max}, true)" style="width: 35px; text-align: center; background: transparent; border: none; color: #fff; font-family: 'Cinzel'; font-weight: bold; font-size: 1em;">
                            <button onclick="adjRes('${feat.resourceId}', 1, ${max})">+</button>
                        </div>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 0.9em;">/ ${max}</div>
                    </div>
                </div>`;
        }
    }
    desc += resourceHtml;

    // 2. Choice/Dropdown Rendering
    if (feat.type === "choice" || feat.type === "dynamic_choice" || feat.type === "spell_choice") {
        const getSlots = typeof feat.getSlots === 'function' ? feat.getSlots(level, subclass, state, configRef) : null;
        const finalCount = getSlots ? getSlots.length : count;

        if (finalCount > 0) {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[sKey] || [];
            
            // Extract values taken in other slots of this feature to filter them out
            const takenValues = selection.filter(v => v && v !== "None");
            const allowDupes = feat.allowDuplicates || [];

            if (getSlots) {
                getSlots.forEach((slot, idx) => {
                    const val = selection[idx] || "None";
                    const isPaired = feat.spellType === "paired";
                    const effectiveType = slot.type || feat.spellType;
                    const effectiveTier = slot.tier;
                    const customLabel = slot.label;
                    const slotColl = slot.collection || collection;
                    
                    const valuesToHide = takenValues.filter(v => v !== val && !allowDupes.includes(v));

                    let optsHtml = `<option value="None">-- Select Option --</option>`;
                    let optDesc = "";

                    // A. Explicit Options provided in slot
                    if (slot.options) {
                        const isGrouped = Array.isArray(slot.options[0]?.options);
                        if (isGrouped) {
                            slot.options.forEach(group => {
                                const visibleOpts = group.options.filter(opt => {
                                    const optVal = typeof opt === 'string' ? opt : (opt.value || opt.name);
                                    return !valuesToHide.includes(optVal);
                                });

                                if (visibleOpts.length > 0) {
                                    optsHtml += `<optgroup label="${group.label}">`;
                                    visibleOpts.forEach(opt => {
                                        const optVal = typeof opt === 'string' ? opt : (opt.value || opt.name);
                                        const optLab = typeof opt === 'string' ? opt : (opt.label || opt.name);
                                        optsHtml += `<option value="${optVal}" ${val === optVal ? 'selected' : ''}>${optLab}</option>`;
                                    });
                                    optsHtml += `</optgroup>`;
                                }
                            });
                        } else {
                            slot.options.forEach(opt => {
                                const optVal = typeof opt === 'string' ? opt : (opt.value || opt.name);
                                const optLab = typeof opt === 'string' ? opt : (opt.label || opt.name);
                                if (!valuesToHide.includes(optVal)) {
                                    optsHtml += `<option value="${optVal}" ${val === optVal ? 'selected' : ''}>${optLab}</option>`;
                                }
                            });
                        }
                    }
                    // B. Spell Selection Logic
                    else if (feat.type === "spell_choice" || effectiveType === 'utility' || effectiveType === 'tiered' || effectiveType === 'cantrip' || effectiveType === 'school') {
                        let schools = slot.schools || (Array.isArray(feat.schools) ? feat.schools : [feat.schools]);
                        if (feat.filterKnown && configRef && configRef.getKnownSchools) {
                            const known = configRef.getKnownSchools(level, subclass, state);
                            schools = schools.filter(s => known.includes(s));
                        }

                        if (effectiveType === 'school') {
                            schools.forEach(school => {
                                if (!valuesToHide.includes(school)) {
                                    optsHtml += `<option value="${school}" ${val === school ? 'selected' : ''}>${school}</option>`;
                                }
                            });
                        } else {
                            schools.forEach(school => {
                                const source = (effectiveType === "utility") ? UTILITY_SPELLS : SPELL_REGISTRY;
                                if (source[school]) {
                                    let spells = Object.entries(source[school]);
                                    if (effectiveType === "cantrip") {
                                        spells = spells.filter(([_, data]) => data.tier.toLowerCase().includes('cantrip'));
                                    } else if (slot.tiers || feat.tiers) {
                                        const allowed = slot.tiers || feat.tiers;
                                        spells = spells.filter(([_, data]) => {
                                            const t = parseInt(data.tier.replace(/\D/g, ''));
                                            return allowed.includes(t);
                                        });
                                    } else if (effectiveTier) {
                                        spells = spells.filter(([_, data]) => data.tier === `Tier ${effectiveTier}`);
                                    }

                                    // Filter out taken spells
                                    spells = spells.filter(([sName, _]) => !valuesToHide.includes(sName));

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
                    } 
                    // C. Data Collection Logic
                    else {
                        const options = Object.keys(optionsRef[slotColl] || {});
                        options.forEach(optName => {
                            if (!valuesToHide.includes(optName)) {
                                optsHtml += `<option value="${optName}" ${val === optName ? 'selected' : ''}>${optName}</option>`;
                            }
                        });
                    }

                    // --- OPTION EXTENSIONS (v2.2 Subclass Encapsulation) ---
                    let opt = (val !== "None" && optionsRef[slotColl]?.[val]) ? { ...optionsRef[slotColl][val] } : null;
                    const subConfig = configRef.getSubclassConfig ? configRef.getSubclassConfig(subclass, state) : {};
                    
                    if (opt && subConfig.optionExtensions) {
                        for (const [collKey, extMap] of Object.entries(subConfig.optionExtensions)) {
                            if (extMap[val]) {
                                Object.assign(opt, extMap[val]);
                                break;
                            }
                        }
                    }

                    if (opt && opt.desc) {
                        const isSpell = !!(opt.tier || opt.school);
                        if (!isSpell) {
                            const baseDesc = typeof opt.desc === "function" ? opt.desc(level, subclass, state, derived, renderSingleSpellCard) : opt.desc;
                            optDesc += `<div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3; margin-top: 5px; padding: 4px; border-top: 1px solid rgba(255,255,255,0.05);">${iStats(baseDesc, level, statsMap, { name: val })}</div>`;
                        }
                    }

                    if (opt && opt.empowered) {
                        const empText = typeof opt.empowered === 'function' ? opt.empowered(level, subclass, state, derived, renderSingleSpellCard) : opt.empowered;
                        optDesc += `<div style="margin-top:8px; padding:6px; background:rgba(139, 92, 246, 0.15); border-left: 2px solid var(--subclass-accent, var(--class-accent)); font-style: italic; font-size: 0.95em; color: #fff;">
                            <strong>Empowered:</strong> ${empText}
                        </div>`;
                    }

                    const finalLabel = customLabel || (isPaired ? `${effectiveType} Selection` : '');

                    choiceHtml += `<div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        ${finalLabel ? `<label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; display: block; margin-bottom: 4px;">${finalLabel}</label>` : ''}
                        <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                        ${optDesc}
                    </div>`;
                });
            } 
            // Legacy Batch Rendering
            else {
                let schools = Array.isArray(feat.schools) ? feat.schools : (feat.schools ? [feat.schools] : []);
                if (feat.filterKnown && configRef && configRef.getKnownSchools) {
                    const known = configRef.getKnownSchools(level, subclass, state);
                    schools = schools.filter(s => known.includes(s));
                }

                for (let i = 0; i < count; i++) {
                    let idx = (feat.startIndex || 0) + i;
                    let val = selection[idx] || "None";
                    
                    const valuesToHide = takenValues.filter(v => v !== val && !allowDupes.includes(v));
                    
                    let optsHtml = `<option value="None">-- Select Option --</option>`;

                    if (feat.type === "spell_choice") {
                        if (feat.spellType === 'school') {
                            schools.forEach(school => {
                                if (!valuesToHide.includes(school)) {
                                    optsHtml += `<option value="${school}" ${val === school ? 'selected' : ''}>${school}</option>`;
                                }
                            });
                        } else {
                            schools.forEach(school => {
                                const source = (feat.spellType === "utility") ? UTILITY_SPELLS : SPELL_REGISTRY;
                                if (source[school]) {
                                    let spells = Object.entries(source[school]);
                                    if (feat.spellType === "cantrip") spells = spells.filter(([_, data]) => data.tier.toLowerCase().includes('cantrip'));
                                    else if (feat.tier) spells = spells.filter(([_, data]) => data.tier === `Tier ${feat.tier}`);
                                    
                                    // Filter out taken spells
                                    spells = spells.filter(([sName, _]) => !valuesToHide.includes(sName));

                                    if (spells.length > 0) {
                                        optsHtml += `<optgroup label="${school}">`;
                                        spells.forEach(([sName, _]) => optsHtml += `<option value="${sName}" ${val === sName ? 'selected' : ''}>${sName}</option>`);
                                        optsHtml += `</optgroup>`;
                                    }
                                }
                            });
                        }
                    } else {
                        Object.keys(optionsRef[collection] || {}).forEach(opt => {
                            if (!valuesToHide.includes(opt)) {
                                optsHtml += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
                            }
                        });
                    }

                    // --- OPTION EXTENSIONS (v2.2 Subclass Encapsulation) ---
                    let opt = (feat.type !== "spell_choice" && val !== "None" && optionsRef[collection]?.[val]) ? { ...optionsRef[collection][val] } : null;
                    const subConfig = configRef.getSubclassConfig ? configRef.getSubclassConfig(subclass, state) : {};
                    
                    if (opt && subConfig.optionExtensions) {
                        for (const [collKey, extMap] of Object.entries(subConfig.optionExtensions)) {
                            if (extMap[val]) {
                                Object.assign(opt, extMap[val]);
                                break;
                            }
                        }
                    }

                    let d = "";
                    let empHtml = "";

                    if (opt && opt.desc) {
                        const isSpell = !!(opt.tier || opt.school);
                        if (!isSpell) {
                            const baseDesc = typeof opt.desc === "function" ? opt.desc(level, subclass, state, derived, renderSingleSpellCard) : opt.desc;
                            d = `<div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3; margin-top: 5px;">${iStats(baseDesc, level, statsMap, { ...context, name: val })}</div>`;
                        }
                    }

                    if (opt && opt.empowered) {
                        const empText = typeof opt.empowered === 'function' ? opt.empowered(level, subclass, state, derived, renderSingleSpellCard) : opt.empowered;
                        empHtml = `<div style="margin-top:8px; padding:6px; background:rgba(139, 92, 246, 0.15); border-left: 2px solid var(--subclass-accent, var(--class-accent)); font-style: italic; font-size: 0.95em; color: #fff;">
                            <strong>Empowered:</strong> ${empText}
                        </div>`;
                    }
                    
                    choiceHtml += `<div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                        ${d}${empHtml}
                    </div>`;
                }
            }
            choiceHtml += `</div>`;
            desc += choiceHtml;
        }
    }

    let displayLevel = fLevel || sourceLevel || "";
    if (feat.milestones && Array.isArray(feat.milestones)) {
        displayLevel = feat.milestones.filter(m => level >= m).pop() || displayLevel;
    }

    return buildFeatureHtml(fName, displayLevel, desc, finalCssClass, false, level, statsMap, context);
}

/**
 * Generates the HTML for all class features up to the current level.
 */
function defaultGetFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, featuresRef, optionsRef, configRef) {
    let fHtml = "";
    const sCls = "subclass-feature";
    const subData = featuresRef.subclasses[subclass] || {};
    const replacedIds = new Set();

    // 1. Pre-calculate replaced features
    Object.values(subData).forEach(lvlFeats => {
        lvlFeats.forEach(f => {
            if (f.replaces) {
                const r = Array.isArray(f.replaces) ? f.replaces : [f.replaces];
                r.forEach(id => replacedIds.add(id));
            }
        });
    });

    // 2. Render interleaved by level (L1 -> Current)
    for (let i = 1; i <= level; i++) {
        // Render Core Features for this level
        if (featuresRef.core[i]) {
            featuresRef.core[i].forEach(feat => {
                if (!replacedIds.has(feat.id)) {
                    fHtml += defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, "", optionsRef, configRef, i);
                }
            });
        }
        
        // Render Subclass Features for this level
        if (subData[i]) {
            subData[i].forEach(feat => {
                fHtml += defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, sCls, optionsRef, configRef, i);
            });
        }
    }

    return fHtml;
}

/**
 * Renders the ancestry feature based on the current state.
 */
function renderAncestryFeature(state, buildFeatureHtml) {
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    if (!ancFeat) return "";
    return buildFeatureHtml(`Ancestry: ${state.ancestry}`, "", ancFeat.desc, "", false, 1, { str: 0, dex: 0, int: 0, wil: 0 });
}

/**
 * Renders the background feature based on the current state.
 */
function renderBackgroundFeature(state, level, statsMap, iStats, buildFeatureHtml, renderSingleSpellCard) {
    const bgFeat = BACKGROUND_FEATURES[state.background];
    if (!bgFeat) return "";

    const bgSelectedOpt = (bgFeat.options && state.selectedBackgroundOption) 
        ? bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === state.selectedBackgroundOption) 
        : null;

    let bgDesc = iStats(bgFeat.desc, level, statsMap);
    if (bgSelectedOpt && bgSelectedOpt.desc) {
        bgDesc += `<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);">${iStats(bgSelectedOpt.desc, level, statsMap)}</div>`;
    }

    let choiceHtml = "";
    if (bgFeat.collection) {
        if (bgFeat.collection === "spells") {
            const school = bgFeat.school || "Utility";
            const opts = `<option value="None">-- Select Spell --</option>` + 
                Object.keys(UTILITY_SPELLS[school] || {}).map(s => `<option value="${s}" ${state.bgSpell === s ? 'selected' : ''}>${s}</option>`).join('');
            
            choiceHtml = renderSingleSpellCard({
                name: state.bgSpell !== "None" ? state.bgSpell : state.background,
                tier: "Utility",
                school: school,
                customHtml: `<div style="margin-bottom:8px;"><select onchange="updateBgSpell(this.value)">${opts}</select></div><div>${state.bgSpell !== "None" ? iStats(UTILITY_SPELLS[school][state.bgSpell], level, statsMap) : ''}</div>`
            }, level, statsMap);
        } else if (bgFeat.collection === "ancestry") {
            let opts = `<option value="None">-- Select Ancestry --</option>`;
            Object.keys(ANCESTRIES).forEach(group => {
                opts += `<optgroup label="${group}">`;
                ANCESTRIES[group].forEach(a => {
                    opts += `<option value="${a}" ${state[bgFeat.stateKey] === a ? 'selected' : ''}>${a}</option>`;
                });
                opts += `</optgroup>`;
            });
            choiceHtml = `<div class="bg-choice-selector" style="margin-top:10px;"><select onchange="updateBgChoice('${bgFeat.stateKey}', this.value)">${opts}</select></div>`;
        } else if (bgFeat.options && bgFeat.stateKey) {
            let opts = `<option value="None">-- Select Option --</option>` + 
                bgFeat.options.map(opt => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    return `<option value="${label}" ${state[bgFeat.stateKey] === label ? 'selected' : ''}>${label}</option>`;
                }).join('');
            choiceHtml = `<div class="bg-choice-selector" style="margin-top:10px;"><select onchange="updateBgChoice('${bgFeat.stateKey}', this.value)">${opts}</select></div>`;
        }
        bgDesc += choiceHtml;
    }

    return buildFeatureHtml(`Background: ${state.background}`, "", bgDesc, "", false, level, statsMap);
}
