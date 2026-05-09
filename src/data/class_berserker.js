class BerserkerClass extends BaseClass {
    constructor() {
        super({
            name: "Berserker",
            subtitle: "Avatar of rage, fury, and raw power",
            keyStats: ['str', 'dex'],
            saves: { adv: 'str', dis: 'int' },
            proficiencies: { armor: "None", weapons: "all STR weapons" },
            baseHp: 20,
            hpPerLevel: 8,
            hitDie: 12,
            theme: {
                accent: "#ef4444",
                accentDim: "#991b1b",
                bodyBg: "#0a0505",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.15) 0%, transparent 100%), linear-gradient(180deg, #1a0f1f 0%, #0a0505 100%)",
                panelBg: "rgba(45, 20, 20, 0.7)",
                border: "rgba(239, 68, 68, 0.3)"
            },
            initialStats: { baseStr: 3, baseDex: 1, baseInt: -1, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "RedMist", label: "Path of the Red Mist", accent: "#fb923c" },
                { value: "Mountainheart", label: "Path of the Mountainheart", accent: "#4b5563" }
            ],
            scalingStats: {
                furyFaces: { 1: 4, 6: 6, 9: 8, 13: 10, 17: 12 },
                furyText: { 1: "d4", 6: "d6", 9: "d8", 13: "d10", 17: "d12" }
            },
            rollTriggers: [
                {
                    condition: (label, options) => (options.type === 'attack' || /attack|⚔️/i.test(label)) && options.stat === 'str',
                    getMod: (state) => (state.furyDice || []).reduce((sum, d) => sum + (d ? d.total : 0), 0)
                }
            ],
            featuresData: BerserkerClass.FEATURES,
            optionsData: BerserkerClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            arsenal: {
                "Death Blow": { desc: "After you deal damage from a crit, you may expend any number of Fury Dice. Sum the dice and deal double that amount of damage." },
                "Deathless Rage": { desc: "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action." },
                "Eager for Battle": { desc: "Gain advantage on Initiative. Move 2×DEX spaces for free on your first turn each encounter." },
                "Into the Fray": { desc: "Action: Leap up to 2×DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, make an attack against 1 of them for free." },
                "Mighty Endurance": { desc: "You can now survive an additional 4 Wounds before death." },
                "MORE BLOOD!": { desc: "Whenever an enemy crits you, gain 1 Fury Die." },
                "Rampage": { desc: "(1/ turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again." },
                "Swift Fury": { desc: "Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain." },
                "Thunderous Steps": { desc: "After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop." },
                "Unstoppable Force": { desc: "While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3)." },
                "Whirlwind": { desc: "2 actions: Attack ALL targets within your melee weapon’s reach." },
                "You’re Next!": { desc: "Action: While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or DEX', 'WIL or INT', false);

        core[1] = [
            { id: "rage", name: "Rage", context: { type: 'attack', stat: 'str' }, desc: "(1/turn) Action: Roll a Fury Die (1d4) and set it aside. Add it to every STR attack you make. You can have a max of KEY Fury Dice; they are lost when your Rage ends." },
            { id: "got", name: "That all you got?!", desc: "When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR+DEX for each die spent." }
        ];
        core[2] = [
            {
                id: "intensifying", name: "Intensifying Fury", milestones: [2, 6, 9, 13, 17], desc: (level) => FeatureGen.createScalingList(
                    "If you are Raging at the beginning of your turn, roll 1 Fury Die for free.",
                    [
                        { level: 6, text: "Your Fury Dice are now d6s." },
                        { level: 9, text: "Your Fury Dice are now d8s." },
                        { level: 13, text: "Your Fury Dice are now d10s." },
                        { level: 17, text: "Your Fury Dice are now d12s." }
                    ],
                    level
                )
            },
            { id: "one_ancients", name: "One with the Ancients", desc: "(1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path." }
        ];
        core[3].push({ id: "bloodlust", name: "Bloodlust", desc: "Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free." });

        core[4].push({ id: "enduring_rage", name: "Enduring Rage", desc: "While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks." });
        core[4].push({ id: "arsenal", name: "Savage Arsenal", type: "dynamic_choice", collection: "arsenal", stateKey: "selectedArsenal", milestones: [4, 6, 8, 10, 12, 14, 16], desc: "Choose abilities from the Savage Arsenal as you level up.", getCount: FeatureGen.createStandardCount([4, 6, 8, 10, 12, 14, 16]) });

        core[18] = [{ id: "deep_rage", name: "DEEP RAGE", desc: "Dropping to 0 HP does not cause your Rage to end." }];
        core[20].push({ id: "boundless_rage", name: "BOUNDLESS RAGE", desc: "+1 to any 2 of your stats. Anytime you roll less than 6 on a Fury Die, change it to 6 instead." });

        subclasses["Mountainheart"] = {
            3: [{ id: "stones_resilience", name: "Stone’s Resilience", desc: "Whenever you expend Fury Dice to reduce incoming damage, add the value of the die to the amount reduced." }, { id: "mountainous_tenacity", name: "Mountainous Tenacity", desc: "Whenever you expend your Hit Dice to recover HP, for every 10 HP you would recover, you may heal 1 Wound instead." }],
            7: [{ id: "unbreakable", name: "Unbreakable", desc: "(1/encounter) While Raging, if you would suffer your last Wound or other negative condition of your choice, you don’t." }],
            11: [{ id: "titans_fury", name: "Titan’s Fury", desc: "After you miss an attack or are crit by an enemy, Rage for free." }],
            15: [{ id: "mountains_endurance", name: "Mountain’s Endurance", desc: "While Dying, if an attack against you would be a crit, the attack is rerolled instead (when-crit abilities, such as Titan’s Fury, still trigger)." }]
        };
        subclasses["RedMist"] = {
            3: [{ id: "blood_frenzy", name: "Blood Frenzy", desc: "(1/turn) While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum." }, { id: "savage_awareness", name: "Savage Awareness", desc: "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the Blinded condition and can see through darkness and Invisibility within that Range." }],
            7: [{ id: "unstoppable_brutality", name: "Unstoppable Brutality", desc: "While Raging, you may gain 1 Wound to reroll any attack or save." }],
            11: [{ id: "opportunistic_frenzy", name: "Opportunistic Frenzy", desc: "While Raging, you can make opportunity attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon’s reach." }],
            15: [{ id: "onslaught", name: "Onslaught", desc: "While Raging, gain +2 speed. (1/round) you may move for free." }]
        };

        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        const stats = super.getDerivedStats(level, subclass, state);
        const statsMap = getStatsMap(state);
        stats.furyMax = Math.max(statsMap.str, statsMap.dex);
        return stats;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        let totalFury = 0;
        (state.furyDice || []).forEach(d => { if (d) totalFury += d.total; });

        builder.addDicePool(
            state.furyDice || [],
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
