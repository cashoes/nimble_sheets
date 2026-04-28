const COMMANDER_DATA = {
    orders: [
        "Coordinated Strike!",
        "Face Me!",
        "Hold the Line!",
        "I Can Do This ALL DAY!",
        "Move it! Move it!",
        "Reposition!"
    ],
    tactics: [
        "Commanding Presence",
        "Heavy Strike",
        "Inerrant Strike",
        "Lunging Strike",
        "Sweeping Strike"
    ]
};

const COMMANDER_DESCS = {
    "Coordinated Strike!": "1/round, Free: You and an ally within 6 both immediately make a weapon attack or cast a cantrip for free. Uses: INT/Safe Rest.",
    "Face Me!": "Reaction (ally crit within 12): Taunt enemy until you drop to 0 HP.",
    "Hold the Line!": "(1/encounter) Reaction (ally drops to 0 HP): Command them to continue; set their HP to 3 x LVL.",
    "I Can Do This ALL DAY!": "(1/encounter) Reaction (you drop to 0 HP): Expend Hit Dice and set HP to the sum rolled (no STR bonus).",
    "Move it! Move it!": "When you roll Initiative: Grant self and ally advantage on the roll and +3 speed for 1 round.",
    "Reposition!": "Action/Reaction (on ally's turn): Command 1 ally to move their speed (or 2 allies 1/2 speed) for free.",
    "Commanding Presence": "Action: Command enemy (2 words). Failed WIL save (DC 10+STR): They obey for next turn. Immune for 1 day after.",
    "Heavy Strike": "When you hit: Push Med creature STR spaces and deal extra dmg = Combat Die. Small: 2x distance. Large: 1/2 distance.",
    "Inerrant Strike": "Reroll missed attack, add 1 to Primary Die, deal extra damage = Combat Die.",
    "Lunging Strike": "Gain +1 Reach and deal extra damage = 2 x Combat Die.",
    "Sweeping Strike": "2 actions: Select 3x3 area. Attack ALL targets; does not miss on a 1."
};

const CLASS_CONFIG = {
    name: "Commander",
    subtitle: "Fearless leader, battlefield tactician, and weapon master",
    keyStats: ['str', 'int'], 
    saves: { adv: 'str', dis: 'dex' }, 
    baseHp: 17,
    hpPerLevel: 8,
    hitDie: 10,
    
    theme: {
        accent: "#f59e0b",
        accentDim: "#b45309",
        bodyBg: "#0f0a0a",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0f0f 0%, #0f0a0a 100%)",
        panelBg: "rgba(35, 20, 20, 0.8)",
        border: "rgba(245, 158, 11, 0.25)"
    },

    initialStats: {
        baseStr: 2, baseDex: 0, baseInt: 1, baseWil: 1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Bulwark", label: "Champion of the Bulwark", accent: "#94a3b8" },
        { value: "Vanguard", label: "Champion of the Vanguard", accent: "#ef4444" }
    ],

    resources: [
        { id: 'combatDice', label: 'Combat Dice', manual: true, calcMax: (level, stats) => stats.str },
        { id: 'coordStrike', label: 'Coordinated Strike', manual: true, calcMax: (level, stats) => stats.int }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; 
        let woundMax = 6;
        
        let cdType = "d6";
        if (level >= 5) cdType = "d8";
        if (level >= 9) cdType = "d10";
        if (level >= 13) cdType = "d12";
        if (level >= 17) cdType = "d20";

        return { speed, woundMax, cdType };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        let maxCD = state.baseStr + state.addStr;
        let currentCD = state.resourceValues.combatDice || 0;
        let strikeMax = state.baseInt + state.addInt;
        let strikeCur = state.resourceValues.coordStrike || 0;

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 12px;">
               <!-- Column 1: Combat Dice -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Combat Dice (${derived.cdType})</label>
                   <div class="dark-incrementer" style="padding: 4px 10px;">
                       <button onclick="adjRes('combatDice', -1, ${maxCD})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">-</button>
                       <input type="number" id="res_combatDice" value="${currentCD}" min="0" max="${maxCD}" onchange="adjRes('combatDice', parseInt(this.value), ${maxCD}, true)" style="width:30px; font-size: 1.3em;">
                       <button onclick="adjRes('combatDice', 1, ${maxCD})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">+</button>
                   </div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Cinzel'; font-weight:bold;">MAX ${maxCD}</div>
               </div>

               <!-- Column 2: Strike Uses -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Coord. Strike</label>
                   <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                       <button onclick="adjRes('coordStrike', -1, ${strikeMax})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">-</button>
                       <input type="number" id="res_coordStrike" value="${strikeCur}" min="0" max="${strikeMax}" onchange="adjRes('coordStrike', parseInt(this.value), ${strikeMax}, true)" style="width:30px; font-size: 1.3em;">
                       <button onclick="adjRes('coordStrike', 1, ${strikeMax})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">+</button>
                   </div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Cinzel'; font-weight:bold;">USES: ${strikeMax}</div>
               </div>

               <!-- Column 3: Tactical Presence -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Tactical DC</label>
                   <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">${10 + state.baseStr + state.addStr}</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">10+STR save DC.</div>
               </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Commander Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> STR(+), DEX(-)<br><strong>Armor:</strong> Mail, Shields | <strong>Weapons:</strong> All Martial Weapons`, "", true);
        fHtml += bFeat("Coordinated Strike!", 1, `1/round, Free: You and ally within 6 spaces make a weapon attack/cantrip for free. Uses: <strong>INT</strong>.`);

        if (level >= 2) {
            let nOrders = 2;
            let oState = state.selectedOrders || [];
            let opts = `<option value="None">Select a Commander's Order...</option>`;
            COMMANDER_DATA.orders.forEach(k => opts += `<option value="${k}">${k}</option>`);
            let oHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<nOrders; i++) {
                let val = oState[i] || "None";
                oHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedOrders', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(245, 158, 11, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(COMMANDER_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Commander's Orders", 2, `Choose <strong>${nOrders}</strong> orders.${oHtml}</div>`, "", true);
            fHtml += bFeat("Field Medic", 2, `Roll +1 die for health potions. Allies you examine for 10 min add your Examination bonus to HD recovery.`);
        }

        if (level >= 3) {
            if (subclass === "Bulwark") {
                fHtml += bFeat("Armor Master", 3, `Proficient with Plate armor.`, sCls);
                fHtml += bFeat("Shield Expert", 3, `Defend 2x each round. First block each round grants free opportunity attack.`, sCls);
            } else if (subclass === "Vanguard") {
                fHtml += bFeat("Advance!", 3, `1/round: Move toward enemy to gain advantage on first melee attack. Ally/Self within 12 move 1/2 speed for free on Coordinated Strike.`, sCls);
            }
        }

        if (level >= 4) {
            let nTactics = level>=16?6 : level>=12?5 : level>=10?4 : level>=8?3 : level>=6?2 : 1;
            let tState = state.selectedTactics || [];
            let opts = `<option value="None">Select a Combat Tactic...</option>`;
            COMMANDER_DATA.tactics.forEach(k => opts += `<option value="${k}">${k}</option>`);
            let tHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<nTactics; i++) {
                let val = tState[i] || "None";
                tHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--gold-light);">
                    <select onchange="updateClassState('selectedTactics', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(245, 158, 11, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(COMMANDER_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Combat Tactics", 4, `When rolling Init, gain <strong>STR</strong> Combat Dice (<strong>${derived.cdType}</strong>). Spend dice on maneuvers. Choose <strong>${nTactics}</strong>.${tHtml}</div>`, "", true);
        }

        return fHtml;
    }
};