/**
 * @fileoverview CORE HELPERS MODULE
 * Provides helper functions for building feature HTML, rendering class features,
 * and formatting UI elements like spell pips.
 */

/**
 * Builds the HTML structure for a feature block.
 * @param {string} title - The title of the feature.
 * @param {string|number} levelTag - The level requirement to display.
 * @param {string} description - The descriptive text of the feature.
 * @param {string} [theme=""] - Additional CSS classes for styling.
 * @param {boolean} [skip=false] - If true, skips iStats processing of the description.
 * @param {number} level - Current character level.
 * @param {Object} statsMap - Current attribute values.
 * @param {Object} [context={}] - Context for rolls within the description.
 * @returns {string} HTML string for the feature.
 */
function buildFeatureHtml(title, levelTag, description, theme = "", skip = false, level, statsMap, context = {}) { 
    const featContext = { ...context, name: title };
    const desc = skip ? description : iStats(description, level, statsMap, featContext); 
    return `<div class="feature ${theme}"><h3>${title} ${levelTag ? `<span class="level-tag">Lvl ${levelTag}</span>` : ''}</h3><div class="feature-desc">${desc}</div></div>`; 
}

/**
 * Default renderer for individual features.
 * @param {Object} feat - The feature definition object.
 * @param {number} level - Current character level.
 * @param {string} subclass - Selected subclass.
 * @param {Object} state - Current character state.
 * @param {Object} derived - Derived character data (statsMap, etc.).
 * @param {Function} buildFeatureHtml - Callback to build feature HTML.
 * @param {Function} iStats - Callback to parse stat tokens.
 * @param {Function} formatPips - Callback to format spell pips.
 * @param {Function} renderSingleSpellCard - Callback to render a spell card.
 * @param {string} cssClass - Additional CSS classes.
 * @param {Object} optionsRef - Reference to available feature options.
 * @param {Object} configRef - Reference to class configuration.
 * @returns {string} HTML string for the feature.
 */
