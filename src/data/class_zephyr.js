/**
 * Zephyr Class Configuration
 * A disciplined martial artist with swift hands.
 * @extends BaseClass
 */
class ZephyrClass extends BaseClass {
    /**
     * Initializes the Zephyr class with its core configuration.
     */
    constructor() {
        super({
            name: "Zephyr",
            subtitle: "Disciplined martial artist with swift hands",
            keyStats: ['dex', 'str'],
            saves: { adv: 'dex', dis: 'int' },
            proficiencies: { armor: "None", weapons: "Melee" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#06b6d4",
                accentDim: "#0891b2",
                bodyBg: "#05070a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0a101a 0%, #050809 100%)",
                panelBg: "rgba(15, 20, 35, 0.8)",
                border: "rgba(6, 182, 212, 0.25)"
            },
            initialStats: { baseStr: 1, baseDex: 3, baseInt: -1, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { 
                    value: "WayPain", 
                    label: "Way of Pain", 
                    accent: "#7f1d1d",
                    config: {
                        statModifiers: [
                            { id: "pain_saves", stat: "allSaveAdv", level: 11, condition: (l, s, state, maxHP) => CLASS_CONFIG.isBloodied(state, maxHP) }
                        ]
                    }
                },
                { value: "WayFlame", label: "Way of the Burning Flame", accent: "#ea580c" }
            ],
            scalingStats: {
                unyieldingMax: (level) => {
                    if (level >= 17) return 3;
                    if (level >= 10) return 2;
                    if (level >= 4) return 1;
                    return 0;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                const isUnarmored = this.isUnarmored(state);
                let acVal = isUnarmored ? (statsMap.dex + statsMap.str) : 0;
                if (level >= 13) acVal *= 2;
                builder.addStatDisplay(isUnarmored ? acVal : '--', 'Armor', 'Iron Defense', { borderRight: true });
                
                const rbBonus = level >= 5 ? level : 0;
                const totalBonus = statsMap.str + rbBonus;
                const notation = `1d4+${totalBonus}`;
                const subtext = rbBonus > 0 ? `Ignores Rushed DIS | +${rbBonus} Reverb` : 'Ignores Rushed DIS';
                builder.addRollDisplay(notation, 'Swift Fists', notation, subtext, { type: 'attack', stat: 'str' });
            },
            onInitiative: (level, subclass, state, derived) => {
                const statsMap = getStatsMap(state);
                const max = statsMap.dex + (level >= 20 ? 1 : 0);
                state.resourceValues.bursts = max;
                
                const uMax = level >= 17 ? 3 : (level >= 10 ? 2 : (level >= 4 ? 1 : 0));
                if (state.resourceValues.unyielding === undefined) {
                    state.resourceValues.unyielding = uMax;
                }
            },
            statModifiers: [
                { id: "iron_defense", stat: "armorBase", condition: (l, s, state) => CLASS_CONFIG.isUnarmored(state), getMod: (stats, state, level) => {
                    let ac = stats.dex + stats.str;
                    if (level >= 13) ac *= 2;
                    return ac;
                }},
                { id: "swift_feet_speed", stat: "speed", level: 2, value: 2, condition: (l, s, state) => CLASS_CONFIG.isUnarmored(state) },
                { id: "swift_feet_speed_2", stat: "speed", level: 9, value: 2, condition: (l, s, state) => CLASS_CONFIG.isUnarmored(state) },
                { id: "swift_feet_init", stat: "init", level: 2, getMod: (stats, state, level) => level, condition: (l, s, state) => CLASS_CONFIG.isUnarmored(state) },
                { id: "windborne_actions", stat: "maxActions", level: 20, value: 1 }
            ],
            resources: [
                createSimpleResource('bursts', 'Bursts', (l, stats) => stats.dex + (l >= 20 ? 1 : 0), { visible: false, reset: 'Encounter' }),
                createSimpleResource('unyielding', 'Unyielding', (l, stats, state, sub, derived) => derived.unyieldingMax, { visible: false, reset: 'Encounter' })
            ],
            featuresData: ZephyrClass.FEATURES,
            optionsData: ZephyrClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            abilities: {
                "Airshift": { desc: "You cannot be Grappled while conscious. While moving, you may travel across all terrain as normal ground, ignoring all ill effects." },
                "Blur": { desc: "([[uBlur]] 1/encounter) When you Defend, you may first move up to half your speed away, taking no damage if you are now out of range or have Full Cover." },
                "Bodily Discipline": { desc: "You may spend 1 action to end any non-Wound condition on yourself." },
                "Enduring Soul": { desc: "Each time you roll Initiative, gain Hit Dice equal to the actions you get on your first turn. These Hit Dice expire at the end of combat if unused." },
                "I Jump On His Back!": { desc: "While moving with your Windstep, if you move into the space of a creature your size or larger, you may jump onto its back. While on a creature this way, gain advantage on melee attacks against it, and any damage you avoid is dealt to it instead." },
                "Kinetic Barrage": { desc: "Whenever you miss an attack, gain a cumulative +STR bonus to all damage you do for the rest of this encounter." },
                "Mighty Soul": { desc: "You cannot be moved against your will. Whenever you would fail a saving throw, you may gain a Wound in order to add your STR to the result you rolled. You may repeat this any number of times." },
                "Quickstrike": { desc: "When you Interpose, you may first make an unarmed strike against the enemy for free." },
                "Use Momentum": { desc: "Whenever you avoid all of the damage of a melee attack, you may swap places with the attacker and then choose another target that is now within the attack’s reach, and they are hit instead." },
                "Vital Rejuvenation": { desc: "When you receive healing for the first time on a turn, you may heal another target within 6 spaces HP equal to your STR." },
                "Windstrider": { desc: "If you move through the space of a willing creature while using Windstep, they can move with you and choose any space adjacent to your path of movement to end in." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or STR', 'INT or WIL', true, [1, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        core[1] = [
            { id: "iron_defense", name: "Iron Defense", desc: "Your armor equals DEX+STR as long as you are unarmored." },
            { id: "swift_fists", name: "Swift Fists", desc: "Your unarmed strikes are not subject to disadvantage imposed by Rushed Attacks, and their damage is 1d4+STR." }
        ];

        core[2] = [
            { id: "swift_feet", name: "Swift Feet", desc: "While unarmored, gain +2 speed and +LVL Initiative." },
            { id: "bursts", name: "Burst of Speed", resourceId: "bursts", desc: "When you roll Initiative, gain DEX Bursts of Speed. (1/turn) You may spend 1 Burst of Speed for a free maneuver: <ul><li>Slipstream: Defend, and the attack misses.</li><li>Whirling Defense: Defend and apply your armor to every attack this round.</li><li>Swiftstrike: Attack on your turn, and ignore disadvantage from Rushed Attacks.</li><li>Windstep: Move on your turn, ignoring difficult terrain.</li></ul>" }
        ];

        core[3] = [
            { id: "subclass", name: "Subclass", desc: "Choose a Zephyr subclass." },
            { id: "kinetic", name: "Kinetic Momentum", desc: "Whenever you gain a Wound, gain a Burst of Speed." },
            { id: "ethereal", name: "Ethereal Projection", desc: "([[uEthereal]] 1/day) By meditating for at least 10 minutes, you can project an ethereal version of yourself up to 30 ft. away." }
        ];

        core[4] = [
            { id: "resolve", name: "Unyielding Resolve", resourceId: "unyielding", desc: "Ignore the first Wound you would suffer each encounter." },
            { id: "martial", name: "Martial Master", type: "dynamic_choice", collection: "abilities", stateKey: "selectedMartial", milestones: [4, 6, 8, 10, 12, 14, 16, 18], desc: "Choose a Martial Arts ability.", getCount: FeatureGen.createStandardCount([4, 6, 8, 10, 12, 14, 16, 18]) }
        ];

        core[5] = [{ id: "reverb", name: "Reverberating Strikes", desc: "Add LVL bludgeoning damage to all of your melee attacks." }];

        core[6].push({ id: "infuse", name: "Infuse Strength", desc: "Action: Make an unarmed strike against an ally and infuse them with strength instead of harming them. Expend Hit Dice to heal them (roll and add STR)." });

        core[9].push({ id: "swift_feet2", name: "Swift Feet (2)", desc: "Gain an additional +2 speed as long as you are unarmored." });

        core[13] = [{ id: "iron_defense2", name: "Iron Defense (2)", desc: "Your armor is doubled while unarmored." }];

        core[20].push({ id: "windborne", name: "Windborne", desc: "+1 to any 2 of your stats. +1 additional burst of speed when you roll Initiative. Permanently gain 1 action (while Dying, you have a max of 2 actions)." });

        subclasses["WayPain"] = {
            3: [{ id: "bring_pain", name: "Bring the Pain", desc: "([[uPain]] 1/round) You may turn any melee attack against you into a crit. Whenever you are crit, reduce the damage by half. The attacker takes the same amount of damage you took (ignoring armor). You may suffer 1 Wound to double the damage the enemy takes." }],
            7: [{ id: "share_pain", name: "Share My Pain", desc: "Your Swiftstrike can also target a 2nd creature within Reach 2." }],
            11: [{ id: "sharpens", name: "Pain Sharpens the Mind", desc: "While you are Bloodied, gain advantage on the first attack you make each turn, and on all saves." }],
            15: [{ id: "echoed", name: "Echoed Agony", desc: "Your Swiftstrike can also target a 3rd creature within Reach 4." }]
        };

        subclasses["WayFlame"] = {
            3: [{ id: "exploding", name: "Exploding Soul", desc: "([[uExploding]] 1/round) On your turn, you may suffer a Wound. Whenever you gain a Wound, deal STR+Wounds damage to any creatures you choose within 2 spaces (ignoring armor) and give them the Smoldering condition." }],
            7: [{ id: "blazing", name: "Blazing Speed", desc: "Gain +2 speed while using Windstep. After you cease movement with Windstep, enemies you passed through take STR+DEX fire damage. You may have Smoldering enemies take double, ending the condition." }],
            11: [{ id: "chain", name: "Chain Reaction", desc: "(1/turn) When you crit, deal fire damage equal to your STR+Wounds to creatures of your choice within 2 spaces of your target. Repeat any number of times, targeting creatures not yet damaged by this effect within 2 spaces of any already damaged." }],
            15: [{ id: "burning", name: "Burning Soul", desc: "Double any fire damage you deal." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new ZephyrClass();
