const COMMANDER_OPTIONS = {
    orders: {
        "Coordinated Strike!": {
            desc: "1/round, Free: You and an ally within 6 both immediately make a weapon attack or cast a cantrip for free. Uses: INT/Safe Rest.",
            empowered: "<strong>(Withering Strike)</strong> Attacks made this way deal additional Necrotic damage equal to the max value of your Combat Die. Target considered undead for 1 round."
        },
        "Face Me!": {
            desc: "Reaction (ally crit within 12): Taunt enemy until you drop to 0 HP.",
            empowered: "<strong>(Glimmering Decree)</strong> Target takes STR d8 radiant damage, is pulled up to 4 spaces toward you, and is Taunted until you drop to 0 HP."
        },
        "Hold the Line!": {
            desc: "(1/encounter) Reaction (ally drops to 0 HP): Command them to continue; set their HP to 3x LVL.",
            empowered: "<strong>(Crystalline Armor)</strong> Target set to 3x LVL HP and gains that much Temp HP. Enemies who reduce this Temp HP in melee have speed halved for next turn."
        },
        "I Can Do This ALL DAY!": {
            desc: "(1/encounter) Reaction (you drop to 0 HP): Expend Hit Dice and set HP to the sum rolled (no STR bonus).",
            empowered: "<strong>(Rising Phoenix)</strong> Roll HD for HP, then deal HD fire damage to each enemy within 2. They gain Smoldering."
        },
        "Move it! Move it!": {
            desc: "When you roll Initiative: Grant self and ally advantage on the roll and +3 speed for 1 round.",
            empowered: "<strong>(Borne upon the Wind)</strong> Gain advantage on Initiative, +3 speed, and FLY for 1 round. You and chosen ally both move for free."
        },
        "Reposition!": {
            desc: "Action/Reaction (on ally's turn): Command 1 ally to move their speed (or 2 allies 1/2 speed) for free.",
            empowered: "<strong>(Flashstep)</strong> Command ally to move their speed (or 2 allies 1/2 speed) for free. You may exchange places with one of them."
        }
    },
    tactics: {
        "Commanding Presence": { desc: "Action: Command enemy (2 words). Failed WIL save (DC 10+STR): They obey for next turn. Immune for 1 day after." },
        "Heavy Strike": { desc: "When you hit: Push Med creature STR spaces and deal extra dmg = Combat Die. Small: 2x distance. Large: 1/2 distance." },
        "Inerrant Strike": { desc: "Reroll missed attack, add 1 to Primary Die, deal extra damage = Combat Die." },
        "Lunging Strike": { desc: "Gain +1 Reach and deal extra damage = 2 x Combat Die." },
        "Sweeping Strike": { desc: "2 actions: Select 3x3 area. Attack ALL targets; does not miss on a 1." }
    },
    masteries: {
        "Slashing": { desc: "Your attacks with slashing weapons cannot miss unarmored enemies." },
        "Bludgeoning": { desc: "When your primary die rolls a 7 or higher with a bludgeoning weapon, ignore Heavy Armor." },
        "Piercing": { desc: "Your attacks with piercing weapons ignore Medium Armor." }
    }
};

