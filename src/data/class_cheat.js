/**
 * The Cheat Class
 * A sneaky, backstabbing, dirty-fighting rogue.
 * @extends BaseClass
 */
class CheatClass extends BaseClass {
    /**
     * Initializes the Cheat class with its core configuration.
     */
    constructor() {
        super({
            name: "The Cheat",
            subtitle: "A sneaky, backstabbing, dirty-fighting rogue",
            keyStats: ['dex', 'int'],
            saves: { adv: 'dex', dis: 'wil' },
            proficiencies: { armor: "Leather Armor", weapons: "DEX Weapons" },
            baseHp: 10,
            hpPerLevel: 6,
            hitDie: 6,
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
                { value: "SilentBlade", label: "Tools of the Silent Blade", accent: "#be123c" },
                { value: "Scoundrel", label: "Tools of the Scoundrel", accent: "#fbbf24" }
            ],
            scalingStats: {
                saDice: { 1: "1d6", 3: "1d8", 7: "2d8", 9: "2d10", 11: "2d12", 15: "2d20", 17: "3d20" }
            },
            statModifiers: [
                {
                    id: "misdirection_armor", stat: "armor", getMod: (stats, state) => {
                        const hasMisdirection = (state.selectedUnderhanded || []).includes("Misdirection");
                        if (!hasMisdirection) return 0;
                        return stats.int;
                    }
                },
                { id: "onslaught_speed", stat: "speed", value: 2, condition: (l, s, state) => s === "SilentBlade" && l >= 11 }
            ],
            featuresData: CheatClass.FEATURES,
            optionsData: CheatClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Cheat class (Underhanded Abilities).
     */
    static get OPTIONS() {
        return {
            underhanded: {
                "'Creative' Accounting": { desc: "Steal up to INT actions from your next turn (Gain up to INT actions now. The next time you would gain actions, subtract the number stolen). You cannot use this 2 turns in a row." },
                "Exploit Weakness": { desc: "Action: Make a contested INT check against an enemy. If you win, you can use Vicious Opportunist against them, even if they are not Distracted. This lasts for 1 minute or until you use this ability against another target." },
                "Feinting Attack": { desc: "If you miss for the 2nd time in a single round, you may change the primary die roll to any result instead." },
                "How’d YOU get here?!": { desc: "2 actions: “Teleport” up to 4 spaces away, adjacent to a Distracted target, and make a melee attack against them. If you crit, you may \"teleport\" again." },
                "I’m Outta Here!": { desc: "When an ally within 4 spaces is crit, you may turn invisible until the end of your next turn and then move up to half your speed for free." },
                "Misdirection": { desc: "Gain INT armor. Whenever you Defend, you may halve the damage instead." },
                "Steal Tempo": { desc: "When you land a critical hit for the second time on a turn, your target loses 1 action and you gain 1 action." },
                "Sunder Armor (Medium)": { desc: "Action: When you crit an enemy with medium armor, sunder their armor. Until the start of your next turn, ALL melee attacks against that target ignore its armor." },
                "Sunder Armor (Heavy)": { desc: "Req. Sunder Armor (Medium). Your Sunder Armor ability now also applies to enemies wearing heavy armor." },
                "Trickshot": { desc: "When you throw a dagger, it returns back to your hand at the end of your turn. On a hit, it ricochets to another creature within 2 spaces, dealing half as much damage to them." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Cheat class.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or INT', 'STR or WIL', false, null, [2, 2, 4, 6, 8, 10, 13, 17, 19, 21]);

        core[1] = [
            { id: "sneak_attack", name: "Sneak Attack", desc: (level, subclass, state, derived) => `(1/turn) When you crit, deal <strong>+${derived.saDice}</strong> damage.` },
            { id: "vicious_opportunist", name: "Vicious Opportunist", desc: "When you hit a Distracted target with a melee attack, you may change the Primary Die roll to whatever you like (changing it to the max value counts as a crit). <br><em>Distracted: A target is Distracted if it is adjacent to or Taunted by an ally, or if it cannot see you.</em>" }
        ];

        core[2] = [
            { id: "cheat", name: "Cheat", desc: "Gain the following abilities:<ul><li>(1/round) You may either Move or Hide for free.</li><li>([[uCheatDay]] 1/day) You may change any skill check to 10+INT.</li><li>If you roll less than 10 on Initiative, you may change it to 10 instead.</li><li>You may gain advantage on skill checks while playing games/competitions/wagers.</li></ul>" }
        ];

        core[3] = [
            { id: "subclass", name: "Subclass", level: 3, minor: true, desc: "Choose a Cheat subclass." },
            { id: "thieves_cant", name: "Thieves’ Cant", desc: "You learn the secret language of rogues and scoundrels." }
        ];

        core[4].push({
            id: "underhanded",
            name: "Underhanded Ability",
            type: "dynamic_choice",
            collection: "underhanded",
            stateKey: "selectedUnderhanded",
            milestones: [4, 6, 8, 10, 12, 14, 16, 18],
            desc: "Choose an Underhanded Ability.",
            getCount: createStandardCount([4, 6, 8, 10, 12, 14, 16, 18])
        });

        core[5] = [
            { id: "twist", name: "Twist the Blade", desc: "Action: Change one of your Sneak Attack dice to whatever you like. (Lvl 13: You can do this 1/turn for free)." },
            { id: "quick_read", replaces: ["quick_read"], name: "Quick Read", desc: "<ul><li>([[uQuickReadEnc]] 1/encounter) Gain advantage on an Assess check.</li><li>([[uQuickReadDay]] 1/day) Gain advantage on an Examination check.</li></ul>" }
        ];

        core[6] = [
            { id: "not_happened", name: "THAT'S Not What Happened!", desc: "([[uNotHappened]] 1/Safe Rest) Action: After a Distracted enemy attacks you, you may change the Primary Die roll to whatever you like (changing the die to the minimum value counts as a miss)." }
        ];

        core[20].push({ id: "supreme", name: "Supreme Execution", desc: "+1 to any 2 stats. When you attack with a blade, you do not require targets to be Distracted to trigger Vicious Opportunist." });

        subclasses["SilentBlade"] = {
            3: [
                { id: "commotion", name: "Amidst All This Commotion...", desc: "If a creature dies while you Sneak Attack them, you may turn Invisible until you attack again or until the beginning of your next turn." },
                { id: "trace", name: "Leave No Trace", desc: "Advantage on Stealth checks when you are at full health." }
            ],
            7: [{ id: "cunning_strike", name: "Cunning Strike", desc: "([[uCunningStrike1]] [[uCunningStrike2]] 2/encounter) When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, they deal the maximum amount of damage (if your target saves, regain 1 use)." }],
            11: [{ id: "pro_skulker", name: "Professional Skulker", desc: "Gain a climbing speed and advantage on Stealth checks (replaces Leave No Trace)." }],
            15: [{ id: "kill", name: "KILL", desc: "When you crit an enemy with fewer max HP than you, it dies." }]
        };

        subclasses["Scoundrel"] = {
            3: [
                { id: "low_blow", name: "Low Blow", desc: "When you Sneak Attack, you may spend 2 additional actions to Incapacitate your target for their next turn on a failed STR save (DC 10+INT). Save or fail, they are Taunted by you until you drop to 0 HP." },
                { id: "sweet_talk", name: "Sweet Talk", desc: "You may gain advantage on all Influence checks with NPCs you’ve just met for the first time. This lasts until you fail an Influence check with them or until you meet a 2nd time. You have disadvantage on Influence checks with them after you use this ability." }
            ],
            7: [{ id: "pocket_sand", name: "Pocket Sand", desc: "([[uPocketSand1]] [[uPocketSand2]] 2/encounter) When you Defend against a melee attack, Blind the attacker until the start of their next turn and force them to reroll the attack (Blinded creatures attack with disadvantage)." }],
            11: [{ id: "escape_plan", name: "Escape Plan", desc: "([[uEscapePlan]] 1/Safe Rest) When you would drop to 0 HP or gain a Wound, you don’t. Instead, you turn Invisible for 1 minute or until you attack." }],
            15: [{ id: "heads_win", name: "Heads I Win, Tails You Lose", desc: "([[uHeadsIWin]] 1/encounter) Attacks you make this round don’t miss, you crit on 1 less than normally needed, and you gain LVL temp HP." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Sneak Attack bonus and Cheat status for the mechanic panel.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();

        builder.addRollDisplay(derived.saDice, 'Sneak Attack', derived.saDice, 'Added to Critical Hits');

        builder.addRollDisplay('1d20', 'Vicious Opp.', 'MAX', 'On Distracted Target', { type: 'attack', isCrit: true });

        if (level >= 2) {
            builder.addStatDisplay('10', 'Init Floor', 'Min Initiative Result');
        }

        return builder.build();
    }
}

const CLASS_CONFIG = new CheatClass();
