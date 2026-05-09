class OathswornClass extends BaseClass {
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
                accent: "#38bdf8",
                accentDim: "#0284c7",
                bodyBg: "#05070a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.1) 0%, transparent 100%), linear-gradient(180deg, #111827 0%, #0a0f1a 100%)",
                panelBg: "rgba(30, 41, 59, 0.7)",
                border: "var(--gold-dim)"
            },
            initialStats: { baseStr: 2, baseDex: 0, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Vengeance", label: "Oath of Vengeance", accent: "#ef4444" },
                { value: "Refuge", label: "Oath of Refuge", accent: "#f8fafc" },
                { value: "Oathbreaker", label: "Oathbreaker (Extra)", accent: "#a855f7" }
            ],
            scalingStats: {
                jdFaces: { 1: 6, 3: 8, 5: 10, 8: 12, 10: 20 },
                jdText: { 1: "2d6", 3: "2d8", 5: "2d10", 8: "2d12", 10: "2d20", 14: "3d20" }
            },
            rollTriggers: [
                {
                    condition: (label, options) => options.type === 'attack' || /attack|⚔️/i.test(label),
                    getMod: (state, options) => {
                        const jdSum = (state.judgmentDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);
                        if (jdSum > 0) return jdSum;
                        if (state.level >= 18 && ['str', 'dex', 'wil'].includes(options.stat)) return 5;
                        return 0;
                    },
                    onRoll: (state) => {
                        const jdSum = (state.judgmentDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);
                        if (jdSum > 0) {
                            state.judgmentDice = null;
                            saveState(); render();
                        }
                    }
                }
            ],
            spellSchools: ["Radiant"],
            subclassSchools: { "Oathbreaker": ["Necrotic"] },
            extraSchoolsKeys: ["selectedBenediction"],
            spellProgression: [2, 2, 4, 6, 8, 10, 13, 17, 19, 21],
            spellReplacements: [
                createSpellReplacement("True Strike", "Entice", "Necrotic", "Oathbreaker"),
                createSpellReplacement("Heal", "Shadow Trap", "Necrotic", "Oathbreaker"),
                createSpellReplacement("Warding Bond", "Dread Visage", "Necrotic", "Oathbreaker")
            ],
            includeUtilitySpells: createUtilityConfig(false, ["selectedSpells", "selectedBenediction"]),
            resources: [
                createManaResource('wil'),
                createSimpleResource('loh', 'Lay on Hands', (level, subclass, stats) => 5 * level)
            ],
            customHeaderStats: [
                { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level, subclass) => level >= 3 && subclass !== 'None', getValue: (derived) => `R ${derived.auraReach}` }
            ],
            featuresData: OathswornClass.FEATURES,
            optionsData: OathswornClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            decrees: {
                "Blinding Aura": { desc: "(1/Safe Rest) Action: Enemies in your aura are Blinded until the end of their next turn." },
                "Courage!": { desc: "(1/encounter) When you or an ally in your aura would drop to 0 HP, set their HP to 1 instead." },
                "Explosive Judgment": { desc: "(1/encounter) 2 actions: Expend your Judgment Dice, deal that much radiant damage to all enemies in your aura." },
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

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or WIL', 'DEX or INT', true, [2, 2, 4, 6, 8, 10, 13, 17, 19, 21]);

        core[1] = [
            { id: "judgment", name: "Radiant Judgment", milestones: [1, 3, 5, 8, 10, 14], context: { type: 'attack', stat: 'str' }, desc: (level, subclass, state, derived) => FeatureGen.createScalingList(
                `Whenever an enemy attacks you, if you have no Judgment Dice, roll your Judgment dice (<strong>${derived.jdText}</strong>). On your next melee attack this encounter, if you hit, deal that much additional radiant damage. The dice are expended whether you hit or miss.`,
                [
                    { level: 1, text: "Roll 2 Judgment Dice. Your Judgment Dice are d6s." },
                    { level: 3, text: "Your Judgment Dice are now d8s." },
                    { level: 5, text: "Your Judgment Dice are now d10s." },
                    { level: 8, text: "Your Judgment Dice are now d12s." },
                    { level: 10, text: "Your Judgment Dice are now d20s." },
                    { level: 14, text: "Roll 3 Judgment Dice." }
                ],
                level
            )},
            { id: "loh", name: "Lay on Hands", resourceId: "loh", desc: (level) => FeatureGen.createScalingList(
                "Gain a magical pool of healing power. Action: Touch a target and spend any amount of remaining healing power to restore that many HP. Recharges on a Safe Rest.",
                [{ level: 1, text: `Pool maximum is <strong>${5 * level}</strong>.` }],
                level
            )}
        ];
        core[2].push({ id: "zealot", name: "Zealot", context: { type: 'attack', stat: 'str' }, desc: "Whenever you attack with a melee weapon, you may spend mana (up to your highest unlocked spell tier) to choose one for each mana spent: <ul><li><strong>Condemning Strike:</strong> Deal +5 radiant damage.</li><li><strong>Blessed Aim:</strong> Decrease your target's armor by 1 step for this attack.</li></ul>" });
        core[2].push({ id: "paragon", name: "Paragon of Virtue", desc: "Advantage on Influence checks to convince someone when you are forthrightly telling the truth, disadvantage when misleading." });

        core[3].push({ id: "decrees", name: "Sacred Decree", type: "dynamic_choice", collection: "decrees", stateKey: "selectedDecrees", milestones: [3, 6, 9, 12, 14, 16], desc: "Learn Sacred Decrees.", getCount: FeatureGen.createStandardCount([3, 6, 9, 12, 14, 16]) });


            core[4].push({ id: "life", name: "My Life, for My Friends", desc: "You can Interpose for free." });

            core[7].push(FeatureGen.createSpellChoiceFeature({
            id: "master_radiance",
            name: "Master of Radiance",
            level: 7,
            spellType: "utility",
            schools: ["Radiant"],
            stateKey: "selectedSpells",
            getCount: (level) => level >= 11 ? 2 : 1,
            milestones: [7, 11],
            desc: (level) => FeatureGen.createScalingList(
                "Choose Radiant Utility Spells.",
                [{ level: 11, text: "Learn a 2nd Radiant Utility Spell." }],
                level
            )
            }));

            core[18] = [{ id: "unending", name: "Unending Judgment", desc: "While you have no Judgment Dice, gain +5 damage to melee attacks." }];
            core[20].push({ id: "glorious_paragon", name: "Glorious Paragon", desc: "+1 to any 2 of your stats. Defend for free whenever you Interpose." });

            subclasses["Vengeance"] = {
            3: [{ id: "aura_zeal", name: "Aura of Zeal", desc: (level, subclass, state, derived) => `Whenever you roll Judgment Dice, roll 1 more. Gain an aura with a Reach of 4. Your Radiant Judgment also triggers when an ally within your aura is attacked while you have no Judgment Dice.` }],
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
            1: [
                { id: "judgment", replaces: "judgment", name: "Aura of Suffering", desc: "You gain an aura with a Reach of 4 and can Interpose for an ally anywhere within your aura; however, your Radiant Judgment ability no longer triggers when attacked. Instead, it triggers whenever you could Interpose but don’t." }
            ],
            2: [
                { id: "paragon", replaces: "paragon", name: "Paragon of Power", desc: "Advantage on Might checks when attempting to intimidate others." }
            ],
            3: [
                { id: "we_all_suffer", name: "We All Suffer", desc: "Gain +2 max Wounds. When an ally within your aura would gain any Wounds or fail a save, you may suffer the effect instead and trigger your Radiant Judgment ability." },
                { id: "bring_pain", name: "Bring Me Your Pain", desc: "Reaction (When a willing ally within your aura would drop to 0 HP): Switch HP with them (if your current HP is higher than their max HP, they gain Temp HP equal to the difference), dropping to 0 hp and gaining the Wound instead." },
                FeatureGen.createSpellChoiceFeature({
                    id: "dark_benediction",
                    replaces: "master_radiance",
                    name: "Dark Benediction",
                    level: 3,
                    spellType: "utility",
                    schools: ["Necrotic"],
                    stateKey: "selectedBenediction",
                    getCount: (level) => level >= 11 ? 2 : (level >= 7 ? 1 : 0),
                    milestones: [3, 7, 11],
                    desc: (level) => FeatureGen.createScalingList(
                        "Fallen from the light, but not entirely. You lose access to the following Radiant spells: True Strike, Heal, and Warding Bond; and gain access to the following Necrotic spells: Entice, Shadowtrap, and Dread Visage.",
                        [
                            { level: 7, text: "Learn a Necrotic Utility Spell." },
                            { level: 11, text: "Learn a 2nd Necrotic Utility Spell." }
                        ],
                        level
                    )
                })
            ],            7: [
                { id: "torment", name: "Torment", desc: "Your Lay on Hands heals you for twice as much, and others for half as much. When you deal damage, you can expend healing power from your Lay on Hands pool to increase the damage dealt by an amount equal to the points spent (ignoring armor)." }
            ],
            11: [
                { id: "exploit", name: "Exploit", desc: "Reaction (whenever an ally within your aura Defends), you may expend your Judgment Dice to force an enemy within your Aura to Interpose (a creature cannot interpose against its own attack)." }
            ],
            15: [
                { id: "terror", name: "Bloody Terror", desc: "Attacks against you gain 1 instance of disadvantage for each Wound you have (max 3)." }
            ]
        };

        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        const stats = super.getDerivedStats(level, subclass, state);
        stats.auraReach = 4;
        stats.jdCount = level >= 14 ? 3 : 2;
        if (subclass === "Vengeance") stats.jdCount++;
        if (state.selectedDecrees?.includes("Improved Aura")) stats.auraReach += 2;
        if (subclass === "Oathbreaker") stats.woundMax += 2;

        const decrees = state.selectedDecrees || [];
        if (decrees.includes("Reliable Justice")) stats.jdText += " (Adv)";

        return stats;
    }

    getShieldBonus(level, subclass, stats) {
        return (subclass === 'Refuge' && level >= 3) ? stats.wil : 0;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const hasAdv = state.selectedDecrees?.includes("Reliable Justice");
        let totalJD = 0;
        (state.judgmentDice || []).forEach(d => { if (d) totalJD += d.total; });

        builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana, level >= 2);

        builder.addDicePool(
            state.judgmentDice || [],
            'Judgment',
            `d${derived.jdFaces}`,
            'judgmentDice',
            derived.jdCount,
            { 
                rollAll: true, 
                static: true,
                disableRemove: true
            }
        );

        const isBoomMode = state.judgmentMode === 'BOOM';
        builder.addStatDisplay(totalJD, isBoomMode ? 'Explosive DMG' : 'Radiant DMG', isBoomMode ? 'Hits All in Aura' : '', { 
            borderLeft: true, 
            color: isBoomMode ? '#f59e0b' : 'var(--gold-light)',
            indicators: [
                { label: 'Advantage', color: '#22c55e', active: hasAdv },
                { label: 'Exploding', color: '#3b82f6', active: state.judgmentBoom === 'BOOM', toggleKey: 'judgmentBoom' }
            ]
        });
        return builder.build();
    }
}

const CLASS_CONFIG = new OathswornClass();
