const ZEPHYR_OPTIONS = {
    martial: {
        "Airshift": { desc: "You cannot be Grappled while conscious. While moving, you may travel across all terrain as normal ground (ignoring all ill effects)." },
        "Blur": { desc: "(1/encounter) When you Defend, you may first move up to half your speed away, taking no damage if you are now out of range or have Full Cover." },
        "Bodily Discipline": { desc: "You may spend 1 action to end any non-Wound condition on yourself." },
        "Enduring Soul": { desc: "Each time you roll Initiative, gain Hit Dice equal to the actions you get on your first turn. These Hit Dice expire at the end of combat if unused." },
        "I Jump On His Back!": { desc: "While moving with your Windstep, if you move into the space of a creature your size or larger, you may jump onto its back. Gain advantage on melee attacks against it, and any damage you avoid is dealt to it instead." },
        "Kinetic Barrage": { desc: "Whenever you miss an attack, gain a cumulative +STR bonus to all damage you do for the rest of this encounter." },
        "Mighty Soul": { desc: "You cannot be moved against your will. Whenever you would fail a saving throw, you may gain a Wound in order to add your STR to the result you rolled. You may repeat this any number of times." },
        "Quickstrike": { desc: "When you Interpose, you may first make an unarmed strike against the enemy for free." },
        "Use Momentum": { desc: "Whenever you avoid all of the damage of a melee attack, you may swap places with the attacker and then choose another target that is now within the attack's reach, and they are hit instead." },
        "Vital Rejuvenation": { desc: "When you receive healing for the first time on a turn, you may heal another target within 6 spaces HP equal to your STR." },
        "Windstrider": { desc: "If you move through the space of a willing creature while using Windstep, they can move with you and choose any space adjacent to your path of movement to end in." }
    }
};

