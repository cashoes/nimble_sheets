/**
 * Cheat Class
 * Master of stealth, dirty fighting, & rules.
 * @extends BaseClass
 */
class CheatClass extends BaseClass {
    /**
     * Initializes the Cheat class with its core configuration.
     */
    constructor() {
        super({
            name: "Cheat",
            subtitle: "Master of stealth, dirty fighting, & rules",
            keyStats: ['dex', 'int'],
            saves: { adv: 'dex', dis: 'str' },
            proficiencies: { armor: "Mail", weapons: "Blades, Bows, Crossbows" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#94a3b8",
                accentDim: "#475569",
                bodyBg: "#0a0c12",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(148, 163, 184, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0f172a 0%, #0a0c12 100%)",
                panelBg: "rgba(15, 23, 42, 0.8)",
                border: "rgba(148, 163, 184, 0.25)"
            },
            initialStats: { baseStr: -1, baseDex: 3, baseInt: 2, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Assassin", label: "Assassin", accent: "#be123c" },
                { value: "Thief", label: "Thief", accent: "#fbbf24" }
            ],
            scalingStats: {
                saDice: { 1: "None", 3: "1d8", 7: "2d8", 9: "2d10", 11: "2d12", 15: "2d20", 17: "3d20" }
            },
            statModifiers: [
                { id: "misdirection_armor", stat: "armor", getMod: (stats, state) => {
                    const hasMisdirection = (state.selectedUnderhanded || []).includes("Misdirection");
                    if (!hasMisdirection) return 0;
                    return CLASS_CONFIG.isHeavyArmored(state) ? 0 : stats.int;
                }}
            ],
            resources: [],
            featuresData: CheatClass.FEATURES,
            optionsData: CheatClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Cheat class (Underhanded Abilities).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            underhandedAbilities: {
                "Fast Hands": { desc: "Bonus Action: Use an item, make a Sleight of Hand check, or use your thieves’ tools to disarm a trap or open a lock." },
                "Misdirection": { desc: "While you are not wearing Heavy Armor, add your INT to your Armor Class." },
                "Slippery Mind": { desc: "You have advantage on all WIL saves." },
                "Uncanny Dodge": { desc: "When you are hit by an attack, you can use your reaction to halve the damage." },
                "Vanish": { desc: "Bonus Action: Hide, even if you are being observed." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Cheat class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or INT', 'STR or WIL', false);

        core[1] = [
            { id: "sneak", name: "Sneak Attack", desc: (level, subclass, state, derived) => `(<strong>${derived.saDice}</strong>) Once per turn, you can deal extra damage to a creature you hit if you have advantage on the attack roll.` },
            { id: "expertise", name: "Expertise", desc: "Choose two skills you are proficient in. Your proficiency bonus is doubled for any check you make that uses either of those skills." }
        ];
        core[2].push({ id: "cunning", name: "Cunning Action", desc: "Bonus Action: Dash, Disengage, or Hide." });

        core[3].push({ id: "subclass_feat", name: "Cheat’s Path", desc: "Your specialized training grants you unique ways to bend the rules of combat." });
        core[4].push({ id: "underhanded", name: "Underhanded Ability", type: "dynamic_choice", collection: "underhandedAbilities", stateKey: "selectedUnderhanded", milestones: [4, 10, 16], desc: "Choose an Underhanded Ability as you level up.", getCount: createStandardCount([4, 10, 16]) });

        core[18] = [{ id: "elusive", name: "Elusive", desc: "No attack roll has advantage against you while you aren’t incapacitated." }];
        core[20].push({ id: "master", name: "Master of Shadows", desc: "+1 to any 2 stats. When you roll for Sneak Attack and roll a 1, you can treat that die as having rolled its maximum value." });

        subclasses["Assassin"] = {
            3: [{ id: "assassinate", name: "Assassinate", desc: "You have advantage on attack rolls against any creature that hasn't taken a turn in combat yet. Any hit you score against a surprised creature is a critical hit." }],
            7: [{ id: "infiltration", name: "Infiltration Expertise", desc: "You can perfectly mimic the speech, handwriting, and mannerisms of another person as long as you have studied them for at least 1 hour." }],
            11: [{ id: "death_strike", name: "Death Strike", desc: "When you hit a creature that is surprised, it must make a CON save (DC 10+DEX). On a failure, double the damage of your attack." }],
            15: [{ id: "poisoner", name: "Poison Master", desc: "You are immune to poison damage and the poisoned condition. Your attacks deal an extra 1d10 poison damage." }]
        };
        subclasses["Thief"] = {
            3: [{ id: "climb", name: "Second-Story Work", desc: "Climbing no longer costs you extra movement. Your jump distance increases by your DEX modifier." }],
            7: [{ id: "supreme", name: "Supreme Sneak", desc: "You have advantage on Hide checks if you move no more than half your speed on the same turn." }],
            11: [{ id: "use_item", name: "Use Magic Device", desc: "You ignore all class, race, and level requirements on the use of magic items." }],
            15: [{ id: "reflexes", name: "Thief’s Reflexes", desc: "You can take two turns during the first round of any combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Sneak Attack and Opportunist displays for the Cheat's mechanic panel.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = super.getMechanicPanelHTML(level, subclass, state, derived);

        builder.addRollDisplay(derived.saDice, 'Sneak Attack', derived.saDice, '1/turn | Adv Targets', { borderRight: true });

        if (level >= 2) {
            builder.addStatDisplay('10+', 'Cunning', 'Init Floor. Free Move/Hide.');
        }

        return builder.build();
    }
}

const CLASS_CONFIG = new CheatClass();
