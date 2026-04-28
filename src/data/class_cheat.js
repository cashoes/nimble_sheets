const CHEAT_DATA = {
    underhanded: {
        "Combat": [
            "Creative Accounting",
            "Feinting Attack",
            "Steal Tempo",
            "Trickshot"
        ],
        "Defense & Mobility": [
            "How'd YOU get here?!",
            "I'm Outta Here!",
            "Misdirection"
        ],
        "Utility": [
            "Exploit Weakness",
            "Sunder Armor (Medium)",
            "Sunder Armor (Heavy)"
        ]
    }
};

const UNDERHANDED_DESCS = {
    "Creative Accounting": "Steal up to INT actions from your next turn (Gain actions now, subtract from next). Cannot use 2 turns in a row.",
    "Exploit Weakness": "Action: Contested INT check. Success: Use Vicious Opportunist even if not Distracted for 1 min.",
    "Feinting Attack": "If you miss for the 2nd time in a round, change the Primary Die roll to any result instead.",
    "How'd YOU get here?!": "2 actions: Teleport up to 4 spaces adjacent to a Distracted target and attack. If you crit, teleport again.",
    "I'm Outta Here!": "When an ally within 4 is crit, turn invisible until end of next turn, then move 1/2 speed for free.",
    "Misdirection": "Gain INT armor. Whenever you Defend, you may halve the damage instead.",
    "Steal Tempo": "When you land a crit for the 2nd time on a turn, target loses 1 action and you gain 1 action.",
    "Sunder Armor (Medium)": "Action: When you crit an enemy with medium armor, sunder it. All melee attacks against them ignore armor until your next turn.",
    "Sunder Armor (Heavy)": "Req. Sunder Medium. Now also applies to enemies wearing heavy armor.",
    "Trickshot": "When you throw a dagger, it returns to your hand. On hit, it ricochets to another target within 2 for half damage."
};

const CLASS_CONFIG = {
    name: "Cheat",
    subtitle: "Master of stealth, dirty fighting, and breaking rules",
    keyStats: ['dex', 'int'], 
    saves: { adv: 'dex', dis: 'wil' }, 
    baseHp: 10,
    hpPerLevel: 5,
    hitDie: 6,
    
    theme: {
        accent: "#cbd5e1",
        accentDim: "#64748b",
        bodyBg: "#0f1115",
        containerBg: "radial-gradient(circle at 50% 50%, rgba(203, 213, 225, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1e2125 0%, #0f1115 100%)",
        panelBg: "rgba(35, 40, 45, 0.8)",
        border: "rgba(203, 213, 225, 0.2)"
    },

    initialStats: {
        baseStr: -1, baseDex: 3, baseInt: 1, baseWil: -1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "SilentBlade", label: "Tools of the Silent Blade", accent: "#94a3b8" },
        { value: "Scoundrel", label: "Tools of the Scoundrel", accent: "#22c55e" }
    ],

    resources: [],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; 
        let woundMax = 6;
        
        let saDice = "1d6";
        if (level >= 3) saDice = "1d8";
        if (level >= 7) saDice = "2d8";
        if (level >= 9) saDice = "2d10";
        if (level >= 11) saDice = "2d12";
        if (level >= 15) saDice = "2d20";
        if (level >= 17) saDice = "3d20";

        return { speed, woundMax, saDice };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        let underhanded = state.selectedUnderhanded || [];
        if (underhanded.includes("Misdirection")) overrides.armor = (overrides.armor || 0) + statsMap.int;
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 15px;">
               <!-- Column 1: Sneak Attack -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Sneak Attack</label>
                   <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">${derived.saDice}</div>
                   <div style="font-size: 0.75em; color: var(--text-muted); text-align: center; margin-top: auto; font-family:'Cinzel'; font-weight:bold;">On Critical Hit</div>
               </div>

               <!-- Column 2: Vicious Opportunist -->
               <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; text-align: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Opportunist</label>
                   <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; text-transform: uppercase; line-height: 1.1; margin: auto 0;">Max Roll</div>
                   <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">Vs. Distracted targets</div>
               </div>

               <!-- Column 3: Cunning -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Cunning</label>
                   <div style="font-size: 2.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">10+</div>
                   <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">Init Floor. Free Move/Hide.</div>
               </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Cheat Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> DEX(+), WIL(-)<br><strong>Armor:</strong> Leather Armor | <strong>Weapons:</strong> DEX Weapons`, "", true);
        fHtml += bFeat("Sneak Attack", 1, `(1/turn) When you crit, deal +<strong>${derived.saDice}</strong> damage.`);
        fHtml += bFeat("Vicious Opportunist", 1, `(1/turn) When you hit a Distracted target with melee, change Primary Die to its max (counts as crit).`);

        if (level >= 2) {
            fHtml += bFeat("Cheat", 2, `You're a well-rounded cheater. Gain the following abilities:
            <ul>
                <li>(1/round) You may either Move or Hide for free.</li>
                <li>(1/day) You may change any skill check to 10+INT.</li>
                <li>If your roll is less than 10 on Initiative, you may change it to 10 instead.</li>
                <li>You may gain advantage on skill checks while playing any games, competitions, or placing wagers. If you're caught though...</li>
            </ul>`);
        }

        if (level >= 3) {
            fHtml += bFeat("Thieves' Cant", 3, `You learn the secret language of rogues and scoundrels.`);
            if (subclass === "SilentBlade") {
                fHtml += bFeat("Amidst All This Commotion...", 3, `If a creature dies while you Sneak Attack them, turn invisible until your next turn or attack.`, sCls);
                fHtml += bFeat("Leave No Trace", 3, `Advantage on Stealth checks when at full health.`, sCls);
            } else if (subclass === "Scoundrel") {
                fHtml += bFeat("Low Blow", 3, `Action: Spend 2 actions to Incapacitate target for next turn on failed STR save (DC 10+INT). Success/Fail: Target Taunted.`, sCls);
                fHtml += bFeat("Sweet Talk", 3, `Advantage on Influence checks with new NPCs. DIS with them thereafter until you get back on their good side.`, sCls);
            }
        }

        if (level >= 4) {
            let numAbilities = level>=18?8 : level>=16?7 : level>=14?6 : level>=12?5 : level>=10?4 : level>=8?3 : level>=6?2 : 1;
            let aState = state.selectedUnderhanded || [];
            let opts = `<option value="None">Select an Underhanded Ability...</option>`;
            Object.keys(CHEAT_DATA.underhanded).forEach(group => {
                opts += `<optgroup label="${group}">`;
                CHEAT_DATA.underhanded[group].forEach(k => opts += `<option value="${k}">${k}</option>`);
                opts += `</optgroup>`;
            });
            
            let aHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<numAbilities; i++) {
                let val = aState[i] || "None";
                aHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedUnderhanded', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(168, 85, 247, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(UNDERHANDED_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Underhanded Abilities", 4, `Choose <strong>${numAbilities}</strong> abilities.${aHtml}</div>`, "", true);
        }

        if (level >= 5) {
            fHtml += bFeat("Twist the Blade", 5, `Action: Change one of your Sneak Attack dice to whatever you like.`);
            fHtml += bFeat("Quick Read", 5, `Advantage on Assess (1/encounter) and Examination (1/day).`);
        }

        return fHtml;
    }
};