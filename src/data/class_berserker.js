const BERSERKER_DATA = {
    arsenal: {
        "Combat Offense": [
            "Death Blow",
            "Rampage",
            "Whirlwind"
        ],
        "Mobility & Speed": [
            "Eager for Battle",
            "Into the Fray",
            "Swift Fury",
            "Thunderous Steps"
        ],
        "Survival & Grit": [
            "Deathless Rage",
            "Mighty Endurance",
            "Unstoppable Force"
        ],
        "Utility & Control": [
            "MORE BLOOD!",
            "You're Next!"
        ]
    }
};

const ARSENAL_DESCS = {
    "Death Blow": "After you deal damage from a crit, you sum the Fury Dice and deal double that amount of damage.",
    "Deathless Rage": "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action.",
    "Eager for Battle": "Gain advantage on Initiative. Move 2x DEX spaces for free on your first turn each encounter.",
    "Into the Fray": "Action: Leap up to 2x DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, make an attack against 1 of them for free.",
    "Mighty Endurance": "You can now survive an additional 4 Wounds before death.",
    "MORE BLOOD!": "Whenever an enemy crits you, gain 1 Fury Die.",
    "Rampage": "(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again.",
    "Swift Fury": "Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain.",
    "Thunderous Steps": "After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop.",
    "Unstoppable Force": "While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3).",
    "Whirlwind": "2 actions: Attack ALL targets within your melee weapon's reach.",
    "You're Next!": "Action: While Raging, make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee."
};

