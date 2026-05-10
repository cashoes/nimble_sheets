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
            saves: { adv: 'wil', dis: 'dex' },
            proficiencies: { armor: "Mail, Shields", weapons: "Blades, Bludgeons, Polearms" },
            baseHp: 18,
            hpPerLevel: 8,
            hitDie: 10,
            theme: {
                accent: "#f0abfc",
                accentDim: "#c084fc",
                bodyBg: "#09090b",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(240, 171, 252, 0.12) 0%, transparent 100%), linear-gradient(180deg, #120a14 0%, #09090b 100%)",
                panelBg: "rgba(240, 171, 252, 0.06)",
                border: "rgba(240, 171, 252, 0.25)"
            },
            initialStats: { baseStr: 2, baseDex: -1, baseInt: 0, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { 
                    value: "Vengeance", 
                    label: "Champion of Vengeance", 
                    accent: "#ef4444",
                    config: {
                        scalingStats: {
                            jdCount: (level) => (level >= 14 ? 4 : 3),
                            jdText: (level) => {
                                const facesMilestones = [1, 3, 5, 8, 10];
                                const facesValues = [6, 8, 10, 12, 20];
                                let f = 6;
                                for (let i = 0; i < facesMilestones.length; i++) {
                                    if (level >= facesMilestones[i]) f = facesValues[i];
                                }
                                return `${level >= 14 ? 4 : 3}d${f}`;
                            }
                        }
                    }
                },
                { 
                    value: "Refuge", 
                    label: "Champion of the Refuge", 
                    accent: "#3b82f6",
                    config: {
                        statModifiers: [
                            { id: "refuge_shield", stat: "shieldBonus", level: 3, getMod: (stats) => stats.wil }
                        ]
                    }
                },
                { 
                    value: "Oathbreaker", 
                    label: "Oathbreaker", 
                    accent: "#4c1d95",
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
                jdCount: (level) => level >= 14 ? 3 : 2,
                jdText: (level) => {
                    const count = level >= 14 ? 3 : 2;
                    const facesMilestones = [1, 3, 5, 8, 10];
                    const facesValues = [6, 8, 10, 12, 20];
                    let f = 6;
                    for (let i = 0; i < facesMilestones.length; i++) {
                        if (level >= facesMilestones[i]) f = facesValues[i];
                    }
                    return `${count}d${f}`;
                },
                auraReach: { 1: 0, 3: 4 }
            },
            mechanicPanelExtension: (builder, level, state, derived) => {
                builder.addResource('loh', 'Lay on Hands', state.resourceValues.loh, derived.resourceMaxes.loh);
                builder.addDicePool(state.judgmentDice, 'Judgment Dice', derived.jdFaces, 'judgmentDice', derived.jdCount, {
                    accent: 'var(--subclass-accent)',
                    allowRollAll: true,
                    allowMaximize: true,
                    pips: [
                        { label: 'Adv', color: 'var(--save-adv)', active: (state.selectedDecrees || []).includes("Reliable Justice"), toggleKey: 'none', readonly: true },
                        { label: 'Exploding', color: '#f0abfc', active: state.judgmentBoom === 'BOOM', toggleKey: 'judgmentBoom' }
                    ]
                });
            },
            statModifiers: [
                { id: "unstoppable_speed", stat: "speed", value: 1, condition: (l, s, state) => (state.selectedDecrees || []).includes("Unstoppable Protector") },
                { id: "improved_aura", stat: "auraReach", value: 2, condition: (l, s, state) => (state.selectedDecrees || []).includes("Improved Aura") }
            ],
            rollTriggers: [
                {
                    condition: (label, options) => options.type === 'attack' || /attack|⚔️/i.test(label),
                    getMod: (state, options) => {
                        const jdSum = (state.judgmentDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);
                        if (jdSum > 0) {
                            return jdSum;
                        }
                        if (state.level >= 18 && ['str', 'dex', 'wil'].includes(options.stat)) {
                            return 5;
                        }
                        return 0;
                    },
                    onRoll: (state) => {
                        const jdSum = (state.judgmentDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);
                        if (jdSum > 0) {
                            state.judgmentDice = null;
                            saveState();
                            render();
                        }
                    }
                }
            ],
            spellSchools: ["Radiant"],
            extraSchoolsKeys: ["selectedBenediction"],
            spellProgression: [1, 2, 4, 6, 8, 10, 13, 17, 19, 21],
            includeUtilitySpells: createUtilityConfig(false, ["selectedSpells", "selectedBenediction"]),
            resources: [
                createManaResource('wil'),
                createSimpleResource('loh', 'Lay on Hands', (level, subclass, stats) => 5 * level)
            ],
            customHeaderStats: [
                { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level) => level >= 3, getValue: (derived) => `R ${derived.auraReach}` }
            ],
            featuresData: OathswornClass.FEATURES,
            optionsData: OathswornClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Oathsworn class (Decrees, Invocations).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            decrees: {
                "Aura of Protection": { desc: "Allies within your aura gain +1 to all saves." },
                "Improved Aura": { desc: "The reach of your aura increases by +2." },
                "Master of Radiance": { desc: "You may cast a Radiant spell as a free action whenever you crit with a weapon attack." },
                "Reliable Justice": { desc: "Whenever you roll your Judgment Dice, you can roll an extra die and drop the lowest result." },
                "Unstoppable Protector": { desc: "While wearing a shield, gain +1 speed and ignore difficult terrain." }
            },
            benedictions: {
                "Dark Benediction": { desc: "You learn 3 unique Necrotic spells (Entice, Shadow Trap, Dread Visage) which replace True Strike, Heal, and Warding Bond." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Oathsworn class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or WIL', 'DEX or INT', true);

        core[1] = [
            { id: "smite", name: "Holy Smite", desc: "When you hit with a weapon attack, you may expend any number of your available Judgment Dice to deal extra radiant damage (add the total to your damage)." },
            { id: "judgment", name: "Judgment Dice", desc: (level, subclass, state, derived) => `(<strong>${derived.jdText}</strong>) When you roll Initiative, you gain your Judgment Dice. You lose any remaining Judgment Dice when combat ends.` }
        ];
        core[2].push({ id: "loh", name: "Lay on Hands", desc: (level, subclass, state, derived) => `(<strong>${derived.resourceMaxes.loh}</strong> HP/Safe Rest) Action: Touch a creature and restore any amount of HP from your pool. You may also spend 5 HP from this pool to cure 1 condition.` });

        core[3].push({ id: "aura", name: "Aura of Protection", desc: "You and all allies within 4 spaces gain +1 to all saves." });
        core[4].push({ id: "decree", name: "Holy Decree", type: "dynamic_choice", collection: "decrees", stateKey: "selectedDecrees", milestones: [4, 9, 13, 17], desc: "Choose a Holy Decree as you level up.", getCount: createStandardCount([4, 9, 13, 17]) });

        core[18] = [{ id: "everlasting", name: "Everlasting Justice", desc: "When you roll Initiative, gain +5 to all weapon attacks (this bonus is lost once you use your Judgment Dice during that encounter)." }];
        core[20].push({ id: "avatar", name: "Avatar of the Oath", desc: "+1 to any 2 stats. Once/round, you may use Holy Smite without expending a Judgment Die (it deals 1d20 radiant damage)." });

        subclasses["Vengeance"] = {
            3: [{ id: "vow", name: "Vow of Enmity", desc: "Gain +1 max Judgment Die. When you use your Coordinated Strike, you and your ally gain advantage on the attacks." }],
            7: [{ id: "relentless", name: "Relentless Avenger", desc: "When an enemy within your aura moves, you may move up to your speed toward them as a free reaction." }],
            11: [{ id: "soul", name: "Soul of Vengeance", desc: "When a creature you have damaged crits an ally, you may make a weapon attack against them for free." }],
            15: [{ id: "execute", name: "Executioner", desc: "Your weapon attacks ignore Heavy Armor against creatures below half HP." }]
        };
        subclasses["Refuge"] = {
            3: [{ id: "ward", name: "Shield Ward", desc: "While wearing a shield, add your WIL to your Armor Class." }],
            7: [{ id: "guardian", name: "Guardian Spirit", desc: "Allies within your aura gain +2 Armor Class." }],
            11: [{ id: "bastion", name: "Shield of the Refuge", desc: "When an ally within your aura is hit, you may use a reaction to take the damage for them. You have advantage on the save." }],
            15: [{ id: "immortal", name: "Immortal Defender", desc: "You cannot be moved or knocked prone against your will while you are conscious." }]
        };
        subclasses["Oathbreaker"] = {
            3: [
                { id: "dark_wounds", name: "Dark Vitality", desc: "You gain +2 max Wounds." },
                { id: "benediction", name: "Dark Benediction", type: "choice", collection: "benedictions", stateKey: "selectedBenediction", desc: "You have abandoned your holy vows for dark power.", count: 1 }
            ],
            7: [{ id: "dread", name: "Avatar of Dread", desc: "Enemies within your aura have -2 to all saves." }],
            11: [{ id: "blight", name: "Blighted Blade", desc: "Your weapon attacks deal an additional 1d6 necrotic damage." }],
            15: [{ id: "undead", name: "Master of Shadows", desc: "When you drop an enemy to 0 HP, they rise as a shadow minion under your control for 1 minute." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new OathswornClass();