function defaultRenderFeature(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, cssClass, optionsRef, configRef) {
    const statsMap = derived.statsMap;
    let count = (feat.type === "dynamic_choice" || feat.type === "spell_choice") 
        ? (typeof feat.getCount === 'function' ? feat.getCount(level, subclass, state) : (feat.count || 1)) 
        : (feat.count || 1);
    let collection = feat.collection;
    let context = feat.context || {};
    
    let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, derived, renderSingleSpellCard) : (feat.desc || "");

    let finalCssClass = (cssClass || "") + (feat.minor ? " minor-feature" : "");

    let resourceHtml = "";
    if (feat.resourceId && configRef && configRef.resources) {
        const resConfig = configRef.resources.find(r => r.id === feat.resourceId);
        if (resConfig) {
            const current = state.resourceValues[feat.resourceId] || 0;
            const max = typeof resConfig.calcMax === 'function' ? resConfig.calcMax(level, statsMap, state, subclass) : (resConfig.max || 1);
            
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
        let selection = state[feat.stateKey] || [];
        
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
                            if (!UTILITY_SPELLS[school]) {
                                return;
                            }
                            
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
                // Determine list of slots to render
                const slots = typeof feat.getSlots === 'function' ? feat.getSlots(level, subclass, state) : (feat.slots || []);
                const renderCount = slots.length > 0 ? slots.length : count;
                const isPaired = feat.spellType === "paired";
                
                for (let i = 0; i < renderCount; i++) {
                    let idx = (feat.startIndex || 0) + i;
                    let val = selection[idx] || "None";
                    
                    // Resolve slot type and tier
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

                    const finalLabel = customLabel || (isPaired ? `${effectiveType} Selection` : '');

                    choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        ${finalLabel ? `<label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; display: block; margin-bottom: 4px;">${finalLabel}</label>` : ''}
                        <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); width: 100%;">${optsHtml}</select>
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
                
                // --- OPTION EXTENSIONS (v2.1) ---
                let opt = (val !== "None" && optionsRef[collection][val]) ? { ...optionsRef[collection][val] } : null;
                if (opt && configRef.optionExtensions?.[subclass]?.[collection]?.[val]) {
                    Object.assign(opt, configRef.optionExtensions[subclass][collection][val]);
                }
                // --------------------------------

                let d = opt ? opt.desc : "";
                
                // Append empowered text if it exists (from base or extension)
                if (opt && opt.empowered) {
                    const empText = typeof opt.empowered === 'function' ? opt.empowered(level, subclass, state, derived, renderSingleSpellCard) : opt.empowered;
                    d += `<div style="margin-top:8px; padding:6px; background:rgba(139, 92, 246, 0.15); border-left: 2px solid var(--subclass-accent, var(--class-accent)); font-style: italic; font-size: 0.95em; color: #fff;">
                        <strong>Empowered:</strong> ${empText}
                    </div>`;
                }

                if (typeof d === "function") {
                    d = d(level, subclass, state, derived, renderSingleSpellCard);
                }

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

    return buildFeatureHtml(feat.name, displayLevel, desc, finalCssClass, false, level, statsMap, context);
}

/**
 * Generates the HTML for all class features up to the current level.
 * @param {number} level - Current character level.
 * @param {string} subclass - Selected subclass.
 * @param {Object} state - Current character state.
 * @param {Object} derived - Derived character data.
 * @param {Function} buildFeatureHtml - Callback to build feature HTML.
 * @param {Function} iStats - Callback to parse stat tokens.
 * @param {Function} formatPips - Callback to format spell pips.
 * @param {Function} renderSingleSpellCard - Callback to render a spell card.
 * @param {Object} featuresRef - Reference to core and subclass features.
 * @param {Object} optionsRef - Reference to available feature options.
 * @param {Object} configRef - Reference to class configuration.
 * @returns {string} HTML string for all features.
 */
function defaultGetFeaturesHTML(level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, featuresRef, optionsRef, configRef) {
    let fHtml = "";
    const sCls = "subclass-feature";
    const subData = featuresRef.subclasses[subclass] || {};
    const replacedIds = new Set();

    // 1. Identify replaced core features
    Object.values(subData).forEach(lvlFeats => {
        lvlFeats.forEach(f => {
            if (f.replaces) {
                if (Array.isArray(f.replaces)) {
                    f.replaces.forEach(id => replacedIds.add(id));
                } else {
                    replacedIds.add(f.replaces);
                }
            }
        });
    });

    // 2. Render level by level
    const renderFn = configRef.renderFeature ? configRef.renderFeature.bind(configRef) : defaultRenderFeature;
    for (let lvl = 1; lvl <= level; lvl++) {
        if (featuresRef.core[lvl]) {
            featuresRef.core[lvl].forEach(feat => {
                if (!replacedIds.has(feat.id)) {
                    if (feat.level === undefined) {
                        feat.level = lvl;
                    }
                    fHtml += renderFn(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, "", optionsRef, configRef);
                }
            });
        }
        if (subData[lvl]) {
            subData[lvl].forEach(feat => {
                if (feat.level === undefined) {
                    feat.level = lvl;
                }
                fHtml += renderFn(feat, level, subclass, state, derived, buildFeatureHtml, iStats, formatPips, renderSingleSpellCard, sCls, optionsRef, configRef);
            });
        }
    }

    return fHtml;
}

/**
 * Formats spell tier indicators (pips).
 * @param {string|number} tier - The spell tier.
 * @param {string} [school=null] - The magic school for color-coding.
 * @returns {string} HTML string with tier and pips.
 */
function formatPips(tier, school = null) { 
    const tStr = String(tier); 
    const tNum = parseInt(tStr.replace(/\D/g, '')) || 0; 
    let pips = ""; 
    if (tNum > 0) {
        for (let i = 0; i < tNum; i++) {
            pips += "●";
        }
    } else if (tStr.toLowerCase().includes("cantrip")) {
        pips = "○";
    } 
    if (!pips) {
        return tStr;
    } 
    
    let color = 'var(--subclass-accent, var(--class-accent))';
    if (school) {
        const s = school.toLowerCase();
        if (['fire', 'ice', 'lightning', 'wind', 'radiant', 'necrotic'].includes(s)) {
            color = `var(--${s}-school)`;
        }
    }

    return `${tStr} <span style="letter-spacing:2px; color:${color}; margin-left:8px;">${pips}</span>`; 
}

/**
 * Renders the background feature based on the current state.
 * @param {Object} state - Current character state.
 * @param {number} level - Current character level.
 * @param {Object} statsMap - Current attribute values.
 * @param {Function} iStats - Callback to parse stat tokens.
 * @param {Function} buildFeatureHtml - Callback to build feature HTML.
 * @param {Function} renderSingleSpellCard - Callback to render a spell card.
 * @returns {string} HTML string for the background feature.
 */
function renderBackgroundFeature(state, level, statsMap, iStats, buildFeatureHtml, renderSingleSpellCard) {
    const bgFeat = BACKGROUND_FEATURES[state.background];
    if (!bgFeat) {
        return "";
    }

    let bgDesc = bgFeat.desc;
    let bgSelectedOpt = (bgFeat.options && state[bgFeat.stateKey]) ? bgFeat.options.find(o => (typeof o === 'string' ? o : o.label) === state[bgFeat.stateKey]) : null;

    if (bgFeat.type === "choice") {
        let choiceHtml = "";
        if (bgFeat.collection === "utility") {
            let opts = `<option value="None">-- Select Spell --</option>`;
            Object.keys(UTILITY_SPELLS).forEach(school => {
                opts += `<optgroup label="${school}">`;
                Object.keys(UTILITY_SPELLS[school]).forEach(sName => {
                    opts += `<option value="${sName}" ${state.bgSpell === sName ? 'selected' : ''}>${sName}</option>`;
                });
                opts += `</optgroup>`;
            });
            let school = "Radiant";
            if (state.bgSpell && state.bgSpell !== "None") {
                for (const [sch, spells] of Object.entries(UTILITY_SPELLS)) {
                    if (spells[state.bgSpell]) {
                        school = sch;
                        break;
                    }
                }
            }
            choiceHtml = renderSingleSpellCard({
                name: state.bgSpell !== "None" ? state.bgSpell : state.background,
                tier: "Utility",
                school: school,
                customHtml: `<div style="margin-bottom:8px;"><select onchange="updateBgSpell(this.value)">${opts}</select></div><div style="font-weight:bold; color:var(--text-muted); font-size:0.85em; margin-bottom:4px;">1 Action</div><div>${state.bgSpell !== "None" ? iStats(UTILITY_SPELLS[school][state.bgSpell]) : ''}</div>`
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
            choiceHtml = `<div class="bg-choice-selector" style="margin-top:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;"><select style="width:100%; padding:4px; background:var(--class-panel-bg); color:var(--text-main); border:1px solid var(--class-border);" onchange="updateBgChoice('${bgFeat.stateKey}', this.value)">${opts}</select></div>`;
        } else if (bgFeat.options && bgFeat.stateKey) {
            let opts = `<option value="None">-- Select Option --</option>`;
            bgFeat.options.forEach(opt => {
                const label = typeof opt === 'string' ? opt : opt.label;
                opts += `<option value="${label}" ${state[bgFeat.stateKey] === label ? 'selected' : ''}>${label}</option>`;
            });
            let optDesc = "";
            if (bgSelectedOpt && bgSelectedOpt.desc) {
                optDesc = `<div style="margin-top:8px; font-size:0.9em; color:var(--text-main); border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">${iStats(bgSelectedOpt.desc)}</div>`;
            }
            choiceHtml = `<div class="bg-choice-selector" style="margin-top:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;"><select style="width:100%; padding:4px; background:var(--class-panel-bg); color:var(--text-main); border:1px solid var(--class-border);" onchange="updateBgChoice('${bgFeat.stateKey}', this.value)">${opts}</select>${optDesc}</div>`;
        }
        bgDesc += choiceHtml;
    }
    
    if (bgFeat.uses || (bgSelectedOpt && bgSelectedOpt.uses)) {
        let usesHtml = '<div style="margin-top:10px; display:flex; flex-direction:column; gap:6px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">';
        const allUses = [...(bgFeat.uses || []), ...(bgSelectedOpt?.uses || [])];
        allUses.forEach(u => {
            let pips = "";
            for (let i = 0; i < u.max; i++) {
                const checked = (state[u.stateKey] || 0) > i;
                pips += `<input type="checkbox" class="pip" ${checked ? 'checked' : ''} onclick="toggleBgPip('${u.stateKey}', ${i})">`;
            }
            usesHtml += `<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.85em; color:var(--text-muted);"><span style="color:var(--text-main); font-weight:bold;">• ${u.label}</span><div style="display:flex; gap:4px;">${pips}</div></div>`;
        });
        usesHtml += '</div>';
        bgDesc += usesHtml;
    }

    return buildFeatureHtml(`Background: ${state.background}`, "", bgDesc, "", false);
}

/**
 * Renders the ancestry feature based on the current state.
 * @param {Object} state - Current character state.
 * @param {Function} buildFeatureHtml - Callback to build feature HTML.
 * @returns {string} HTML string for the ancestry feature.
 */
function renderAncestryFeature(state, buildFeatureHtml) {
    const ancFeat = ANCESTRY_FEATURES[state.ancestry];
    if (!ancFeat) {
        return "";
    }
    return buildFeatureHtml(`Ancestry: ${state.ancestry}`, "", ancFeat.desc, "", false);
}
