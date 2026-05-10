/**
 * Stormshifter Class Configuration
 * Master of weather, beast, and nature.
 * A versatile caster that can transform into powerful Direbeast forms.
 */
class StormshifterClass extends BaseClass {
    constructor() {
        super({
            name: "Stormshifter",
            subtitle: "Master of weather, beast, and nature",
            keyStats: ['dex', 'wil'],
            saves: { adv: 'dex', dis: 'str' },
            proficiencies: { armor: "Cloth", weapons: "Blades, Bows, Staves" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#14b8a6",
                accentDim: "#0d9488",
                bodyBg: "#050806",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0f1a18 0%, #050a09 100%)",
                panelBg: "rgba(15, 25, 20, 0.8)",
                border: "rgba(20, 184, 166, 0.25)"
            },
            initialStats: { baseStr: 0, baseDex: 2, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Storm", label: "Avatar of the Storm", accent: "#38bdf8" },
                { value: "Beast", label: "Avatar of the Beast", accent: "#f59e0b" }
            ],
            scalingStats: {
                shiftFaces: { 1: 4, 3: 6, 5: 8 }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                const activeForm = (state.currentForm || [])[0] || "Normal";
                const formOptions = Object.keys(StormshifterClass.OPTIONS.forms).filter(k => {
                    if (k === "Fearsome" && level < 2) return false;
                    if (k === "Beast of the Pack" && level < 3) return false;
                    if (k === "Beast of Nightmares" && level < 5) return false;
                    return true;
                });

                const subtext = activeForm === "Fearsome" ? `+${statsMap.dex + level} THP on Shift` :
                    activeForm === "Beast of the Pack" ? `+${statsMap.dex} SPD` :
                        activeForm === "Beast of Nightmares" ? `SPD 2 | Unseen` : 'Standard Form';

                builder.addSelectDisplay('currentForm', 'Form', formOptions, activeForm, subtext);

                if (activeForm === "Fearsome") {
                    builder.addRollDisplay(`1d6+${level}`, 'Gore', `1d6+${level}`, 'Reach 1', { type: 'attack', stat: 'str' });
                } else if (activeForm === "Beast of the Pack") {
                    builder.addRollDisplay(`1d4+${level}`, 'Thunderfang', `1d4+${level}`, 'Reach 1', { type: 'attack', stat: 'dex' });
                } else if (activeForm === "Beast of Nightmares") {
                    builder.addRollDisplay(`1d4+${3 * level}`, 'Sting', `1d4+${3 * level}`, 'Reach 1 | Acid', { type: 'attack', stat: 'dex' });
                }
            },
            
            // Stat Modifiers
            statModifiers: [
                { id: "nightmare_speed", stat: "speedBase", value: 2, condition: (l, s, state) => state.currentForm?.[0] === "Beast of Nightmares" },
                { id: "pack_speed", stat: "speed", getMod: (stats, state) => state.currentForm?.[0] === "Beast of the Pack" ? stats.dex : 0 },
                { id: "fleet_footed_speed", stat: "speed", value: 2, condition: (l, s, state) => (state.selectedBoons || []).includes("Fleet Footed") },
                { id: "earthwalker_armor", stat: "armor", value: 2, condition: (l, s, state) => (state.selectedBoons || []).includes("Earthwalker") },
                { id: "winged_fly", stat: "modFlySpeed", value: true, condition: (l, s, state) => (state.selectedBoons || []).includes("Winged") }
            ],
            
            // Spell Configuration
            spellSchools: ["Lightning", "Wind"],
            extraSchoolsKeys: ["selectedStudy"],
            spellProgression: [1, 2, 4, 6, 8, 10, 13, 17, 19, 21],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, "selectedSubclassSpells"),
            includeTieredSpells: ["selectedStudy"],
            resources: [
                createManaResource('wil')
            ],
            featuresData: StormshifterClass.FEATURES,
            optionsData: StormshifterClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Stormshifter class (Forms, Boons, Studies).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            forms: {
                "Normal": { desc: "Your standard humanoid form." },
                "Fearsome": { desc: "Transform into a powerful predatory beast. Gain STR+Level temporary HP." },
                "Beast of the Pack": { desc: "Transform into a swift pack hunter. Your speed increases by your DEX." },
                "Beast of Nightmares": { desc: "Transform into a terrifying creature of shadow. Your speed is 2, but you are unseen." }
            },
            boons: {
                "Earthwalker": { desc: "While in a beast form, your Armor Class increases by +2." },
                "Fleet Footed": { desc: "Your speed increases by +2 in all forms." },
                "Thick Hide": { desc: "While in a beast form, you have resistance to bludgeoning, piercing, and slashing damage from non-magical attacks." },
                "Winged": { desc: "You grow wings while in a beast form and gain a fly speed equal to your speed." }
            },
            studies: {
                "Study of Fire": { desc: "You learn the Fire school of magic.", school: "Fire" },
                "Study of Ice": { desc: "You learn the Ice school of magic.", school: "Ice" }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Stormshifter class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or DEX', 'STR or INT', true);

        core[1] = [
            { id: "shift", name: "Beastshift", desc: (level, subclass, state, derived) => `Action: Expend 1 mana to transform into a beast form. Transform back as a free action. While shifted, you cannot cast spells but gain unique abilities. Shift Die: 1d${derived.shiftFaces}.` }
        ];

        core[3].push(FeatureGen.createSpellChoiceFeature({
            id: "study",
            name: "Deepening Study",
            level: 3,
            spellType: "school",
            schools: ["Fire", "Ice"],
            stateKey: "selectedStudy",
            desc: "Choose an additional school of magic to master."
        }));

        core[4].push({ id: "boon", name: "Chimeric Boon", type: "dynamic_choice", collection: "boons", stateKey: "selectedBoons", milestones: [4, 10, 16], desc: "Choose a Chimeric Boon as you level up.", getCount: createStandardCount([4, 10, 16]) });

        core[6].push(FeatureGen.createSpellChoiceFeature({
            id: "mastery",
            name: "Master of Storms",
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

        core[20].push({ id: "elder", name: "Elder Stormshifter", desc: "+1 to any 2 stats. You can cast spells while in a beast form. Additionally, you can maintain two forms simultaneously (combining their benefits)." });

        subclasses["Storm"] = {
            3: [{ id: "lightning_strike", name: "Lightning Strike", desc: "Whenever you transform, a bolt of lightning strikes an enemy within 6 spaces for 2d6 damage." }],
            7: [{ id: "weather_control", name: "Weather Control", desc: "(1 mana) Action: Change the weather in a 1-mile radius for 1 hour. You can create rain, fog, or clear skies." }],
            11: [{ id: "storm_form", name: "Storm Avatar", desc: "While in a beast form, you are surrounded by a swirling storm. Enemies within 2 spaces take 1d6 lightning damage at the start of their turn." }],
            15: [{ id: "thunder_call", name: "Thunder Call", desc: "(1/Safe Rest) 2 actions: Call down a massive thunderclap. Each enemy within 12 spaces take 10d6 lightning damage and is Deafened for 1 minute (WIL save DC 10+WIL for half)." }]
        };
        subclasses["Beast"] = {
            3: [{ id: "feral_might", name: "Feral Might", desc: "While in a beast form, your weapon attacks deal an additional 1d6 damage." }],
            7: [{ id: "beast_tongue", name: "Beast Tongue", desc: "You can communicate with any animal as if you shared a language. You have advantage on all Influence checks related to animals." }],
            11: [{ id: "primal_regeneration", name: "Primal Regeneration", desc: "While in a beast form, you regain HP equal to your WIL at the start of each of your turns." }],
            15: [{ id: "alpha", name: "Alpha Predator", desc: "While in a beast form, you have advantage on all weapon attacks against creatures that are below their maximum HP." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new StormshifterClass();
