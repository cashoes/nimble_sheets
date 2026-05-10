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
                        includeUtilitySpells: createUtilityConfig(null, ["selectedDeepKnowledge"]),
                        includeTieredSpells: ["selectedDeepKnowledge"],
                        resources: [
                            createManaResource('int')
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
                                    empowered: "(Glimmering Decree) That enemy additionally takes STR d8 radiant damage (ignoring armor), is pulled up to 4 spaces toward you."
                                },
                                "Hold the Line!": {
                                    empowered: "(Crystalline Armor) Additionally, they gain 3x LVL temp HP. Enemies who reduce this temp HP in melee have their speed halved until the end of their next turn."
                                },
                                "I Can Do This ALL DAY!": {
                                    empowered: "(Rising Phoenix) Deal fire damage to each enemy within 2 spaces equal to the total value of the (HD) expended. They gain the Smoldering condition."
                                },
                                "Move it! Move it!": {
                                    empowered: "(Borne upon the Wind) You additionally gain the ability to fly for 1 round. Then, you both can also move for free."
                                },
                                "Reposition!": {
                                    empowered: "(Flashstep) You may exchange places with one of them."
                                }
                            }
                        },
                        featureExtensions: {
                            "training": {
                                empoweredRules: "Whenever you could choose a Combat Tactic or Weapon Mastery, instead choose another Commander’s Order or a tier 1 (or lower) spell from any spell school. Your Commander’s Orders are also empowered with magical power."
                            }
                        },
                        mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                            builder.addStatDisplay(derived.cdType, 'Combat Die', 'Reference for Spells');
                            const orders = state.selectedOrders || [];
                            if (orders.includes("Face Me!")) builder.addRollDisplay(`${statsMap.str}d8`, 'Radiant Order', `${statsMap.str}d8`, 'Radiant / Taunt', { type: 'attack', school: 'Radiant' });
                            if (orders.includes("I Can Do This ALL DAY!")) builder.addRollDisplay('HD', 'Fire Order', 'Sum HD', 'Fire / Smolder', { type: 'attack', school: 'Fire' });
                            if (orders.includes("Hold the Line!")) builder.addStatDisplay(3 * level, 'Rally HP', 'Set HP & Temp HP', { color: '#22c55e' });
                        }
                    }
                }
            ],
            scalingStats: {
                cdType: { 4: "d6", 5: "d8", 9: "d10", 13: "d12", 17: "d20" },
                bonusCombatDice: 0
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                builder.addStatDisplay(10 + statsMap.str, 'Tactical DC', '10+STR save DC.');
            },
            statModifiers: [
                { id: "move_it_bonus", stat: "initAdv", condition: (l, s, state) => (state.selectedOrders || []).includes("Move it! Move it!") },
                { id: "move_it_speed", stat: "speed", value: 3, condition: (l, s, state) => (state.selectedOrders || []).includes("Move it! Move it!") }
            ],
            resources: [
                createSimpleResource('combatDice', 'Combat Dice', (level, stats, state, subclass, derived) => {
                    if (level < 4 || subclass === "Spellblade") return 0;
                    return stats.str + (derived.bonusCombatDice || 0);
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
        return {
            training: {
                "+1 Order": { desc: "Gain 1 additional Commander's Order selection." },
                "+1 Tier 1 Spell": { desc: "Gain 1 additional Tier 1 Spell selection." }
            },
            orders: {
                "Face Me!": { desc: "Reaction (after an ally is crit within 12 spaces): Taunt that enemy until you drop to 0 HP." },
                "Hold the Line!": { desc: "(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3x LVL." },
                "I Can Do This ALL DAY!": { desc: "(1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR)." },
                "Move it! Move it!": { desc: "When you roll Initiative you may give yourself and an ally advantage on the roll and +3 speed for 1 round." },
                "Reposition!": { desc: "Action/Reaction (on an ally’s turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free." }
            },
            tactics: {
                "Commanding Presence": { desc: "Action: Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it to the best of their ability, provided it is not obviously harmful to themselves. They then become immune to this effect for 1 day." },
                "Heavy Strike": { desc: "When you hit, push a Medium creature STR spaces and deal extra damage equal to a roll of your Combat Die. A Small creature is pushed twice as far; Large, pushed half as far (round down)." },
                "Inerrant Strike": { desc: "Reroll a missed attack, add 1 to the Primary Die, and deal extra damage equal to a roll of your Combat Die." },
                "Lunging Strike": { desc: "Gain +1 Reach on an attack and deal extra damage equal to 2× a roll of your Combat Die." },
                "Sweeping Strike": { desc: "2 actions: Select any contiguous area within your weapon’s Reach and damage ALL targets there. This attack does not miss on a 1." }
            },
            masteries: {
                "Slashing": { desc: "Your attacks with slashing weapons cannot miss unarmored enemies." },
                "Bludgeoning": { desc: "When your primary die rolls a 7 or higher with a bludgeoning weapon, ignore Heavy Armor." },
                "Piercing": { desc: "Your attacks with piercing weapons ignore Medium Armor." }
            },
            combatAbilities: {
                "Face Me!": { desc: "Reaction (after an ally is crit within 12 spaces): Taunt that enemy until you drop to 0 HP." },
                "Hold the Line!": { desc: "(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3x LVL." },
                "I Can Do This ALL DAY!": { desc: "(1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR)." },
                "Move it! Move it!": { desc: "When you roll Initiative you may give yourself and an ally advantage on the roll and +3 speed for 1 round." },
                "Reposition!": { desc: "Action/Reaction (on an ally’s turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free." },
                "Commanding Presence": { desc: "Action: Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it to the best of their ability." },
                "Heavy Strike": { desc: "When you hit, push a Medium creature STR spaces and deal extra damage equal to a roll of your Combat Die." },
                "Inerrant Strike": { desc: "Reroll a missed attack, add 1 to the Primary Die, and deal extra damage equal to a roll of your Combat Die." },
                "Lunging Strike": { desc: "Gain +1 Reach on an attack and deal extra damage equal to 2× a roll of your Combat Die." },
                "Sweeping Strike": { desc: "2 actions: Select any contiguous area within your weapon’s Reach and damage ALL targets there." }
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
                    const cdVal = derived.cdType || "d6";
                    const baseRules = "1/round, Free action: you and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free. You can do this INT times/Safe Rest.";
                    
                    let d = baseRules;
                    const subConfig = CLASS_CONFIG.getSubclassConfig(subclass, state);
                    const ext = subConfig.featureExtensions?.["coord_strike"];
                    
                    if (ext?.empoweredRules) {
                        const rules = ext.empoweredRules.replace("cdType", cdVal);
                        d += `<div style="margin-top:8px; padding:6px; background:rgba(139, 92, 246, 0.15); border-left: 2px solid var(--subclass-accent); font-style: italic; font-size: 0.95em; color: #fff;">
                            <strong>Empowered:</strong> ${rules}
                        </div>`;
                    }

                    const orderCard = renderSingleSpellCard({
                        name: "Order: Coordinated Strike!",
                        tier: "Order",
                        school: "Commander",
                        customHtml: d
                    }, level, derived.statsMap);

                    return FeatureGen.createScalingList(
                        `Gain the Coordinated Strike! Commander's Order (see card below).<div style="margin-top:10px;">${orderCard}</div>`,
                        [
                            { level: 9, text: "Master Commander (2): +1 use of Coordinated Strike/Safe Rest." },
                            { level: 13, text: "Master Commander (3): +2 uses of Coordinated Strike/Safe Rest." },
                            { level: 17, text: "Master Commander (4): +3 uses of Coordinated Strike/Safe Rest." }
                        ],
                        level
                    );
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
                    // Level 2 base
                    if (level >= 2) {
                        slots.push({ collection: 'orders', label: 'Order Selection' });
                        slots.push({ collection: 'orders', label: 'Order Selection' });
                    }
                    
                    if (subclass === "Spellblade") {
                        (state.selectedTraining || []).forEach(t => {
                            if (t === "+1 Order") slots.push({ collection: 'orders', label: 'Additional Order' });
                        });
                    } else {
                        // Base Class "Fit for Any Battlefield" expansions
                        if (level >= 4) slots.push({ collection: 'tactics', label: 'Combat Tactic' });
                        [6, 8, 10, 12, 14, 16].forEach(m => {
                            if (level >= m) slots.push({ collection: 'combatAbilities', label: 'Combat Ability' });
                        });
                    }
                    return slots;
                },
                desc: (level, subclass) => {
                    if (subclass === "Spellblade") return "Choose your Commander’s Orders.";
                    return "Choose your Commander’s Orders and Combat Tactics.";
                }
            },
            { id: "medic", name: "Field Medic", desc: "Roll 1 additional die for any health potion you administer. Whenever you or an ally spends any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered." }
        ];
        
        core[4].push({
            id: "training",
            level: 4,
            name: (level, subclass) => subclass === "Spellblade" ? "Arcane Command" : "Fit for Any Battlefield",
            type: (level, subclass) => subclass === "Spellblade" ? "dynamic_choice" : "static",
            collection: "training",
            stateKey: "selectedTraining",
            milestones: [4, 6, 8, 10, 12, 14, 16],
            getCount: (level, subclass) => {
                if (subclass !== "Spellblade") return 0;
                let count = 0;
                [4, 6, 8, 10, 12, 14, 16].forEach(m => { if (level >= m) count++; });
                return count;
            },
            desc: (level, subclass, state, derived) => {
                const baseDesc = FeatureGen.createScalingList(
                    "You gain access to specialized maneuvers on your <strong>Commander's Orders</strong> card. When you roll Initiative, gain STR Combat Dice, each a d6. (1/attack) You may expend a Combat Die to perform a special maneuver. Combat Dice are lost when combat ends.",
                    [
                        { level: 5, text: "Combat Tactics: Your Combat Dice are now d8s." },
                        { level: 9, text: "Combat Tactics (2): Your Combat Dice are now d10s." },
                        { level: 13, text: "Combat Tactics (3): Your Combat Dice are now d12s." },
                        { level: 17, text: "Combat Tactics (4): Your Combat Dice are now d20s." }
                    ],
                    level
                );

                if (subclass === "Spellblade") {
                    const subConfig = CLASS_CONFIG.getSubclassConfig(subclass, state);
                    const rules = subConfig.featureExtensions?.["training"]?.empoweredRules || "";
                    return `${baseDesc}<div style="margin-top:12px; padding:10px; background:rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 4px; font-style: italic; color: #fff; font-size: 0.95em;">
                        <strong>Empowered:</strong> ${rules}
                    </div><div style="margin-top:10px; font-weight: bold; color: var(--gold-light); font-family: 'Cinzel'; font-size: 0.8em; text-transform: uppercase;">Choose training specialization:</div>`;
                }
                return baseDesc;
            }
        });

        core[5].push({ id: "master_commander", name: "Master Commander", desc: "When you roll Initiative, regain 1 spent use of Coordinated Strike (it is lost if not spent during that encounter). Attacks made from your Coordinated Strikes also now ignore disadvantage." });
        
        core[6].push({ 
            id: "mastery", 
            name: "Weapon Mastery", 
            level: 6,
            desc: (level, subclass) => {
                if (subclass === "Spellblade") return "Handled by Arcane Command.";
                return FeatureGen.createScalingList(
                    "You may sheathe a weapon and draw a different one 2×/round for free. Your <strong>Commander’s Orders</strong> card now includes additional slots for Weapon Mastery options.",
                    [
                        { level: 14, text: "Weapon Mastery (3): You have complete mastery of all weapon types." }
                    ],
                    level
                );
            }
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
            7: [{ id: "exp_commander", name: "Experienced Commander", desc: "Your Coordinated Strike may target 1 additional ally. Gain +1 use of Coordinated Strike/Safe Rest." }],
            11: [{ id: "survey_battlefield", name: "Survey the Battlefield", desc: "When you roll Initiative, regain 1 use of Coordinated Strike. +1 max Combat Dice." }],
            15: [{ id: "as_one", name: "As One!", desc: "Attacks made with your Coordinated Strike also grant advantage and ignore all disadvantage. Your chosen allies gain 1 additional action to use on their next turn." }]
        };

        subclasses["Spellblade"] = {
            3: [
                {
                    id: "firebrand",
                    name: "Firebrand",
                    desc: "When you roll Initiative you may cast Enchant Weapon for free (can be upcast as normal by spending additional mana). You learn the <strong>Enchant Weapon</strong> spell.",
                },
                FeatureGen.createSpellChoiceFeature({
                    id: "deep_knowledge",
                    name: "Deep Knowledge",
                    level: 3,
                    spellType: "paired",
                    stateKey: "selectedDeepKnowledge",
                    getCount: (level, subclass, state) => {
                        let base = 0;
                        [3, 7, 11, 15].forEach(m => { if (level >= m) base++; });
                        let extra = 0;
                        if (state && state.selectedTraining) {
                            state.selectedTraining.forEach(t => { if (t === "+1 Tier 1 Spell") extra += 1; });
                        }
                        return (base * 2) + extra;
                    },
                    getSlots: (level, subclass, state) => {
                        const slots = [];
                        let base = 0;
                        [3, 7, 11, 15].forEach(m => { if (level >= m) base++; });
                        const tiers = [1, 2, 3, 4];
                        for (let i = 0; i < base; i++) {
                            slots.push({ type: 'utility', label: 'Utility Selection' });
                            slots.push({ type: 'tiered', tier: tiers[i] || 4, label: 'Tiered Selection' });
                        }
                        if (state && state.selectedTraining) {
                            state.selectedTraining.forEach(t => {
                                if (t === "+1 Tier 1 Spell") slots.push({ type: 'tiered', tier: 1, label: '+1 Tier 1 Spell' });
                            });
                        }
                        return slots;
                    },
                    schools: ["Fire", "Ice", "Lightning", "Radiant", "Necrotic", "Wind"],
                    milestones: [3, 7, 11, 15],
                    desc: (level) => FeatureGen.createScalingList(
                        "Choose any tier 1 (or lower) spell and any Utility Spell.",
                        [
                            { level: 7, text: "Deep Knowledge (2): Choose any tier 2 (or lower) spell and any Utility Spell." },
                            { level: 11, text: "Deep Knowledge (3): Choose any tier 3 (or lower) spell and any Utility Spell." },
                            { level: 15, text: "Deep Knowledge (4): Choose any tier 4 (or lower) spell and any Utility Spell." }
                        ],
                        level
                    )
                })
            ]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new CommanderClass();
