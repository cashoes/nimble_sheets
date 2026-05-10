/**
 * Mage Class
 * Master of elemental forces & spellshaping.
 * @extends BaseClass
 */
class MageClass extends BaseClass {
    /**
     * Initializes the Mage class with its core configuration.
     */
    constructor() {
        super({
            name: "Mage",
            subtitle: "Master of elemental forces & spellshaping",
            keyStats: ['int', 'wil'],
            saves: { adv: 'int', dis: 'str' },
            proficiencies: { armor: "Cloth", weapons: "Blades, Staves, Wands" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#3b82f6",
                accentDim: "#1d4ed8",
                bodyBg: "#05060a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 100%), linear-gradient(180deg, #0a0c1a 0%, #05060a 100%)",
                panelBg: "rgba(15, 20, 35, 0.7)",
                border: "rgba(59, 130, 246, 0.3)"
            },
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 3, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { 
                    value: "Chaos", 
                    label: "Avatar of Chaos", 
                    accent: "#f59e0b",
                    config: {
                        mechanicPanelExtension: (builder) => {
                            builder.addStatDisplay('1d20', 'Invoke Chaos', 'Roll on Chaos Table', { borderLeft: true, color: '#f59e0b' });
                        }
                    }
                },
                { 
                    value: "Control", 
                    label: "Avatar of Control", 
                    accent: "#3b82f6",
                    config: {
                        mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                            builder.addStatDisplay('10+' + statsMap.int, 'Demand Control', '1/round or on miss', { borderLeft: true, color: '#3b82f6' });
                        }
                    }
                }
            ],
            scalingStats: {
                surgeNotation: { 5: "WIL", 10: "WIL+1d4", 17: "WIL+2d4" },
                surgeDisplay: { 5: "WIL", 10: "WIL+1d4", 17: "2d4+WIL" }
            },
            mechanicPanelExtension: (builder, level, state, derived) => {
                if (level >= 5) {
                    builder.addRollDisplay(derived.surgeNotation, 'Surge', derived.surgeDisplay, 'Regain on Init', { type: 'surge' });
                }
            },
            spellSchools: ["Fire", "Ice", "Lightning"],
            extraSchoolsKeys: ["selectedStudy"],
            spellProgression: [1, 2, 4, 6, 8, 10, 13, 17, 19, 21],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, "selectedSubclassSpells"),
            includeTieredSpells: ["selectedStudy"],
            resources: [
                createManaResource('int')
            ],
            featuresData: MageClass.FEATURES,
            optionsData: MageClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Mage class (Spellshaping, Studies).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            spellshaping: {
                "Careful Spell": { desc: "When you cast a spell that forces creatures to make a save, you can choose a number of creatures equal to your INT to automatically succeed on their save." },
                "Distant Spell": { desc: "When you cast a spell with a range of 4 spaces or greater, double the range. If the range is Touch, it becomes 6 spaces." },
                "Empowered Spell": { desc: "When you roll damage for a spell, you can reroll a number of damage dice up to your INT (minimum of 1). You must use the new rolls." },
                "Quickened Spell": { desc: "When you cast a spell that costs 2 actions, you can expend 2 extra mana to cast it for 1 action instead." },
                "Subtle Spell": { desc: "You can cast a spell without any somatic or verbal components." }
            },
            studies: {
                "Study of Radiant": { desc: "You learn the Radiant school of magic.", school: "Radiant" },
                "Study of Necrotic": { desc: "You learn the Necrotic school of magic.", school: "Necrotic" },
                "Study of Wind": { desc: "You learn the Wind school of magic.", school: "Wind" }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Mage class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('INT or WIL', 'STR or DEX', true);

        core[1] = [
            { id: "recovery", name: "Arcane Recovery", desc: "Once per day when you take a Field Rest, you can regain mana equal to half your Level (round up)." },
            { id: "sculpt", name: "Elemental Sculptor", desc: "You know all Cantrips from the Fire, Ice, and Lightning schools." }
        ];

        core[3].push(FeatureGen.createSpellChoiceFeature({
            id: "study",
            name: "Deepening Study",
            level: 3,
            spellType: "school",
            schools: ["Radiant", "Necrotic", "Wind"],
            stateKey: "selectedStudy",
            desc: "Choose an additional school of magic to master."
        }));

        core[5].push({ id: "surge", name: "Elemental Surge", desc: (level, subclass, state, derived) => `When you roll Initiative, gain <strong>${derived.surgeDisplay}</strong> temporary mana. This mana is lost when combat ends.` });
        core[5].push({ id: "shaping", name: "Spellshaping", type: "dynamic_choice", collection: "spellshaping", stateKey: "selectedShaping", milestones: [5, 11, 17], desc: "Choose a Spellshaping technique as you level up.", getCount: createStandardCount([5, 11, 17]) });

        core[6].push(FeatureGen.createSpellChoiceFeature({
            id: "mastery",
            name: "Elemental Mastery",
            level: 6,
            spellType: "utility",
            stateKey: "selectedSubclassSpells",
            perSchool: true,
            multiplier: (level) => level >= 14 ? 0 : 1,
            milestones: [6, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Choose 1 Utility Spell from each spell school you know.",
                [{ level: 14, text: "You know all Utility Spells from the spell schools you know." }],
                level
            )
        }));

        core[20].push({ id: "archmage", name: "Archmage", desc: "+1 to any 2 stats. When you drop to 0 mana, you can cast one Tier 1 or Tier 2 spell for free (1/Safe Rest)." });

        subclasses["Chaos"] = {
            3: [{ id: "unstable", name: "Unstable Power", desc: "Whenever you roll a max result on a spell's damage die, the spell deals an additional 1d6 damage of that same type." }],
            7: [{ id: "chaos_bolt", name: "Chaos Bolt", desc: "(1 mana) Action: Hurl a bolt of shifting energy at a target within 12 spaces. Roll 1d20 to determine the damage type on the Chaos Table." }],
            11: [{ id: "shift", name: "Planar Shift", desc: "Bonus Action: Teleport up to 6 spaces. After teleporting, you have resistance to all damage until the start of your next turn." }],
            15: [{ id: "overload", name: "Overload", desc: "(1/encounter) Action: Release a wave of raw energy. All enemies within 6 spaces take 10d6 damage (roll for type)." }]
        };
        subclasses["Control"] = {
            3: [{ id: "sculpt_spells", name: "Sculpt Spells", desc: "When you cast an area-of-effect spell, you can choose to exclude any number of allies from the spell's effects." }],
            7: [{ id: "potent", name: "Potent Cantrip", desc: "When a creature succeeds on a save against one of your cantrips, they still take half damage." }],
            11: [{ id: "slow", name: "Time Warp", desc: "(1/Safe Rest) Action: Choose a target within 12 spaces. On a failed WIL save, they are Stunned for 1 round." }],
            15: [{ id: "dominate", name: "Mind Control", desc: "(1/Safe Rest) 2 actions: Choose a creature within 12 spaces. On a failed WIL save, they are Charmed and obey your commands for 1 minute." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new MageClass();
