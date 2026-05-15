/**
 * Stormshifter Class Configuration
 * Master of weather, beast, and nature.
 * @extends BaseClass
 */
class StormshifterClass extends BaseClass {
    /**
     * Initializes the Stormshifter class with its core configuration.
     */
    constructor() {
        super({
            name: "Stormshifter",
            subtitle: "Master of weather, beast, and nature",
            keyStats: ['wil', 'dex'],
            saves: { adv: 'wil', dis: 'str' },
            proficiencies: { armor: "Cloth, Leather", weapons: "Staves, Wands" },
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
                { value: "SkyStorm", label: "Circle of Sky & Storm", accent: "#38bdf8" },
                { value: "FangClaw", label: "Circle of Fang & Claw", accent: "#f59e0b" }
            ],
            scalingStats: {
                manaMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    return level >= 2 ? (statsMap.wil * 3) + level : 0;
                },
                shiftMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    let max = statsMap.dex;
                    if (level >= 6) max += 1;
                    if (level >= 9) max += 1;
                    if (level >= 12) max += 1;
                    if (subclass === "FangClaw" && level >= 15) max += 2;
                    return max;
                },
                goreDmg: (level) => `1d6+${level}`,
                thunderDmg: (level) => `1d4+${level}`,
                stingDmg: (level) => `1d4+${3 * level}`
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                if (level >= 2) {
                    builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
                }
                const activeForm = (state.currentForm || [])[0] || "Normal";
                const formOptions = ["Normal", "Fearsome", "Beast of the Pack", "Beast of Nightmares"].filter(k => {
                    if (k === "Fearsome" && level < 2) return false;
                    if (k === "Beast of the Pack" && level < 3) return false;
                    if (k === "Beast of Nightmares" && level < 5) return false;
                    return true;
                });

                builder.addSelectDisplay('currentForm', 'Form', formOptions, activeForm, activeForm === 'Normal' ? 'Standard Form' : 'Shifted');

                if (activeForm === "Fearsome") {
                    builder.addRollDisplay(derived.goreDmg, 'Gore', derived.goreDmg, `Reach 1 | +${statsMap.dex + level} THP`, { type: 'attack', stat: 'dex' });
                } else if (activeForm === "Beast of the Pack") {
                    builder.addRollDisplay(derived.thunderDmg, 'Thunderfang', derived.thunderDmg, `Reach 1 | +${statsMap.dex} SPD`, { type: 'attack', stat: 'dex' });
                } else if (activeForm === "Beast of Nightmares") {
                    builder.addRollDisplay(derived.stingDmg, 'Sting', derived.stingDmg, `Reach 0 | Acid`, { type: 'attack', stat: 'dex' });
                }
            },
            statModifiers: [
                { id: "nightmare_speed", stat: "speedBase", value: 2, condition: (l, s, state) => state.currentForm?.[0] === "Beast of Nightmares" },
                { id: "pack_speed", stat: "speed", getMod: (stats, state) => state.currentForm?.[0] === "Beast of the Pack" ? stats.dex : 0 },
                { id: "fleet_footed_speed", stat: "speed", value: 2, condition: (l, s, state) => (state.selectedBoons || []).includes("Fleet Footed") },
                { id: "earthwalker_armor", stat: "armor", value: 2, condition: (l, s, state) => (state.selectedBoons || []).includes("Earthwalker") }
            ],
            grantedSpells: [
                { level: 1, spells: ["Lightning Cantrips", "Wind Cantrips"] }
            ],
            spellSchools: ["Wind", "Lightning"],
            extraSchoolsKeys: ["selectedStudy"],
            spellProgression: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, ["selectedStormcaller"]),
            resources: [
                createManaResource('wil', 'Mana Pool', { hideMechanic: true }),
                createSimpleResource('shift', 'Beastshift', (l, stats, state, sub, derived) => derived.shiftMax, { hideMechanic: true, reset: 'Safe Rest' })
            ],
            featuresData: StormshifterClass.FEATURES,
            optionsData: StormshifterClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            boons: {
                "Beast of the Sea": { desc: "Can move, breathe, and fight underwater without penalty." },
                "Climber": { desc: "Can walk across walls and ceilings; ignores difficult terrain." },
                "Fleet Footed": { desc: "+2 speed. Advantage on Stealth checks and against the Grappled condition." },
                "Earthwalker": { desc: "+2 armor. Can burrow through dirt and unworked rock at half speed. Advantage against the Prone condition." },
                "Keen Senses": { desc: "Advantage on Perception and Assess checks. Unaffected by Blinded." },
                "Leader of the Pack": { desc: "Advantage against fear and charm effects for yourself and allies within 6 spaces." },
                "Phasebeast": { desc: "Whenever you shift between this form and your normal form (and vice versa), you may teleport up to 6 spaces away to a place you can see." },
                "Prehensile Tail": { desc: "Creatures you hit in melee that are your size or smaller are Grappled. If you hit a larger creature, you may move with it when it moves." },
                "Winged": { desc: "Gain a flying speed. Forced movement moves you twice as far while flying." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or DEX', 'STR or INT', true, [1, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        core[1] = [
            { id: "storms", name: "Master of Storms", desc: "You know cantrips from the Lightning and Wind schools." },
            { id: "shift", name: "Beastshift", resourceId: "shift", desc: "Action: You can transform into a harmless beast (squirrel, pigeon, etc.). While transformed, you can speak with animals. This form lasts until you drop to 0 HP, cast a spell, or if you end it on your turn for free." }
        ];

        core[2] = [
            { 
                id: "dire_fearsome", 
                name: "Direbeast Form", 
                milestones: [2, 3, 5],
                desc: (l) => FeatureGen.createScalingList("You can Beastshift into a <strong>Fearsome Beast</strong> (Large). Gain DEX+LVL temp HP. Gore: 1d6+LVL damage. Fearsome: Whenever you Interpose or Defend, you may spend 1 mana to force them to reroll.", [
                    { level: 3, text: "Rank 2: You can Beastshift into a <strong>Beast of the Pack</strong> (Medium). Gain +DEX speed. Thunderfang: 1d4+LVL piercing damage. Supercharge: Spend up to WIL mana for +1d8 lightning damage per mana (take damage on a miss)." },
                    { level: 5, text: "Rank 3: You can Beastshift into a <strong>Beast of Nightmares</strong> (Tiny). Sting: 1d4 piercing + 3×LVL acid damage (ignoring armor), on crit: 4×LVL damage instead. Silent But Deadly: Speed 2, cannot Defend/Interpose, cannot be targeted until conspicuous." }
                ], l)
            },
            { id: "mana", name: "Mana and Unlock Tier 1 Spells", desc: "You unlock tier 1 Wind and Lightning spells and gain a mana pool. This mana pool’s maximum is always equal to (WIL×3)+LVL and recharges on a Safe Rest." }
        ];

        core[3] = [
            { id: "subclass", name: "Subclass", desc: "Choose a Stormshifter subclass." }
        ];

        core[4].push(FeatureGen.createSpellChoiceFeature({
            id: "stormcaller",
            name: "Stormcaller",
            level: 4,
            stateKey: "selectedStormcaller",
            milestones: [4, 7, 14],
            getCount: (l, s, state) => {
                if (l >= 14) return 0;
                const perSchool = l >= 7 ? 2 : 1;
                const schoolCount = (s === "SkyStorm" && state.selectedStudy?.[0] && state.selectedStudy[0] !== "None") ? 3 : 2;
                return schoolCount * perSchool;
            },
            getSlots: (level, subclass, state) => {
                if (level >= 14) return [];
                const schools = ["Lightning", "Wind"];
                const third = state.selectedStudy?.[0];
                if (subclass === "SkyStorm" && third && third !== "None") {
                    schools.push(third);
                }

                const slots = [];
                const perSchool = level >= 7 ? 2 : 1;
                for (let i = 0; i < perSchool; i++) {
                    schools.forEach(s => {
                        slots.push({ type: 'utility', schools: [s], label: `${s} Utility ${i > 0 ? '(2)' : ''}`.trim() });
                    });
                }
                return slots;
            },
            desc: (l) => l >= 14 ? "You know all Utility Spells from each spell school you know." : "Learn a Utility Spell from each spell school you know."
        }));

        core[5] = [];

        core[6].push({ id: "boon", name: "Chimeric Boon", type: "dynamic_choice", collection: "boons", stateKey: "selectedBoons", milestones: [6, 9, 12, 17], desc: "Choose Chimeric Boons.", getCount: FeatureGen.createStandardCount([6, 9, 12, 17]) });
        core[6].push({ id: "expert", name: "Expert Shifter", desc: "Gain 1 additional use of Beastshift per Safe Rest." });

        core[8].push({ 
            id: "stormborn", 
            name: "Stormborn", 
            milestones: [8, 13],
            desc: (l) => FeatureGen.createScalingList("Gain resistance to lightning damage. ([[uStormbornDay]] 1/day) You may gain advantage on a Naturecraft check or Concentration check.", [
                { level: 13, text: "Rank 2: Instead of rolling dice, deal the max damage of a Wind spell by spending a charge of your Beastshift feature. Whenever you end Beastshift, you may cast a cantrip for free." }
            ], l)
        });

        core[13] = [];

        core[20].push({ id: "archdruid", name: "Archdruid", desc: "+1 to any 2 of your stats. ([[uArchdruid]] 1/encounter) Cast a spell up to tier 4 for free when you enter or leave a Beastshift form." });

        subclasses["SkyStorm"] = {
            3: [
                FeatureGen.createSpellChoiceFeature({ id: "study", name: "Deepening Study", level: 3, spellType: "school", schools: ["Ice", "Radiant"], stateKey: "selectedStudy", desc: "Choose the Ice or Radiant school to learn." }),
                { id: "fey", name: "Creature of the Fey", desc: "You may cast spells while Beastshifted." },
                { id: "attuned", name: "Attuned to Nature", desc: "([[uAttunedDay]] 1/day) Add LVL to any skill check related to nature or weather." }
            ],
            7: [{ id: "tempest", name: "Raging Tempest", desc: "Whenever you crit with a tiered spell, you may cast a cantrip for free from a school you know and haven’t cast any spells from this turn (at the same level of dis/advantage)." }],
            11: [{ id: "primordial", name: "Primordial Force", desc: "Spending 2+ mana on a spell grants an additional effect: <ul><li>Ice: Gain WIL temp HP.</li><li>Lightning: Deal additional damage equal to your WIL.</li><li>Radiant: You may heal a creature within 6 spaces WIL HP.</li><li>Wind: Gain a flying speed this turn. Move up to 6 spaces for free.</li></ul>" }],
            15: [{ id: "master_storm", name: "Master of Storm", desc: "You can concentrate on 1 lightning spell and 1 wind spell at the same time. ([[uMasterStorm]] 1/Safe Rest) You can cast Ride the Lightning for 0 mana." }]
        };

        subclasses["FangClaw"] = {
            3: [{ id: "swiftshift", name: "Swiftshift", desc: "When you roll Initiative, you may Beastshift or move for free. While transformed, you may shift between different Direbeast forms for free (and as a reaction by spending 1 mana); however, Beastshifting for free does not grant any temp HP." },
            { id: "windborne", name: "Windborne Protector", desc: "([[uWindborne]] 1/encounter) Reaction: when an enemy attacks, spend 2 mana to shift into a Fearsome Beast. Then you may Interpose from up to 12 spaces away and Defend for free (if you have not yet done so this round)." },
            { id: "friend", name: "Friend of Beasts", desc: "Beasts will not attack you until you first harm them. You may transform into harmless beasts without spending a Beastshift charge." }],
            7: [{ id: "unleash", name: "Unleash the Beast", desc: "([[uUnleash]] 1/encounter) When you miss, you can crit instead." },
            { id: "wake", name: "Storm Wake", desc: "([[uStormWake]] 1/encounter) Action: Spend 3 mana to shift into a Beast of the Pack, then teleport in a straight line up to 12 spaces away, unerringly dealing WIL d8 lightning damage to any creatures you choose adjacent to your path." }],
            11: [{ 
                id: "master_forms", 
                name: "Master of Forms", 
                milestones: [11, 15],
                desc: (l) => FeatureGen.createScalingList("Your shapeshift forms can have 2 Chimeric Boons at a time.", [
                    { level: 15, text: "Rank 2: You can Beastshift 2 additional times per Safe Rest. Choose 2 additional Chimeric Boons. Your Direbeast forms can have 3 at a time." }
                ], l)
            },
            { id: "venomous", name: "Venomous Gaze", desc: "([[uVenomous]] 1/encounter) Action: Spend 2 mana to shift into a Beast of Nightmares. Then entice a creature within 12 spaces to move 2×WIL spaces closer to you on a failed WIL save (they roll with disadvantage and must repeat until they save or can move no further). If they end up in the same space as you, you may Sting them for free." }],
            15: []
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new StormshifterClass();
