const BERSERKER_OPTIONS = {
    arsenal: {
        "Death Blow": { desc: "After you deal damage from a crit, you may expend any number of Fury Dice. Sum the dice and deal double that amount of damage." },
        "Deathless Rage": { desc: "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action." },
        "Eager for Battle": { desc: "Gain advantage on Initiative. Move 2× DEX spaces for free on your first turn each encounter." },
        "Into the Fray": { desc: "Action: Leap up to 2× DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, make an attack against 1 of them for free." },
        "Mighty Endurance": { desc: "You can now survive an additional 4 Wounds before death." },
        "MORE BLOOD!": { desc: "Whenever an enemy crits you, gain 1 Fury Die." },
        "Rampage": { desc: "(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again." },
        "Swift Fury": { desc: "Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain." },
        "Thunderous Steps": { desc: "After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop." },
        "Unstoppable Force": { desc: "While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3)." },
        "Whirlwind": { desc: "2 actions: Attack ALL targets within your melee weapon's reach." },
        "You're Next!": { desc: "Action: While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle." }
    }
};

const BERSERKER_FEATURES = {
    core: {
        1: [
            { id: "rage", name: "Rage", desc: "(1/turn) Action: Roll a Fury Die (1d4) and set it aside. Add it to every STR attack you make. You can have a max of KEY Fury Dice; they are lost when your Rage ends." },
            { id: "that_all", name: "That all you got?!", desc: "When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR+DEX for each die spent." },
            { id: "rage_ends", name: "Your Rage Ends...", desc: "If you leave combat, drop to 0 HP, or go 1 round without attacking or Raging.", minor: true }
        ],
        2: [
            { id: "intensifying", name: "Intensifying Fury", desc: "If you are Raging at the beginning of your turn, roll 1 Fury Die for free." },
            { id: "ancients", name: "One with the Ancients", desc: "(1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path." }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Berserker subclass.", minor: true },
            { id: "bloodlust", name: "Bloodlust", desc: "Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free." }
        ],
        4: [
            { id: "enduring_rage", name: "Enduring Rage", desc: "While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks." },
            { id: "arsenal", name: "Savage Arsenal", type: "dynamic_choice", collection: "arsenal", stateKey: "selectedArsenal", desc: "Choose Savage Arsenal abilities as you level up.", getCount: (level) => level >= 16 ? 7 : level >= 14 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        5: [
            { id: "rage_2", name: "Rage (2)", desc: "Whenever you Rage, gain 2 Fury Dice instead." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        6: [
            { id: "intensifying_2", name: "Intensifying Fury (2)", desc: "Your Fury Dice are now d6s.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        9: [
            { id: "intensifying_3", name: "Intensifying Fury (3)", desc: "Your Fury Dice are now d8s.", minor: true },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        13: [
            { id: "intensifying_4", name: "Intensifying Fury (4)", desc: "Your Fury Dice are now d10s.", minor: true },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        17: [
            { id: "intensifying_5", name: "Intensifying Fury (5)", desc: "Your Fury Dice are now d12s.", minor: true },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        18: [
            { id: "deep_rage", name: "DEEP RAGE", desc: "Dropping to 0 HP does not cause your Rage to end." }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "boundless_rage", name: "BOUNDLESS RAGE", desc: "+1 to any 2 of your stats. Anytime you roll less than 6 on a Fury Die, change it to 6 instead." }
        ]
    },
    subclasses: {
        "Mountainheart": {
            3: [
                { id: "stone_resilience", name: "Stone's Resilience", desc: "Whenever you expend Fury Dice to reduce incoming damage, add the value of the die to the amount reduced." },
                { id: "mountainous_tenacity", name: "Mountainous Tenacity", desc: "Whenever you expend your Hit Dice to recover HP, for every 10 HP you would recover, you may heal 1 Wound instead." }
            ],
            7: [
                { id: "unbreakable", name: "Unbreakable", desc: "(1/encounter) While Raging, if you would suffer your last Wound or other negative condition of your choice, you don't." }
            ],
            11: [
                { id: "titans_fury", name: "Titan's Fury", desc: "After you miss an attack or are crit by an enemy, Rage for free." }
            ],
            15: [
                { id: "mountains_endurance", name: "Mountain's Endurance", desc: "While Dying, if an attack against you would be a crit, the attack is rerolled instead (when-crit abilities, such as Titan's Fury, still trigger)." }
            ]
        },
        "RedMist": {
            3: [
                { id: "blood_frenzy", name: "Blood Frenzy", desc: "(1/turn) While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum." },
                { id: "savage_awareness", name: "Savage Awareness", desc: "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the Blinded condition and can see through darkness and Invisibility within that Range." }
            ],
            7: [
                { id: "unstoppable_brutality", name: "Unstoppable Brutality", desc: "While Raging, you may gain 1 Wound to reroll any attack or save." }
            ],
            11: [
                { id: "opportunistic_frenzy", name: "Opportunistic Frenzy", desc: "While Raging, you can make opportunity attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon's reach." }
            ],
            15: [
                { id: "onslaught", name: "Onslaught", desc: "While Raging, gain +2 speed. (1/round) you may move for free." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Berserker",
    subtitle: "An unstoppable force of wrath and ruin",
    keyStats: ['str', 'dex'], 
    saves: { adv: 'str', dis: 'int' }, 
    proficiencies: {
        armor: "None",
        weapons: "All STR weapons"
    },
    baseHp: 20,
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
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 15px; justify-content: center;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Fury Bonus</label>
                   <div style="font-size: 3.2em; font-family: 'Cinzel', serif; font-weight: 900; color: var(--save-dis); line-height: 1; text-shadow: 0 0 15px rgba(239, 68, 68, 0.3);">+${totalFury}</div>
                   <div style="font-size: 0.7em; color: var(--text-muted); text-align: center; margin-top: 8px; font-weight: bold; font-family: 'Cinzel';">STR Dmg Bonus</div>
               </div>

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

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = BERSERKER_FEATURES.subclasses[subclass] || {};
        const replacedIds = new Set();

        Object.values(subData).forEach(lvlFeats => {
            lvlFeats.forEach(f => {
                if (f.replaces) {
                    if (Array.isArray(f.replaces)) f.replaces.forEach(id => replacedIds.add(id));
                    else replacedIds.add(f.replaces);
                }
            });
        });

        for (let l = 1; l <= level; l++) {
            if (BERSERKER_FEATURES.core[l]) {
                BERSERKER_FEATURES.core[l].forEach(feat => {
                    if (!replacedIds.has(feat.id)) {
                        fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips, rSSC);
                    }
                });
            }
            if (subData[l]) {
                subData[l].forEach(feat => {
                    fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips, rSSC, sCls);
                });
            }
        }

        return fHtml;
    },

    renderFeature: function (feat, level, subclass, state, bFeat, iStats, formatPips, rSSC, cssClass) {
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice";
        let count = feat.type === "dynamic_choice" ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state), rSSC) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(BERSERKER_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && BERSERKER_OPTIONS[collection][val]) ? BERSERKER_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice);
    }
};