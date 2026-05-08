class CommanderClass extends BaseClass {
    constructor() {
        super({
            name: "Commander",
            subtitle: "Fearless leader, tactician, & weapon master",
            keyStats: ['str', 'int'],
            saves: { adv: 'str', dis: 'dex' },
            proficiencies: { armor: "Mail, Shields", weapons: "All Martial Weapons" },
            baseHp: 17,
            hpPerLevel: 8,
            hitDie: 10,
            theme: {
                accent: "#f59e0b",
                accentDim: "#b45309",
                bodyBg: "#0f0a0a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0f11 0%, #0f0a0a 100%)",
                panelBg: "rgba(35, 20, 20, 0.8)",
                border: "rgba(245, 158, 11, 0.25)"
            },
            initialStats: { baseStr: 2, baseDex: 0, baseInt: 2, baseWil: -1 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Bulwark", label: "Champion of the Bulwark", accent: "#94a3b8" },
                { value: "Vanguard", label: "Champion of the Vanguard", accent: "#ef4444" },
                { value: "Spellblade", label: "Spellblade", accent: "#a855f7" }
            ],
            spellProgression: [0, 3, 7, 11, 15],
            resources: [
                createSimpleResource('combatDice', 'Combat Dice', (level, stats, state, subclass) => stats.str + (level >= 11 && subclass === "Vanguard" ? 1 : 0)),
                createSimpleResource('coordStrike', 'Coord. Strike', (level, stats, state, subclass) => stats.int + (level >= 9 ? 1 : 0) + (level >= 13 ? 1 : 0) + (level >= 17 ? 1 : 0) + (level >= 7 && subclass === "Vanguard" ? 1 : 0)),
                createManaResource('int')
            ],
            customHeaderStats: [
                { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level, subclass) => level >= 3 && subclass !== 'None', getValue: (derived) => `R ${derived.auraReach}` }
            ],
            featuresData: CommanderClass.FEATURES,
            optionsData: CommanderClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            orders: {
                "Coordinated Strike!": { desc: "1/round, Free action: you and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free. You can do this INT times/Safe Rest.", empowered: "Any attacks made this way deal additional Necrotic damage equal to the max value of your Combat Die. An enemy damaged this way is considered undead for 1 round." },
                "Face Me!": { desc: "Reaction (after an ally is crit within 12 spaces): Taunt that enemy until you drop to 0 HP.", empowered: "That enemy takes STR d8 radiant damage (ignoring armor), is pulled up to 4 spaces toward you, and is Taunted by you until you drop to 0 HP." },
                "Hold the Line!": { desc: "(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3× your LVL.", empowered: "Set their HP to 3× your LVL. Additionally, they gain that many temp HP. Enemies who reduce this temp HP in melee have their speed halved until the end of their next turn." },
                "I Can Do This ALL DAY!": { desc: "(1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR).", empowered: "You may expend any number of Hit Dice, set your HP to the sum rolled instead, and deal that much fire damage to each enemy within 2 spaces of you. They gain the Smoldering condition." },
                "Move it! Move it!": { desc: "When you roll Initiative you may give yourself and an ally advantage on the roll and +3 speed for 1 round.", empowered: "When you roll Initiative, you may give yourself and an ally advantage on the roll, +3 speed, and the ability to fly for 1 round. Then, you both can also move for free." },
                "Reposition!": { desc: "Action/Reaction (on an ally’s turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free.", empowered: "Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free. You may exchange places with one of them." }
            },
            tactics: {
                "Commanding Presence": { desc: "Action: Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it to the best of their ability, provided it is not obviously harmful to themselves. They then become immune to this effect for 1 day." },
                "Heavy Strike": { desc: "When you hit, push a Medium creature STR spaces and deal extra damage equal to a roll of your Combat Die. A Small creature is pushed twice as far; Large, pushed half as far (round down)." },
                "Inerrant Strike": { desc: "Reroll a missed attack, add 1 to the Primary Die, and deal extra damage equal to a roll of your Combat Die." },
                "Lunging Strike": { desc: "Gain +1 Reach on an attack and deal extra damage equal to 2× a roll of your Combat Die." },
                "Sweeping Strike": { desc: "2 actions: Select any contiguous area within your weapon’s Reach and damage ALL targets there. This attack does not miss on a 1." }
            },
            masteries: {
                "Slashing": { desc: "Your attacks with slashing weapons cannot miss unarmored enemies." },
                "Bludgeoning": { desc: "When your primary die rolls a 7 or higher with a bludgeoning weapon, ignore Heavy Armor." },
                "Piercing": { desc: "Your attacks with piercing weapons ignore Medium Armor." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or INT', 'DEX or WIL', false);
        
        core[1] = [{ id: "coord_strike", name: "Coordinated Strike!", desc: "Gain the Coordinated Strike! Commander's Order." }];
        core[2] = [
            { id: "orders", name: "Commander’s Orders", type: "dynamic_choice", collection: "orders", stateKey: "selectedOrders", desc: "Choose 2 Commander's Orders.", getCount: (level) => 2 },
            { id: "medic", name: "Field Medic", desc: "Roll 1 additional die for any health potion you administer. Whenever you or an ally spends any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered." }
        ];
        core[4].push({ id: "tactics", name: "Fit for Any Battlefield", type: "dynamic_choice", collection: "tactics", stateKey: "selectedTactics", desc: "Choose a Combat Tactic. When you roll Initiative, gain STR Combat Dice, each a d6. (1/attack) You may expend a Combat Die to perform a special maneuver. Combat Dice are lost when combat ends.", getCount: (level) => level >= 16 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 });
        core[5].push({ id: "master_commander", name: "Master Commander", desc: "When you roll Initiative, regain 1 spent use of Coordinated Strike (it is lost if not spent during that encounter). Attacks made from your Coordinated Strikes also now ignore disadvantage. Your Combat Dice are now d8s." });
        core[6].push({ id: "mastery", name: "Weapon Mastery", type: "dynamic_choice", collection: "masteries", stateKey: "selectedMastery", desc: "You may sheathe a weapon and draw a different one 2×/round for free. Choose a weapon type to specialize in.", getCount: (level) => level >= 14 ? 3 : level >= 10 ? 2 : 1 });
        
        core[9].push({ id: "master_commander_2", name: "Master Commander (2)", desc: "+1 use of Coordinated Strike/Safe Rest. Your Combat Dice are now d10s." });
        core[13].push({ id: "master_commander_3", name: "Master Commander (3)", desc: "+1 use of Coordinated Strike/Safe Rest. Your Combat Dice are now d12s." });
        core[17].push({ id: "master_commander_4", name: "Master Commander (4)", desc: "+1 use of Coordinated Strike/Safe Rest. Your Combat Dice are now d20s." });
        
        core[18] = [{ id: "unparalleled_tactics", name: "Unparalleled Tactics", desc: "The first time each encounter you use Coordinated Strike, an ally who can hear you also gains 1 action to use on their next turn." }];
        core[20].push({ id: "captain_of_legions", name: "Captain of Legions", desc: "+1 to any 2 of your stats. The first time each encounter you use Coordinated Strike, EVERY ally within 12 spaces gains +1 action (replaces Unparalleled Tactics)." });

        subclasses["Bulwark"] = {
            3: [{ id: "armor_master", name: "Armor Master", desc: "You are proficient with plate armor." }, { id: "shield_expert", name: "Shield Expert", desc: "While wearing a shield, you may Defend 2× each round. The first time each round you block all of the damage from an attack, you may make an opportunity attack against the attacker for free." }],
            7: [{ id: "juggernaut", name: "Juggernaut", desc: "When you use Coordinated Strike, you deal extra damage equal to your armor, and you can add 1 to your primary die." }],
            11: [{ id: "taunting_strike", name: "Taunting Strike", desc: "(1/turn) You may Taunt a creature you hit until the end of their next turn." }],
            15: [{ id: "shield_wall", name: "Shield Wall", desc: "Allies within 2 spaces gain ALL the benefits of the shield you have equipped." }]
        };
        subclasses["Vanguard"] = {
            3: [{ id: "advance", name: "Advance!", desc: "(1/round) After you move toward an enemy, gain advantage on the first melee attack you make against it. When you use your Coordinated Strike, you and all allies within 12 spaces can first move up to half their speed for free." }],
            7: [{ id: "exp_commander", name: "Experienced Commander", desc: "Your Coordinated Strike may target 1 additional ally. Gain +1 use of Coordinated Strike/Safe Rest." }],
            11: [{ id: "survey_battlefield", name: "Survey the Battlefield", desc: "When you roll Initiative, regain 1 use of Coordinated Strike. +1 max Combat Dice." }],
            15: [{ id: "as_one", name: "As One!", desc: "Attacks made with your Coordinated Strike also grant advantage and ignore all disadvantage. Your chosen allies gain 1 additional action to use on their next turn." }]
        };
        subclasses["Spellblade"] = {
            3: [
                { id: "arcane_command_passive", replaces: ["tactics", "mastery"], name: "Arcane Command", desc: "You gain INT mana when you roll Initiative. Your Commander's Orders are empowered. (See your updated Arcane Command feature above).", minor: true }, 
                { id: "firebrand", name: "Firebrand", desc: "When you roll Initiative you may cast Enchant Weapon for free (can be upcast as normal by spending additional mana)." }
            ]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        let cdType = "d6";
        if (level >= 17) cdType = "d20";
        else if (level >= 13) cdType = "d12";
        else if (level >= 9) cdType = "d10";
        else if (level >= 5) cdType = "d8";

        return { speed: 6, woundMax: 6, cdType };
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);

        if (subclass !== "Spellblade") {
            builder.addRollDisplay('1' + derived.cdType, 'Combat Die', derived.cdType, `${state.resourceValues.combatDice || 0}/${derived.resourceMaxes.combatDice}`, { type: 'attack', stat: 'str' });
        } else {
            builder.addResource('mana', 'INT Mana', state.resourceValues.mana, derived.resourceMaxes.mana);
        }

        builder.addResource('coordStrike', 'Coord. Strike', state.resourceValues.coordStrike, derived.resourceMaxes.coordStrike);

        builder.addCustom(`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Tactical DC</label>
                <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">${10 + statsMap.str}</div>
                <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">10+STR save DC.</div>
            </div>
        `);

        return builder.build();
    }

    renderFeature(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, optionsRef) {
        if (feat.id === "orders" && subclass === "Spellblade") {
            // Transformation logic for Spellblade's Arcane Command
            const empoweredFeat = {
                ...feat,
                name: "Arcane Command",
                collection: "sb_options",
                desc: "Your focus on the arcane causes you to lose access to Weapon Mastery and Combat Tactics, but you now gain INT mana when you roll Initiative. Your Commander's Orders are empowered. Whenever you could choose a Combat Tactic or Weapon Mastery, instead choose another Commander’s Order or a tier 1 spell."
            };
            return super.renderFeature(empoweredFeat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, {
                sb_options: {
                    ...this.optionsData.orders,
                    ...Object.values(SPELL_REGISTRY).reduce((acc, sch) => ({...acc, ...sch}), {})
                }
            });
        }
        return super.renderFeature(feat, level, subclass, state, derived, bFeat, iStats, formatPips, rSSC, cssClass, optionsRef);
    }
}

const CLASS_CONFIG = new CommanderClass();
