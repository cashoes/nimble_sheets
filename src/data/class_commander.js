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
            subtitle: "Fearless leader, tactician, & weapon master",
            keyStats: ['str', 'int'],
            saves: { adv: 'str', dis: 'dex' },
            proficiencies: { armor: "Mail, Shields", weapons: "All Martial Weapons" },
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
                { value: "Vanguard", label: "Champion of the Vanguard", accent: "#dc2626" },
                { value: "Spellblade", label: "Spellblade", accent: "#8b5cf6" }
            ],
            scalingStats: {
                cdType: { 1: "d6", 5: "d8", 9: "d10", 13: "d12", 17: "d20" }
            },
            spellProgression: [0, 3, 7, 11, 15],
            extraSchoolsKeys: [],
            includeUtilitySpells: createUtilityConfig(null, ["selectedDeepKnowledge"]),
            includeTieredSpells: ["selectedDeepKnowledge"],
            resources: [
                createSimpleResource('combatDice', 'Combat Dice', (level, stats, state, subclass) => stats.str + (level >= 11 && subclass === "Vanguard" ? 1 : 0)),
                createSimpleResource('coordStrike', 'Coord. Strike', (level, stats, state, subclass) => stats.int + (level >= 9 ? 1 : 0) + (level >= 13 ? 1 : 0) + (level >= 17 ? 1 : 0) + (level >= 7 && subclass === "Vanguard" ? 1 : 0)),
                createManaResource('int')
            ],
            featuresData: CommanderClass.FEATURES,
            optionsData: CommanderClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Commander class (Orders, Tactics, Masteries, Training).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            training: {
                "Order": {
                    desc: "Gain 1 additional Commander's Order selection."
                },
                "Tier 1 Spell": {
                    desc: "Gain 1 additional Tier 1 Spell selection."
                }
            },
            orders: {
                "Face Me!": {
                    desc: "Reaction (after an ally is crit within 12 spaces): Taunt that enemy until you drop to 0 HP.",
                    empowered: "(Glimmering Decree) That enemy additionally takes STR d8 radiant damage (ignoring armor), is pulled up to 4 spaces toward you."
                },
                "Hold the Line!": {
                    desc: "(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3x LVL.",
                    empowered: "(Crystalline Armor) Additionally, they gain 3x LVL temp HP. Enemies who reduce this temp HP in melee have their speed halved until the end of their next turn."
                },
                "I Can Do This ALL DAY!": {
                    desc: "(1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR).",
                    empowered: "(Rising Phoenix) Deal fire damage to each enemy within 2 spaces equal to the total value of the (HD) expended. They gain the Smoldering condition."
                },
                "Move it! Move it!": {
                    desc: "When you roll Initiative you may give yourself and an ally advantage on the roll and +3 speed for 1 round.",
                    empowered: "(Borne upon the Wind) You additionally gain the ability to fly for 1 round. Then, you both can also move for free."
                },
                "Reposition!": {
                    desc: "Action/Reaction (on an ally’s turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free.",
                    empowered: "(Flashstep) You may exchange places with one of them."
                }
            },
            tactics: {
                "Commanding Presence": {
                    desc: "Action: Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it to the best of their ability, provided it is not obviously harmful to themselves. They then become immune to this effect for 1 day."
                },
                "Heavy Strike": {
                    desc: "When you hit, push a Medium creature STR spaces and deal extra damage equal to a roll of your Combat Die. A Small creature is pushed twice as far; Large, pushed half as far (round down)."
                },
                "Inerrant Strike": {
                    desc: "Reroll a missed attack, add 1 to the Primary Die, and deal extra damage equal to a roll of your Combat Die."
                },
                "Lunging Strike": {
                    desc: "Gain +1 Reach on an attack and deal extra damage equal to 2× a roll of your Combat Die."
                },
                "Sweeping Strike": {
                    desc: "2 actions: Select any contiguous area within your weapon’s Reach and damage ALL targets there. This attack does not miss on a 1."
                }
            },
            masteries: {
                "Slashing": {
                    desc: "Your attacks with slashing weapons cannot miss unarmored enemies."
                },
                "Bludgeoning": {
                    desc: "When your primary die rolls a 7 or higher with a bludgeoning weapon, ignore Heavy Armor."
                },
                "Piercing": {
                    desc: "Your attacks with piercing weapons ignore Medium Armor."
                }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Commander class.
     * @returns {Object} Core and subclass feature data.
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
                    const empoweredRules = `(Withering Strike) Any attacks made this way deal additional Necrotic damage equal to the max value of your Combat Die (1${cdVal}). An enemy damaged this way is considered undead for 1 round.`;

                    let d = baseRules;
                    if (subclass === "Spellblade") {
                        d += `<div style="margin-top:8px; padding:6px; background:rgba(139, 92, 246, 0.15); border-left: 2px solid var(--subclass-accent); font-style: italic; font-size: 0.95em; color: #fff;">
                            <strong>Empowered:</strong> ${empoweredRules}
                        </div>`;
                    }

                    const orderCard = renderSingleSpellCard({
                        name: "Order: Coordinated Strike!",
                        tier: "Order",
                        school: "Commander",
                        customHtml: d
                    }, level, derived.statsMap);

                    return FeatureGen.createScalingList(
                        `You gain the Coordinated Strike! Commander's Order (see card below).<div style="margin-top:10px;">${orderCard}</div>`,
                        [
                            { level: 9, text: "Master Commander: +1 use of Coordinated Strike/Safe Rest." },
                            { level: 13, text: "Master Commander: +2 uses of Coordinated Strike/Safe Rest." },
                            { level: 17, text: "Master Commander: +3 uses of Coordinated Strike/Safe Rest." }
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
                collection: "orders",
                stateKey: "selectedOrders",
                milestones: [2],
                desc: "Choose Commander's Orders.",
                getCount: (level, subclass, state) => {
                    let count = 2;
                    if (subclass === "Spellblade") {
                        (state.selectedTraining || []).forEach(choice => {
                            if (choice === "Order") {
                                count++;
                            }
                        });
                    }
                    return count;
                }
            },
            { id: "medic", name: "Field Medic", desc: "Roll 1 additional die for any health potion you administer. Whenever you or an ally spends any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered." }
        ];
        core[4].push({
            id: "tactics",
            name: "Fit for Any Battlefield",
            type: "dynamic_choice",
            collection: "tactics",
            stateKey: "selectedTactics",
            milestones: [4, 6, 8, 10, 12, 14, 16],
            context: { type: 'attack', stat: 'str' },
            desc: (level) => FeatureGen.createScalingList(
                "Choose a Combat Tactic. When you roll Initiative, gain STR Combat Dice. (1/attack) You may expend a Combat Die to perform a special maneuver. Combat Dice are lost when combat ends.",
                [
                    { level: 4, text: "Your Combat Dice are d6s." },
                    { level: 5, text: "Your Combat Dice are now d8s." },
                    { level: 9, text: "Your Combat Dice are now d10s." },
                    { level: 13, text: "Your Combat Dice are now d12s." },
                    { level: 17, text: "Your Combat Dice are now d20s." }
                ],
                level
            ),
            getCount: FeatureGen.createStandardCount([4, 6, 8, 10, 12, 14, 16])
        });

        core[5].push({ id: "master_commander", name: "Master Commander", desc: "When you roll Initiative, regain 1 spent use of Coordinated Strike (it is lost if not spent during that encounter). Attacks made from your Coordinated Strikes also now ignore disadvantage." });
        core[6].push({ id: "mastery", name: "Weapon Mastery", type: "dynamic_choice", collection: "masteries", stateKey: "selectedMastery", milestones: [6, 10, 14], desc: "You may sheathe a weapon and draw a different one 2×/round for free. Choose a weapon type to specialize in.", getCount: FeatureGen.createStandardCount([6, 10, 14]) });

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
                    id: "arcane_command",
                    replaces: ["tactics", "mastery"],
                    name: "Arcane Command",
                    type: "dynamic_choice",
                    collection: "training",
                    stateKey: "selectedTraining",
                    milestones: [4, 6, 6, 8, 10, 10, 12, 14, 14, 16],
                    getCount: (level) => {
                        const m = [4, 6, 6, 8, 10, 10, 12, 14, 14, 16];
                        let c = 0; m.forEach(v => { if (level >= v) c++; });
                        return c;
                    },
                    desc: "Whenever you could choose a Combat Tactic or Weapon Mastery, instead choose another Commander’s Order or a Tier 1 Spell."
                },
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
                        const baseCount = FeatureGen.createStandardCount([3, 7, 11, 15])(level);
                        let extra = 0;
                        if (subclass === "Spellblade") {
                            (state.selectedTraining || []).forEach(choice => {
                                if (choice === "Tier 1 Spell") {
                                    extra += 1;
                                }
                            });
                        }
                        return (baseCount * 2) + extra;
                    },
                    getSlots: (level, subclass, state) => {
                        const slots = [];
                        const baseCount = FeatureGen.createStandardCount([3, 7, 11, 15])(level);
                        const tiers = [1, 2, 3, 4];

                        // 1. Base slots (milestones)
                        for (let i = 0; i < baseCount; i++) {
                            slots.push({ type: 'utility', label: 'Utility Selection' });
                            slots.push({ type: 'tiered', tier: tiers[i] || 4, label: 'Tiered Selection' });
                        }

                        // 2. Extra slots from Training
                        if (subclass === "Spellblade") {
                            (state.selectedTraining || []).forEach(choice => {
                                if (choice === "Tier 1 Spell") {
                                    slots.push({ type: 'tiered', tier: 1, label: 'Tier 1 Spell' });
                                }
                            });
                        }
                        return slots;
                    },
                    schools: ["Fire", "Ice", "Lightning", "Radiant", "Necrotic", "Wind"],
                    milestones: [3, 7, 11, 15],
                    desc: (level) => FeatureGen.createScalingList(
                        "Choose 1 utility and 1 tiered spell for every level of Deep Knowledge you have unlocked.",
                        [
                            { level: 3, text: "Tier 1 spells." },
                            { level: 7, text: "Tier 2 spells." },
                            { level: 11, text: "Tier 3 spells." },
                            { level: 15, text: "Tier 4 spells." }
                        ],
                        level
                    )
                })
            ]
        };

        return { core, subclasses };
    }

    /**
     * Custom spell availability for Commander to handle Firebrand.
     */
    getAvailableSpells(level, subclass, state, derived) {
        const spells = super.getAvailableSpells(level, subclass, state, derived);
        if (subclass === "Spellblade") {
            const firebrand = SPELL_REGISTRY["Fire"]?.["Enchant Weapon"];
            if (firebrand && !spells.find(s => s.name === "Enchant Weapon")) {
                spells.push({ name: "Enchant Weapon", ...firebrand, school: "Fire" });
            }
        }
        return spells;
    }

    /**
     * Calculates Commander-specific derived statistics.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @returns {Object} Derived statistics.
     */
    getDerivedStats(level, subclass, state) {
        return super.getDerivedStats(level, subclass, state);
    }

    /**
     * Applies attribute overrides based on Commander features like Move it! Move it!.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} statsMap - Current attribute map.
     * @returns {Object} Stat overrides.
     */
    getStatOverrides(level, subclass, state, statsMap) {
        let overrides = {};
        const orders = state.selectedOrders || [];

        if (orders.includes("Move it! Move it!")) {
            overrides.initAdv = true;
            overrides.speed = (overrides.speed || 0) + 3;
            if (subclass === "Spellblade") {
                overrides.modFlySpeed = true;
            }
        }

        return overrides;
    }

    /**
     * Renders the Combat Die/Mana and Coordinated Strike displays for the Commander's mechanic panel.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @returns {string} HTML string.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);
        const orders = state.selectedOrders || [];
        const isSpellblade = subclass === "Spellblade";

        // 1. Primary Resource (Combat Dice or Mana)
        if (!isSpellblade) {
            builder.addRollDisplay('1' + derived.cdType, 'Combat Die', derived.cdType, `${state.resourceValues.combatDice || 0}/${derived.resourceMaxes.combatDice}`, { type: 'attack', stat: 'str' });
        } else {
            builder.addResource('mana', 'INT Mana', state.resourceValues.mana, derived.resourceMaxes.mana);
        }

        // 2. Coordinated Strike (Base usage)
        builder.addResource('coordStrike', 'Coord. Strike', state.resourceValues.coordStrike, derived.resourceMaxes.coordStrike);

        // 3. Empowered Order Effects (Spellblade Only)
        if (isSpellblade) {
            // --- RADIANT DAMAGE (Face Me!) ---
            if (orders.includes("Face Me!")) {
                builder.addRollDisplay(`${statsMap.str}d8`, 'Radiant Order', `${statsMap.str}d8`, 'Radiant / Taunt', { type: 'attack', school: 'Radiant' });
            }

            // --- FIRE EXPLOSION (I Can Do This ALL DAY!) ---
            if (orders.includes("I Can Do This ALL DAY!")) {
                builder.addRollDisplay('HD', 'Fire Order', 'Sum HD', 'Fire / Smolder', { type: 'attack', school: 'Fire' });
            }

            // --- HP RECOVERY (Hold the Line!) ---
            if (orders.includes("Hold the Line!")) {
                builder.addStatDisplay(3 * level, 'Rally HP', 'Set HP & Temp HP', { borderLeft: true, color: '#22c55e' });
            }
        }

        // 4. Tactical DC
        builder.addStatDisplay(10 + statsMap.str, 'Tactical DC', '10+STR save DC.', { borderLeft: true });

        return builder.build();
    }
}

const CLASS_CONFIG = new CommanderClass();
