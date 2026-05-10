/**
 * Berserker Class
 * Avatar of rage, fury, and raw power.
 * @extends BaseClass
 */
class BerserkerClass extends BaseClass {
    /**
     * Initializes the Berserker class with its core configuration.
     */
    constructor() {
        super({
            name: "Berserker",
            subtitle: "Avatar of rage, fury, and raw power",
            keyStats: ['str', 'dex'],
            saves: { adv: 'str', dis: 'int' },
            proficiencies: { armor: "None", weapons: "All Simple & Martial Weapons" },
            baseHp: 20,
            hpPerLevel: 10,
            hitDie: 12,
            theme: {
                accent: "#ef4444",
                accentDim: "#991b1b",
                bodyBg: "#0a0505",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0a1a 0%, #0a0505 100%)",
                panelBg: "rgba(25, 15, 15, 0.8)",
                border: "rgba(239, 68, 68, 0.25)"
            },
            initialStats: { baseStr: 3, baseDex: 1, baseInt: -1, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Slayer", label: "Path of the Slayer", accent: "#f87171" },
                { value: "Juggernaut", label: "Path of the Juggernaut", accent: "#451a03" }
            ],
            scalingStats: {
                furyMax: { 1: 2, 6: 3, 9: 4, 13: 5, 17: 6 },
                furyText: { 1: "d4", 6: "d6", 9: "d8", 13: "d10", 17: "d12" }
            },
            statModifiers: [
                { id: "berserker_unarmored", stat: "armorBase", condition: (l, s, state) => CLASS_CONFIG.isUnarmored(state), getMod: (stats) => 10 + stats.dex + stats.str },
                { id: "eager_init", stat: "initAdv", condition: (l, s, state) => (state.selectedArsenal || []).includes("Eager for Battle") },
                { id: "mighty_wounds", stat: "woundMax", value: 4, condition: (l, s, state) => (state.selectedArsenal || []).includes("Mighty Endurance") }
            ],
            rollTriggers: [
                {
                    condition: (label, options) => options.isFury,
                    getMod: (state, options) => {
                        const arsenal = state.selectedArsenal || [];
                        if (arsenal.includes("Cruel Critical") && options.isCrit) {
                            return 10;
                        }
                        return 0;
                    }
                }
            ],
            resources: [],
            featuresData: BerserkerClass.FEATURES,
            optionsData: BerserkerClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Berserker class (Savage Arsenal).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            savageArsenal: {
                "Bloodthirst": { desc: "When you hit with a melee weapon attack, you regain HP equal to your STR modifier (minimum 1)." },
                "Cruel Critical": { desc: "Your Fury dice deal an additional +10 damage on a critical hit." },
                "Eager for Battle": { desc: "You have advantage on Initiative rolls." },
                "Mighty Endurance": { desc: "Your maximum Wounds increases by +4." },
                "Whirlwind Strike": { desc: "Action: Make a melee weapon attack against every creature within 1 space of you." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Berserker class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or DEX', 'INT or WIL', false);

        core[1] = [
            { id: "rage", name: "Berserker Rage", desc: "Action: Enter a rage for 1 minute. While raging, you have resistance to bludgeoning, piercing, and slashing damage. You cannot cast spells or concentrate." },
            { id: "fury", name: "Fury Dice", desc: (level, subclass, state, derived) => `(<strong>${derived.furyMax}</strong> ${derived.furyText}) While raging, you gain a Fury die whenever you hit with a melee attack or take damage. You can expend all Fury dice on a hit to deal extra damage.` }
        ];

        core[2].push({ id: "unarmored", name: "Unarmored Defense", desc: "While you are not wearing armor, your Armor Class equals 10 + your DEX + your STR modifier." });
        
        core[4].push({ id: "arsenal", name: "Savage Arsenal", type: "dynamic_choice", collection: "savageArsenal", stateKey: "selectedArsenal", milestones: [4, 10, 16], desc: "Choose a Savage Arsenal ability as you level up.", getCount: createStandardCount([4, 10, 16]) });

        core[5].push({ id: "extra_attack", name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the attack action on your turn." });

        core[18] = [{ id: "indomitable", name: "Indomitable Will", desc: "While raging, you have advantage on all WIL saves and cannot be Charmed or Frightened." }];
        core[20].push({ id: "avatar", name: "Avatar of Slaughter", desc: "+1 to any 2 stats. When you roll Initiative, you immediately gain your maximum number of Fury dice." });

        subclasses["Slayer"] = {
            3: [{ id: "execution", name: "Execute", desc: "When you hit a creature with fewer than half its maximum HP, you deal an extra 1d10 damage." }],
            7: [{ id: "ferocity", name: "Feral Instinct", desc: "You have advantage on all DEX saves while raging." }],
            11: [{ id: "bloodlust", name: "Bloodlust", desc: "Whenever you drop a creature to 0 HP, you can move half your speed and make one melee attack for free." }],
            15: [{ id: "death_blow", name: "Death Blow", desc: "When you hit a creature with your Fury dice, and the total damage exceeds its remaining HP, the creature is instantly decapitated or destroyed." }]
        };
        subclasses["Juggernaut"] = {
            3: [{ id: "heavy", name: "Heavy Hitter", desc: "You ignore the 'Heavy' property of weapons. Your weapon attacks push creatures 1 space on hit." }],
            7: [{ id: "shield", name: "Shield of Rage", desc: "While raging, you gain temporary HP equal to your STR modifier at the start of each of your turns." }],
            11: [{ id: "immovable", name: "Unyielding", desc: "You cannot be moved or knocked prone against your will while raging." }],
            15: [{ id: "siege", name: "Siege Monster", desc: "You deal double damage to objects and structures. Your weapon attacks ignore all armor on a roll of 18-20." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Fury Dice pool and total damage display for the Berserker's mechanic panel.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = super.getMechanicPanelHTML(level, subclass, state, derived);
        const totalFury = (state.furyDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);

        builder.addDicePool(
            state.furyDice,
            'Fury Dice',
            derived.furyText,
            'furyDice',
            derived.furyMax,
            { static: true }
        );

        builder.addStatDisplay(totalFury, 'Total Damage', 'Gain on hit<br>or dmg taken.');

        return builder.build();
    }
}

const CLASS_CONFIG = new BerserkerClass();