const ZEPHYR_FEATURES = {
    core: {
        1: [
            { id: "iron", name: "Iron Defense", desc: "Your armor equals DEX+STR as long as you are unarmored." },
            { id: "fists", name: "Swift Fists", desc: "Your unarmed strikes are not subject to disadvantage imposed by Rushed Attacks, and their damage is 1d4+STR." }
        ],
        2: [
            { id: "feet", name: "Swift Feet", desc: "While unarmored, gain +2 speed and +LVL Initiative." },
            { id: "burst", name: "Burst of Speed", desc: "Gain DEX Bursts of Speed. Spend 1: Slipstream (Defend, attack misses), Whirling Def (apply armor to all attacks), Swiftstrike (Ignore rush DIS), or Windstep (Move free, ignore difficult terrain)." }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Zephyr subclass.", minor: true },
            { id: "kinetic", name: "Kinetic Momentum", desc: "Whenever you gain a Wound, gain a Burst of Speed." },
            { id: "projection", name: "Ethereal Projection", desc: "(1/day) Meditate 10 mins: Project an ethereal version of yourself up to 30 ft away for 10 mins. Can move through walls, cannot interact." }
        ],
        4: [
            { id: "resolve", name: "Unyielding Resolve", desc: "Ignore the first Wound you would suffer each encounter." },
            { id: "martial", name: "Martial Master", type: "dynamic_choice", collection: "martial", stateKey: "selectedMartial", desc: "Choose Martial Arts abilities.", getCount: (level) => level >= 18 ? 8 : level >= 16 ? 7 : level >= 14 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 DEX or STR.", minor: true }
        ],
        5: [
            { id: "reverb", name: "Reverberating Strikes", desc: "Add LVL bludgeoning damage to all of your melee attacks." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        6: [
            { id: "infuse", name: "Infuse Strength", desc: "Action: Attack ally to heal them (Hit Dice + STR)." }
        ],
        9: [
            { id: "feet_2", name: "Swift Feet (2)", desc: "Gain an additional +2 speed while unarmored.", minor: true },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        10: [
            { id: "resolve_2", name: "Unyielding Resolve (2)", desc: "Ignore the first 2 Wounds you would suffer each encounter.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 DEX or STR.", minor: true }
        ],
        13: [
            { id: "iron_2", name: "Iron Defense (2)", desc: "Your armor is doubled while unarmored.", minor: true },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 DEX or STR.", minor: true }
        ],
        17: [
            { id: "resolve_3", name: "Unyielding Resolve (3)", desc: "Ignore the first 3 Wounds. Advantage on STR saves while Dying.", minor: true },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 INT or WIL.", minor: true }
        ],
        20: [
            { id: "windborne", name: "Windborne", desc: "+1 Burst of Speed on Init. Permanently gain 1 action (max 2 while dying)." }
        ]
    },
    subclasses: {
        "WayOfPain": {
            3: [
                { id: "bring_pain", name: "Bring the Pain", desc: "(1/round) Turn any melee attack against you into a crit. When crit, take 1/2 damage. Attacker takes same damage you took. Suffer 1 Wound to double enemy damage." }
            ],
            7: [
                { id: "share_pain", name: "Share My Pain", desc: "Swiftstrike can also target a 2nd creature within Reach 2." }
            ],
            11: [
                { id: "sharpens", name: "Pain Sharpens the Mind", desc: "While Bloodied, gain advantage on the first attack each turn, and on all saves." }
            ],
            15: [
                { id: "echoed", name: "Echoed Agony", desc: "Swiftstrike can target a 3rd creature within Reach 4." }
            ]
        },
        "WayOfFlame": {
            3: [
                { id: "exploding", name: "Exploding Soul", desc: "(1/round) Suffer 1 Wound to deal STR+Wounds damage within 2 spaces and inflict Smoldering." }
            ],
            7: [
                { id: "blazing", name: "Blazing Speed", desc: "+2 speed while using Windstep. Enemies you pass through take STR+DEX fire damage." }
            ],
            11: [
                { id: "chain", name: "Chain Reaction", desc: "(1/turn) When you crit, deal STR+Wounds fire damage to creatures within 2 spaces. Can repeat to adjacent targets." }
            ],
            15: [
                { id: "burning", name: "Burning Soul", desc: "Double any fire damage you deal." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Zephyr",
    subtitle: "A disciplined martial artist with swift hands",
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
        accent: "#60a5fa",
        accentDim: "#2563eb",
        bodyBg: "#050810",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(96, 165, 251, 0.07) 0%, transparent 100%), linear-gradient(180deg, #0a0f1e 0%, #050810 100%)",
        panelBg: "rgba(15, 23, 42, 0.7)",
        border: "rgba(96, 165, 251, 0.3)"
    },

    initialStats: {
        baseStr: 2, baseDex: 2, baseInt: -1, baseWil: 0
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "WayOfPain", label: "Way of Pain", accent: "#ef4444" },
        { value: "WayOfFlame", label: "Way of Flame", accent: "#f97316" }
    ],

    resources: [
        { id: 'burstSpeed', label: 'Bursts of Speed', manual: true, calcMax: (level, stats) => level >= 2 ? stats.dex : 0 }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
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
                   <div style="display: flex; align-items: center; gap: 8px;">
                       <div class="dark-incrementer" style="padding: 4px 10px;">
                           <button onclick="adjRes('burstSpeed', -1, ${burstMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                           <input type="number" id="res_burstSpeed" value="${burstCur}" min="0" max="${burstMax}" onchange="adjRes('burstSpeed', parseInt(this.value), ${burstMax}, true)" style="width:35px; font-size: 1.4em;">
                           <button onclick="adjRes('burstSpeed', 1, ${burstMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">+</button>
                       </div>
                       <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.1em;">/ <span style="color: var(--text-main);">${burstMax}</span></div>
                   </div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: 8px; font-family: 'Crimson Text'; font-style: italic; text-align: center; line-height: 1.2;">
                        Spend 1: Slipstream, Whirling Def, Swiftstrike, or Windstep.
                   </div>
               </div>

               <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Swift Fists</label>
                   <div class="roll-link" onclick="dispatchRoll('1d4+${state.baseStr + state.addStr}', 'Swift Fists')" style="font-size: 2.2em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: 900; line-height: 1; margin: 2px 0; cursor:pointer;">1d4+${state.baseStr + state.addStr}${level >= 5 ? '+' + level : ''}</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: 2px; font-family:'Crimson Text'; font-style:italic;">Ignores Rushed DIS.</div>
               </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
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
        let context = (feat.id === "fists" || feat.id === "quickstrike") ? { type: 'attack' } : {};
        if (feat.id === "fists") context.label = "Swift Fists";
        
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state), rSSC) : (feat.desc || "");

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
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, { str: state.baseStr + state.addStr, dex: state.baseDex + state.addDex, int: state.baseInt + state.addInt, wil: state.baseWil + state.addWil }, context)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, false, level, { str: state.baseStr + state.addStr, dex: state.baseDex + state.addDex, int: state.baseInt + state.addInt, wil: state.baseWil + state.addWil }, context);
    }
};