const ZEPHYR_OPTIONS = {
    martialArts: {
        "Airshift": { desc: "Cannot be Grappled while conscious. Move across all terrain as if normal (ignore walls, water, spikes, etc)." },
        "Blur.": { desc: "(1/encounter) When you Defend: Move up to 1/2 speed away first. No damage if out of range or have Full Cover." },
        "Bodily Discipline": { desc: "Spend 1 action to end any non-Wound condition on yourself." },
        "Enduring Soul.": { desc: "When you roll Initiative: Gain Hit Dice equal to your actions on first turn (expire end of combat)." },
        "I Jump On His Back!": { desc: "Move through larger creature's space: Jump on back. Advantage on melee; you avoid damage (it hits them instead)." },
        "Kinetic Barrage.": { desc: "Whenever you miss: Gain cumulative +STR bonus to all damage for rest of encounter." },
        "Mighty Soul.": { desc: "Cannot be moved against will. Fail save: Gain 1 Wound to add STR to result. May repeat." },
        "Quickstrike.": { desc: "When you Interpose: You may first make an unarmed strike against the enemy for free." },
        "Use Momentum.": { desc: "Avoid all dmg from melee: Swap places with attacker; choose another target in reach to be hit instead." },
        "Vital Rejuvenation.": { desc: "When healed: Heal another target within 6 spaces HP equal to your STR." },
        "Windstrider.": { desc: "Move through willing creature's space: They move with you and end in any adjacent space." }
    }
};

