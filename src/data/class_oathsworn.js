class OathswornClass extends BaseClass {
    constructor() {
        super({
            name: "Oathsworn",
            subtitle: "Faithful guardian, protector, and avenger",
            keyStats: ['str', 'wil'],
            saves: { adv: 'str', dis: 'dex' },
            proficiencies: { armor: "All Armor", weapons: "STR Weapons" },
            baseHp: 17,
            hpPerLevel: 8,
            hitDie: 10,
            theme: {
                accent: "#38bdf8",
                accentDim: "#0284c7",
                bodyBg: "#05070a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.1) 0%, transparent 100%), linear-gradient(180deg, #111827 0%, #0a0f1a 100%)",
                panelBg: "rgba(30, 41, 59, 0.7)",
                border: "var(--gold-dim)"
            },
            initialStats: { baseStr: 2, baseDex: 0, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Vengeance", label: "Oath of Vengeance", accent: "#ef4444" },
                { value: "Refuge", label: "Oath of Refuge", accent: "#f8fafc" },
                { value: "Oathbreaker", label: "Oathbreaker (Extra)", accent: "#a855f7" }
            ],
            spellSchools: ["Radiant"],
            subclassSchools: { "Oathbreaker": ["Necrotic"] },
            extraSchoolsKeys: ["selectedBenediction"],
            spellProgression: [2, 2, 4, 6, 8, 10, 13, 17, 19, 21],
            spellReplacements: [
                createSpellReplacement("True Strike", "Entice", "Necrotic", "Oathbreaker"),
                createSpellReplacement("Heal", "Shadow Trap", "Necrotic", "Oathbreaker"),
                createSpellReplacement("Warding Bond", "Dread Visage", "Necrotic", "Oathbreaker")
            ],
            includeUtilitySpells: createUtilityConfig(null, ["selectedSpells", "selectedBenediction"]),
            resources: [
                createManaResource('wil'),
                createSimpleResource('loh', 'Lay on Hands', (level) => 5 * level)
            ],
            customHeaderStats: [
                { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level, subclass) => level >= 3 && subclass !== 'None', getValue: (derived) => `R ${derived.auraReach}` }
            ],
            featuresData: OathswornClass.FEATURES,
            optionsData: OathswornClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            decrees: {
                "Blinding Aura": { desc: "(1/Safe Rest) Action: Enemies in your aura are Blinded until the end of their next turn." },
                "Courage!": { desc: "(1/encounter) When you or an ally in your aura would drop to 0 HP, set their HP to 1 instead." },
                "Explosive Judgment": { desc: "(1/encounter) 2 actions: Expend your Judgment Dice, deal that much radiant damage to all enemies in your aura." },
                "Improved Aura": { desc: "+2 aura Reach." },
                "Radiant Aura": { desc: "Action: End any single harmful condition or effect on yourself or another willing creature within your aura. You may use this ability WIL times/Safe Rest." },
                "Reliable Justice": { desc: "Whenever you roll Judgment Dice, roll with advantage (roll one extra and drop the lowest)." },
                "Shining Mandate": { desc: "The first time each round you are attacked while you already have Judgment Dice, select an ally within your aura to roll one and apply it to their next attack. You have advantage on skill checks to see through illusions." },
                "Stand Fast, Friends!": { desc: "When you roll Initiative, grant allies temp HP equal to your STR+WIL. You and allies within your aura have advantage against fear and effects that would move or knock Prone." },
                "Unstoppable Protector": { desc: "Gain +1 speed. You may Interpose even if you are restrained, stunned, or otherwise incapacitated. If you Interpose for a noncombatant NPC, you may Interpose again this round." },
                "Well Armored": { desc: "Whenever you Interpose, gain temp HP equal to your STR." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or WIL', 'DEX or INT', true, [0, 2, 4, 6, 8, 10, 13, 17]);
        
        core[1] = [
            { id: "judgment", name: "Radiant Judgment", milestones: [1, 3, 5, 8, 10, 14], desc: (level, subclass, state, derived) => FeatureGen.createScalingList(
                `Whenever an enemy attacks you, if you have no Judgment Dice, roll your Judgment dice (<strong>${derived.jdText}</strong>). On your next melee attack this encounter, if you hit, deal that much additional radiant damage. The dice are expended whether you hit or miss.`,
                [
                    { level: 1, text: "Roll 2 Judgment Dice. Your Judgment Dice are d6s." },
                    { level: 3, text: "Your Judgment Dice are now d8s." },
                    { level: 5, text: "Your Judgment Dice are now d10s." },
                    { level: 8, text: "Your Judgment Dice are now d12s." },
                    { level: 10, text: "Your Judgment Dice are now d20s." },
                    { level: 14, text: "Roll 3 Judgment Dice." }
                ],
                level
            )},
            { id: "loh", name: "Lay on Hands", desc: (level) => `Gain a magical pool of healing power. This pool’s maximum is always equal to <strong>${5 * level}</strong> and recharges on a Safe Rest. Action: Touch a target and spend any amount of remaining healing power to restore that many HP.` }
        ];
        core[2].push({ id: "zealot", name: "Zealot", desc: "Whenever you attack with a melee weapon, you may spend mana (up to your highest unlocked spell tier) to choose one for each mana spent: <ul><li><strong>Condemning Strike:</strong> Deal +5 radiant damage.</li><li><strong>Blessed Aim:</strong> Decrease your target's armor by 1 step for this attack.</li></ul>" });
        core[2].push({ id: "paragon", name: "Paragon of Virtue", desc: "Advantage on Influence checks to convince someone when you are forthrightly telling the truth, disadvantage when misleading." });
        
        core[3].push({ id: "decrees", name: "Sacred Decree", type: "dynamic_choice", collection: "decrees", stateKey: "selectedDecrees", milestones: [3, 6, 9, 12, 14, 16], desc: "Learn Sacred Decrees.", getCount: (level) => level >= 16 ? 6 : level >= 14 ? 5 : level >= 12 ? 4 : level >= 9 ? 3 : level >= 6 ? 2 : 1 });
        
        core[4].push({ id: "life", name: "My Life, for My Friends", desc: "You can Interpose for free." });
        
        core[7].push(FeatureGen.createSpellChoiceFeature({
            id: "master_radiance",
            name: "Master of Radiance",
            level: 7,
            spellType: "utility",
            schools: ["Radiant"],
            stateKey: "selectedSpells",
            getCount: (level) => level >= 11 ? 2 : 1,
            milestones: [7, 11],
            desc: "Choose Radiant Utility Spells."
        }));
        
        core[18] = [{ id: "unending", name: "Unending Judgment", desc: "While you have no Judgment Dice, gain +5 damage to melee attacks." }];
        core[20].push({ id: "glorious_paragon", name: "Glorious Paragon", desc: "+1 to any 2 of your stats. Defend for free whenever you Interpose." });

        subclasses["Vengeance"] = {
            3: [{ id: "aura_zeal", name: "Aura of Zeal", desc: (level, subclass, state, derived) => `Whenever you roll Judgment Dice, roll 1 more. Gain an aura with a Reach of 4. Your Radiant Judgment also triggers when an ally within your aura is attacked while you have no Judgment Dice.` }],
            7: [{ id: "avenger", name: "Avenger", desc: "Whenever you or an ally within your aura gain any Wounds, change up to that many Judgment Dice to their max. Then, move up to half your speed for free." }],
            11: [{ id: "unerring", name: "Unerring Judgment", desc: "Increase your primary die rolls on melee attacks by 1 whenever you have Judgment Dice." }],
            15: [{ id: "max_judgment", name: "Maximum Judgment", desc: "Whenever you are attacked, set a Judgment Die to its max." }]
        };
        subclasses["Refuge"] = {
            3: [{ id: "aura_refuge", name: "Aura of Refuge", desc: "Your shields gain +WIL armor and count as your spellcasting focus. Gain an aura with a Reach of 4; you can Interpose for an ally anywhere within your aura." }],
            7: [{ id: "face_me", name: "Face Me, Foul Creature!", desc: "When you Interpose, the attacking enemy is also Taunted by you until the end of their next turn." }],
            11: [{ id: "reprieve", name: "Glorious Reprieve", desc: "You and allies in your aura cannot drop below 1 HP. Whenever this triggers, they gain 1 Wound instead (heroes still die at max Wounds)." }],
            15: [{ id: "grace", name: "Divine Grace", desc: "You are resistant to all damage while Interposing." }]
        };
        subclasses["Oathbreaker"] = {
            1: [
                { id: "judgment", replaces: "judgment", name: "Aura of Suffering", desc: "You gain an aura with a Reach of 4 and can Interpose for an ally anywhere within your aura; however, your Radiant Judgment ability no longer triggers when attacked. Instead, it triggers whenever you could Interpose but don’t." }
            ],
            2: [
                { id: "paragon", replaces: "paragon", name: "Paragon of Power", desc: "Advantage on Might checks when attempting to intimidate others." }
            ],
            3: [
                { id: "we_all_suffer", name: "We All Suffer", desc: "Gain +2 max Wounds. When an ally within your aura would gain any Wounds or fail a save, you may suffer the effect instead and trigger your Radiant Judgment ability." },
                { id: "bring_pain", name: "Bring Me Your Pain", desc: "Reaction (When a willing ally within your aura would drop to 0 HP): Switch HP with them (if your current HP is higher than their max HP, they gain Temp HP equal to the difference), dropping to 0 hp and gaining the Wound instead." },
                FeatureGen.createSpellChoiceFeature({
                    id: "dark_benediction",
                    name: "Dark Benediction",
                    level: 3,
                    spellType: "utility",
                    schools: ["Necrotic"],
                    stateKey: "selectedBenediction",
                    getCount: (level) => level >= 11 ? 0 : (level >= 7 ? 2 : 1),
                    milestones: [3, 7, 11],
                    desc: (level) => level >= 11 ? "You know all Necrotic Utility Spells." : "Choose Necrotic Utility Spells."
                })
            ],
            7: [
                { id: "torment", name: "Torment", desc: "Your Lay on Hands heals you for twice as much, and others for half as much. When you deal damage, you can expend healing power from your Lay on Hands pool to increase the damage dealt by an amount equal to the points spent (ignoring armor)." }
            ],
            11: [
                { id: "exploit", name: "Exploit", desc: "Reaction (whenever an ally within your aura Defends), you may expend your Judgment Dice to force an enemy within your Aura to Interpose (a creature cannot interpose against its own attack)." }
            ],
            15: [
                { id: "terror", name: "Bloody Terror", desc: "Attacks against you gain 1 instance of disadvantage for each Wound you have (max 3)." }
            ]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        let auraReach = 4;
        let woundMax = 6;
        let decrees = state.selectedDecrees || [];
        if (decrees.includes("Improved Aura")) auraReach += 2;
        if (subclass === "Oathbreaker") woundMax += 2;

        let jdCount = 2;
        let faces = 6;
        if (level >= 14) jdCount++;
        if (subclass === "Vengeance") jdCount++;
        
        if (level >= 10) faces = 20;
        else if (level >= 8) faces = 12;
        else if (level >= 5) faces = 10;
        else if (level >= 3) faces = 8;

        let jdText = `${jdCount}d${faces}${decrees.includes("Reliable Justice") ? " (Adv)" : ""}`;

        return { speed: 6, woundMax, auraReach, jdCount, jdFaces: faces, jdText };
    }

    getShieldBonus(level, subclass, stats) {
        return (subclass === 'Refuge' && level >= 3) ? stats.wil : 0;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const manaMax = derived.resourceMaxes.mana;
        const lohMax = derived.resourceMaxes.loh;

        if (level >= 2) {
            builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, manaMax);
        }
        builder.addResource('loh', 'Lay on Hands', state.resourceValues.loh, lohMax);

        let totalJD = 0;
        (state.judgmentDice || []).forEach(d => totalJD += d.total);

        builder.addDicePool(
            state.judgmentDice || [],
            'Judgment Dice',
            `d${derived.jdFaces}`,
            'CLASS_CONFIG.actions.rollJudgmentDice()',
            'CLASS_CONFIG.actions.spendJudgmentDice()',
            'CLASS_CONFIG.actions.toggleJudgment'
        );

        builder.addCustom(`
            <div style="display: flex; flex-direction: column; align-items: center; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 12px; min-width: 80px;">
                <span style="font-size: 1.8em; font-family: 'Cinzel', serif; font-weight: 900; color: ${totalJD > 0 ? 'var(--gold-light)' : '#fff'}; line-height: 1;">+${totalJD}</span>
                <span style="font-size: 0.55em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: bold; white-space: nowrap;">Radiant DMG</span>
                <div style="margin-top: 5px; display: flex; gap: 5px;">
                    ${state.selectedDecrees?.includes("Reliable Justice") ? `<div style="width: 8px; height: 8px; background: var(--save-adv); border-radius: 50%;" title="Advantage"></div>` : ''}
                </div>
            </div>
        `);

        return builder.build();
    }

    actions = {
        rollJudgmentDice: function () {
            const derived = this.getDerivedStats(state.level, state.subclass, state);
            const jdCount = derived.jdCount;
            const faces = derived.jdFaces;
            const hasAdv = state.selectedDecrees?.includes("Reliable Justice");
            
            let finalDice = [];
            let rollCount = hasAdv ? jdCount + 1 : jdCount;

            for (let i = 0; i < rollCount; i++) {
                let r = Math.floor(Math.random() * faces) + 1;
                finalDice.push({ total: r, detail: r.toString() });
            }

            if (hasAdv) {
                let minVal = Math.min(...finalDice.map(d => d.total));
                let minIdx = finalDice.findIndex(d => d.total === minVal);
                finalDice.splice(minIdx, 1);
            }
            
            state.judgmentDice = finalDice;
            saveState(); render();
        },
        toggleJudgment: function(idx) {
            if (!state.judgmentDice || !state.judgmentDice[idx]) return;
            const derived = this.getDerivedStats(state.level, state.subclass, state);
            state.judgmentDice[idx].total = derived.jdFaces;
            saveState(); render();
        },
        spendJudgmentDice: function () { state.judgmentDice = null; saveState(); render(); }
    };
}

const CLASS_CONFIG = new OathswornClass();
