/**
 * Shepherd Class
 * Master of life and death, leader of spirits.
 * @extends BaseClass
 */
class ShepherdClass extends BaseClass {
    /**
     * Initializes the Shepherd class with its core configuration.
     */
    constructor() {
        super({
            name: "Shepherd",
            subtitle: "Master of life and death, leader of spirits",
            keyStats: ['wil', 'int'],
            saves: { adv: 'wil', dis: 'str' },
            proficiencies: { armor: "Mail", weapons: "Blades, Staves" },
            baseHp: 15,
            hpPerLevel: 7,
            hitDie: 8,
            theme: {
                accent: "#d946ef",
                accentDim: "#a21caf",
                bodyBg: "#080508",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(217, 70, 239, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0a1a 0%, #080508 100%)",
                panelBg: "rgba(35, 15, 35, 0.8)",
                border: "rgba(217, 70, 239, 0.25)"
            },
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 2, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Mercy", label: "Luminary of Mercy", accent: "#f0f9ff" },
                { 
                    value: "Malice", 
                    label: "Luminary of Malice", 
                    accent: "#312e81",
                    config: {
                        spellSchools: ["Necrotic"],
                        scalingStats: {
                            spiritType: (l) => "Deadly"
                        },
                        optionExtensions: {
                            spirit: { name: "Deadly Spirit", desc: (l, s, state) => (state.spiritDesc || "").replace("Lifebinding", "Deadly").replace("Radiant", "Necrotic") },
                            graces: {
                                "Font of Life": { desc: "(Spirit of Dread) When you or an ally spend a hit die, deal 1 Wound to an enemy within 6 spaces." }
                            }
                        }
                    }
                }
            ],
            scalingStats: {
                spiritDie: (level, subclass, state) => {
                    let baseTier = Math.max(1, Math.floor(level / 2));
                    if ((state.selectedGraces || []).includes("Empowered Companion")) baseTier++;
                    const sizes = ["d6", "d8", "d10", "d12", "d20"];
                    return sizes[Math.min(sizes.length, baseTier) - 1];
                },
                spiritType: (l) => "Lifebinding",
                spiritDmg: (level, subclass, state, derived) => {
                    const die = derived.spiritDie || "d6";
                    return level >= 20 ? `2${die}` : `1${die}`;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                builder.addRollDisplay('1d8+' + statsMap.wil, 'Searing Light', '1d8+' + statsMap.wil, 'Range 12 | Radiant', { type: 'cantrip', school: 'Radiant' });
                builder.addRollDisplay(`${derived.spiritDmg}+${statsMap.wil}`, `${derived.spiritType} Spirit`, `${derived.spiritDmg}+${statsMap.wil}`, `Reach 4 | T${Math.max(1, Math.floor(level / 2))} uses`, { isMinion: true });
            },
            statModifiers: [
                { id: "font_of_life", stat: "quickRestLoh", value: true, condition: (l, s, state) => (state.selectedGraces || []).includes("Font of Life") }
            ],
            grantedSpells: [
                { level: 1, spells: ["Lifebinding Spirit"] }
            ],
            spellSchools: ["Radiant"],
            extraSchoolsKeys: ["selectedStudy"],
            spellProgression: [1, 2, 4, 6, 8, 10, 13, 17, 19, 21],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, ["selectedTwilight", "selectedSubclassSpells"]),
            includeTieredSpells: [],
            resources: [
                createManaResource('wil')
            ],
            featuresData: ShepherdClass.FEATURES,
            optionsData: ShepherdClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Shepherd class (Sacred Graces).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            graces: {
                "Beacon of Hope": { desc: "Whenever you heal a creature, they also gain advantage on their next save." },
                "Empowered Companion": { desc: "The damage and healing dice of your spirit increase by 1 size (d6 -> d8, etc.)." },
                "Font of Life": { desc: "Whenever you or an ally spend a hit die to recover HP during a Field Rest, they recover double the amount." },
                "Protective Spirit": { desc: "Creatures within 2 spaces of your spirit gain +1 to their Armor Class." },
                "Spirit of Sacrifice": { desc: "When an ally within 6 spaces takes damage, you can use your reaction to take half of that damage instead. This damage cannot be reduced." }
            },
            studies: {
                "Study of Fire": { desc: "You learn the Fire school of magic.", school: "Fire" },
                "Study of Ice": { desc: "You learn the Ice school of magic.", school: "Ice" },
                "Study of Lightning": { desc: "You learn the Lightning school of magic.", school: "Lightning" },
                "Study of Wind": { desc: "You learn the Wind school of magic.", school: "Wind" }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Shepherd class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or INT', 'STR or DEX', true);

        core[1] = [
            { id: "spirit", name: "Lifebinding Spirit", desc: (level, subclass, state, derived) => `Action: Expend 1 mana to summon your spirit (Reach: 4). It lasts for 1 minute. It can move 6 spaces on your turn. Its attacks/heals deal ${derived.spiritDmg}+WIL. Uses: Tier+1/Safe Rest.` },
            { id: "light", name: "Searing Light", desc: "You know the Radiant cantrip <strong>Searing Light</strong>. Range: 12. Damage: 1d8+WIL radiant. On hit, the target is outlined in light (next attack against it has advantage)." }
        ];

        core[3].push(FeatureGen.createSpellChoiceFeature({
            id: "study",
            name: "Deepening Study",
            level: 3,
            spellType: "school",
            schools: ["Fire", "Ice", "Lightning", "Wind"],
            stateKey: "selectedStudy",
            desc: "Choose an additional school of magic to master."
        }));

        core[5].push({ id: "graces", name: "Sacred Graces", type: "dynamic_choice", collection: "graces", stateKey: "selectedGraces", milestones: [5, 9, 13, 17], desc: "Choose a Sacred Grace as you level up.", getCount: createStandardCount([5, 9, 13, 17]) });

        core[6].push(FeatureGen.createSpellChoiceFeature({
            id: "twilight",
            name: "Master of Twilight",
            level: 6,
            spellType: "utility",
            stateKey: "selectedTwilight",
            perSchool: true,
            multiplier: (level) => level >= 14 ? 0 : 1,
            milestones: [6, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Choose 1 Utility Spell from each spell school you know.",
                [{ level: 14, text: "You know all Utility Spells from the spell schools you know." }],
                level
            )
        }));

        core[20].push({ id: "luminary", name: "Luminary of Spirits", desc: "+1 to any 2 stats. You can maintain 2 spirits simultaneously. When you use an action to command one, you can command both." });

        subclasses["Mercy"] = {
            3: [{ id: "mending", name: "Mending Aura", desc: "Allies within 2 spaces of your spirit regain 1 HP at the start of their turn." }],
            7: [{ id: "revive", name: "Spirit Revive", desc: "(1/Safe Rest) If an ally within 6 spaces of your spirit drops to 0 HP, they instead drop to 1 HP and regain 2d8 HP." }],
            11: [{ id: "purity", name: "Purifying Light", desc: "Your Searing Light cantrip now also removes one condition from an ally within 2 spaces of the target." }],
            15: [{ id: "mercy_avatar", name: "Avatar of Mercy", desc: "Your spirit can now cast Heal (Tier 3) once per summoning without expending mana." }]
        };
        subclasses["Malice"] = {
            3: [{ id: "dread_aura", name: "Avatar of Dread", desc: "Enemies within 2 spaces of your spirit have -2 to all saves." }],
            7: [{ id: "wither", name: "Withering Touch", desc: "Whenever your spirit deals damage, the target's speed is halved until the end of their next turn." }],
            11: [{ id: "corruption", name: "Corrupting Light", desc: "Your Searing Light cantrip now deals necrotic damage and the target has disadvantage on their next attack." }],
            15: [{ id: "malice_avatar", name: "Avatar of Malice", desc: "Your spirit can now cast Enervate (Tier 3) once per summoning without expending mana." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new ShepherdClass();
