/**
 * Commander Class
 * Fearless leader, tactician, & weapon master.
 * @extends BaseClass
 */
class CommanderClass extends BaseClass {
    /**
     * Initializes the Commander class with its core configuration.
     */
    constructor() {
        super({
            name: "Commander",
            subtitle: "An academy-trained battlefield tactician",
            keyStats: ['str', 'int'],
            saves: { adv: 'str', dis: 'dex' },
            proficiencies: { armor: "Mail Armor, Shields", weapons: "All Martial Weapons" },
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
            initialStats: { baseStr: 2, baseDex: 0, baseInt: 2, baseWil: -1 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Bulwark", label: "Champion of the Bulwark", accent: "#334155" },
                { 
                    value: "Vanguard", 
                    label: "Champion of the Vanguard", 
                    accent: "#dc2626",
                    config: {
                        scalingStats: {
                            bonusCombatDice: (l) => l >= 11 ? 1 : 0
                        }
                    }
                },
                { 
                    value: "Spellblade", 
                    label: "Spellblade", 
                    accent: "#8b5cf6",
                    config: {
                        spellProgression: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18],
                        includeUtilitySpells: createUtilityConfig(null, ["selectedDeepKnowledge", "selectedTraining"]),
                        includeTieredSpells: ["selectedDeepKnowledge", "selectedTraining"], 
                        resources: [
                            createSimpleResource('mana', 'Mana Pool', (level, stats) => {
                                if (level < 4) return 0;
                                return stats.int;
                            }, { subtext: "(on Initiative)" })
                        ],
                        statModifiers: [
                            {
                                id: "spellblade_fly",
                                stat: "modFlySpeed",
                                condition: (l, s, state) => (state.selectedOrders || []).includes("Move it! Move it!")
                            }
                        ],
                        grantedSpells: [
                            { level: 3, spells: ["Enchant Weapon"] }
                        ],
                        optionExtensions: {
                            orders: {
                                "Face Me!": {
                                    empowered: "(Glimmering Decree). Reaction (after an ally within 12 spaces is crit): That enemy takes STR d8 radiant damage (ignoring armor), is pulled up to 4 spaces toward you, and is Taunted by you until you drop to 0 HP."
                                },
                                "Move it! Move it!": {
                                    empowered: "(Borne upon the Wind). When you roll Initiative, you may give yourself and an ally advantage on the roll, +3 speed, and the ability to fly for 1 round. Then, you both can also move for free."
                                },
                                "Hold the Line!": {
                                    empowered: "(Crystalline Armor). (1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3x LVL. Additionally, they gain that many temp HP. Enemies who reduce this temp HP in melee have their speed halved until the end of their next turn."
                                },
                                "Reposition!": {
                                    empowered: "(Flashstep). Action/Reaction (on an ally’s turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free. You may exchange places with one of them."
                                },
                                "I Can Do This ALL DAY!": {
                                    empowered: "(Rising Phoenix). (1/encounter) Reaction, (when you would drop to 0 HP): You may expend any number of Hit Dice, set your HP to the sum rolled instead, and deal that much fire damage to each enemy within 2 spaces of you. They gain the Smoldering condition."
                                }
                            }
                        }
                    }
                }
            ],
            scalingStats: {
                cdType: { 4: "d6", 5: "d8", 9: "d10", 13: "d12", 17: "d20" },
                bonusCombatDice: 0
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                if (level >= 4) {
                    if (state.subclass === "Spellblade") {
                        builder.addStatDisplay(derived.cdType, 'Combat Die', 'Reference');
                    } else {
                        builder.addStatDisplay(derived.cdType, 'Combat Die', 'Die Size');
                        builder.addStatDisplay(10 + statsMap.str, 'Tactical DC', '10+STR');
                    }
                }
            },
            statModifiers: [
                { id: "move_it_bonus", stat: "initAdv", condition: (l, s, state) => (state.selectedOrders || []).includes("Move it! Move it!") },
                { id: "move_it_speed", stat: "speed", value: 3, condition: (l, s, state) => (state.selectedOrders || []).includes("Move it! Move it!") }
            ],
            resources: [
                createSimpleResource('combatDice', 'Combat Dice', (level, stats, state, subclass, derived) => {
                    if (level < 4 || subclass === "Spellblade") return 0;
                    let max = stats.str + (derived.bonusCombatDice || 0);
                    (state.selectedTactics || []).forEach(t => { if (t === "+1 Combat Die") max += 1; });
                    return max;
                })
            ],
            featuresData: CommanderClass.FEATURES,
            optionsData: CommanderClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Commander class.
     */
    static get OPTIONS() {
        const orders = {
            "Face Me!": { desc: "Reaction (after an ally is crit within 12 spaces): Taunt that enemy until you drop to 0 HP." },
            "Hold the Line!": { desc: "(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3x LVL." },
            "I Can Do This ALL DAY!": { desc: "(1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR)." },
            "Move it! Move it!": { desc: "When you roll Initiative you may give yourself and an ally advantage on the roll and +3 speed for 1 round." },
            "Reposition!": { desc: "Action/Reaction (on an ally’s turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free." }
        };

        const tactics = {
            "Commanding Presence": { desc: "Action: Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it to the best of their ability." },
            "Heavy Strike": { desc: "When you hit, push a Medium creature STR spaces and deal extra damage equal to a roll of your Combat Die. A Small creature is pushed twice as far; Large, pushed half as far (round down)." },
            "Inerrant Strike": { desc: "Reroll a missed attack, add 1 to the Primary Die, and deal extra damage equal to a roll of your Combat Die." },
            "Lunging Strike": { desc: "Gain +1 Reach on an attack and deal extra damage equal to 2× a roll of your Combat Die." },
            "Sweeping Strike": { desc: "2 actions: Select any contiguous area within your weapon’s Reach and damage ALL targets there." }
        };

        const masteries = {
            "Slashing": { desc: "Your attacks with slashing weapons cannot miss unarmored enemies." },
            "Bludgeoning": { desc: "When your primary die rolls a 7 or higher with a bludgeoning weapon, ignore Heavy Armor." },
            "Piercing": { desc: "Your attacks with piercing weapons ignore Medium Armor." }
        };

        const allT1Spells = {};
        if (typeof SPELL_REGISTRY !== 'undefined') {
            Object.entries(SPELL_REGISTRY).forEach(([school, spells]) => {
                Object.entries(spells).forEach(([name, data]) => {
                    if (data.tier === "Tier 1") allT1Spells[name] = data;
                });
            });
        }

        return {
            orders,
            tactics,
            masteries,
            combatAbilities: { 
                "Coordinated Strike!": { desc: "1/round, Free action: you and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free. You can do this INT times/Safe Rest." },
                ...orders, 
                ...tactics 
            },
            training: {
                "+1 Order": { desc: "Gain 1 additional Commander's Order selection." },
                ...allT1Spells
            }
        };
    }

    /**
     * Defines the core and subclass features for the Commander class.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or INT', 'DEX or WIL', false);

        core[1] = [
            {
                id: "coord_strike",
                name: "Coordinated Strike!",
                milestones: [1, 9, 13, 17],
                desc: (level, subclass, state, derived, renderSingleSpellCard) => {
                    const baseRules = "1/round, Free action: you and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free. You can do this INT times/Safe Rest.";
                    const orderCard = renderSingleSpellCard({ name: "Order: Coordinated Strike!", tier: "Order", school: "Commander", customHtml: baseRules }, level, derived.statsMap);
                    return FeatureGen.createScalingList(`Gain the Coordinated Strike! Commander's Order (see card below).<div style="margin-top:10px;">${orderCard}</div>`, [
                        { level: 9, text: "Master Commander (2): +1 use of Coordinated Strike/Safe Rest." },
                        { level: 13, text: "Master Commander (3): +2 uses of Coordinated Strike/Safe Rest." },
                        { level: 17, text: "Master Commander (4): +3 uses of Coordinated Strike/Safe Rest." }
                    ], level);
                }
            }
        ];

        core[2] = [
            {
                id: "orders",
                name: "Commander’s Orders",
                type: "dynamic_choice",
                stateKey: "selectedOrders",
                getSlots: (level, subclass, state) => {
                    const slots = [];
                    if (level >= 2) {
                        slots.push({ collection: 'orders', label: 'Order Selection' });
                        slots.push({ collection: 'orders', label: 'Order Selection' });
                    }
                    if (subclass === "Spellblade") {
                        (state.selectedTraining || []).forEach(t => {
                            if (t === "+1 Order") slots.push({ collection: 'combatAbilities', label: 'Additional Order' });
                        });
                    }
                    return slots;
                },
                desc: "Choose your Commander’s Orders."
            },
            { id: "medic", name: "Field Medic", desc: "Roll 1 additional die for any health potion you administer. Whenever you or an ally spends any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered." }
        ];
        
        core[4].push({
            id: "training",
            level: 4,
            milestones: [4, 6, 8, 10, 12, 16],
            name: "Fit for Any Battlefield",
            type: "dynamic_choice",
            stateKey: "selectedTactics",
            getSlots: (level, subclass) => {
                if (subclass === "Spellblade") return null;
                const slots = [];
                const milestones = [4, 6, 8, 10, 12, 16];
                milestones.forEach((m, idx) => {
                    if (level >= m) {
                        if (idx === 0) slots.push({ collection: 'tactics', label: 'Combat Tactic' });
                        else slots.push({ 
                            options: [
                                { label: "Core", options: ["+1 Combat Die"] },
                                { label: "Combat Tactics", options: Object.keys(CommanderClass.OPTIONS.tactics) },
                                { label: "Commander's Orders", options: Object.keys(CommanderClass.OPTIONS.orders) }
                            ],
                            collection: 'combatAbilities', 
                            label: `Training Selection` 
                        });
                    }
                });
                return slots;
            },
            desc: (level) => FeatureGen.createScalingList("When you roll Initiative, gain STR Combat Dice, each a d6. (1/attack) You may expend a Combat Die to perform a special maneuver. Combat Dice are lost when combat ends.", [
                { level: 5, text: "Combat Tactics: Your Combat Dice are now d8s." },
                { level: 9, text: "Combat Tactics (2): Your Combat Dice are now d10s." },
                { level: 13, text: "Combat Tactics (3): Your Combat Dice are now d12s." },
                { level: 17, text: "Combat Tactics (4): Your Combat Dice are now d20s." }
            ], level)
        });

        core[5].push({ id: "master_commander", name: "Master Commander", desc: "When you roll Initiative, regain 1 spent use of Coordinated Strike (it is lost if not spent during that encounter). Attacks made from your Coordinated Strikes also now ignore disadvantage." });
        
        core[6].push({ 
            id: "mastery", name: "Weapon Mastery", level: 6, milestones: [6, 10, 14], type: "dynamic_choice", stateKey: "selectedMastery",
            getSlots: (level, subclass) => {
                if (subclass === "Spellblade") return null;
                const slots = [];
                [6, 10, 14].forEach((m, idx) => { if (level >= m) slots.push({ collection: 'masteries', label: `Weapon Mastery` }); });
                return slots;
            },
            desc: (level) => FeatureGen.createScalingList("You may sheathe a weapon and draw a different one 2×/round for free. Choose a weapon type to specialize in.", [{ level: 14, text: "Weapon Mastery (3): You have complete mastery of all weapon types." }], level)
        });

        core[18] = [{ id: "unparalleled_tactics", name: "Unparalleled Tactics", desc: "The first time each encounter you use Coordinated Strike, an ally who can hear you also gains 1 action to use on their next turn." }];
        core[20].push({ id: "captain_of_legions", name: "Captain of Legions", desc: "+1 to any 2 of your stats. The first time each encounter you use Coordinated Strike, EVERY ally within 12 spaces gains +1 action (replaces Unparalleled Tactics)." });

        subclasses["Bulwark"] = {
            3: [
                { id: "armor_master", name: "Armor Master", desc: "You are proficient with plate armor." },
                { id: "shield_expert", name: "Shield Expert", desc: "While wearing a shield, you may Defend 2× each round. The first time each round you block all of the damage from an attack, you may make an opportunity attack against the attacker for free." }
            ],
            7: [{ id: "juggernaut", name: "Juggernaut", desc: "When you use Coordinated Strike, you deal extra damage equal to your armor, and you can add 1 to your primary die." }],
            11: [{ id: "taunting_strike", name: "Taunting Strike", desc: "(1/turn) You may Taunt a creature you hit until the end of their next turn." }],
            15: [{ id: "shield_wall", name: "Shield Wall", desc: "Allies within 2 spaces gain ALL the benefits of the shield you have equipped." }]
        };

        subclasses["Vanguard"] = {
            3: [{ id: "advance", name: "Advance!", desc: "(1/round) After you move toward an enemy, gain advantage on the first melee attack you make against it. When you use your Coordinated Strike, you and all allies within 12 spaces can first move up to half their speed for free." }],
            7: [{ id: "experienced_commander", name: "Experienced Commander", desc: "Your Coordinated Strike may target 1 additional ally. Gain +1 use of Coordinated Strike/Safe Rest." }],
            11: [{ id: "survey_battlefield", name: "Survey the Battlefield", desc: "When you roll Initiative, regain 1 use of Coordinated Strike. +1 max Combat Dice." }],
            15: [{ id: "as_one", name: "As One!", desc: "Attacks made with your Coordinated Strikes also grant advantage and ignore all disadvantage. Your chosen allies gain 1 additional action to use on their next turn." }]
        };

        subclasses["Spellblade"] = {
            3: [
                { id: "firebrand", name: "Firebrand", desc: "When you roll Initiative you may cast Enchant Weapon for free (can be upcast as normal by spending additional mana). You learn the <strong>Enchant Weapon</strong> spell." },
                FeatureGen.createSpellChoiceFeature({
                    id: "deep_knowledge", name: "Deep Knowledge", level: 3, milestones: [3, 7, 11, 15], spellType: "paired", stateKey: "selectedDeepKnowledge",
                    getCount: (level) => { let count = 0; [3, 7, 11, 15].forEach(m => { if (level >= m) count++; }); return (count * 2); },
                    getSlots: (level) => {
                        const slots = [];
                        const milestones = [3, 7, 11, 15];
                        milestones.forEach(m => { if (level >= m) { const tier = Math.min(4, milestones.indexOf(m) + 1); slots.push({ type: 'utility', label: 'Utility Selection' }); slots.push({ type: 'tiered', tier: tier, label: `Tier ${tier} Selection` }); } });
                        return slots;
                    },
                    schools: ["Fire", "Ice", "Lightning", "Radiant", "Necrotic", "Wind"],
                    milestones: [3, 7, 11, 15],
                    desc: (level) => FeatureGen.createScalingList("Choose any tier 1 (or lower) spell and any Utility Spell.", [
                        { level: 7, text: "Deep Knowledge (2): Choose any tier 2 (or lower) spell and any Utility Spell." },
                        { level: 11, text: "Deep Knowledge (3): Choose any tier 3 (or lower) spell and any Utility Spell." },
                        { level: 15, text: "Deep Knowledge (4): Choose any tier 4 (or lower) spell and any Utility Spell." }
                    ], level)
                })
            ],
            4: [
                { id: "training", replaces: ["training", "mastery"], name: "Arcane Command", level: 4, milestones: [4, 6, 8, 10, 12, 14, 16], type: "dynamic_choice", stateKey: "selectedTraining",
                    allowDuplicates: ["+1 Order"],
                    getSlots: (level) => {
                        const slots = [];
                        const milestones = [4, 6, 8, 10, 12, 14, 16];
                        const masteryMilestones = [6, 10, 14];
                        
                        const groupedOptions = [{ label: "Training", options: ["+1 Order"] }];
                        if (typeof SPELL_REGISTRY !== 'undefined') {
                            Object.entries(SPELL_REGISTRY).forEach(([school, spells]) => {
                                const schoolT1s = Object.entries(spells)
                                    .filter(([_, data]) => data.tier === "Tier 1")
                                    .map(([name, _]) => name);
                                if (schoolT1s.length > 0) groupedOptions.push({ label: school, options: schoolT1s });
                            });
                        }

                        milestones.forEach(m => { if (level >= m) slots.push({ options: groupedOptions, collection: 'training', label: 'Arcane Command' }); });
                        masteryMilestones.forEach(m => { if (level >= m) slots.push({ options: groupedOptions, collection: 'training', label: 'Arcane Command' }); });
                        return slots;
                    },
                    desc: "Your focus on the arcane causes you to lose access to Weapon Mastery and Combat Tactics, but you now gain INT mana when you roll Initiative (this mana is lost if unspent when combat ends). Whenever you could choose a Combat Tactic or Weapon Mastery, instead choose another Commander’s Order or a tier 1 (or lower) spell from any spell school. Your Commander’s Orders are also empowered with magical power."
                }
            ]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new CommanderClass();