const ZEPHYR_FEATURES = {
    core: {
        1: [
            { id: "iron", name: "Iron Defense", desc: (level) => `Unarmored: Armor = <strong>DEX + STR</strong>.${level >= 13 ? ' <strong>(Doubled)</strong>' : ''}` },
            { id: "fists", name: "Swift Fists", desc: "Unarmed strikes (1d4+STR) ignore disadvantage from Rushed Attacks." }
        ],
        2: [
            { id: "feet", name: "Swift Feet", desc: "Unarmored: +2 speed and +<strong>LVL</strong> Initiative." },
            { id: "burst", name: "Burst of Speed", desc: "Roll Init: gain <strong>DEX</strong> Bursts. Spend 1 to: Slipstream (Defend/Miss), Whirling Defense (Defend+Armor to all), Swiftstrike (No DIS on attack), Windstep (Ignore Terrain)." }
        ],
        3: [
            { id: "momentum", name: "Kinetic Momentum", desc: "Gain 1 Burst of Speed whenever you gain a Wound." },
            { id: "projection", name: "Ethereal Projection", desc: "(1/day) 10 min meditation: Project version of self up to 30ft. See through its eyes, move freely, cannot interact." }
        ],
        4: [
            { id: "resolve", name: "Unyielding Resolve", desc: "Ignore the first Wound each encounter (Wounded abilities still trigger).<br><strong>Key Stat Increase:</strong> +1 DEX or STR." },
            { id: "arts", name: "Martial Arts", type: "dynamic_choice", collection: "martialArts", stateKey: "selectedArts", desc: "Choose modular abilities.", getCount: (level) => level >= 18 ? 8 : level >= 16 ? 7 : level >= 14 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 }
        ],
        5: [
            { id: "strikes", name: "Reverberating Strikes", desc: "Add <strong>LVL</strong> bludgeoning damage to all melee attacks." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        6: [
            { id: "infuse", name: "Infuse Strength", desc: "Action: Make unarmed strike against ally and infuse them with your own strength. They heal as if you used a Field Rest (roll HD + your STR)." }
        ],
        8: [
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 DEX or STR.", minor: true }
        ],
        9: [
            { id: "feet_2", name: "Swift Feet (2)", desc: "Gain +2 additional speed as long as you are unarmored.", minor: true },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        12: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 DEX or STR.", minor: true }
        ],
        13: [
            { id: "iron_2", name: "Iron Defense (2)", desc: "Your armor is doubled while unarmored.", minor: true },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        16: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 DEX or STR.", minor: true }
        ],
        17: [
            { id: "resolve_3", name: "Unyielding Resolve (3)", desc: "Ignore the first 3 Wounds you would suffer each encounter. You have advantage on STR saves while Dying." },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "windborne", name: "Windborne", desc: "+1 to any 2 of your stats. +1 additional burst of speed when you roll Initiative. Permanently gain 1 action (while Dying, you have a max of 2 actions)." }
        ]
    },
    subclasses: {
        "WayOfPain": {
            3: [
                { id: "pain", name: "Bring the Pain", desc: "(1/round) Turn any melee attack against you into a crit. Reduce dmg by 1/2. Attacker takes same amount. Spend 1 Wound to double dmg taken by enemy." }
            ],
            7: [
                { id: "share", name: "Share My Pain", desc: "Your Swiftstrike can also target a 2nd creature within Reach 2." }
            ],
            11: [
                { id: "sharps", name: "Pain Sharpens the Mind", desc: "While you are Bloodied, gain advantage on the first attack you make each turn, and on all saves." }
            ],
            15: [
                { id: "echo", name: "Echoed Agony", desc: "Your Swiftstrike can also target a 3rd creature within Reach 4." }
            ]
        },
        "WayOfFlame": {
            3: [
                { id: "exploding", name: "Exploding Soul", desc: (level, subclass, state, derived) => `(1/round) Gain Wound: Deal <strong>STR+Wounds</strong> damage to creatures within 2 spaces (ignore armor) and Smolder them.` }
            ],
            7: [
                { id: "blazing", name: "Blazing Speed", desc: "Gain +2 speed in Windstep. Targets you pass through take <strong>STR+DEX</strong> fire dmg (2x to Smoldering targets)." }
            ],
            11: [
                { id: "chain", name: "Chain Reaction", desc: (level, subclass, state, derived) => `(1/turn) When you crit, deal <strong>STR+Wounds</strong> fire dmg to targets within 2 spaces of your target.` }
            ],
            15: [
                { id: "burning", name: "Burning Soul", desc: "Double any fire damage you deal." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Zephyr",
    subtitle: "Disciplined martial artist with swift hands and feet",
    keyStats: ['dex', 'str'], 
    saves: { adv: 'dex', dis: 'int' }, 
    proficiencies: {
        armor: "None",
        weapons: "Melee"
    },
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
        
        let isUnarmored = true;
        state.inventory.forEach(item => { if(item.type==='armor' && item.equipped) isUnarmored = false; });

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; justify-content: space-around; flex: 1; width: 100%;">
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Iron Defense</label>
                   ${isUnarmored ? `
                       <div style="font-size: 3.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: 900; line-height: 1;">${acVal}</div>
                       <div style="font-size: 0.8em; color: var(--gold-light); margin-top: 2px; font-family:'Cinzel'; font-weight:bold;">AC</div>
                   ` : `
                       <div style="font-size: 1em; color: var(--text-muted); font-style: italic; text-align: center; margin: auto 0;">Inactive<br>(Armored)</div>
                   `}
               </div>

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

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = ZEPHYR_FEATURES.subclasses[subclass] || {};
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
            if (ZEPHYR_FEATURES.core[l]) {
                ZEPHYR_FEATURES.core[l].forEach(feat => {
                    if (!replacedIds.has(feat.id)) {
                        fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips);
                    }
                });
            }
            if (subData[l]) {
                subData[l].forEach(feat => {
                    fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips, sCls);
                });
            }
        }

        return fHtml;
    },

    renderFeature: function (feat, level, subclass, state, bFeat, iStats, formatPips, cssClass) {
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice";
        let count = feat.type === "dynamic_choice" ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state)) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(ZEPHYR_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && ZEPHYR_OPTIONS[collection][val]) ? ZEPHYR_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice);
    }
};