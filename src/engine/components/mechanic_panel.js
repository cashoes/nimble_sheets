/**
 * Renders subtext as real line-break elements (one `<br/>` HTM node per split, built with
 * `splitSubtextLines` from ui.js) instead of interpolating the raw string as a single text
 * node. This is a safe alternative to a `\n`-in-data convention: it never parses the
 * subtext as HTML (no innerHTML/raw-string injection), so untrusted or malformed subtext
 * still can't inject markup — it only ever produces text nodes plus literal `<br/>`
 * elements written by this file (see issue #1: a literal "<br>" in data used to render as
 * visible text because subtext was rendered as a text node).
 */
function renderSubtextLines(sub) {
    return splitSubtextLines(sub).flatMap((line, idx) => idx === 0 ? [line] : [html`<br/>`, line]);
}

/**
 * Mechanic Panel Sub-Components
 */
const PanelComponents = {
    Resource: (props) => {
        const id = props.id;
        const label = props.label;
        const max = props.max;
        const val = () => props.value || 0;
        const opt = props.options;
        const sub = opt.subtext;

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${label}</label>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <${NumberSpinner} value=${val} onAdjust=${(amt) => adjRes(id, amt, max)} onSet=${(value) => adjRes(id, value, max, true)} />
                    <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ <span style="color: var(--text-main);">${max}</span></div>
                </div>
                ${sub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-style: italic; margin-top: 4px; line-height: 1.1;">${renderSubtextLines(sub)}</div>` : ''}
            </div>
        `;
    },

    Roll: (props) => {
        const not = props.notation;
        const lab = props.label;
        const disp = props.display;
        const sub = props.subtext;
        const ctx = props.rollContext;
        const click = () => dispatchRoll(not, lab, ctx);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <label class="roll-link" onclick=${click} 
                      style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px; cursor: pointer;">
                    ${lab}
                </label>
                <div class="roll-link" onclick=${click} 
                     style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                    ${disp}
                </div>
                ${sub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; line-height: 1.1; margin-top: 4px;">${renderSubtextLines(sub)}</div>` : ''}
            </div>
        `;
    },

    Stat: (props) => {
        const lab = props.label;
        const sub = props.subtext;
        const opt = props.options;
        const indList = opt.indicators;

        const curVal = () => props.value;
        const colorVal = opt.color || 'var(--gold-light)';
        const valCol = () => curVal() > 0 ? colorVal : '#fff';
        const valLab = () => (curVal() >= 0 ? '+' : '') + curVal();
        
        const vSize = opt.fontSize || '2.2em';
        const valSty = () => `font-size: ${vSize}; font-family: 'Cinzel', serif; font-weight: 900; color: ${valCol()}; line-height: 1;`;

        const iNodes = () => (indList || []).map(ind => {
            const iLab = ind.label;
            const iCol = ind.color;
            const tKey = ind.toggleKey;

            const isActive = () => tKey ? charState()[tKey] === 'BOOM' : ind.active;
            const iSty = () => `display: flex; align-items: center; gap: 6px; cursor: ${tKey ? 'pointer' : 'default'}; opacity: ${isActive() ? '1' : '0.2'};`;
            const lSty = () => `font-size: 0.6em; color: ${isActive() ? iCol : 'var(--text-muted)'}; text-transform: uppercase; font-family: 'Cinzel'; font-weight: bold; letter-spacing: 0.5px;`;
            const pSty = () => `width: 6px; height: 6px; border-radius: 50%; background: ${iCol}; box-shadow: ${isActive() ? `0 0 6px ${iCol}` : ''};`;
            const clickFn = () => tKey ? updateBgChoice(tKey, charState()[tKey] === 'BOOM' ? 'OFF' : 'BOOM') : undefined;

            return html`
                <div onclick=${clickFn} style=${iSty}>
                    <span style=${lSty}>${iLab}</span>
                    <div style=${pSty}></div>
                </div>
            `;
        });

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 80px;">
                <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${lab}</label>
                <span style=${valSty}>${valLab}</span>
                ${sub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-style: italic; text-align: center; line-height: 1.1; margin-top: 4px;">${renderSubtextLines(sub)}</div>` : ''}
                ${() => indList ? html`
                    <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 6px; width: 100%; align-items: flex-end;">
                        ${iNodes}
                    </div>
                ` : ''}
            </div>
        `;
    },

    DicePool: (props) => {
        const s = charState;
        const flab = props.label;
        const skey = props.stateKey;
        const maxDiceCount = props.maxDice;
        const opt = props.options;
        const diceVal = () => props.dice;

        const facesCount = parseInt(props.faces.toString().replace(/\D/g, '')) || 6;

        const dieGenerator = (die, idx, place = false) => {
            const expFn = () => (die && die.detail) && die.detail.includes('!');
            const colFn = () => expFn() ? 'var(--gold-light)' : 'var(--class-accent)';

            const remFlag = opt.disableRemove;
            const maxFlag = opt.disableMaximize;
            const statFlag = opt.static;

            const canRem = !place && !remFlag;
            const canMax = !place && !maxFlag;

            const vTot = die ? die.total : "";
            const vDet = die ? die.detail : "";

            const dStyFn = () => `position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: ${canRem || canMax ? 'pointer' : 'default'}; opacity: ${place ? 0.3 : 1};`;

            const clickFn = () => canRem ? removePoolDie(skey, idx, statFlag) : undefined;
            const ctxFn = (e) => { e.preventDefault(); if (canMax) maximizePoolDie(skey, idx, facesCount); };
            const titStr = place ? 'Empty Slot' : `${vDet || vTot}${!canMax ? '' : ' (Right-click to Maximize)'}`;

            return html`
                <div onclick=${clickFn} oncontextmenu=${ctxFn} title=${titStr} style=${dStyFn}>
                    <${Die} faces=${facesCount} isFilled=${!place} color=${colFn()} />
                    ${!place ? html`<span style="position: absolute; font-family: 'Cinzel', serif; font-weight: 900; color: #fff; font-size: 1.4em; text-shadow: 0 0 4px rgba(0,0,0,0.8); pointer-events: none;">${vTot}</span>` : ''}
                </div>
            `;
        };

        const dNodes = () => {
            const list = diceVal();
            if (opt.static) {
                let items = [];
                for (let i = 0; i < maxDiceCount; i++) items.push(dieGenerator(list[i], i, !list[i]));
                return items;
            }
            return (list && list.length > 0) ? list.map((d, i) => dieGenerator(d, i)) : html`<div style="color: var(--text-muted); font-style: italic; font-size: 0.9em; opacity: 0.5; padding: 5px;">Awaiting ${flab}...</div>`;
        };

        const indList = opt.indicators || [];
        const indNodes = () => indList.map(ind => {
            const iLab = ind.label;
            const iCol = ind.color;
            const tKey = ind.toggleKey;
            const isAct = () => tKey ? s()[tKey] === 'BOOM' : ind.active;
            const iSty = () => `width: 8px; height: 8px; border-radius: 50%; background: ${iCol}; box-shadow: ${isAct() ? `0 0 8px ${iCol}` : ''}; opacity: ${isAct() ? '1' : '0.2'}; cursor: ${tKey ? 'pointer' : 'default'};`;
            const clickFn = () => tKey ? updateBgChoice(tKey, charState()[tKey] === 'BOOM' ? 'OFF' : 'BOOM') : undefined;
            return html`
                <div onclick=${clickFn} title=${() => `${iLab}: ${isAct() ? 'ON' : 'OFF'}`} style=${iSty}></div>
            `;
        });

        const rallFlag = opt.rollAll;
        const btnNode = () => {
            if (rallFlag) {
                const click = () => rollPool(skey, maxDiceCount, facesCount);
                return html`<button onclick=${click} style="background: rgba(255,255,255,0.1); border: 1px solid var(--class-accent); color: #fff; font-size: 0.7em; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Roll</button>`;
            }
            const click = () => addPoolDie(skey, maxDiceCount, facesCount);
            return html`<button onclick=${click} style="background: rgba(255,255,255,0.1); border: 1px solid var(--class-accent); color: #fff; font-size: 0.7em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">+ Die</button>`;
        };

        const clearBtnNode = () => {
            const click = () => clearPool(skey);
            return html`<button onclick=${click} style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: var(--text-muted); font-size: 0.7em; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Clear</button>`;
        };

        return html`
            <div style="display: flex; flex-direction: column; align-items: stretch;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">${flab} (${facesCount})</label>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            ${indNodes}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        ${btnNode}
                        ${clearBtnNode}
                    </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; min-height: 58px; background: rgba(0,0,0,0.2); border-radius: 4px; padding: 4px;">
                    <div style=${() => `display: flex; gap: 4px; flex-wrap: ${maxDiceCount <= 6 ? 'nowrap' : 'wrap'}; justify-content: center; align-items: center; width: 100%;`}>
                        ${dNodes}
                    </div>
                </div>
            </div>
        `;
    },

    Toggle: (props) => {
        const s = charState;
        const lab = props.label;
        const optList = props.options;
        const skey = props.stateKey;

        const curVal = () => s()[skey] || optList[0];
        const btnNodes = () => optList.map(opt => {
            const bSty = () => `flex: 1; background: ${curVal() === opt ? 'var(--class-accent)' : 'transparent'}; border: 1px solid ${curVal() === opt ? 'var(--class-accent)' : 'rgba(255,255,255,0.2)'}; color: ${curVal() === opt ? '#000' : 'var(--text-muted)'}; font-size: 0.7em; padding: 4px; border-radius: 4px; cursor: pointer; font-family: 'Cinzel'; font-weight: bold;`;
            const click = () => updateBgChoice(skey, opt);
            return html`
                <button onclick=${click} style=${bSty}>${opt}</button>
            `;
        });

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1.2;">
                <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">${lab}</label>
                <div style="display: flex; gap: 4px; width: 100%;">
                    ${btnNodes}
                </div>
            </div>
        `;
    },

    Select: (props) => {
        const sid = props.id;
        const slab = props.label;
        const optList = props.options;
        const scur = props.current;
        const ssub = props.subtext;

        const optNodes = optList.map(opt => html`<option value=${opt} selected=${() => opt === scur}>${opt}</option>`);
        const changeFn = (e) => updateClassState(sid, 0, e.target.value);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1.6;">
                <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${slab}</label>
                <select onchange=${changeFn} style="border-bottom-color: var(--class-accent); font-size: 0.9em; width: 100%;">
                    ${optNodes}
                </select>
                ${ssub ? html`<div style="font-size: 0.75em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; line-height: 1.1; margin-top: 4px;">${renderSubtextLines(ssub)}</div>` : ''}
            </div>
        `;
    },

    RollWithResource: (props) => {
        const s = charState;
        const not = props.notation;
        const lab = props.label;
        const disp = props.display;
        const rid = props.resourceId;
        const rmax = props.resourceMax;
        const rctx = props.rollContext;

        const curVal = () => s().resourceValues[rid] || 0;
        const clickFn = () => dispatchRoll(not, lab, rctx);

        return html`
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1.2;">
                <label class="roll-link" onclick=${clickFn} 
                       style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px; cursor: pointer;">
                    ${lab}
                </label>
                <div class="roll-link" onclick=${clickFn} 
                     style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                    ${disp}
                </div>
                <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                    <${NumberSpinner} value=${curVal} onAdjust=${(amt) => adjRes(rid, amt, rmax)} onSet=${(value) => adjRes(rid, value, rmax, true)} />
                    <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ ${rmax}</div>
                </div>
            </div>
        `;
    },

    Html: (props) => {
        const raw = props.html;
        return html`<div innerHTML=${raw} style="flex: 1;"></div>`;
    }
};

