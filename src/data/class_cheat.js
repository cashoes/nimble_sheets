class CheatClass extends BaseClass {
    constructor() {
        super({
            name: "Cheat",
            subtitle: "Master of stealth, dirty fighting, & rules",
            keyStats: ['dex', 'int'],
            saves: { adv: 'dex', dis: 'wil' },
            proficiencies: { armor: "Leather Armor", weapons: "DEX Weapons" },
            baseHp: 10,
            hpPerLevel: 5,
            hitDie: 6,
            theme: {
                accent: "#cbd5e1",
                accentDim: "#64748b",
                bodyBg: "#0f1115",
                containerBg: "radial-gradient(circle at 50% 50%, rgba(203, 213, 225, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1e2125 0%, #0f1115 100%)",
                panelBg: "rgba(35, 40, 45, 0.8)",
                border: "rgba(203, 213, 225, 0.2)"
            },
            initialStats: { baseStr: -1, baseDex: 3, baseInt: 1, baseWil: -1 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "SilentBlade", label: "Tools of the Silent Blade", accent: "#0f172a" },
                { value: "Scoundrel", label: "Tools of the Scoundrel", accent: "#16a34a" }
            ],
            featuresData: CheatClass.FEATURES,
            optionsData: CheatClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            underhanded: {
                "Creative Accounting": { desc: "Steal up to INT actions from your next turn (Gain up to INT actions now. The next time you would gain actions, subtract the number stolen). You cannot use this 2 turns in a row." },
                "Exploit Weakness": { desc: "Action: Make a contested INT check against an enemy. If you win, you can use Vicious Opportunist against them, even if they are not Distracted. This lasts for 1 minute or until you use this ability against another target." },
                "Feinting Attack": { desc: "If you miss for the 2nd time in a single round, you may change the primary die roll to any result instead." },
                "How'd YOU get here?!": { desc: "2 actions: “Teleport” up to 4 spaces away, adjacent to a Distracted target, and make a melee attack against them. If you crit, you may \"teleport\" again." },
                "I’m Outta Here!": { desc: "When an ally within 4 spaces is crit, you may turn invisible until the end of your next turn and then move up to half your speed for free." },
                "Misdirection": { desc: "Gain INT armor. Whenever you Defend, you may halve the damage instead." },
                "Steal Tempo": { desc: "When you land a critical hit for the second time on a turn, your target loses 1 action and you gain 1 action." },
                "Sunder Armor (Medium)": { desc: "Action: When you crit an enemy with medium armor, sunder their armor. Until the start of your next turn, ALL melee attacks against that target ignore its armor." },
                "Sunder Armor (Heavy)": { desc: "Req. Sunder Armor (Medium). Your Sunder Armor ability now also applies to enemies wearing heavy armor." },
                "Trickshot": { desc: "When you throw a dagger, it returns back to your hand at the end of your turn. On a hit, it ricochets to another creature within 2 spaces, dealing half as much damage to them." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or INT', 'WIL or STR', false);
        
        core[1] = [
            { id: "sneak_attack", name: "Sneak Attack", milestones: [1, 3, 7, 9, 11, 15, 17], desc: (level, subclass, state, derived) => FeatureGen.createScalingList(
                `(1/turn) When you crit, deal <strong>+${derived.saDice}</strong> damage.`,
                [
                    { level: 3, text: "Deal +1d8 damage." },
                    { level: 7, text: "Deal +2d8 damage." },
                    { level: 9, text: "Deal +2d10 damage." },
                    { level: 11, text: "Deal +2d12 damage." },
                    { level: 15, text: "Deal +2d20 damage." },
                    { level: 17, text: "Deal +3d20 damage." }
                ],
                level
            )},
            { id: "vicious_opp", name: "Vicious Opportunist", desc: "(1/turn) When you hit a Distracted target with a melee attack, you may change the Primary Die roll to whatever you like (changing it to the max value counts as a crit)." }
        ];
        core[2] = [
            { id: "cheat", name: "Cheat", desc: "You’re a well-rounded cheater. Gain the following abilities:<ul><li>(1/round) You may either Move or Hide for free.</li><li>(1/day) You may change any skill check to 10+INT.</li><li>If you roll less than 10 on Initiative, you may change it to 10 instead.</li><li>You may gain advantage on skill checks while playing any games, competitions, or placing wagers.</li></ul>" }
        ];
        core[3].push({ id: "thieves_cant", name: "Thieves’ Cant", desc: "You learn the secret language of rogues and scoundrels." });
        
        core[4].push({ id: "underhanded", name: "Underhanded Abilities", type: "dynamic_choice", collection: "underhanded", stateKey: "selectedUnderhanded", milestones: [4, 6, 8, 10, 12, 14, 16, 18], desc: "Choose Underhanded Abilities as you level up.", getCount: (level) => level >= 18 ? 8 : level >= 16 ? 7 : level >= 14 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 });
        
        core[5].push({ id: "twist_blade", name: "Twist the Blade", milestones: [5, 13], desc: (level) => FeatureGen.createScalingList(
            "Action: Change one of your Sneak Attack dice to whatever you like.",
            [{ level: 13, text: "You can Twist the Blade for free (1/turn)." }],
            level
        )});
        core[5].push({ id: "quick_read", name: "Quick Read", desc: "Gain advantage on an Assess check (1/encounter) and an Examination check (1/day)." });
        
        core[6].push({ id: "not_happened", name: "THAT'S Not What Happened!", desc: "(1/Safe Rest) Action: After a Distracted enemy attacks you, you may change the Primary Die roll to whatever you like (changing the die to the minimum value counts as a miss)." });
        
        core[20].push({ id: "supreme_exec", name: "Supreme Execution", desc: "+1 to any 2 of your stats. When you attack with a blade, you do not require targets to be Distracted to trigger Vicious Opportunist." });

        subclasses["SilentBlade"] = {
            3: [{ id: "commotion", name: "Amidst All This Commotion…", desc: "If a creature dies while you Sneak Attack them, you may turn Invisible until you attack again or until the beginning of your next turn." }, { id: "no_trace", name: "Leave No Trace", desc: "Advantage on Stealth checks when you are at full health." }],
            7: [{ id: "cunning_strike", name: "Cunning Strike", desc: "(2/encounter) When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, they deal the maximum amount of damage (if your target saves, regain 1 use)." }],
            11: [{ id: "skulker", name: "Professional Skulker", desc: "Gain a climbing speed and advantage on Stealth checks (replaces Leave No Trace).", replaces: "no_trace" }],
            15: [{ id: "kill", name: "KILL", desc: "When you crit an enemy with fewer max HP than you, it dies." }]
        };
        subclasses["Scoundrel"] = {
            3: [{ id: "low_blow", name: "Low Blow", desc: "When you Sneak Attack, you may spend 2 additional actions to Incapacitate your target for their next turn on a failed STR save (DC 10+INT). Save or fail, they are Taunted by you until you drop to 0 HP." }, { id: "sweet_talk", name: "Sweet Talk", desc: "You may gain advantage on all Influence checks with NPCs you’ve just met for the first time. This lasts until you fail an Influence check with them or until you meet a 2nd time. You have disadvantage on Influence checks with them after you use this ability (until you get back on their good side)." }],
            7: [{ id: "pocket_sand", name: "Pocket Sand", desc: "(2/encounter—you’ve got to collect more sand!) When you Defend against a melee attack, Blind the attacker until the start of their next turn and force them to reroll the attack (Blinded creatures attack with disadvantage)." }],
            11: [{ id: "escape_plan", name: "Escape Plan", desc: "(1/Safe Rest) When you would drop to 0 HP or gain a Wound, you don’t. Instead, you turn Invisible for 1 minute or until you attack." }],
            15: [{ id: "heads_i_win", name: "Heads I Win, Tails You Lose", desc: "(1/encounter) Attacks you make this round don’t miss, you crit on 1 less than normally needed, and you gain LVL temp HP." }]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        let saDice = "1d6";
        if (level >= 17) saDice = "3d20";
        else if (level >= 15) saDice = "2d20";
        else if (level >= 11) saDice = "2d12";
        else if (level >= 9) saDice = "2d10";
        else if (level >= 7) saDice = "2d8";
        else if (level >= 3) saDice = "1d8";

        return { speed: 6, woundMax: 6, saDice };
    }

    getStatOverrides(level, subclass, state, statsMap) {
        let overrides = {};
        let underhanded = state.selectedUnderhanded || [];
        if (underhanded.includes("Misdirection")) overrides.armor = (overrides.armor || 0) + statsMap.int;
        return overrides;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        
        builder.addRollDisplay(derived.saDice, 'Sneak Attack', derived.saDice, 'On Critical Hit', { type: 'attack', stat: 'dex' });
        
        builder.addCustom(`
            <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; text-align: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Opportunist</label>
                <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; text-transform: uppercase; line-height: 1.1; margin: auto 0;">Max Roll</div>
                <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">Vs. Distracted targets</div>
            </div>
        `);

        if (level >= 2) {
            builder.addCustom(`
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Cunning</label>
                    <div style="font-size: 2.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">10+</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">Init Floor. Free Move/Hide.</div>
                </div>
            `);
        }

        return builder.build();
    }
}

const CLASS_CONFIG = new CheatClass();
