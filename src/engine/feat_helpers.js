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
function defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef, configRef) {
    const statsMap = derived.statsMap;
    
    // Evaluate function properties (v2.2)
    const fName = (typeof feat.name === "function") ? feat.name(level, subclass, state, derived, configRef) : (feat.name || "");
    const fLevel = (typeof feat.level === "function") ? feat.level(level, subclass, state, derived, configRef) : (feat.level || null);
    
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
        let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
        let selection = state[sKey] || [];
        
        // Universal Slot Engine (v2.2)
        if (typeof feat.getSlots === 'function') {
            const slots = feat.getSlots(level, subclass, state, configRef);
            slots.forEach((slot, idx) => {
                const val = selection[idx] || "None";
                const isPaired = feat.spellType === "paired";
                const effectiveType = slot.type;
                const effectiveTier = slot.tier;
                const customLabel = slot.label;
                const slotColl = slot.collection || collection;
                
                let optsHtml = `<option value="None">-- Select Option --</option>`;
                
                // A. Spell Selection Logic
                if (feat.type === "spell_choice" || effectiveType === 'utility' || effectiveType === 'tiered' || effectiveType === 'cantrip') {
                    const schools = slot.schools || (Array.isArray(feat.schools) ? feat.schools : [feat.schools]);
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
                // B. Data Collection Logic
                else {
                    const options = Object.keys(optionsRef[slotColl] || {});
                    options.forEach(optName => {
                        optsHtml += `<option value="${optName}" ${val === optName ? 'selected' : ''}>${optName}</option>`;
                    });
                }

                const finalLabel = customLabel || (isPaired ? `${effectiveType} Selection` : '');
                
                // Fetch option description for non-spell choices
                let optDesc = "";
                if (feat.type !== "spell_choice" && val !== "None" && optionsRef[slotColl]?.[val]) {
                    const optObj = optionsRef[slotColl][val];
                    optDesc = `<div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3; margin-top: 5px; padding: 4px; border-top: 1px solid rgba(255,255,255,0.05);">${iStats(optObj.desc, level, statsMap, { name: val })}</div>`;
                }

                choiceHtml += `<div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    ${finalLabel ? `<label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; display: block; margin-bottom: 4px;">${finalLabel}</label>` : ''}
                    <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                    ${optDesc}
                </div>`;
            });
        } 
        // Legacy Batch Rendering
        else {
            const schools = Array.isArray(feat.schools) ? feat.schools : [feat.schools];
            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let optsHtml = `<option value="None">-- Select Option --</option>`;

                if (feat.type === "spell_choice") {
                    schools.forEach(school => {
                        if (SPELL_REGISTRY[school]) {
                            let spells = Object.entries(SPELL_REGISTRY[school]);
                            if (feat.spellType === "cantrip") spells = spells.filter(([_, data]) => data.tier.toLowerCase().includes('cantrip'));
                            else if (feat.tier) spells = spells.filter(([_, data]) => data.tier === `Tier ${feat.tier}`);
                            if (spells.length > 0) {
                                optsHtml += `<optgroup label="${school}">`;
                                spells.forEach(([sName, _]) => optsHtml += `<option value="${sName}" ${val === sName ? 'selected' : ''}>${sName}</option>`);
                                optsHtml += `</optgroup>`;
                            }
                        }
                    });
                } else {
                    Object.keys(optionsRef[collection] || {}).forEach(opt => optsHtml += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`);
                }

                let optObj = (feat.type !== "spell_choice" && val !== "None") ? optionsRef[collection][val] : null;
                let d = optObj ? optObj.desc : "";
                
                choiceHtml += `<div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                    ${d ? `<div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3; margin-top: 5px;">${iStats(d, level, statsMap, context)}</div>` : ""}
                </div>`;
            }
        }
        choiceHtml += `</div>`;
        desc += choiceHtml;
    }

    let displayLevel = fLevel || "";
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

    Object.values(subData).forEach(lvlFeats => {
        lvlFeats.forEach(f => {
            if (f.replaces) {
                const r = Array.isArray(f.replaces) ? f.replaces : [f.replaces];
                r.forEach(id => replacedIds.add(id));
            }
        });
    });

    for (let i = 1; i <= level; i++) {
        if (featuresRef.core[i]) {
            featuresRef.core[i].forEach(feat => {
                if (!replacedIds.has(feat.id)) {
                    fHtml += defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, "", optionsRef, configRef);
                }
            });
        }
    }

    for (let i = 1; i <= level; i++) {
        if (subData[i]) {
            subData[i].forEach(feat => {
                fHtml += defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, sCls, optionsRef, configRef);
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