const COMMANDER_FEATURES = {
    core: {
        1: [
            { id: "coord_strike", name: "Coordinated Strike!", desc: "1/round, Free action: you and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free. You can do this INT times/Safe Rest." }
        ],
        2: [
            { id: "orders", name: "Commander’s Orders", type: "dynamic_choice", collection: "orders", stateKey: "selectedOrders", desc: "Choose 2 Commander's Orders.", getCount: (level) => 2 },
            { id: "medic", name: "Field Medic", desc: "Roll 1 additional die for any health potion you administer. Whenever you or an ally spends any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered." }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Commander subclass.", minor: true }
        ],
        4: [
            { id: "tactics", name: "Fit for Any Battlefield", type: "dynamic_choice", collection: "tactics", stateKey: "selectedTactics", desc: "Choose Combat Tactics. When you roll Initiative, gain STR Combat Dice, each a d6 (d8 at 5, d10 at 9, d12 at 13, d20 at 17). (1/attack) You may expend a Combat Die to perform a special maneuver. Combat Dice are lost when combat ends.", getCount: (level) => level >= 16 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        5: [
            { id: "master_commander_1", name: "Master Commander", desc: "When you roll Initiative, regain 1 spent use of Coordinated Strike (it is lost if not spent during that encounter). Attacks made from your Coordinated Strikes also now ignore disadvantage." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        6: [
            { id: "mastery", name: "Weapon Mastery", type: "dynamic_choice", collection: "masteries", stateKey: "selectedMastery", desc: "You may sheathe a weapon and draw a different one 2×/round for free. Choose weapon types to specialize in.", getCount: (level) => level >= 14 ? 3 : level >= 10 ? 2 : 1 }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        9: [
            { id: "master_commander_2", name: "Master Commander (2)", desc: "+1 use of Coordinated Strike/Safe Rest.", minor: true },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        13: [
            { id: "master_commander_3", name: "Master Commander (3)", desc: "+1 use of Coordinated Strike/Safe Rest.", minor: true },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        17: [
            { id: "master_commander_4", name: "Master Commander (4)", desc: "+1 use of Coordinated Strike/Safe Rest.", minor: true },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        18: [
            { id: "unparalleled_tactics", name: "Unparalleled Tactics", desc: "The first time each encounter you use Coordinated Strike, an ally who can hear you also gains 1 action to use on their next turn." }
        ],
        20: [
            { id: "captain_of_legions", name: "Captain of Legions", desc: "+1 to any 2 of your stats. The first time each encounter you use Coordinated Strike, EVERY ally within 12 spaces gains +1 action (replaces Unparalleled Tactics)." }
        ]
    },
    subclasses: {
        "Bulwark": {
            3: [
                { id: "armor_master", name: "Armor Master", desc: "You are proficient with plate armor." },
                { id: "shield_expert", name: "Shield Expert", desc: "While wearing a shield, you may Defend 2× each round. The first time each round you block all of the damage from an attack, you may make an opportunity attack against the attacker for free." }
            ],
            7: [
                { id: "juggernaut", name: "Juggernaut", desc: "When you use Coordinated Strike, you deal extra damage equal to your armor, and you can add 1 to your primary die." }
            ],
            11: [
                { id: "taunting_strike", name: "Taunting Strike", desc: "(1/turn) You may Taunt a creature you hit until the end of their next turn." }
            ],
            15: [
                { id: "shield_wall", name: "Shield Wall", desc: "Allies within 2 spaces gain ALL the benefits of the shield you have equipped." }
            ]
        },
        "Vanguard": {
            3: [
                { id: "advance", name: "Advance!", desc: "(1/round) After you move toward an enemy, gain advantage on the first melee attack you make against it. When you use your Coordinated Strike, you and all allies within 12 spaces can first move up to half their speed for free." }
            ],
            7: [
                { id: "exp_commander", name: "Experienced Commander", desc: "Your Coordinated Strike may target 1 additional ally. Gain +1 use of Coordinated Strike/Safe Rest." }
            ],
            11: [
                { id: "survey_battlefield", name: "Survey the Battlefield", desc: "When you roll Initiative, regain 1 use of Coordinated Strike. +1 max Combat Dice." }
            ],
            15: [
                { id: "as_one", name: "As One!", desc: "Attacks made with your Coordinated Strike also grant advantage and ignore all disadvantage. Your chosen allies gain 1 additional action to use on their next turn." }
            ]
        },
        "Spellblade": {
            3: [
                { id: "arcane_command_passive", replaces: ["tactics", "mastery"], name: "Arcane Command", desc: "You gain INT mana when you roll Initiative. Your Commander's Orders are empowered. (See your updated Arcane Command feature above).", minor: true },
                { id: "firebrand", name: "Firebrand", desc: "When you roll Initiative you may cast Enchant Weapon for free (can be upcast as normal by spending additional mana)." },
                { id: "deep_knowledge", name: "Deep Knowledge", type: "dynamic_spell_choice", stateKey: "selectedSpells", desc: "Choose a tiered spell (based on your level) and any Utility Spell.", utility: true, utilStateKey: "selectedUtilitySpells", getCount: (level) => level >= 15 ? 4 : level >= 11 ? 3 : level >= 7 ? 2 : 1, getTier: (idx) => idx + 1 }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Commander",
    subtitle: "Fearless leader, tactician, & weapon master",
    keyStats: ['str', 'int'],
    saves: { adv: 'str', dis: 'dex' },
    proficiencies: {
        armor: "Mail, Shields",
        weapons: "All Martial Weapons"
    },
    baseHp: 17,
    hpPerLevel: 8,
    hitDie: 10,

    theme: {
        accent: "#f59e0b",
        accentDim: "#b45309",
        bodyBg: "#0f0a0a",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0f11 0%, #0f0a0a 100%)",
        panelBg: "rgba(35, 20, 20, 0.8)",
        border: "rgba(245, 158, 11, 0.25)"
    },

    initialStats: {
        baseStr: 2, baseDex: 0, baseInt: 2, baseWil: -1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Bulwark", label: "Champion of the Bulwark", accent: "#94a3b8" },
        { value: "Vanguard", label: "Champion of the Vanguard", accent: "#ef4444" },
        { value: "Spellblade", label: "Spellblade", accent: "#a855f7" }
    ],

    resources: [
        { id: 'combatDice', label: 'Combat Dice', manual: true, calcMax: (level, stats, state, subclass) => {
            let max = stats.str;
            if (level >= 11 && subclass === "Vanguard") max += 1;
            return max;
        }},
        { id: 'coordStrike', label: 'Coordinated Strike', manual: true, calcMax: (level, stats, state, subclass) => {
            let max = stats.int;
            if (level >= 9) max += 1;
            if (level >= 13) max += 1;
            if (level >= 17) max += 1;
            if (level >= 7 && subclass === "Vanguard") max += 1;
            return max;
        }},
        { id: 'mana', label: 'Mana Pool', manual: true, isVisible: (level, subclass) => subclass === "Spellblade", calcMax: (level, stats) => stats.int }
    ],

    customHeaderStats: [],

    getDerivedStats: function (level, subclass, state) {
        let speed = 6;
        let woundMax = 6;

        let cdType = "d6";
        if (level >= 5) cdType = "d8";
        if (level >= 9) cdType = "d10";
        if (level >= 13) cdType = "d12";
        if (level >= 17) cdType = "d20";

        return { speed, woundMax, cdType };
    },

    getStatOverrides: function (level, subclass, state, statsMap) {
        let overrides = {};
        return overrides;
    },

    getShieldBonus: function (level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function (level, subclass, state, derived) {
        const maxCD = derived.resourceMaxes.combatDice;
        const strikeMax = derived.resourceMaxes.coordStrike;
        const manaMax = derived.resourceMaxes.mana;

        const currentCD = state.resourceValues.combatDice || 0;
        const strikeCur = state.resourceValues.coordStrike || 0;
        const manaCur = state.resourceValues.mana || 0;

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 8px;">
               ${subclass !== "Spellblade" ? `
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                   <label class="roll-link" onclick="dispatchRoll('1${derived.cdType}', 'Combat Die')" style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px; cursor:pointer;">Combat Dice (${derived.cdType})</label>
                   <div style="display: flex; align-items: center; gap: 4px;">
                       <div class="dark-incrementer">
                           <button onclick="adjRes('combatDice', -1, ${maxCD})">-</button>
                           <input type="number" id="res_combatDice" value="${currentCD}" min="0" max="${maxCD}" onchange="adjRes('combatDice', parseInt(this.value), ${maxCD}, true)">
                           <button onclick="adjRes('combatDice', 1, ${maxCD})">+</button>
                       </div>
                       <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ ${maxCD}</div>
                   </div>
               </div>` : `
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                   <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">INT Mana</label>
                   <div style="display: flex; align-items: center; gap: 4px;">
                       <div class="dark-incrementer">
                           <button onclick="adjRes('mana', -1, ${manaMax})">-</button>
                           <input type="number" id="res_mana" value="${manaCur}" min="0" max="${manaMax}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)">
                           <button onclick="adjRes('mana', 1, ${manaMax})">+</button>
                       </div>
                       <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ ${manaMax}</div>
                   </div>
               </div>`}

               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                   <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Coord. Strike</label>
                   <div style="display: flex; align-items: center; gap: 4px;">
                       <div class="dark-incrementer">
                           <button onclick="adjRes('coordStrike', -1, ${strikeMax})">-</button>
                           <input type="number" id="res_coordStrike" value="${strikeCur}" min="0" max="${strikeMax}" onchange="adjRes('coordStrike', parseInt(this.value), ${strikeMax}, true)">
                           <button onclick="adjRes('coordStrike', 1, ${strikeMax})">+</button>
                       </div>
                       <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.0em;">/ ${strikeMax}</div>
                   </div>
               </div>

               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Tactical DC</label>
                   <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">${10 + state.baseStr + state.addStr}</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">10+STR save DC.</div>
               </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        return defaultGetFeaturesHTML(level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, COMMANDER_FEATURES, COMMANDER_OPTIONS, this);
    },

    renderFeature: function(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, optionsRef, configRef) {
        const statsMap = derived.statsMap;
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice" || feat.type === "spell_choice" || feat.type === "dynamic_spell_choice";
        let name = feat.name;
        let count = feat.type === "dynamic_choice" ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, derived, rSSC) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) {
            finalCssClass += " minor-feature";
        }

        let context = (feat.id === "tactics" || feat.collection === "tactics") ? { type: 'attack', stat: 'str' } : {};

        // Dynamic renaming and transformation of the Orders card into Arcane Command for Spellblade
        if (feat.id === "orders" && subclass === "Spellblade") {
            name = "Arcane Command";
            collection = "sb_options";
            desc = "Your focus on the arcane causes you to lose access to Weapon Mastery and Combat Tactics, but you now gain INT mana when you roll Initiative. Your Commander's Orders are empowered with magical power. Whenever you could choose a Combat Tactic or Weapon Mastery, instead choose another Commander’s Order or a tier 1 (or lower) spell from any spell school.";
            let c = 2; // base 2 orders
            if (level >= 4) c += 1;
            if (level >= 6) c += 2;
            if (level >= 8) c += 1;
            if (level >= 10) c += 2;
            if (level >= 12) c += 1;
            if (level >= 14) c += 1;
            if (level >= 16) c += 1;
            count = c;
        }

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = "";

                if (collection === "sb_options") {
                    let orderOpts = `<option value="None">Select Commander's Order...</option>`;
                    Object.keys(COMMANDER_OPTIONS.orders).forEach(o => orderOpts += `<option value="${o}">${o}</option>`);

                    let spellOpts = `<option value="None">Select Tier 1 Spell...</option>`;
                    Object.keys(SPELL_REGISTRY).forEach(sch => {
                        spellOpts += `<optgroup label="${sch}">`;
                        Object.entries(SPELL_REGISTRY[sch]).forEach(([sn, data]) => {
                            let t = parseInt(data.tier.replace(/\D/g, '')) || 0;
                            if (data.tier.includes("Cantrip") || t <= 1) {
                                spellOpts += `<option value="${sn}">${sn} (${data.tier})</option>`;
                            }
                        });
                        spellOpts += `</optgroup>`;
                    });

                    if (val !== "None") {
                        let itemName = val.split(" (")[0];
                        if (COMMANDER_OPTIONS.orders[itemName]) {
                            d = subclass === "Spellblade" && COMMANDER_OPTIONS.orders[itemName].empowered ? COMMANDER_OPTIONS.orders[itemName].empowered : COMMANDER_OPTIONS.orders[itemName].desc;
                        } else {
                            Object.values(SPELL_REGISTRY).forEach(sch => {
                                if (sch[itemName]) d = sch[itemName].desc;
                            });
                            if (!d) d = "Selected Spell/Order";
                        }
                    }

                    choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        <div style="display:flex; gap: 8px; margin-bottom: 5px;">
                            <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="flex:1; border-bottom-color: var(--class-accent);">${orderOpts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                            <span style="color:var(--text-muted); font-size:0.8em; align-self:center; font-family:'Cinzel'; font-weight:bold;">OR</span>
                            <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="flex:1; border-bottom-color: var(--class-accent);">${spellOpts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                        </div>
                        <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3; margin-top:4px;">${iStats(d, level, statsMap, context)}</div>
                    </div>`;
                } else {
                    let options = [];
                    if (collection === "orders") options = Object.keys(COMMANDER_OPTIONS.orders);
                    else if (collection === "tactics") options = Object.keys(COMMANDER_OPTIONS.tactics);
                    else if (collection === "masteries") options = Object.keys(COMMANDER_OPTIONS.masteries);

                    let optsHtml = `<option value="None">-- Select Option --</option>`;
                    options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

                    if (val !== "None") {
                        if (COMMANDER_OPTIONS[collection] && COMMANDER_OPTIONS[collection][val]) {
                            d = (subclass === "Spellblade" && collection === "orders" && COMMANDER_OPTIONS.orders[val].empowered) ? COMMANDER_OPTIONS.orders[val].empowered : COMMANDER_OPTIONS[collection][val].desc;
                        }
                    }
                    choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                        <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, statsMap, context)}</div>
                    </div>`;
                }
            }
            desc += choiceHtml + `</div>`;
        }

        if (feat.type === "spell_choice" || feat.type === "dynamic_spell_choice") {
            let sHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;

            let selection = state[feat.stateKey] || [];
            let count = feat.type === "dynamic_spell_choice" ? feat.getCount(level) : (feat.count || 1);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let maxTier = feat.getTier ? feat.getTier(idx) : feat.tiered;

                let opts = `<option value="None">Select Tier ${maxTier} Spell...</option>`;
                Object.keys(SPELL_REGISTRY).forEach(sch => {
                    opts += `<optgroup label="${sch}">`;
                    Object.entries(SPELL_REGISTRY[sch]).forEach(([sn, data]) => {
                        let t = parseInt(data.tier.replace(/\D/g, '')) || 0;
                        let isCantrip = data.tier.includes("Cantrip");
                        if (isCantrip || t <= maxTier) {
                            opts += `<option value="${sn}">${sn} (${data.tier})</option>`;
                        }
                    });
                    opts += `</optgroup>`;
                });
                sHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <label style="font-size:0.7em; color:var(--gold-light); display:block; margin-bottom:2px;">TIERED SPELL (UP TO T${maxTier})</label>
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                </div>`;

                if (feat.utility) {
                    let uSelection = state[feat.utilStateKey] || [];
                    let uVal = uSelection[idx] || "None";
                    let uOpts = `<option value="None">Select Utility Spell...</option>`;
                    Object.keys(UTILITY_SPELLS).forEach(sch => {
                        uOpts += `<optgroup label="${sch}">`;
                        Object.keys(UTILITY_SPELLS[sch]).forEach(sn => uOpts += `<option value="${sn}">${sn}</option>`);
                        uOpts += `</optgroup>`;
                    });
                    sHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent); margin-top: 4px;">
                        <label style="font-size:0.7em; color:var(--gold-light); display:block; margin-bottom:2px;">UTILITY SPELL</label>
                        <select onchange="updateClassState('${feat.utilStateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${uOpts.replace(`value="${uVal}"`, `value="${uVal}" selected`)}</select>
                    </div>`;
                }
            }

            desc += sHtml + `</div>`;
        }

        return bFeat(name, feat.level || "", desc, finalCssClass, false, level, statsMap, context);
    }
};