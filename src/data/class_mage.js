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
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 2, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Control", label: "Invoker of Control", accent: "#38bdf8" },
                { value: "Chaos", label: "Invoker of Chaos", accent: "#f97316" }
            ],
            spellSchools: ["Fire", "Ice", "Lightning"],
            subclassSchools: {
                "Control": ["Necrotic"],
                "Chaos": ["Wind"]
            },
            includeUtilitySpells: createUtilityConfig(null, "selectedMastery"),
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
        core[3] = [{ id: "mastery_1", name: "Elemental Mastery", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, desc: "Learn the Utility Spells from 1 spell school you know." }];
        
        core[4].push({ id: "spellshaper", name: "Spellshaper", type: "dynamic_choice", collection: "spellshapers", stateKey: "selectedShapers", desc: "Choose Spellshaper abilities as you level up. You may use 1/turn.", getCount: (level) => level >= 13 ? 3 : level >= 9 ? 2 : 1 });
        
        core[5].push({ id: "surge", name: "Elemental Surge", desc: (level) => {
            let surge = level >= 17 ? "WIL+2d4" : (level >= 10 ? "WIL+1d4" : "WIL");
            return `When you roll Initiative, regain <strong>${surge}</strong> mana (this expires at the end of combat if unused).`;
        }});
        
        core[6].push({ id: "mastery_2", name: "Elemental Mastery (2)", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, startIndex: 1, desc: "Learn the Utility Spells from a 2nd spell school you know." });
        core[14].push({ id: "mastery_3", name: "Elemental Mastery (3)", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, startIndex: 2, desc: "Learn the Utility Spells from a 3rd spell school you know." });
        
        core[20].push({ id: "archmage", name: "Archmage", desc: "+1 to any 2 of your stats. The first tiered spell you cast each encounter costs 1 action less and 5 fewer mana." });

        subclasses["Control"] = {
            3: [{ id: "force_will", name: "Force of Will", desc: "(1/round) On your turn, you may Demand Control: Choose 1 option from the Control Table which you haven't chosen yet; resets when you roll Initiative, or when you have chosen all options once. <strong>Deny Fate:</strong> Whenever you miss with a spell or an effect you cause is saved against, you MUST Demand Control." }],
            7: [{ id: "cost", name: "At Any Cost", desc: "Learn 1 cantrip and 1 tiered spell from the Necrotic school." }, { id: "nullify", name: "Nullify", desc: "(1/encounter) Ignore all disadvantage and other negative effects on your next action this turn, then Demand Control." }],
            11: [{ id: "steel_will", name: "Steel Will", desc: "(1/Safe Rest) Whenever you would fail a save, you may succeed instead. Whenever you roll a 1 on an Elemental Surge die, you may reroll it once." }],
            15: [{ id: "supreme_control", name: "Supreme Control", desc: "Whenever you Demand Control, you may choose to trigger the selected option twice. You may Demand Control as a Reaction." }]
        };
        subclasses["Chaos"] = {
            3: [{ id: "force_chaos", name: "Force of Chaos", desc: "Whenever you cast a spell, you can choose to spend 1 less mana. Whenever you do this and whenever you crit, Invoke Chaos: Roll on the Chaos Table." }],
            7: [{ id: "tempest", name: "Tempest Mage", desc: "Learn 1 cantrip and 1 tiered spell from the Wind school." }, { id: "chaos_lash", name: "Chaos Lash", desc: "(1/encounter) Reaction (when an enemy moves adjacent to you): They are pushed back 2 spaces, and on a failed WIL save, knocked Prone as well. Invoke Chaos." }],
            11: [{ id: "thrive", name: "Thrive in Chaos", desc: "Whenever you Invoke Chaos, you may roll twice and cause both effects. (1/Safe Rest) You may choose which roll to use instead." }],
            15: [{ id: "master_chaos", name: "Master of Chaos", desc: "Whenever you Invoke Chaos, roll with advantage." }]
        };
        
        return { core, subclasses };
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const totalWil = (state.baseWil || 0) + (state.addWil || 0);

        if (level >= 2) {
            builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        }

        if (level >= 5) {
            let surgeNotation = `${totalWil > 0 ? totalWil : ''}`; 
            let surgeDisplay = `+${totalWil}`;
            if (level >= 17) { surgeNotation = `2d4+${totalWil}`; surgeDisplay = `2d4+${totalWil}`; }
            else if (level >= 10) { surgeNotation = `1d4+${totalWil}`; surgeDisplay = `1d4+${totalWil}`; }
            
            builder.addRollDisplay(surgeNotation, 'Surge', surgeDisplay, 'Regain on Init', { type: 'surge' });
        }

        if (subclass === "Chaos") {
            builder.addCustom(`
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px dashed rgba(255,255,255,0.15); padding-left: 15px;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Chaos</label>
                    <button class="roll-link" onclick="dispatchRoll('1d20', 'Invoke Chaos')" 
                            style="background: rgba(249, 115, 22, 0.15); border: 1px solid var(--class-accent); color: #fff; font-family: 'Cinzel'; font-size: 0.8em; font-weight: bold; padding: 6px 10px; border-radius: 4px; cursor: pointer; text-transform: uppercase; width: 100%;">
                        Invoke
                    </button>
                </div>`);
        } else if (subclass === "Control") {
            builder.addCustom(`
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px dashed rgba(255,255,255,0.15); padding-left: 15px;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Control</label>
                    <div style="font-size: 0.65em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; text-align: center;">
                        Demand Control 1/round or on miss.
                    </div>
                </div>`);
        }

        return builder.build();
    }
}

const CLASS_CONFIG = new MageClass();
