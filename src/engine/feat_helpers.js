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
    let desc = "";
    if (typeof feat.desc === "function") {
        try {
            desc = feat.desc(level, subclass, state, derived, renderSingleSpellCard, configRef);
        } catch (e) {
            console.error(`Error rendering feature ${fName}:`, e);
            desc = `<span style="color:red">Error rendering feature description.</span>`;
        }
    } else {
        desc = feat.desc || "";
    }

    const count = (feat.type === "dynamic_choice" || feat.type === "spell_choice") 
        ? (typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1)) 
        : (feat.count || 1);
    
    let collection = (typeof feat.collection === "function") ? feat.collection(level, subclass, state) : feat.collection;
    let sKey = (typeof feat.stateKey === "function") ? feat.stateKey(level, subclass, state) : feat.stateKey;
    let context = feat.context || {};
    
    let finalCssClass = (cssClass || "") + (feat.minor ? " minor-feature" : "");

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

    if (feat.type === "choice" || feat.type === "dynamic_choice" || feat.type === "spell_choice") {
        let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
        let selection = state[sKey] || [];
        
        if (feat.type === "spell_choice") {
            let schools = Array.isArray(feat.schools) ? feat.schools : [feat.schools];
            
            if (feat.filterKnown && configRef && configRef.getKnownSchools) {
                const known = configRef.getKnownSchools(level, subclass, state);
                schools = schools.filter(school => known.includes(school));
            }

            if (feat.perSchool && configRef && configRef.getKnownSchools) {
                const limits = configRef._getActiveStateKeyLimits(level, subclass, state);
                const known = configRef.getKnownSchools(level, subclass, state, limits);
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
                                <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                            </div>`;
                            totalIdx++;
                        });
                    }
                }
            } else {
                const slots = typeof feat.getSlots === 'function' ? feat.getSlots(level, subclass, state) : (feat.slots || []);
                const renderCount = slots.length > 0 ? slots.length : count;
                const isPaired = feat.spellType === "paired";
                
                for (let i = 0; i < renderCount; i++) {
                    let idx = (feat.startIndex || 0) + i;
                    let val = selection[idx] || "None";
                    
                    let effectiveType, effectiveTier, customLabel;
                    if (slots.length > 0) {
                        effectiveType = slots[i].type;
                        effectiveTier = slots[i].tier;
                        customLabel = slots[i].label;
                    } else {
                        effectiveType = isPaired ? (i % 2 === 0 ? "utility" : "tiered") : feat.spellType;
                        effectiveTier = isPaired ? (i % 2 === 0 ? null : (feat.tiers ? feat.tiers[Math.floor(i/2)] : feat.tier)) : feat.tier;
                    }
                    
                    let selectLabel = customLabel || (feat.spellType === 'school' ? 'School' : (effectiveType === 'cantrip' ? 'Cantrip' : (effectiveType === 'utility' ? 'Utility' : 'Spell')));
                    let optsHtml = `<option value="None">-- Select ${selectLabel} --</option>`;
                    
                    if (feat.spellType === 'school') {
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
                        ${customLabel ? `<label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; display: block; margin-bottom: 4px;">${customLabel}</label>` : ''}
                        <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
                    </div>`;
                }
            }
        } else {
            let options = Object.keys(optionsRef[collection] || {});
            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                
                let opt = (val !== "None" && optionsRef[collection][val]) ? { ...optionsRef[collection][val] } : null;
                const subConfig = configRef.getSubclassConfig ? configRef.getSubclassConfig(subclass, state) : {};
                
                if (opt && subConfig.optionExtensions?.[collection]?.[val]) {
                    Object.assign(opt, subConfig.optionExtensions[collection][val]);
                }

                let d = opt ? opt.desc : "";
                if (opt && opt.empowered) {
                    const empText = typeof opt.empowered === 'function' ? opt.empowered(level, subclass, state, derived, renderSingleSpellCard) : opt.empowered;
                    d += `<div style="margin-top:8px; padding:6px; background:rgba(139, 92, 246, 0.15); border-left: 2px solid var(--subclass-accent, var(--class-accent)); font-style: italic; font-size: 0.95em; color: #fff;">
                        <strong>Empowered:</strong> ${empText}
                    </div>`;
                }

                if (typeof d === "function") d = d(level, subclass, state, derived, renderSingleSpellCard);

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${sKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3; margin-top: 5px;">${iStats(d, level, statsMap, context)}</div>
                </div>`;
            }
        }
        desc += choiceHtml + `</div>`;
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