const CLASS_CONFIG = {
    name: "Berserker",
    subtitle: "An unstoppable force of wrath and ruin",
    keyStats: ['str', 'dex'], 
    saves: { adv: 'str', dis: 'int' }, 
    baseHp: 22,
    hpPerLevel: 9,
    hitDie: 12,
    
    theme: {
        accent: "#ef4444",
        accentDim: "#991b1b",
        bodyBg: "#0c0606",
        containerBg: "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0f0f 0%, #0c0606 100%)",
        panelBg: "rgba(26, 15, 15, 0.8)",
        border: "rgba(239, 68, 68, 0.25)"
    },

    initialStats: {
        baseStr: 3, baseDex: 1, baseInt: -1, baseWil: -1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Mountainheart", label: "Path of the Mountainheart", accent: "#d97706" },
        { value: "RedMist", label: "Path of the Red Mist", accent: "#7f1d1d" }
    ],

    resources: [], // Fury is managed via custom classState.furyDice array

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; 
        let woundMax = 6;
        let arsenal = state.selectedArsenal || [];
        if (arsenal.includes("Mighty Endurance")) woundMax += 4;
        
        let fdType = "d4";
        if(level>=6) fdType = "d6";
        if(level>=9) fdType = "d8";
        if(level>=13) fdType = "d10";
        if(level>=17) fdType = "d12";

        return { speed, woundMax, fdType };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        if (!state.furyDice) state.furyDice = [];
        let maxFD = Math.max(state.baseStr + state.addStr, state.baseDex + state.addDex);
        let fdType = derived.fdType;
        
        let diceHtml = "";
        let totalFury = 0;
        state.furyDice.forEach((die, idx) => {
            totalFury += die.total;
            diceHtml += `
            <div onclick="CLASS_CONFIG.actions.spendDie(${idx})" title="Click to spend this die" 
                 style="cursor:pointer; background: rgba(239, 68, 68, 0.25); border: 2px solid var(--save-dis); border-radius: 6px; padding: 6px; min-width: 42px; text-align: center; transition: all 0.2s; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                <span style="font-family: 'Cinzel', serif; font-weight: 900; color: #fff; font-size: 1.4em;">${die.total}</span>
            </div>`;
        });

        if (state.furyDice.length === 0) {
            diceHtml = `<div style="color: var(--text-muted); font-style: italic; font-size: 0.9em; opacity: 0.5;">Awaiting Fury...</div>`;
        }

        return `
        <div class="panel mechanic-panel" style="padding: 12px 15px; height: 165px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; align-items: stretch; justify-content: space-around; flex: 1;">
               <!-- Column 1: Bonus -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 15px; justify-content: center;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Fury Bonus</label>
                   <div style="font-size: 3.2em; font-family: 'Cinzel', serif; font-weight: 900; color: var(--save-dis); line-height: 1; text-shadow: 0 0 15px rgba(239, 68, 68, 0.3);">+${totalFury}</div>
                   <div style="font-size: 0.7em; color: var(--text-muted); text-align: center; margin-top: 8px; font-weight: bold; font-family: 'Cinzel';">STR Dmg Bonus</div>
               </div>

               <!-- Column 2: Pool & Controls -->
               <div style="flex: 2.8; display: flex; flex-direction: column; align-items: center; padding: 0 15px; justify-content: center;">
                   <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px;">
                       <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">Dice Pool (${fdType})</label>
                       <div style="display: flex; gap: 8px; align-items: center;">
                           <span style="font-size: 0.75em; color: var(--text-muted); font-family: 'Cinzel'; font-weight: bold;">${state.furyDice.length} / ${maxFD}</span>
                           <button onclick="CLASS_CONFIG.actions.rollOneDie()" style="background: rgba(239, 68, 68, 0.2); border: 2px solid var(--save-dis); color: #fff; font-size: 0.7em; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;" ${state.furyDice.length >= maxFD ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>ROLL +1</button>
                           <button onclick="CLASS_CONFIG.actions.resetFury()" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.3); color: var(--text-muted); font-size: 0.7em; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">CLEAR</button>
                       </div>
                   </div>
                   <div style="display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 8px; width: 100%; justify-content: center; align-items: center; scrollbar-width: none; padding-bottom: 5px; flex: 1;">
                       ${diceHtml}
                   </div>
                   <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family: 'Crimson Text'; font-style: italic; text-align: center;">
                        Spend 1 die to: Move <strong>DEX</strong> spaces OR Reduce damage by <strong>STR+DEX</strong>
                   </div>
               </div>
            </div>
        </div>`;
    },

    actions: {
        rollOneDie: function() {
            if (!state.furyDice) state.furyDice = [];
            let maxFD = Math.max(state.baseStr + state.addStr, state.baseDex + state.addDex);
            if (state.furyDice.length >= maxFD) return;

            let faces = parseInt(CLASS_CONFIG.getDerivedStats(state.level, state.subclass, state).fdType.replace('d', ''));
            let roll = Math.floor(Math.random() * faces) + 1;

            state.furyDice.push({
                chain: [roll],
                total: roll
            });
            saveState(); render();
        },
        spendDie: function(idx) {
            state.furyDice.splice(idx, 1);
            saveState(); render();
        },
        resetFury: function() { 
            state.furyDice = []; 
            saveState(); render(); 
        }
    },

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Berserker Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> STR(+), INT(-)<br><strong>Armor:</strong> None | <strong>Weapons:</strong> All Weapons`, "", true);
        fHtml += bFeat("Rage", 1, `(1/turn) Action: Roll a Fury Die (<strong>${derived.fdType}</strong>) and set it aside. Add it to every STR attack you make. Max Fury Dice: <strong>KEY</strong>. Lost when Rage ends.`);
        fHtml += bFeat("That all you got?!", 1, `When attacked, expend any number of Fury Dice to reduce damage by <strong>STR + DEX</strong> per die spent.`);
        
        if (level >= 2) {
            fHtml += bFeat("Intensifying Fury", 2, `If Raging at start of turn, roll 1 Fury Die for free.`);
            fHtml += bFeat("One with the Ancients", 2, `(1/Safe Rest) Ask the ancestors for guidance on a direction or course of action.`);
        }
        
        if (level >= 3) {
            fHtml += bFeat("Bloodlust", 3, `Expend 1+ Fury Dice to move <strong>DEX</strong> spaces per die for free.`);
            if (subclass === "Mountainheart") {
                fHtml += bFeat("Stone's Resilience", 3, `When expending Fury Dice to reduce damage, add the value of the die to the amount reduced.`, sCls);
                fHtml += bFeat("Mountainous Tenacity", 3, `When expending Hit Dice to recover HP, for every 10 HP recovered, heal 1 Wound.`, sCls);
            } else if (subclass === "RedMist") {
                fHtml += bFeat("Blood Frenzy", 3, `(1/turn) When you crit or kill an enemy, change 1 Fury Die to its maximum value.`, sCls);
                fHtml += bFeat("Savage Awareness", 3, `Advantage on Perception to track blood. Blindsight 2 while Raging (ignore Blinded, see Invisibility).`, sCls);
            }
        }

        if (level >= 4) {
            fHtml += bFeat("Enduring Rage", 4, `While Dying, Rage automatically for free. Max 2 actions, ignore STR saves to make attacks.`);
            
            let numArsenal = level>=16?7 : level>=14?6 : level>=12?5 : level>=10?4 : level>=8?3 : level>=6?2 : 1;
            let aState = state.selectedArsenal || [];
            let opts = `<option value="None">Select from Savage Arsenal...</option>`;
            Object.keys(BERSERKER_DATA.arsenal).forEach(group => {
                opts += `<optgroup label="${group}">`;
                BERSERKER_DATA.arsenal[group].forEach(k => opts += `<option value="${k}">${k}</option>`);
                opts += `</optgroup>`;
            });
            
            let aHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<numArsenal; i++) {
                let val = aState[i] || "None";
                aHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--slate-lighter); border-left: 3px solid var(--save-dis);">
                    <select onchange="updateClassState('selectedArsenal', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid var(--slate-lighter); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(ARSENAL_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Savage Arsenal", 4, `Choose <strong>${numArsenal}</strong> abilities.${aHtml}</div>`, "", true);
        }

        return fHtml;
    }
};