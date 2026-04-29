const ZEPHYR_DATA = {
    martialArts: [
        "Airshift",
        "Blur.",
        "Bodily Discipline",
        "Enduring Soul.",
        "I Jump On His Back!",
        "Kinetic Barrage.",
        "Mighty Soul.",
        "Quickstrike.",
        "Use Momentum.",
        "Vital Rejuvenation.",
        "Windstrider."
    ]
};

const MARTIAL_DESCS = {
    "Airshift": "Cannot be Grappled while conscious. Move across all terrain as if normal (ignore walls, water, spikes, etc).",
    "Blur.": "(1/encounter) When you Defend: Move up to 1/2 speed away first. No damage if out of range or have Full Cover.",
    "Bodily Discipline": "Spend 1 action to end any non-Wound condition on yourself.",
    "Enduring Soul.": "When you roll Initiative: Gain Hit Dice equal to your actions on first turn (expire end of combat).",
    "I Jump On His Back!": "Move through larger creature's space: Jump on back. Advantage on melee; you avoid damage (it hits them instead).",
    "Kinetic Barrage.": "Whenever you miss: Gain cumulative +STR bonus to all damage for rest of encounter.",
    "Mighty Soul.": "Cannot be moved against will. Fail save: Gain 1 Wound to add STR to result. May repeat.",
    "Quickstrike.": "When you Interpose: You may first make an unarmed strike against the enemy for free.",
    "Use Momentum.": "Avoid all dmg from melee: Swap places with attacker; choose another target in reach to be hit instead.",
    "Vital Rejuvenation.": "When healed: Heal another target within 6 spaces HP equal to your STR.",
    "Windstrider.": "Move through willing creature's space: They move with you and end in any adjacent space."
};

