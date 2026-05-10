/**
 * Zephyr Class Configuration
 * A disciplined martial artist with swift hands.
 * Focuses on speed, unarmored defense, and rapid strikes.
 */
class ZephyrClass extends BaseClass {
    constructor() {
        super({
            name: "Zephyr",
            subtitle: "Disciplined martial artist with swift hands",
            keyStats: ['dex', 'str'],
            saves: { adv: 'dex', dis: 'str' },
            proficiencies: { armor: "None", weapons: "All Simple Weapons" },
            baseHp: 16,
            hpPerLevel: 8,
            hitDie: 10,
            theme: {
                accent: "#06b6d4",
                accentDim: "#0891b2",
                bodyBg: "#05070a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0a101a 0%, #050809 100%)",
                panelBg: "rgba(15, 20, 35, 0.8)",
                border: "rgba(6, 182, 212, 0.25)"
            },
            initialStats: { baseStr: 1, baseDex: 3, baseInt: 0, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "WayWind", label: "Way of the Flowing Wind", accent: "#38bdf8" },
                { value: "WayStone", label: "Way of the Unyielding Stone", accent: "#78350f" }
            ],
            scalingStats: {
                speed: { 1: 6, 2: 8, 9: 10 },
                swiftBonus: { 1: 0, 5: (level) => level }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                const isUnarmored = this.isUnarmored(state);
                const acVal = (isUnarmored ? (statsMap.dex + statsMap.str) : 0) * (level >= 13 ? 2 : 1);
                builder.addStatDisplay(isUnarmored ? acVal : '--', 'Armor', isUnarmored ? 'Iron Defense' : 'Armored', { borderRight: true });
                builder.addRollDisplay(`1d4+${statsMap.str}`, 'Swift Fists', `1d4+${statsMap.str}${derived.swiftBonus ? '+' + derived.swiftBonus : ''}`, 'Ignores Rushed DIS', { type: 'attack', stat: 'str' });
            },
            statModifiers: [
                { id: "iron_defense", stat: "armorBase", condition: (l, s, state) => (!state.armor || state.armor === "None"), getMod: (stats, state, level) => {
                    let ac = stats.dex + stats.str;
                    if (level >= 13) ac *= 2;
                    return ac;
                }},
                { id: "swift_feet_init", stat: "init", level: 2, condition: (l, s, state) => (!state.armor || state.armor === "None"), getMod: (stats, state, level) => level }
            ],
            rollTriggers: [
                {
                    condition: (label, options) => label === 'Swift Fists' || options.type === 'attack',
                    getMod: (state, options) => (state.level >= 5 && options.stat === 'str') ? state.level : 0
                }
            ],
            resources: [
                createSimpleResource('burstSpeed', 'Bursts', (level, stats) => stats.dex)
            ],
            featuresData: ZephyrClass.FEATURES,
            optionsData: ZephyrClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Zephyr class (Techniques).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            techniques: {
                "Deflecting Palms": { desc: "When you are hit by a ranged weapon attack, you can use your reaction to reduce the damage by 1 Combat Die + DEX. If you reduce it to 0, you catch it." },
                "Flowing Strike": { desc: "After you hit with an attack, you can move up to half your speed without triggering opportunity attacks." },
                "Hurricane Kick": { desc: "2 actions: Select all enemies within 1 space. Each must succeed on a DEX save (DC 10+DEX) or take unarmed damage and be knocked prone." },
                "Pressure Point": { desc: "When you hit a creature with an unarmed strike, you can spend 1 Burst to force them to make a WIL save (DC 10+DEX) or be Stunned until the start of your next turn." },
                "Swift Evasion": { desc: "When you use a reaction to Defend, you gain advantage on the save and can move up to 2 spaces for free." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Zephyr class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or STR', 'INT or WIL', false);

        core[1] = [
            { id: "swift_fists", name: "Swift Fists", desc: "Your unarmed strikes deal 1d4 + STR damage. You can make an unarmed strike as a bonus action. Attacks made this way ignore disadvantage from being Rushed." },
            { id: "unarmored", name: "Iron Defense", desc: "While you are not wearing armor or using a shield, your Armor Class equals your DEX + STR. At Level 13, this value is doubled." }
        ];

        core[2].push({ id: "burst", name: "Swift Feet", desc: (level, subclass, state, derived) => `(<strong>${derived.resourceMaxes.burstSpeed}</strong> uses/encounter) Gain Level bonus to Initiative while unarmored. Bonus Action: Spend a Burst to Dash, Disengage, or Hide.` });
        core[2].push({
            id: "training",
            name: "Martial Training",
            desc: (level) => FeatureGen.createScalingList(
                "Your unarmed strike damage increases as you gain levels.",
                [
                    { level: 1, text: "Damage is 1d4." },
                    { level: 5, text: "Damage is now 1d6." },
                    { level: 9, text: "Damage is now 1d8." },
                    { level: 13, text: "Damage is now 1d10." },
                    { level: 17, text: "Damage is now 1d12." }
                ],
                level
            )
        });

        core[4].push({ id: "technique", name: "Martial Technique", type: "dynamic_choice", collection: "techniques", stateKey: "selectedMartial", milestones: [4, 10, 16], desc: "Choose a Martial Technique as you level up.", getCount: createStandardCount([4, 10, 16]) });

        core[5].push({ id: "empowered", name: "Empowered Strikes", desc: "When you use your action to attack with STR, you deal extra damage equal to your Level." });

        core[20].push({ id: "grandmaster", name: "Grandmaster", desc: "+1 to any 2 stats. When you roll Initiative, regain all spent Bursts. Your unarmed strikes now deal 2d12 damage." });

        subclasses["WayWind"] = {
            3: [{ id: "wind_step", name: "Wind Step", desc: "Your speed increases by +2. You can walk across water and other vertical surfaces as if they were solid ground." }],
            7: [{ id: "zephyr_strike", name: "Zephyr Strike", desc: "When you hit with an unarmed strike, you can spend 1 Burst to deal an additional 2d6 wind damage and push the target 2 spaces." }],
            11: [{ id: "evasion", name: "Perfect Evasion", desc: "When you are forced to make a DEX save to take half damage, you instead take no damage on a success and only half damage on a failure." }],
            15: [{ id: "wind_avatar", name: "Wind Avatar", desc: "You gain a fly speed equal to your speed. While flying, you have resistance to all non-magical damage." }]
        };
        subclasses["WayStone"] = {
            3: [{ id: "stone_skin", name: "Stone Skin", desc: "You have resistance to bludgeoning damage. Your Armor Class increases by +1." }],
            7: [{ id: "mountain_strike", name: "Mountain Strike", desc: "When you hit with an unarmed strike, you can spend 1 Burst to deal an additional 2d8 bludgeoning damage and the target is Restrained until the start of your next turn." }],
            11: [{ id: "juggernaut", name: "Unyielding Juggernaut", desc: "You cannot be moved or knocked prone against your will. You have advantage on all STR saves." }],
            15: [{ id: "stone_avatar", name: "Stone Avatar", desc: "As an action, you can become immune to all damage for 1 round (1/Safe Rest)." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new ZephyrClass();
