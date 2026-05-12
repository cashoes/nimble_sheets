/**
 * Mage Class
 * Master of elemental forces & spellshaping.
 * @extends BaseClass
 */
class MageClass extends BaseClass {
    /**
     * Initializes the Mage class with its core configuration.
     */
    constructor() {
        super({
            name: "Mage",
            subtitle: "Master of elemental forces & spellshaping",
            keyStats: ['int', 'wil'],
            saves: { adv: 'int', dis: 'str' },
            proficiencies: { armor: "Cloth Armor", weapons: "Blades, Staves, Wands" },
            baseHp: 10,
            hpPerLevel: 6,
            hitDie: 6,
            theme: {
                accent: "#3b82f6",
                accentDim: "#1d4ed8",
                bodyBg: "#05060a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 100%), linear-gradient(180deg, #0a0c1a 0%, #05060a 100%)",
                panelBg: "rgba(15, 20, 35, 0.7)",
                border: "rgba(59, 130, 246, 0.3)"
            },
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 2, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { 
                    value: "Control", 
                    label: "Invoker of Control", 
                    accent: "#3b82f6",
                    config: {
                        includeCantripSpells: ["selectedAtAnyCost"],
                        includeTieredSpells: ["selectedAtAnyCost"],
                        mechanicPanelExtension: (builder, level, state) => {
                            if (level < 3) return;
                            const tableHtml = `
                                <div style="width: 100%; font-size: 0.55em; line-height: 1.2; color: var(--text-muted); display: flex; flex-direction: column; gap: 5px; padding: 2px;">
                                    <div style="text-align: left;">
                                        <div style="color: #fff; font-weight: bold; font-family: 'Cinzel'; letter-spacing: 0.5px;">I INSIST.</div>
                                        <div style="font-style: italic; opacity: 0.8;">Free cantrip (no DIS, no miss).</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: #fff; font-weight: bold; font-family: 'Cinzel'; letter-spacing: 0.5px;">ELEMENTAL AFFLICTION</div>
                                        <div style="font-style: italic; opacity: 0.8;">Target in 12 gains charged, smoldering, slowed</div>
                                    </div>
                                    <div style="text-align: left;">
                                        <div style="color: #fff; font-weight: bold; font-family: 'Cinzel'; letter-spacing: 0.5px;">NO.</div>
                                        <div style="font-style: italic; opacity: 0.8;">Target cannot harm 1 creature next turn.</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: #fff; font-weight: bold; font-family: 'Cinzel'; letter-spacing: 0.5px;">LOSE CONTROL.</div>
                                        <div style="font-style: italic; opacity: 0.8;">Do ALL (GM chooses).</div>
                                    </div>
                                </div>
                            `;
                            builder.addHtml(tableHtml, { flex: 4, align: 'stretch' });
                        }
                    }
                },
                { 
                    value: "Chaos", 
                    label: "Invoker of Chaos", 
                    accent: "#f59e0b",
                    config: {
                        includeCantripSpells: ["selectedTempestMage"],
                        includeTieredSpells: ["selectedTempestMage"],
                        mechanicPanelExtension: (builder) => {
                            builder.addHtml(`
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">Force of Chaos</label>
                                    <button class="roll-link" onclick="dispatchRoll('1d20', 'Invoke Chaos')" 
                                            style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fff; font-family: 'Cinzel'; font-size: 0.8em; font-weight: bold; padding: 6px 12px; border-radius: 4px; cursor: pointer; text-transform: uppercase;">
                                        Invoke Chaos
                                    </button>
                                </div>
                            `, { flex: 1.2, align: 'center' });
                        }
                    }
                }
            ],
            scalingStats: {
                surgeNotation: (l, s, state) => {
                    const wil = (state.baseWil || 0) + (state.addWil || 0);
                    if (l >= 17) return `2d4+${wil}`;
                    if (l >= 10) return `1d4+${wil}`;
                    return `${wil}`;
                },
                surgeDisplay: (l, s, state) => {
                    const wil = (state.baseWil || 0) + (state.addWil || 0);
                    if (l >= 17) return `2d4 + ${wil}`;
                    if (l >= 10) return `1d4 + ${wil}`;
                    return `+${wil}`;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived) => {
                if (level >= 5) {
                    builder.addRollDisplay(derived.surgeNotation, 'Elemental Surge', derived.surgeDisplay, 'Regain on Init', { flex: 1 });
                }
            },
            spellSchools: ["Fire", "Ice", "Lightning"],
            extraSchoolsKeys: ["selectedMastery"],
            spellProgression: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18],
            includeUtilitySpells: { 
                all: (l) => l >= 14 ? ["Fire", "Ice", "Lightning"] : false,
                selectKey: "selectedMastery" 
            },
            resources: [
                createManaResource('int', 'Mana Pool')
            ],
            featuresData: MageClass.FEATURES,
            optionsData: MageClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Mage class (Spellshaping).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            spellshapers: {
                "Dimensional Compression": { desc: "+4 range to a spell for each additional mana spent." },
                "Echo Casting": { desc: "(2x mana) Cast a tiered, single-target spell, then cast a free copy on a 2nd target." },
                "Elemental Destruction": { desc: "(1+ mana) After hit: spend 1-WIL mana to reroll 1 die per mana spent." },
                "Elemental Transmutation": { desc: "(1 mana) Change spell damage type to: Fire, Ice, Lightning, Necrotic, or Radiant." },
                "Extra-Dimensional Vision": { desc: "(2 mana) Ignore line of sight and obstacles to reach target you know is within range." },
                "Methodical Spellweaver": { desc: "(-2 mana) Spend 1 additional action to reduce spell cost by 2 (min 1)." },
                "Precise Casting": { desc: "(1+ mana) Choose 1 creature per mana spent to be unaffected by your AoE spell." },
                "Stretch Time": { desc: "(2 mana) Reduce the action cost of a spell by 1 (min 1)." }
            },
            masterySchools: {
                "Fire": { desc: "Gain access to all Fire utility spells." },
                "Ice": { desc: "Gain access to all Ice utility spells." },
                "Lightning": { desc: "Gain access to all Lightning utility spells." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Mage class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('INT or WIL', 'STR or DEX', true);

        // Class-specific core features (Level 1-3)
        core[1].push({ id: "spellcasting", name: "Elemental Spellcasting", desc: "You know all cantrips from the Fire, Ice, and Lightning schools." });

        core[2].push({ id: "researcher", name: "Talented Researcher", desc: "Advantage on Arcana/Lore checks when you have access to books/study time." });

        core[3].push({ 
            id: "mastery", 
            name: "Elemental Mastery", 
            type: "dynamic_choice", 
            collection: "masterySchools", 
            stateKey: "selectedMastery", 
            milestones: [3, 6, 14],
            getCount: (l) => l >= 14 ? 0 : (l >= 6 ? 2 : 1),
            desc: (level) => FeatureGen.createScalingList("Learn all Utility spells from one elemental school of your choice.", [
                { level: 6, text: "Elemental Mastery (2): Choose a 2nd school to master." },
                { level: 14, text: "Elemental Mastery (3): You have mastered all three elemental schools. You know all Utility spells from Fire, Ice, and Lightning." }
            ], level)
        });

        // Modular choices (Spellshaper)
        core[4].push({ 
            id: "shaping", 
            name: "Spellshaper", 
            type: "dynamic_choice", 
            collection: "spellshapers", 
            stateKey: "selectedShaping", 
            milestones: [4, 9, 13], 
            desc: "Choose modular Spellshaper upgrades.", 
            getCount: FeatureGen.createStandardCount([4, 9, 13]) 
        });

        subclasses["Control"] = {
            3: [
                { id: "force_will", name: "Force of Will", desc: "(1/round) On your turn, you may Demand Control: Choose 1 option from the Control Table which you haven't chosen yet; resets when you roll Initiative, or when you have chosen all options once." },
                { id: "deny_fate", name: "Deny Fate", desc: "Whenever you miss with a spell or an effect you cause is saved against, you MUST Demand Control." }
            ],
            7: [
                FeatureGen.createSpellChoiceFeature({
                    id: "at_any_cost",
                    name: "At Any Cost",
                    level: 7,
                    stateKey: "selectedAtAnyCost",
                    getCount: () => 2,
                    getSlots: (level, subclass, state) => [
                        { type: 'cantrip', schools: ["Necrotic"], label: 'Necrotic Cantrip' },
                        { type: 'tiered', tiers: [1, 2, 3], schools: ["Necrotic"], label: 'Necrotic Tiered Spell' }
                    ],
                    desc: "Gain access to dark powers. Choose 1 cantrip and 1 tiered spell (up to Tier 3) from the Necrotic school."
                }),
                { id: "nullify", name: "Nullify", desc: "(1/encounter) Ignore all disadvantage and other negative effects on your next action this turn, then Demand Control." }
            ],
            11: [
                { id: "steel_will", name: "Steel Will", desc: "(1/Safe Rest) Whenever you would fail a save, you may succeed instead. Whenever you roll a 1 on an Elemental Surge die, you may reroll it once." }
            ],
            15: [
                { id: "supreme_control", name: "Supreme Control", desc: "Whenever you Demand Control, you may choose to trigger the selected option twice. You may Demand Control as a Reaction." }
            ]
        };

        subclasses["Chaos"] = {
            3: [
                { id: "force_chaos", name: "Force of Chaos", desc: "Whenever you cast a spell, you can choose to spend 1 less mana. Whenever you do this and whenever you crit, Invoke Chaos: Roll on the Chaos Table." }
            ],
            7: [
                FeatureGen.createSpellChoiceFeature({
                    id: "tempest_mage",
                    name: "Tempest Mage",
                    level: 7,
                    stateKey: "selectedTempestMage",
                    getCount: () => 2,
                    getSlots: (level, subclass, state) => [
                        { type: 'cantrip', schools: ["Wind"], label: 'Wind Cantrip' },
                        { type: 'tiered', tiers: [1, 2, 3], schools: ["Wind"], label: 'Wind Tiered Spell' }
                    ],
                    desc: "You attune your soul to the storm. Choose 1 cantrip and 1 tiered spell (up to Tier 3) from the Wind school."
                }),
                { id: "chaos_lash", name: "Chaos Lash", desc: "(1/encounter) Reaction (when an enemy moves adjacent to you): They are pushed back 2 spaces, and on a failed WIL save, knocked Prone as well. Invoke Chaos." }
            ],
            11: [
                { id: "thrive_chaos", name: "Thrive in Chaos", desc: "Whenever you Invoke Chaos, you may roll twice and cause BOTH effects. (1/Safe Rest) You may choose which roll to use instead." }
            ],
            15: [
                { id: "master_chaos", name: "Master of Chaos", desc: "Whenever you Invoke Chaos, roll with advantage." }
            ]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new MageClass();
