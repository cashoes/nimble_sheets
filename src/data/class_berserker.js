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
            subtitle: "An unstoppable force of wrath and ruin",
            keyStats: ['str', 'dex'],
            saves: { adv: 'str', dis: 'int' },
            proficiencies: { armor: "None", weapons: "all STR weapons" },
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
                { value: "Mountainheart", label: "Path of the Mountainheart", accent: "#451a03" },
                { value: "RedMist", label: "Path of the Red Mist", accent: "#f87171" }
            ],
            scalingStats: {
                furyMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    return Math.max(statsMap.str, statsMap.dex);
                },
                furyGain: { 1: 1, 5: 2 },
                furyFaces: { 1: 4, 6: 6, 9: 8, 13: 10, 17: 12 },
                furyText: (level, subclass, state, derived) => `d${derived.furyFaces}`
            },
            statModifiers: [
                { id: "eager_init", stat: "initAdv", condition: (l, s, state) => (state.selectedArsenal || []).includes("Eager for Battle") },
                { id: "mighty_wounds", stat: "woundMax", value: 4, condition: (l, s, state) => (state.selectedArsenal || []).includes("Mighty Endurance") },
                { id: "onslaught_speed", stat: "speed", value: 2, condition: (l, s, state) => s === "RedMist" && l >= 15 && (state.activeConditions || []).includes('raging') }
            ],
            featuresData: BerserkerClass.FEATURES,
            optionsData: BerserkerClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Berserker class (Savage Arsenal).
     */
    static get OPTIONS() {
        return {
            savageArsenal: {
                "Death Blow": { desc: "After you deal damage from a crit, you may expend any number of Fury Dice. Sum the dice and deal double that amount of damage." },
                "Deathless Rage": { desc: "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action." },
                "Eager for Battle": { desc: "Gain advantage on Initiative. Move 2×DEX spaces for free on your first turn each encounter." },
                "Into the Fray": { desc: "Action: Leap up to 2×DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, make an attack against 1 of them for free." },
                "Mighty Endurance": { desc: "You can now survive an additional 4 Wounds before death." },
                "MORE BLOOD!": { desc: "Whenever an enemy crits you, gain 1 Fury Die." },
                "Rampage": { desc: "(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again." },
                "Swift Fury": { desc: "Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain." },
                "Thunderous Steps": { desc: "After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop." },
                "Unstoppable Force": { desc: "While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3)." },
                "Whirlwind": { desc: "2 actions: Attack ALL targets within your melee weapon’s reach." },
                "You’re Next!": { desc: "Action: While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Berserker class.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or DEX', 'INT or WIL', false);

        core[1] = [
            {
                id: "rage",
                name: "Rage",
                desc: (level, subclass, state, derived) => {
                    const gain = derived.furyGain || 1;
                    return `(1/turn) Action: Roll ${gain} Fury Die (1d${derived.furyFaces}) and set it aside. Add it to every STR attack you make. You can have a max of KEY (<strong>${derived.furyMax}</strong>) Fury Dice; they are lost when your Rage ends.`;
                }
            },
            { id: "that_all", name: "That all you got?!", desc: "When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR+DEX for each die spent." }
        ];
        core[2] = [
            { id: "intensifying", name: "Intensifying Fury", desc: "If you are Raging at the beginning of your turn, roll 1 Fury Die for free." },
            { id: "ancients", name: "One with the Ancients", desc: "([[uAncients]] 1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path." }
        ];
        core[3].push({ id: "bloodlust", name: "Bloodlust", desc: "Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free." });
        core[4].push({ id: "enduring", name: "Enduring Rage", desc: "While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks." });
        core[4].push({ id: "arsenal", name: "Savage Arsenal", type: "dynamic_choice", collection: "savageArsenal", stateKey: "selectedArsenal", milestones: [4, 6, 8, 10, 12, 14, 16], desc: "Choose a Savage Arsenal ability.", getCount: createStandardCount([4, 6, 8, 10, 12, 14, 16]) });

        core[18] = [{ id: "deep_rage", name: "DEEP RAGE", desc: "Dropping to 0 HP does not cause your Rage to end." }];
        core[20].push({ id: "boundless", name: "BOUNDLESS RAGE", desc: "+1 to any 2 of your stats. Anytime you roll less than 6 on a Fury Die, change it to 6 instead." });

        subclasses["Mountainheart"] = {
            3: [
                { id: "stone_resilience", name: "Stone’s Resilience", desc: "Whenever you expend Fury Dice to reduce incoming damage, add the value of the die to the amount reduced." },
                { id: "tenacity", name: "Mountainous Tenacity", desc: "Whenever you expend your Hit Dice to recover HP, for every 10 HP you would recover, you may heal 1 Wound instead." }
            ],
            7: [{ id: "unbreakable", name: "Unbreakable", desc: "([[uUnbreakable]] 1/encounter) While Raging, if you would suffer your last Wound or other negative condition of your choice, you don’t." }],
            11: [{ id: "titan", name: "Titan’s Fury", desc: "After you miss an attack or are crit by an enemy, Rage for free." }],
            15: [{ id: "mountain_endurance", name: "Mountain’s Endurance", desc: "While Dying, if an attack against you would be a crit, the attack is rerolled instead (when-crit abilities, such as Titan’s Fury, still trigger)." }]
        };
        subclasses["RedMist"] = {
            3: [
                { id: "blood_frenzy", name: "Blood Frenzy", desc: "(1/turn) While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum." },
                { id: "savage_awareness", name: "Savage Awareness", desc: "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the Blinded condition and can see through darkness and Invisibility within that Range." }
            ],
            7: [{ id: "unstoppable_brutality", name: "Unstoppable Brutality", desc: "While Raging, you may gain 1 Wound to reroll any attack or save." }],
            11: [{ id: "opp_frenzy", name: "Opportunistic Frenzy", desc: "While Raging, you can make opportunity attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon’s reach." }],
            15: [{ id: "onslaught", name: "Onslaught", desc: "While Raging, gain +2 speed. (1/round) you may move for free." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Fury Dice pool for the Berserker's mechanic panel.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const totalFury = (state.furyDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0);

        builder.addDicePool(
            state.furyDice || [],
            'Fury',
            derived.furyText,
            'furyDice',
            derived.furyMax,
            { static: true }
        );

        builder.addStatDisplay(totalFury, 'Total Damage', 'Gain on hit<br>or dmg taken.');

        return builder.build();
    }

    getExtraConditions(level, subclass, state, derived) {
        if (level >= 1) {
            return [
                { id: 'raging', name: 'RAGING!!!', type: 'rage', desc: 'You are in a state of primal fury. Fury Dice are added to your STR attacks.' }
            ];
        }
        return [];
    }
}

const CLASS_CONFIG = new BerserkerClass();
