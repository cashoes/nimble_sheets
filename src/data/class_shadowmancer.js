/**
 * Shadowmancer Class
 * Dark mystic who commands spirits & shadows.
 * @extends BaseClass
 */
class ShadowmancerClass extends BaseClass {
    /**
     * Initializes the Shadowmancer class with its core configuration.
     */
    constructor() {
        super({
            name: "Shadowmancer",
            subtitle: "Dark mystic who commands spirits & shadows",
            keyStats: ['int', 'dex'],
            saves: { adv: 'int', dis: 'str' },
            proficiencies: { armor: "Cloth", weapons: "Blades, Wands" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#a855f7",
                accentDim: "#7e22ce",
                bodyBg: "#050308",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 100%), linear-gradient(180deg, #120a1a 0%, #050308 100%)",
                panelBg: "rgba(25, 15, 35, 0.7)",
                border: "rgba(168, 85, 247, 0.3)"
            },
            initialStats: { baseStr: -1, baseDex: 1, baseInt: 3, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { 
                    value: "RedDragon", 
                    label: "Pact of the Red Dragon", 
                    accent: "#fb923c",
                    config: { spellSchools: ["Fire"] }
                },
                { 
                    value: "AbyssalDepths", 
                    label: "Pact of the Abyssal Depths", 
                    accent: "#38bdf8",
                    config: { spellSchools: ["Ice"] }
                },
                { 
                    value: "Reaver", 
                    label: "Pact of the Reaver (Extra)", 
                    accent: "#be123c",
                    config: {
                        scalingStats: {
                            blastName: (l) => "Bonescythe",
                            blastRange: (l) => "Reach 2",
                            blastStat: (l) => "DEX",
                            pilferMax: (l) => 0
                        },
                        spellReplacements: [
                            createSpellReplacement("Shadow Blast", "Bonescythe", "Necrotic")
                        ]
                    }
                }
            ],
            scalingStats: {
                minionReach: { 1: 1, 5: 2, 10: 3, 15: 4, 20: 5 },
                blastDice: { 1: 1, 5: 2, 10: 3, 15: 4, 20: 5 },
                blastName: (l) => "Shadow Blast",
                blastRange: (l) => "Range 8",
                blastStat: (l) => "INT",
                pilferMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    return level >= 2 ? statsMap.dex : 0;
                },
                minionMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    let max = Math.max(1, Math.min(statsMap.int, level));
                    if (level >= 20) max *= 2;
                    return max;
                },
                minionDmg: (level, subclass, state) => {
                    const greater = state.selectedGreater || [];
                    const statsMap = getStatsMap(state);
                    let max = Math.max(1, Math.min(statsMap.int, level));
                    if (level >= 20) max *= 2;
                    return greater.includes("Shadow Magus") ? `${max}d10` : `${max}d12`;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived) => {
                builder.addRollDisplay(derived.blastDice + 'd12', derived.blastName, derived.blastDice + 'd12', `${derived.blastRange} | Necrotic`, { type: 'cantrip', school: 'Necrotic', stat: derived.blastStat.toLowerCase() });
                builder.addRollDisplay(derived.minionDmg, 'Minions', derived.minionDmg, `MAX ${derived.minionMax}`, { isMinion: true });
            },
            statModifiers: [
                { id: "fiendish_boon_stats", stat: "addDex", value: 1, condition: (l, s, state) => (state.selectedGreater || []).includes("Fiendish Boon") },
                { id: "fiendish_boon_hd", stat: "hdMax", value: -1, condition: (l, s, state) => (state.selectedGreater || []).includes("Fiendish Boon") }
            ],
            grantedSpells: [
                { level: 1, spells: ["Shadow Blast", "Summon Shadows"] }
            ],
            spellSchools: ["Necrotic"],
            extraSchoolsKeys: [],
            spellProgression: [1, 2, 5, 7, 10, 13, 16, 19, 21, 23],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, ["selectedShadowmastery", "selectedSubclassSpells"]),
            includeTieredSpells: [],
            resources: [
                createManaResource('int'),
                createSimpleResource('pilfer', 'Pilfer', (l, stats, state, subclass, derived) => derived.pilferMax)
            ],
            featuresData: ShadowmancerClass.FEATURES,
            optionsData: ShadowmancerClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Shadowmancer class (Invocations).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            lesserInvocations: {
                "Abhorrent Speech": { desc: "You can communicate with horrible creatures (aberrations, undead, etc.)." },
                "Beguiling Influence": { desc: "(1/day) You may reroll an Influence check." },
                "Blood Sight": { desc: "(1/day) You may reroll an Examination check. Additionally, you can detect traces of blood on a surface, even after it has been cleaned." },
                "Devoted Acolyte": { desc: "Learn 2 of the following languages: Celestial, Draconic, Deep Speak, Infernal, or Primordial. Advantage on Lore checks related to those 2 languages." },
                "Eldritch Sense": { desc: "You can sense the presence of any shapechanger or creature concealed by magic while within 6 spaces of them." },
                "Gaze of Two Minds": { desc: "Touch a willing creature and perceive through its senses instead of your own for as long as you hold concentration." },
                "Knowledge from Beyond": { desc: "Whenever you fail an Insight or Arcana check, you may suffer 1 Wound to succeed instead." },
                "My Favored Pet": { desc: "One shadow minion can begrudgingly tolerate you outside of combat. It can (very creepily) do any menial task a below average commoner could." },
                "Voice of the Dark": { desc: "You can communicate telepathically with a humanoid within 6 spaces." }
            },
            greaterInvocations: {
                "Armor of Shadows": { desc: "You can sheathe your body in darkness as an action. While active, you gain +2 to your Armor Class and all attacks against you have disadvantage. This effect ends if you are hit by an attack." },
                "Deep Breath": { desc: "You no longer need to breathe." },
                "Devil's Sight": { desc: "You can see normally in darkness, both magical and non-magical, to a distance of 12 spaces." },
                "Fiendish Boon": { desc: "Your dark master grants you a boon. +1 to your DEX, but your max Hit Dice is reduced by 1." },
                "Life Drinker": { desc: "When you hit with a melee weapon attack, you deal extra necrotic damage equal to your INT bonus and regain 1 HP." },
                "One with Shadows": { desc: "When you are in an area of dim light or darkness, you can use your action to become invisible. You remain invisible until you move or take an action or reaction." },
                "Shadow Magus": { desc: "Your shadow minions are empowered. They deal 1d10 necrotic damage instead of 1d12, and their reach increases by 4 spaces." },
                "Soul Siphon": { desc: "When you drop a creature to 0 HP, you regain 2 mana." },
                "Thirsting Blade": { desc: "You can make two attacks with your Pact Weapon whenever you take the attack action on your turn." },
                "Void Walker": { desc: "You can telepathically communicate with any creature you have seen. Additionally, you can cast Levitate on yourself at will, without spending mana." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Shadowmancer class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('INT or DEX', 'STR or WIL', true);

        core[1] = [
            { id: "blast", name: "Shadow Blast", desc: (level, subclass, state, derived) => {
                const dice = derived.blastDice || 1;
                const stat = derived.blastStat || "INT";
                const name = derived.blastName || "Shadow Blast";
                const range = derived.blastRange || "Range 8";
                return `You know the unique Necrotic cantrip <strong>${name}</strong>. ${range}. Damage: ${dice}d12+${stat} necrotic. Targets 1 enemy.`;
            }},
            { id: "sum_shadows", name: "Summon Shadows", desc: (level, subclass, state, derived) => `Action: Expend 1 mana to summon a shadow minion (up to <strong>${derived.minionMax}</strong> active). They act immediately after your turn. Reach: ${derived.minionReach}. Damage: ${derived.minionDmg}+INT necrotic.` }
        ];
        core[2].push({ id: "pilfer", name: "Pilfer", desc: (level, subclass, state, derived) => `(<strong>${derived.resourceMaxes.pilfer}</strong> uses/Safe Rest) Bonus Action: Telekinetically steal a small object (up to 5 lbs) within 6 spaces. You have advantage on DEX checks to do this unnoticed.` });

        core[3].push({ id: "lesser", name: "Lesser Invocation", type: "dynamic_choice", collection: "lesserInvocations", stateKey: "selectedLesser", milestones: [3, 7, 11, 15], desc: "Choose a Lesser Invocation.", getCount: createStandardCount([3, 7, 11, 15]) });
        core[6].push(FeatureGen.createSpellChoiceFeature({
            id: "mastery",
            name: "Shadowmastery",
            level: 6,
            spellType: "utility",
            schools: ["Necrotic"],
            stateKey: "selectedShadowmastery",
            getCount: createStandardCount([6, 8, 14]),
            multiplier: (level) => level >= 14 ? 0 : 1,
            milestones: [6, 8, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Choose a Necrotic Utility Spell as you level up.",
                [{ level: 14, text: "You know all Necrotic Utility spells." }],
                level
            )
        }));

        core[10].push({ id: "greater", name: "Greater Invocation", type: "dynamic_choice", collection: "greaterInvocations", stateKey: "selectedGreater", milestones: [10, 14, 18], desc: "Choose a Greater Invocation.", getCount: createStandardCount([10, 14, 18]) });

        core[20].push({ id: "overlord", name: "Overlord of Shadows", desc: "+1 to any 2 stats. Double your shadow minion limit. You can summon 2 minions with a single action (expending 2 mana)." });

        subclasses["RedDragon"] = {
            3: [{ id: "burn", name: "Incinerating Shadows", desc: "Your shadow minions deal an additional 1d6 fire damage. You gain resistance to fire damage." }],
            7: [{ id: "wings", name: "Dragon Wings", desc: "You grow dark, leathery wings. You gain a fly speed equal to your speed." }],
            11: [{ id: "breath", name: "Shadow Breath", desc: "(1/Safe Rest) 2 actions: Breathe a 6-space cone of shadow fire. Each enemy takes 8d6 fire damage (DEX save DC 10+INT for half)." }],
            15: [{ id: "presence", name: "Dragon’s Presence", desc: "Enemies within 6 spaces have disadvantage on saves against your shadow spells and minion effects." }]
        };
        subclasses["AbyssalDepths"] = {
            3: [{ id: "chill", name: "Freezing Shadows", desc: "Your shadow minions deal an additional 1d6 ice damage. You gain resistance to ice damage." }],
            7: [{ id: "swim", name: "Abyssal Adaptation", desc: "You can breathe underwater and gain a swim speed equal to your speed. You are immune to the effects of extreme pressure and cold." }],
            11: [{ id: "void_call", name: "Abyssal Void", desc: "(1/Safe Rest) 2 actions: Create a 4-space radius vortex of freezing shadow. Each enemy takes 6d8 ice damage and is Pulled 3 spaces toward the center." }],
            15: [{ id: "depths", name: "Heart of the Depths", desc: "Whenever you take damage, you can use your reaction to teleport up to 6 spaces to an unoccupied space you can see." }]
        };
        subclasses["Reaver"] = {
            3: [{ id: "scythe", name: "Shadow Reaper", desc: "Your Shadow Blast becomes <strong>Bonescythe</strong>. It is a melee cantrip with Reach 2 and uses DEX for attack and damage." }],
            7: [{ id: "harvest", name: "Soul Harvest", desc: "When you hit with a weapon attack or scythe, gain 1 temporary mana (expire end of combat). Maximum temp mana: DEX." }],
            11: [{ id: "dash", name: "Shadow Dash", desc: "Bonus Action: Move up to your speed. This movement does not trigger opportunity attacks." }],
            15: [{ id: "death", name: "Death’s Door", desc: "When you drop a creature to 0 HP, you regain 1d10 HP and 1 spent Hit Die." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new ShadowmancerClass();
