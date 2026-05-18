/**
 * Oathsworn Class
 * Faithful guardian, protector, and avenger.
 * @extends BaseClass
 */
class OathswornClass extends BaseClass {
    /**
     * Initializes the Oathsworn class with its core configuration.
     */
    constructor() {
        super({
            name: "Oathsworn",
            subtitle: "Faithful guardian, protector, and avenger",
            keyStats: ['str', 'wil'],
            saves: { adv: 'str', dis: 'dex' },
            proficiencies: { armor: "All Armor", weapons: "STR Weapons" },
            baseHp: 17,
            hpPerLevel: 8,
            hitDie: 10,
            theme: {
                accent: "#e879f9",
                accentDim: "#a21caf",
                bodyBg: "#09090b",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(232, 121, 249, 0.1) 0%, transparent 100%), linear-gradient(180deg, #1a0b1e 0%, #09090b 100%)",
                panelBg: "rgba(25, 10, 30, 0.8)",
                border: "rgba(232, 121, 249, 0.25)"
            },
            initialStats: { baseStr: 2, baseDex: 0, baseInt: -1, baseWil: 2 },
            onInitiative: (level, subclass, state, derived) => {
                if ((state.selectedDecrees || []).includes("Stand Fast, Friends!")) {
                    const statsMap = getStatsMap(state);
                    const bonus = statsMap.str + statsMap.wil;
                    dispatch({ type: 'ADD_LOG', payload: { msg: `Initiative: Allies in Aura gain +${bonus} Temp HP (Stand Fast, Friends!).` } });
                }
            },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                {
                    value: "Vengeance",
                    label: "Oath of Vengeance",
                    accent: "#ef4444",
                    config: {
                        scalingStats: {
                            jdCount: (level) => (level >= 14 ? 3 : 2) + 1
                        }
                    }
                },
                {
                    value: "Refuge",
                    label: "Oath of Refuge",
                    accent: "#f8fafc",
                    config: {
                        statModifiers: [
                            { id: "refuge_shield", stat: "shieldBonus", level: 3, getMod: (stats) => stats.wil }
                        ]
                    }
                },
                {
                    value: "Oathbreaker",
                    label: "Oathbreaker (Extra)",
                    accent: "#a855f7",
                    config: {
                        statModifiers: [
                            { id: "oathbreaker_wounds", stat: "woundMax", value: 2, level: 3 }
                        ],
                        grantedSpells: [
                            { level: 3, spells: ["Entice", "Shadow Trap", "Dread Visage"] }
                        ],
                        spellSchools: ["Necrotic"],
                        spellReplacements: [
                            createSpellReplacement("True Strike", "Entice", "Necrotic"),
                            createSpellReplacement("Heal", "Shadow Trap", "Necrotic"),
                            createSpellReplacement("Warding Bond", "Dread Visage", "Necrotic")
                        ]
                    }
                }
            ],
            scalingStats: {
                jdFaces: { 1: 6, 3: 8, 5: 10, 8: 12, 10: 20 },
                jdCount: (level) => (level >= 14 ? 3 : 2),
                jdText: (level, subclass, state, derived) => {
                    const faces = derived.jdFaces || 6;
                    const count = derived.jdCount || 2;
                    return `${count}d${faces}`;
                },
                auraReach: { 1: 0, 3: 4 }
            },
            statModifiers: [
                { id: "unstoppable_speed", stat: "speed", value: 1, condition: (l, s, state) => (state.selectedDecrees || []).includes("Unstoppable Protector") },
                { id: "improved_aura", stat: "auraReach", value: 2, condition: (l, s, state) => (state.selectedDecrees || []).includes("Improved Aura") }
            ],
            rollTriggers: [
                {
                    id: "radiant_judgment",
                    condition: (label, options, state) => {
                        const isMelee = /⚔️/.test(label) || options.stat === 'str';
                        const hasJD = state.judgmentDice && state.judgmentDice.length > 0;
                        return isMelee && hasJD;
                    },
                    getMod: (state) => {
                        return (state.judgmentDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);
                    },
                    onRoll: (state) => {
                        state.judgmentDice = [];
                    }
                },
                {
                    id: "unending_judgment",
                    condition: (label, options, state) => {
                        const isMeleeAttack = /attack|⚔️/i.test(label) || options.type === 'attack';
                        const noJD = !state.judgmentDice || state.judgmentDice.length === 0;
                        const isLevel18 = (state.level || 1) >= 18;
                        return isMeleeAttack && noJD && isLevel18;
                    },
                    getMod: () => 5
                }
            ],
            spellSchools: ["Radiant"],
            spellProgression: [2, 2, 4, 6, 8, 10, 12, 14, 16, 18],
            includeUtilitySpells: createUtilityConfig(false, ["selectedSpells"]),
            resources: [
                createManaResource('wil', 'Mana Pool', { multiplier: 1, hideMechanic: true }),
                createSimpleResource('loh', 'Lay on Hands', (level) => 5 * level, { reset: 'Safe Rest', hideMechanic: true })
            ],
            customHeaderStats: [
                { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level) => level >= 3, getValue: (derived) => `R ${derived.auraReach}` }
            ],
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                const totalJD = (state.judgmentDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);

                // 1. Mana Pool
                if (level >= 2) {
                    builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
                }

                // 2. JD Dice Pool
                builder.addDicePool(state.judgmentDice || [], 'Judgment', `d${derived.jdFaces}`, 'judgmentDice', derived.jdCount, {
                    rollAll: true,
                    static: true,
                    disableRemove: true
                });

                // 4. JD Status
                builder.addStatDisplay(totalJD, 'Radiant DMG', '', {
                    fontSize: '1.8em',
                    indicators: [
                        { label: 'Adv', color: '#22c55e', active: (state.selectedDecrees || []).includes("Reliable Justice") },
                        { label: 'Exploding', color: "#e879f9", active: state.judgmentBoom === 'BOOM', toggleKey: 'judgmentBoom' }
                    ]
                });
            },
            featuresData: OathswornClass.FEATURES,
            optionsData: OathswornClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Oathsworn class.
     */
    static get OPTIONS() {
        return {
            decrees: {
                "Blinding Aura": { desc: "([[uBlinding]] 1/Safe Rest) Action: Enemies in your aura are Blinded until the end of their next turn." },
                "Courage!": { desc: "([[uCourage]] 1/encounter) When you or an ally in your aura would drop to 0 HP, set their HP to 1 instead." },
                "Explosive Judgment": { desc: "([[uExplosive]] 1/encounter) 2 actions: Expend your Judgment Dice, deal that much radiant damage to all enemies in your aura." },
                "Improved Aura": { desc: "+2 aura Reach." },
                "Radiant Aura": { desc: "Action: End any single harmful condition or effect on yourself or another willing creature within your aura. You may use this ability WIL times/Safe Rest." },
                "Reliable Justice": { desc: "Whenever you roll Judgment Dice, roll with advantage (roll one extra and drop the lowest)." },
                "Shining Mandate": { desc: "The first time each round you are attacked while you already have Judgment Dice, select an ally within your aura to roll one and apply it to their next attack. You have advantage on skill checks to see through illusions." },
                "Stand Fast, Friends!": { desc: "When you roll Initiative, grant allies temp HP equal to your STR+WIL. You and allies within your aura have advantage against fear and effects that would move or knock Prone." },
                "Unstoppable Protector": { desc: "Gain +1 speed. You may Interpose even if you are restrained, stunned, or otherwise incapacitated. If you Interpose for a noncombatant NPC, you may Interpose again this round." },
                "Well Armored": { desc: "Whenever you Interpose, gain temp HP equal to your STR." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Oathsworn class.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or WIL', 'DEX or INT', true, [2, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        core[1] = [
            {
                id: "judgment",
                name: "Radiant Judgment",
                milestones: [1, 3, 5, 8, 10, 14],
                desc: (level, subclass, state, derived) => FeatureGen.createScalingList(
                    `Whenever an enemy attacks you, if you have no Judgment Dice, roll your Judgment dice (<strong>${derived.jdText}</strong>). On your next melee attack this encounter, if you hit, deal that much additional radiant damage. The dice are expended whether you hit or miss.`,
                    [
                        { level: 3, text: "Rank 2: Your Judgment Dice are now d8s." },
                        { level: 5, text: "Rank 3: Your Judgment Dice are now d10s." },
                        { level: 8, text: "Rank 4: Your Judgment Dice are now d12s." },
                        { level: 10, text: "Rank 5: Your Judgment Dice are now d20s." },
                        { level: 14, text: "Rank 6: Roll 3 Judgment Dice." }
                    ],
                    level
                )
            },
            {
                id: "loh",
                name: "Lay on Hands",
                resourceId: "loh",
                desc: (level) => `Gain a magical pool of healing power. Action: Touch a target and spend any amount of remaining healing power to restore that many HP. Pool maximum (<strong>${5 * level}</strong>) recharges on a Safe Rest.`
            }
        ];

        core[2] = [
            { id: "radiant_casting", name: "Mana and Radiant Spellcasting", desc: (level, subclass, state, derived) => `You learn all Radiant cantrips and unlock tier 1 Radiant spells. You gain a mana pool of <strong>${derived.resourceMaxes.mana}</strong> (WIL+LVL) to cast these spells; it recharges on a Safe Rest.` },
            { id: "zealot", name: "Zealot", desc: "Whenever you attack with a melee weapon, you may spend mana (up to your highest unlocked spell tier) to choose one for each mana spent: <ul><li><strong>Condemning Strike:</strong> Deal +5 radiant damage.</li><li><strong>Blessed Aim:</strong> Decrease your target’s armor by 1 step for this attack.</li><li><strong>Righteous Defense:</strong> Gain +1 AC for each mana spent until the start of your next turn.</li></ul>" },
            { id: "paragon", name: "Paragon of Virtue", desc: "Advantage on Influence checks to convince someone when you are forthrightly telling the truth, disadvantage when misleading." }
        ];

        core[3].push({
            id: "decrees",
            name: "Sacred Decree",
            type: "dynamic_choice",
            collection: "decrees",
            stateKey: "selectedDecrees",
            milestones: [3, 6, 9, 12, 14, 16],
            desc: (l) => FeatureGen.createScalingList("Choose Sacred Decrees.", [
                { level: 6, text: "Rank 2: Choose another Decree." },
                { level: 9, text: "Rank 3: Choose another Decree." },
                { level: 12, text: "Rank 4: Choose another Decree." },
                { level: 14, text: "Rank 5: Choose another Decree." },
                { level: 16, text: "Rank 6: Choose another Decree." }
            ], l),
            getCount: FeatureGen.createStandardCount([3, 6, 9, 12, 14, 16])
        });

        core[4].push({ id: "life", name: "My Life, for My Friends", desc: "You can Interpose for free." });

        core[7].push(FeatureGen.createSpellChoiceFeature({
            id: "master_radiance",
            name: "Master of Radiance",
            level: 7,
            spellType: "utility",
            schools: ["Radiant"],
            stateKey: "selectedSpells",
            getCount: FeatureGen.createStandardCount([7, 11]),
            milestones: [7, 11],
            desc: (level) => FeatureGen.createScalingList(
                "Choose a Radiant Utility Spell.",
                [{ level: 11, text: "Learn a 2nd Radiant Utility Spell." }],
                level
            )
        }));

        core[18] = [{ id: "unending", name: "Unending Judgment", desc: "While you have no Judgment Dice, gain +5 damage to melee attacks." }];
        core[20].push({ id: "glorious_paragon", name: "Glorious Paragon", desc: "+1 to any 2 stats. Defend for free whenever you Interpose." });

        subclasses["Vengeance"] = {
            3: [{ id: "aura_zeal", name: "Aura of Zeal", desc: "Whenever you roll Judgment Dice, roll 1 more. Gain an aura with a Reach of 4. Your Radiant Judgment also triggers when an ally within your aura is attacked while you have no Judgment Dice." }],
            7: [{ id: "avenger", name: "Avenger", desc: "Whenever you or an ally within your aura gain any Wounds, change up to that many Judgment Dice to their max. Then, move up to half your speed for free." }],
            11: [{ id: "unerring", name: "Unerring Judgment", desc: "Increase your primary die rolls on melee attacks by 1 whenever you have Judgment Dice." }],
            15: [{ id: "max_judgment", name: "Maximum Judgment", desc: "Whenever you are attacked, set a Judgment Die to its max." }]
        };

        subclasses["Refuge"] = {
            3: [{ id: "aura_refuge", name: "Aura of Refuge", desc: "Your shields gain +WIL armor and count as your spellcasting focus. Gain an aura with a Reach of 4; you can Interpose for an ally anywhere within your aura." }],
            7: [{ id: "face_me", name: "Face Me, Foul Creature!", desc: "When you Interpose, the attacking enemy is also Taunted by you until the end of their next turn." }],
            11: [{ id: "reprieve", name: "Glorious Reprieve", desc: "You and allies in your aura cannot drop below 1 HP. Whenever this triggers, they gain 1 Wound instead (heroes still die at max Wounds)." }],
            15: [{ id: "grace", name: "Divine Grace", desc: "You are resistant to all damage while Interposing." }]
        };

        subclasses["Oathbreaker"] = {
            1: [{ id: "judgment", replaces: "judgment", name: "Aura of Suffering", desc: "You gain an aura with a Reach of 4 and can Interpose for an ally anywhere within your aura; however, your Radiant Judgment ability no longer triggers when attacked. Instead, it triggers whenever you could Interpose but don’t." }],
            2: [{ id: "paragon", replaces: "paragon", name: "Paragon of Power", desc: "Advantage on Might checks when attempting to intimidate others." }],
            3: [
                { id: "we_all_suffer", name: "We All Suffer", desc: "Gain +2 max Wounds. When an ally within your aura would gain any Wounds or fail a save, you may suffer the effect instead and trigger your Radiant Judgment ability." },
                { id: "bring_pain", name: "Bring Me Your Pain", desc: "Reaction (When a willing ally within your aura would drop to 0 HP): Switch HP with them (if your current HP is higher than their max HP, they gain Temp HP equal to the difference), dropping to 0 hp and gaining the Wound instead." },
                { id: "dark_benediction", name: "Dark Benediction", desc: "You learn 3 unique Necrotic spells (Entice, Shadow Trap, Dread Visage) which replace True Strike, Heal, and Warding Bond." }
            ],
            7: [{ id: "torment", name: "Torment", desc: "Your Lay on Hands heals you for twice as much, and others for half as much. When you deal damage, you can expend healing power from your Lay on Hands pool to increase the damage dealt by an amount equal to the points spent (ignoring armor)." }],
            11: [{ id: "exploit", name: "Exploit", desc: "Reaction (whenever an ally within your aura Defends), you may expend your Judgment Dice to force an enemy within your Aura to Interpose (a creature cannot interpose against its own attack)." }],
            15: [{ id: "terror", name: "Bloody Terror", desc: "Attacks against you gain 1 instance of disadvantage for each Wound you have (max 3)." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new OathswornClass();
