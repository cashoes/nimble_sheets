class MageClass extends BaseClass {
    constructor() {
        super({
            name: "Mage",
            subtitle: "Master of elemental forces & spellshaping",
            keyStats: ['int', 'wil'],
            saves: { adv: 'int', dis: 'str' },
            proficiencies: { armor: "Cloth", weapons: "Blades, Staves, Wands" },
            baseHp: 10,
            hpPerLevel: 5,
            hitDie: 6,
            theme: {
                accent: "#818cf8",
                accentDim: "#4f46e5",
                bodyBg: "#05070a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(129, 140, 248, 0.08) 0%, transparent 100%), linear-gradient(180deg, #0f111a 0%, #05070a 100%)",
                panelBg: "rgba(20, 22, 35, 0.7)",
                border: "rgba(129, 140, 248, 0.3)"
            },
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 3, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Control", label: "Master of Control", accent: "#3b82f6" },
                { value: "Chaos", label: "Master of Chaos", accent: "#f59e0b" }
            ],
            scalingStats: {
                surgeNotation: { 5: "WIL", 10: "WIL+1d4", 17: "WIL+2d4" },
                surgeDisplay: { 5: "WIL", 10: "WIL+1d4", 17: "2d4+WIL" }
            },
            spellSchools: ["Fire", "Ice", "Lightning"],
            subclassSchools: {
                "Control": [],
                "Chaos": []
            },
            extraSchoolsKeys: ["selectedSubclassCantrip", "selectedSubclassTiered"],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, "selectedMastery"),
            includeCantripSpells: ["selectedSubclassCantrip"],
            includeTieredSpells: ["selectedSubclassTiered"],
            resources: [
                createManaResource('int')
            ],
            featuresData: MageClass.FEATURES,
            optionsData: MageClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            spellshapers: {
                "Dimensional Compression": { desc: "+4 range to a spell for each additional mana spent." },
                "Echo Casting": { desc: "(2x mana, min 1 mana) When you cast a tiered, single-target spell, you may cast a copy of that spell on a 2nd target for free." },
                "Elemental Destruction": { desc: "(1 or more mana) After you hit with a spell, you may spend 1 or more mana (up to your WIL) to reroll 1 die per mana spent." },
                "Elemental Transmutation": { desc: "(1 mana) Change the damage type of a spell to: Fire, Ice, Lightning, Necrotic, or Radiant." },
                "Extra-Dimensional Vision": { desc: "(2 mana) You may ignore the line of sight requirement of a spell. Your spell will phase though barriers and obstacles to reach a target you know of within range." },
                "Methodical Spellweaver": { desc: "(–2 mana) Spend 1 additional action to reduce the mana cost of a spell by 2 (min 1)." },
                "Precise Casting": { desc: "(1+ mana) Choose 1 creature per mana spent to be unaffected by a spell you cast." },
                "Stretch Time": { desc: "(2 mana) Reduce the action cost of a spell by 1 (min 1)." }
            },
            masterySchools: {
                "Fire": { desc: "Gain access to all Fire utility spells." },
                "Ice": { desc: "Gain access to all Ice utility spells." },
                "Lightning": { desc: "Gain access to all Lightning utility spells." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('INT or WIL', 'STR or DEX', true);
        
        core[1] = [{ id: "spellcasting", name: "Elemental Spellcasting", desc: "You know Fire, Ice, and Lightning cantrips." }];
        core[2].push({ id: "researcher", name: "Talented Researcher", desc: "Gain advantage on Arcana or Lore checks when you have access to a large amount of books and time to study them." });
        
        core[3] = [FeatureGen.createSpellChoiceFeature({
            id: "master_utility",
            name: "Elemental Mastery",
            level: 3,
            spellType: "school",
            schools: ["Fire", "Ice", "Lightning"],
            stateKey: "selectedMastery",
            getCount: FeatureGen.createStandardCount([3, 6, 14], 14), // Specialist logic handled by 0 if >= 14
            filterKnown: true,
            milestones: [3, 6, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Learn the Utility Spells from a spell school you know.",
                [{ level: 14, text: "You know all Utility Spells from the spell schools you know." }],
                level
            )
        })];
        // Fix specialists manually since getCount needs to return 0 for all-utility at 14
        core[3][0].getCount = (level) => level >= 14 ? 0 : (level >= 6 ? 2 : 1);

        core[4].push({ id: "spellshaper", name: "Spellshaper", type: "dynamic_choice", collection: "spellshapers", stateKey: "selectedShapers", milestones: [4, 9, 13], desc: "Choose Spellshaper abilities as you level up. You may use 1/turn.", getCount: FeatureGen.createStandardCount([4, 9, 13]) });

        core[5].push({ id: "surge", name: "Elemental Surge", context: { type: 'surge' }, desc: (level) => FeatureGen.createScalingList(
            "When you roll Initiative, regain <strong>WIL</strong> mana (this expires at the end of combat if unused).",
            [
                { level: 10, text: "Regain WIL+1d4 mana." },
                { level: 17, text: "Regain WIL+2d4 mana." }
            ],
            level
        )});
        
        core[20].push({ id: "archmage", name: "Archmage", desc: "+1 to any 2 of your stats. The first tiered spell you cast each encounter costs 1 action less and 5 fewer mana." });

        subclasses["Control"] = {
            3: [{ id: "force_will", name: "Force of Will", desc: "(1/round) On your turn, you may Demand Control: Choose 1 option from the Control Table which you haven't chosen yet; resets when you roll Initiative, or when you have chosen all options once. <strong>Deny Fate:</strong> Whenever you miss with a spell or an effect you cause is saved against, you MUST Demand Control." }],
            7: [
                FeatureGen.createSpellChoiceFeature({
                    id: "cost_cantrip",
                    name: "At Any Cost (Cantrip)",
                    level: 7,
                    spellType: "cantrip",
                    schools: ["Necrotic"],
                    stateKey: "selectedSubclassCantrip",
                    desc: "Learn 1 cantrip from the Necrotic school."
                }),
                FeatureGen.createSpellChoiceFeature({
                    id: "cost_tiered",
                    name: "At Any Cost (Tiered)",
                    level: 7,
                    spellType: "tiered",
                    schools: ["Necrotic"],
                    stateKey: "selectedSubclassTiered",
                    desc: "Learn 1 tiered spell from the Necrotic school."
                }),
                { id: "nullify", name: "Nullify", desc: "(1/encounter) Ignore all disadvantage and other negative effects on your next action this turn, then Demand Control." }
            ],
            11: [{ id: "steel_will", name: "Steel Will", desc: "(1/Safe Rest) Whenever you would fail a save, you may succeed instead. Whenever you roll a 1 on an Elemental Surge die, you may reroll it once." }],
            15: [{ id: "supreme_control", name: "Supreme Control", desc: "Whenever you Demand Control, you may choose to trigger the selected option twice. You may Demand Control as a Reaction." }]
        };
        subclasses["Chaos"] = {
            3: [{ id: "force_chaos", name: "Force of Chaos", desc: "Whenever you cast a spell, you can choose to spend 1 less mana. Whenever you do this and whenever you crit, Invoke Chaos: Roll on the Chaos Table." }],
            7: [
                FeatureGen.createSpellChoiceFeature({
                    id: "tempest_cantrip",
                    name: "Tempest Mage (Cantrip)",
                    level: 7,
                    spellType: "cantrip",
                    schools: ["Wind"],
                    stateKey: "selectedSubclassCantrip",
                    desc: "Learn 1 cantrip from the Wind school."
                }),
                FeatureGen.createSpellChoiceFeature({
                    id: "tempest_tiered",
                    name: "Tempest Mage (Tiered)",
                    level: 7,
                    spellType: "tiered",
                    schools: ["Wind"],
                    stateKey: "selectedSubclassTiered",
                    desc: "Learn 1 tiered spell from the Wind school."
                }),
                { id: "chaos_lash", name: "Chaos Lash", desc: "(1/encounter) Reaction (when an enemy moves adjacent to you): They are pushed back 2 spaces, and on a failed WIL save, knocked Prone as well. Invoke Chaos." }
            ],
            11: [{ id: "thrive", name: "Thrive in Chaos", desc: "Whenever you Invoke Chaos, you may roll twice and cause both effects. (1/Safe Rest) You may choose which roll to use instead." }],
            15: [{ id: "master_chaos", name: "Master of Chaos", desc: "Whenever you Invoke Chaos, roll with advantage." }]
        };
        
        return { core, subclasses };
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);

        if (level >= 2) {
            builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        }

        if (level >= 5) {
            builder.addRollDisplay(derived.surgeNotation, 'Surge', derived.surgeDisplay, 'Regain on Init', { type: 'surge' });
        }

        if (subclass === "Chaos") {
            builder.addStatDisplay('1d20', 'Invoke Chaos', 'Roll on Chaos Table', { borderLeft: true, color: '#f59e0b' });
        } else if (subclass === "Control") {
            builder.addStatDisplay('10+' + statsMap.int, 'Demand Control', '1/round or on miss', { borderLeft: true, color: '#3b82f6' });
        }

        return builder.build();
    }
}

const CLASS_CONFIG = new MageClass();