/**
 * Class Mechanic Panel Component
 */
function MechanicPanel() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const data = () => {
        if (!config.getMechanicPanelHTML) return null;
        return config.getMechanicPanelHTML(s().level, s().subclass, s(), d());
    };

    const hasData = () => {
        const d = data();
        return d && d.sections && d.sections.length > 0;
    };

    const pSty = () => {
        const d = data();
        if (!d) return 'display: none;';
        return `min-height: ${d.minHeight}px; display: flex; flex-direction: column; justify-content: center; padding: 5px 15px;`;
    };

    const secNodes = () => {
        const d = data();
        if (!d || !d.sections) return [];

        return d.sections.map((sec, idx) => {
            const styp = sec.type;
            const sflx = sec.flex;
            const saln = sec.align;
            const smw = sec.minWidth;
            const sprop = sec.props;
            const Comp = PanelComponents[styp];

            const divNode = idx > 0 ? html`<div style="width: 1px; background: rgba(255,255,255,0.15); align-self: center; height: 60px; margin: 0 5px;"></div>` : '';
            const sSty = `flex: ${sflx}; display: flex; flex-direction: column; align-items: ${saln}; justify-content: center; text-align: center; ${smw ? `min-width: ${smw}px;` : ''}`;

            return html`
                ${divNode}
                <div style=${sSty}>
                    ${() => createComp(Comp, sprop)}
                </div>
            `;
        });
    };

    return html`
        <div class="panel mechanic-panel" style=${pSty}>
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                ${secNodes}
            </div>
        </div>
    `;
}

/**
 * Proficiency Row Component (Weapons and Armor)
 */
function ProficiencyRow() {
    const s = charState;
    const d = charDerived;
    const config = CLASS_CONFIG;

    const weapons = () => {
        const val = d().profWeapons;
        return (Array.isArray(val) && val.length > 0) ? val.join(', ') : (config.proficiencies?.weapons || "--");
    };
    const armor = () => {
        const val = d().profArmor;
        return (Array.isArray(val) && val.length > 0) ? val.join(', ') : (config.proficiencies?.armor || "--");
    };

    return html`
        <div class="proficiency-row"
            style="margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; align-items: baseline; font-family: 'Cinzel', serif; font-size: 0.8em; color: var(--text-muted); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            <div style="text-align: left; flex: 1.5;"> WEAPONS: <span style="color: #fff;">${weapons}</span></div>
            <div style="text-align: right; flex: 1;"> ARMOR: <span style="color: #fff;">${armor}</span> </div>
        </div>
    `;
}