const CLASS_CONFIG = {
    name: "Zephyr",
    subtitle: "Disciplined martial artist with swift hands and feet",
    keyStats: ['dex', 'str'], 
    saves: { adv: 'dex', dis: 'int' }, 
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#bae6fd",
        accentDim: "#7dd3fc",
        bodyBg: "#0f172a",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(186, 230, 253, 0.08) 0%, transparent 100%), linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        panelBg: "rgba(30, 41, 59, 0.8)",
        border: "#94a3b8"
    },

    initialStats: {
        baseStr: 1, baseDex: 3, baseInt: -1, baseWil: -1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "WayOfPain", label: "Way of Pain", accent: "#ef4444" },
        { value: "WayOfFlame", label: "Way of Flame", accent: "#f97316" }
    ],

    resources: [
        { id: 'burstSpeed', label: 'Burst of Speed', manual: true, calcMax: (level, stats) => stats.dex }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; 
        let woundMax = 6;
        if (level >= 2) speed += 2;
        if (level >= 9) speed += 2;

        return { speed, woundMax };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        // Iron Defense logic is handled in the custom AC calculation in engine, 
        // but we can flag it here if we want to force unarmored check.
        let isUnarmored = true;
        state.inventory.forEach(item => { if(item.type==='armor' && item.equipped) isUnarmored = false; });
        
        if (isUnarmored) {
            overrides.armorBase = statsMap.dex + statsMap.str;
            if (level >= 13) overrides.armorBase *= 2;
        }

        if (level >= 2 && isUnarmored) {
            overrides.init = (overrides.init || 0) + level;
        }

        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        let burstMax = state.baseDex + state.addDex;
        let burstCur = state.resourceValues.burstSpeed || 0;
        let acVal = (state.baseDex + state.addDex) + (state.baseStr + state.addStr);
        if (level >= 13) acVal *= 2;
        
        // Only show Iron Defense if unarmored
        let isUnarmored = true;
        state.inventory.forEach(item => { if(item.type==='armor' && item.equipped) isUnarmored = false; });

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; justify-content: space-around; flex: 1; width: 100%;">
               <!-- Column 1: Iron Defense -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Iron Defense</label>
                   ${isUnarmored ? `
                       <div style="font-size: 3.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: 900; line-height: 1;">${acVal}</div>
                       <div style="font-size: 0.8em; color: var(--gold-light); margin-top: 2px; font-family:'Cinzel'; font-weight:bold;">AC</div>
                   ` : `
                       <div style="font-size: 1em; color: var(--text-muted); font-style: italic; text-align: center; margin: auto 0;">Inactive<br>(Armored)</div>
                   `}
               </div>

               <!-- Column 2: Momentum -->
               <div style="flex: 1.5; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px; justify-content: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Bursts of Speed</label>
                   <div class="dark-incrementer" style="padding: 4px 10px;">
                       <button onclick="adjRes('burstSpeed', -1, ${burstMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                       <input type="number" id="res_burstSpeed" value="${burstCur}" min="0" max="${burstMax}" onchange="adjRes('burstSpeed', parseInt(this.value), ${burstMax}, true)" style="width:35px; font-size: 1.4em;">
                       <button onclick="adjRes('burstSpeed', 1, ${burstMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">+</button>
                   </div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: 8px; font-family: 'Crimson Text'; font-style: italic; text-align: center; line-height: 1.2;">
                        Spend 1: Slipstream, Whirling Def, Swiftstrike, or Windstep.
                   </div>
                   <div style="font-size: 0.7em; color: var(--text-muted); font-family: 'Cinzel'; font-weight: bold; margin-top: auto;">CAPACITY: ${burstMax}</div>
               </div>

               <!-- Column 3: Swift Fists -->
               <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Swift Fists</label>
                   <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: 900; line-height: 1; margin: 2px 0;">1d4+STR</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: 2px; font-family:'Crimson Text'; font-style:italic;">Ignores Rush DIS.</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); font-weight:bold; margin-top:auto; font-family:'Cinzel'; border-top:1px solid rgba(255,255,255,0.05); padding-top:4px; width: 100%;">SPD: ${derived.speed} | INIT: +${state.level + (state.baseDex + state.addDex)}</div>
               </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Zephyr Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> DEX(+), INT(-)<br><strong>Armor:</strong> None | <strong>Weapons:</strong> Melee`, "", true);
        fHtml += bFeat("Iron Defense", 1, `Unarmored: Armor = <strong>DEX + STR</strong>. Level 13: Double this amount.`);
        fHtml += bFeat("Swift Fists", 1, `Unarmed strikes (1d4+STR) ignore disadvantage from Rushed Attacks.`);

        if (level >= 2) {
            fHtml += bFeat("Swift Feet", 2, `Unarmored: +2 speed and +<strong>LVL</strong> Initiative.`);
            fHtml += bFeat("Burst of Speed", 2, `Roll Init: gain <strong>DEX</strong> Bursts. Spend 1 to: Slipstream (Defend/Miss), Whirling Defense (Defend+Armor to all), Swiftstrike (No DIS on attack), Windstep (Ignore Terrain).`);
        }

        if (level >= 3) {
            fHtml += bFeat("Kinetic Momentum", 3, `Gain 1 Burst of Speed whenever you gain a Wound.`);
            fHtml += bFeat("Ethereal Projection", 3, `(1/day) 10 min meditation: Project version of self up to 30ft. See through its eyes, move freely, cannot interact.`);
            if (subclass === "WayOfPain") {
                fHtml += bFeat("Bring the Pain", 3, `(1/round) Turn any melee attack against you into a crit. Reduce dmg by 1/2. Attacker takes same amount. Spend 1 Wound to double dmg taken by enemy.`, sCls);
            } else if (subclass === "WayOfFlame") {
                fHtml += bFeat("Exploding Soul", 3, `(1/round) Gain Wound: Deal <strong>STR+Wounds</strong> damage to creatures within 2 spaces (ignore armor) and Smolder them.`, sCls);
            }
        }

        if (level >= 4) {
            fHtml += bFeat("Unyielding Resolve", 4, `Ignore the first Wound each encounter (Wounded abilities still trigger).<br><strong>Key Stat Increase:</strong> +1 DEX or STR.`);
            
            let nArts = level>=18?8 : level>=16?7 : level>=14?6 : level>=12?5 : level>=10?4 : level>=8?3 : level>=6?2 : 1;
            let aState = state.selectedArts || [];
            let opts = `<option value="None">Select a Martial Art...</option>`;
            ZEPHYR_DATA.martialArts.forEach(k => opts += `<option value="${k}">${k}</option>`);
            let aHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<nArts; i++) {
                let val = aState[i] || "None";
                aHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedArts', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(MARTIAL_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Martial Arts", 4, `Choose <strong>${nArts}</strong> abilities.${aHtml}</div>`, "", true);
        }

        if (level >= 5) {
            fHtml += bFeat("Reverberating Strikes", 5, `Add <strong>LVL</strong> bludgeoning damage to all melee attacks.`);
            fHtml += bFeat("Secondary Stat Increase", 5, `+1 INT or WIL.`);
        }

        if (level >= 6) {
            fHtml += bFeat("Infuse Strength", 6, `Action: Make unarmed strike against ally and infuse them with your own strength. They heal as if you used a Field Rest (roll HD + your STR).`);
        }

        if (level >= 7) {
            if (subclass === "WayOfPain") fHtml += bFeat("Share My Pain", 7, `Your Swiftstrike can also target a 2nd creature within Reach 2.`, sCls);
            else if (subclass === "WayOfFlame") fHtml += bFeat("Blazing Speed", 7, `Gain +2 speed in Windstep. Targets you pass through take <strong>STR+DEX</strong> fire dmg (2x to Smoldering targets).`, sCls);
        }

        if (level >= 8) fHtml += bFeat("Key Stat Increase", 8, `+1 DEX or STR.`);

        if (level >= 9) {
            fHtml += bFeat("Swift Feet (2)", 9, `Gain +2 additional speed as long as you are unarmored.`);
            fHtml += bFeat("Secondary Stat Increase", 9, `+1 INT or WIL.`);
        }

        if (level >= 11) {
            if (subclass === "WayOfPain") fHtml += bFeat("Pain Sharpens the Mind", 11, `While you are Bloodied, gain advantage on the first attack you make each turn, and on all saves.`, sCls);
            else if (subclass === "WayOfFlame") fHtml += bFeat("Chain Reaction", 11, `(1/turn) When you crit, deal <strong>STR+Wounds</strong> fire dmg to targets within 2 spaces of your target.`, sCls);
        }

        if (level >= 12) fHtml += bFeat("Key Stat Increase", 12, `+1 DEX or STR.`);

        if (level >= 13) {
            fHtml += bFeat("Iron Defense (2)", 13, `Your armor is doubled while unarmored.`);
            fHtml += bFeat("Secondary Stat Increase", 13, `+1 INT or WIL.`);
        }

        if (level >= 15) {
            if (subclass === "WayOfPain") fHtml += bFeat("Echoed Agony", 15, `Your Swiftstrike can also target a 3rd creature within Reach 4.`, sCls);
            else if (subclass === "WayOfFlame") fHtml += bFeat("Burning Soul", 15, `Double any fire damage you deal.`, sCls);
        }

        if (level >= 16) fHtml += bFeat("Key Stat Increase", 16, `+1 DEX or STR.`);

        if (level >= 17) {
            fHtml += bFeat("Unyielding Resolve (3)", 17, `Ignore the first 3 Wounds you would suffer each encounter. Advantage on STR saves while Dying.`);
            fHtml += bFeat("Secondary Stat Increase", 17, `+1 INT or WIL.`);
        }

        if (level >= 19) fHtml += bFeat("Epic Boon", 19, `Choose an Epic Boon (see pg. 23 of the GM's Guide).`);
        if (level >= 20) fHtml += bFeat("Windborne", 20, `+1 to any 2 of your stats. +1 burst of speed on Init. Permanently gain 1 action.`);

        return fHtml;
    }
};