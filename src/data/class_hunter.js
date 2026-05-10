/**
 * Hunter Class
 * Resourceful survivalist, bowmaster, and skilled tracker.
 * @extends BaseClass
 */
class HunterClass extends BaseClass {
    /**
     * Initializes the Hunter class with its core configuration.
     */
    constructor() {
        super({
            name: "Hunter",
            subtitle: "Resourceful survivalist, bowmaster, and skilled tracker",
            keyStats: ['dex', 'wil'],
            saves: { adv: 'dex', dis: 'int' },
            proficiencies: { armor: "Leather Armor", weapons: "DEX Weapons" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#4ade80",
                accentDim: "#166534",
                bodyBg: "#061008",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(74, 222, 128, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0d1a0f 0%, #061008 100%)",
                panelBg: "rgba(20, 35, 25, 0.8)",
                border: "rgba(74, 222, 128, 0.2)"
            },
            initialStats: { baseStr: 0, baseDex: 2, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Shadowpath", label: "Keeper of the Shadowpath", accent: "#1e1b4b" },
                { value: "WildHeart", label: "Keeper of the Wild Heart", accent: "#ea580c" },
                { value: "Beastmaster", label: "Beastmaster", accent: "#d9f99d" }
            ],
            scalingStats: {
                saDice: { 1: "None", 3: "1d8", 7: "2d8", 9: "2d10", 11: "2d12", 15: "2d20", 17: "3d20" }
            },
            statModifiers: [
                { id: "wildheart_hd", stat: "hdFace", value: 2, subclass: "WildHeart", level: 3 },
                { id: "wildheart_hp", stat: "baseHp", value: 5, subclass: "WildHeart", level: 3 },
                { id: "wildheart_armor", stat: "armor", subclass: "WildHeart", level: 15, getMod: (stats) => stats.wil }
            ],
            grantedSpells: [
                { level: 1, spells: ["Hunter's Mark"] }
            ],
            featuresData: HunterClass.FEATURES,
            optionsData: HunterClass.OPTIONS,
            resources: [
                createSimpleResource('tothCharges', 'TotH Charges', (level, stats) => Math.max(1, Math.max(stats.dex, stats.wil)))
            ]
        });
    }

    /**
     * Defines choice-based options for the Hunter class (TotH Abilities, Companion Sizes).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            tothAbilities: {
                "Addling Arrow": { desc: "Action: Attack with a ranged weapon. The next attack the target makes must be against the closest other creature, chosen at random." },
                "Come Get Some!": { desc: "Action: Attack a target. It is Taunted by you until the end of their next turn." },
                "Decoy": { desc: "When you Defend: The attack misses instead, and you can move up to half your speed away (where you really were all along!)." },
                "Fleet Feet": { desc: "Move up to your speed for free, ignoring difficult terrain." },
                "Grease Trap": { desc: "(1/encounter) Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Target falls Prone, is vulnerable to the next fire damage it takes, and is treated as if it is Smoldering." },
                "Hail of Arrows": { desc: "(Half range) 2 actions: Shoot all creatures within a 3×3 area. Their speed is halved until the end of their next turn." },
                "Heavy Shot": { desc: "(Half range) Action: Attack with a ranged weapon and push your target: 4 spaces for a small creature, 2 for a medium creature, 1 for a large creature." },
                "Incendiary Shot": { desc: "(Half range) Action: Attack with a ranged weapon, add WIL d8 fire damage." },
                "Multishot": { desc: "(Half range) Action: Attack your quarry with a ranged weapon and load an extra projectile. Select a 2nd target within 2 spaces of them to take the same amount of damage." },
                "Pinning Shot": { desc: "Spend 3 actions shooting your quarry. They are Restrained until they can escape (DC 10+WIL)." },
                "Snare Trap": { desc: "(1/encounter) Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Move them back 1 space, they are Restrained until they can escape (DC 10+WIL)." },
                "Sharpshooter": { desc: "Action: If you have not moved this turn and your quarry is 4 or more spaces away, attack them for double damage." },
                "Vital Shot": { desc: "(Half Range) Action: Attack your Hampered quarry with a ranged weapon, ignoring their armor or doubling your Hunter's Mark damage bonus if they have none." },
                "Wild Instinct": { desc: "(1/round, costs 0 TotH charges if you have none.) Assess for free, with advantage." }
            },
            companionSizes: {
                "None": { desc: "No companion selected." },
                "Small": {
                    desc: (level) => FeatureGen.createScalingList(
                        "You have a small, agile animal companion. Gain the following abilities:<ul><li><strong>Keen Eyes:</strong> Mark a target for free (1/encounter).</li><li><strong>Protect Me!:</strong> (1/encounter) Whenever you Defend, your companion distracts the attacker, causing the attack to miss, and you move up to half your speed away.</li><li><strong>Go for the Throat!:</strong> (1/encounter) Costs 1 TotH charge: Your companion attacks your quarry for 1d4+LVL damage for free (ignoring armor).</li></ul>",
                        [
                            { level: 7, text: "Keen Eyes (2/enc), Protect Me! (2/enc)." },
                            { level: 11, text: "Keen Eyes (3/enc), Go for the Throat! (2/enc, 1/round)." },
                            { level: 15, text: "Go for the Throat! (3/enc, 1/round)." }
                        ],
                        level
                    )
                },
                "Medium": {
                    desc: (level) => FeatureGen.createScalingList(
                        "You have a medium, ferocious animal companion. Gain the following abilities:<ul><li><strong>Ferocious:</strong> Whenever you or your companion crit your quarry, your companion attacks again for LVL damage (ignoring armor), and you can move up to 2 spaces for free.</li><li><strong>Protect Me!:</strong> When you Defend, your companion may first attack that creature for 1d4+LVL damage.</li><li><strong>Go for the Throat!:</strong> (1/encounter) Costs 1 TotH charge: Your companion attacks your quarry for 1d8+3x LVL damage (ignoring armor).</li></ul>",
                        [
                            { level: 7, text: "Ferocious move increases to 4 spaces." },
                            { level: 11, text: "Go for the Throat! (2/encounter)." },
                            { level: 15, text: "Ferocious move increases to 6 spaces." }
                        ],
                        level
                    )
                },
                "Large": {
                    desc: (level) => FeatureGen.createScalingList(
                        "You have a large, powerful animal companion. Gain the following abilities:<ul><li><strong>Alpha Protector:</strong> Damage from the first attack against you each round is halved.</li><li><strong>Protect Me!:</strong> (1/encounter) After you gain a Wound, your companion can whisk you away to safety up to 12 spaces.</li><li><strong>Go for the Throat!:</strong> (1/encounter) Costs 2 TotH charges, 2 actions: Your companion attacks your quarry for 1d12+4x LVL damage (ignoring armor).</li></ul>",
                        [
                            { level: 7, text: "Protect Me! now whisks you away <em>before</em> the Wound." },
                            { level: 11, text: "Go for the Throat! (2/encounter)." },
                            { level: 15, text: "Protect Me! (2/encounter)." }
                        ],
                        level
                    )
                }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Hunter class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or WIL', 'STR or INT', false);

        core[1] = [
            {
                id: "mark",
                name: "Hunter's Mark",
                milestones: [1],
                context: { type: 'attack', stat: 'dex' },
                desc: (level) => FeatureGen.createScalingList(
                    "Action: A creature you can see is marked as your quarry for 1 day (or until you mark another creature). It can’t be hidden from you, and your attacks against it gain your choice of advantage OR +LVL damage (choose before each attack).",
                    [{ level: 1, text: `Bonus damage is +${level}.` }],
                    level
                )
            },
            { id: "forager", name: "Forager", desc: "Gain advantage on skill checks to find food and water in the wild." }
        ];
        core[2] = [
            { id: "toth", name: "Thrill of the Hunt", desc: "Choose 2 Thrill of the Hunt (TotH) abilities. Gain a charge to use these abilities during that encounter whenever:<ul><li>Your quarry dies.</li><li>You hit your quarry in melee or crit your quarry at range.</li></ul>" },
            { id: "roll_strike", name: "Roll & Strike", desc: "Action: If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free." },
            { id: "toth_abilities", name: "Thrill of the Hunt Abilities", type: "dynamic_choice", collection: "tothAbilities", stateKey: "selectedToth", milestones: [2, 4, 6, 8, 12, 14], desc: "Choose TotH abilities as you level up.", getCount: (level) => FeatureGen.createStandardCount([0, 2, 4, 6, 8, 12, 14])(level) + 1 }
        ];
        core[3].push({ id: "intuition", name: "Tracker's Intuition", desc: "You can discern the events of a past encounter by studying tracks and other subtle environmental clues, accurately determining the kind and amount of creatures, their direction, key actions, and passage of time." });
        core[4].push({ id: "explorer", name: "Explorer of the Wilds", desc: "+2 speed; gain a climbing speed." });
        core[5].push({ id: "resolve", name: "Hunter's Resolve", desc: "Whenever you have no Thrill of the Hunt charges, gain Hunter's Resolve until the end of your turn: treat all creatures as your quarry for the purposes of movement and melee attacks." });
        core[5].push({ id: "takedown", name: "Final Takedown", desc: "Action: Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter’s Mark. If they survive, they crit you back." });
        core[6].push({ id: "bowmaster", name: "Versatile Bowmaster", desc: "Whenever you attack with a Longbow, you may roll 2d4 instead of 1d8; or with a Crossbow, 2d8 instead of 4d4." });
        core[9].push({ id: "no_escape", name: "No Escape", desc: "Whenever you see one or more allies make an opportunity attack, you may also make a ranged opportunity attack against the same target." });
        core[10].push({ id: "stalker", name: "Veteran Stalker", desc: "Gain a Thrill of the Hunt charge whenever you are first Bloodied in an encounter and for every Wound you gain." });
        core[10].push({ id: "steady_hand", name: "Keen Eye, Steady Hand", desc: "Add WIL to your ranged weapon damage." });
        core[13].push({ id: "keen_sight", name: "Keen Sight", desc: "Advantage on Perception checks." });
        core[17].push({ id: "peerless", name: "Peerless Hunter", desc: "You can Defend against your quarry for free." });
        core[18] = [{ id: "wild_endurance", name: "Wild Endurance", desc: "Gain 1 Thrill of the Hunt charge at the start of your turns." }];
        core[20].push({ id: "nemesis", name: "Nemesis", desc: "+1 to any 2 of your stats. Your Hunter’s Mark can target any number of creatures simultaneously." });

        subclasses["Shadowpath"] = {
            3: [
                { id: "ambusher", name: "Ambusher", desc: "When you roll Initiative, you may use Hunter’s Mark for free. Gain advantage on the first attack you make each encounter." },
                { id: "track", name: "Skilled Tracker", desc: "You have advantage on skill checks to track creatures." },
                { id: "navigator", name: "Skilled Navigator", desc: "You cannot become lost by nonmagical means." }
            ],
            7: [{ id: "primal", name: "Primal Predator", desc: "(1/encounter) Your weapon attacks ignore cover and armor this turn." }],
            11: [{ id: "pack", name: "Pack Hunter", desc: "Whenever you mark a creature, you may also mark another creature within 6 spaces of them for free." }],
            15: [{ id: "apex", name: "Apex Predator", desc: "You may use your Primal Predator ability twice each encounter. Gain 1 Thrill of the Hunt charge when you roll Initiative." }]
        };
        subclasses["WildHeart"] = {
            3: [
                { id: "form", name: "Impressive Form", desc: "+5 max HP. Upgrade your Hit Dice to d10s." },
                { id: "high_ground", name: "I Have the High Ground", desc: "When you roll Initiative or gain one or more Thrill of the Hunt charges, move up to half your speed for free, ignoring difficult terrain." }
            ],
            7: [{ id: "herbalist", name: "Resourceful Herbalist", desc: "Whenever you Safe Rest in a location near where plants or fungi can grow, you may spend a day collecting healing herbs to craft a number of Healing Salves equal to your WIL. <strong>Healing Salve:</strong> Action: Heal yourself or an adjacent creature WIL d6 HP. Only you or another experienced Herbalist may administer these, and they expire whenever you Safe Rest." }],
            11: [{ id: "here", name: "Ha! I’m Over Here!", desc: "(1/Safe Rest) If an attack would cause you to drop to 0 HP, you instead move up to your speed away and take no damage." }],
            15: [{ id: "survivalist", name: "Unparalleled Survivalist", desc: "Gain +WIL armor. When you attack with a ranged weapon, you may first move half your speed for free." }]
        };
        subclasses["Beastmaster"] = {
            3: [{ id: "companion", name: "Animal Companion", type: "choice", collection: "companionSizes", stateKey: "selectedCompanion", desc: "Choose a Small, Medium, or Large animal as your companion. No stats or actions to track. Your companion's attacks count as your own for TotH." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Hunter's Mark and Thrill of the Hunt charges for the Hunter's mechanic panel.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived statistics.
     * @returns {string} HTML string.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();

        builder.addRollDisplay('1d20', 'Hunter\'s Mark', `+${level}`, 'Advantage OR Bonus Dmg', { type: 'attack', stat: 'dex' });
        builder.addResource('tothCharges', 'TotH Charges', state.resourceValues.tothCharges, derived.resourceMaxes.tothCharges);

        builder.addStatDisplay('', 'Gain Charge', '● Quarry Dies<br>● Melee Hit<br>● Ranged Crit', { borderLeft: true });

        return builder.build();
    }
}

const CLASS_CONFIG = new HunterClass();
