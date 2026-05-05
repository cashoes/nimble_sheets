const MAGE_OPTIONS = {
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

const MAGE_FEATURES = {
    core: {
        1: [
            { id: "spellcasting", name: "Elemental Spellcasting", desc: "You know all cantrips from the Fire, Ice, and Lightning schools." }
        ],
        2: [
            { id: "mana", name: "Mana Pool", desc: "You gain a mana pool (<strong>INTx3+LVL</strong>) to cast tiered spells." },
            { id: "researcher", name: "Talented Researcher", desc: "Advantage on Arcana/Lore checks when you have access to books/study time." }
        ],
        3: [
            { id: "mastery_1", name: "Elemental Mastery", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, desc: "Learn all Utility spells from one elemental school of your choice." }
        ],
        4: [
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 INT or WIL.", minor: true },
            { id: "tier_2", name: "Tier 2 Spells", desc: "You gain access to Tier 2 spells.", minor: true },
            { id: "spellshaper", name: "Spellshaper", type: "dynamic_choice", collection: "spellshapers", stateKey: "selectedShapers", desc: "Choose modular shadow powers.", getCount: (level) => level >= 13 ? 3 : level >= 9 ? 2 : 1 }
        ],
        5: [
            { id: "surge", name: "Elemental Surge", desc: (level) => {
                let surge = `WIL`;
                if (level >= 17) surge = `WIL+2d4`;
                else if (level >= 10) surge = `WIL+1d4`;
                return `Roll Init: Regain <strong>${surge}</strong> mana (expires end of combat).`;
            }},
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true },
            { id: "cantrips_1", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger (+5 damage).", minor: true }
        ],
        6: [
            { id: "mastery_2", name: "Elemental Mastery (2)", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, startIndex: 1, desc: "Learn all Utility spells from a 2nd elemental school of your choice." },
            { id: "tier_3", name: "Tier 3 Spells", desc: "You gain access to Tier 3 spells.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 INT or WIL.", minor: true },
            { id: "tier_4", name: "Tier 4 Spells", desc: "You gain access to Tier 4 spells.", minor: true }
        ],
        9: [
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        10: [
            { id: "cantrips_2", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger (+5 damage).", minor: true },
            { id: "tier_5", name: "Tier 5 Spells", desc: "You gain access to Tier 5 spells.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 INT or WIL.", minor: true },
            { id: "tier_6", name: "Tier 6 Spells", desc: "You gain access to Tier 6 spells.", minor: true }
        ],
        13: [
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        14: [
            { id: "mastery_3", name: "Elemental Mastery (3)", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, startIndex: 2, desc: "Learn all Utility spells from your 3rd elemental school." },
            { id: "tier_7", name: "Tier 7 Spells", desc: "You gain access to Tier 7 spells.", minor: true }
        ],
        15: [
            { id: "cantrips_3", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger (+5 damage).", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 INT or WIL.", minor: true },
            { id: "tier_8", name: "Tier 8 Spells", desc: "You gain access to Tier 8 spells.", minor: true }
        ],
        17: [
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        18: [
            { id: "tier_9", name: "Tier 9 Spells", desc: "You gain access to Tier 9 spells.", minor: true }
        ],
        20: [
            { id: "archmage", name: "Archmage", desc: "+1 to any 2 of your stats. The first tiered spell you cast each encounter costs 1 action less and 5 fewer mana." },
            { id: "cantrips_4", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger (+5 damage).", minor: true }
        ]
    },
    subclasses: {
        "Control": {
            3: [
                { id: "force_will", name: "Force of Will", desc: "1/round: Choose 1 option from the Control Table. You must cycle through all options before resetting (resets on Initiative). <br><strong>Deny Fate:</strong> Whenever you miss with a spell or an effect you cause is saved against, you MUST Demand Control." },
                { id: "control_table", name: "Control Table", desc: `<div style="font-size:0.9em; color:var(--text-muted); margin-top:8px;">
                    ● <strong>I INSIST:</strong> Cast a cantrip for free, ignoring all disadvantage; it cannot miss.<br>
                    ● <strong>ELEMENTAL AFFLICTION:</strong> A creature within 12 reach gains the Charged, Smoldering, or Slowed condition.<br>
                    ● <strong>NO:</strong> Choose a creature; it cannot harm a creature of your choice during its next turn.<br>
                    ● <strong>LOSE CONTROL:</strong> Do ALL of the above, but the GM chooses each time.</div>` }
            ],
            7: [
                { id: "cost", name: "At Any Cost", desc: "Learn 1 cantrip and 1 tiered spell from the Necrotic school." },
                { id: "nullify", name: "Nullify", desc: "(1/encounter) Ignore all disadvantage and other negative effects on your next action, then Demand Control." }
            ],
            11: [
                { id: "steel_will", name: "Steel Will", desc: "(1/Safe Rest) Automatically succeed on a failed save. Reroll 1s on Elemental Surge dice." }
            ],
            15: [
                { id: "supreme_control", name: "Supreme Control", desc: "Whenever you Demand Control, you may choose to trigger the selected option twice. You may Demand Control as a Reaction." }
            ]
        },
        "Chaos": {
            3: [
                { id: "force_chaos", name: "Force of Chaos", desc: "Whenever you cast a spell, you can choose to spend 1 less mana. Whenever you do this and whenever you crit, Invoke Chaos: Roll on the Chaos Table." }
            ],
            7: [
                { id: "tempest", name: "Tempest Mage", desc: "Learn 1 cantrip and 1 tiered spell from the Wind school." },
                { id: "chaos_lash", name: "Chaos Lash", desc: "(1/encounter) Reaction (when an enemy moves adjacent to you): They are pushed back 2 spaces, and on a failed WIL save, knocked Prone as well. Invoke Chaos." }
            ],
            11: [
                { id: "thrive", name: "Thrive in Chaos", desc: "Whenever you Invoke Chaos, you may roll twice and cause BOTH effects. (1/Safe Rest) You may choose which roll to use instead." }
            ],
            15: [
                { id: "master_chaos", name: "Master of Chaos", desc: "Whenever you Invoke Chaos, roll with advantage." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Mage",
    subtitle: "Master of elemental forces & spellshaping",
    keyStats: ['int', 'wil'], 
    saves: { adv: 'int', dis: 'str' }, 
    proficiencies: {
        armor: "Cloth",
        weapons: "Blades, Staves, Wands"
    },
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

    initialStats: {
        baseStr: -1, baseDex: 1, baseInt: 3, baseWil: -1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Control", label: "Invoker of Control", accent: "#38bdf8" },
        { value: "Chaos", label: "Invoker of Chaos", accent: "#f97316" }
    ],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.int * 3) + level : 0 }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        let cDmg = 0;
        if (level >= 5) cDmg += 5;
        if (level >= 10) cDmg += 5;
        if (level >= 15) cDmg += 5;
        if (level >= 20) cDmg += 5;

        return { speed, woundMax, cDmg };
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const totalInt = (state.baseInt || 0) + (state.addInt || 0);
        const totalWil = (state.baseWil || 0) + (state.addWil || 0);
        const manaMax = totalInt * 3 + level;

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; padding: 5px 10px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 10px; justify-content: center;">
                ${level >= 2 ? `
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px; justify-content: center; text-align: center;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Mana Pool</label>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="dark-incrementer" style="padding: 4px 6px;">
                            <button onclick="adjRes('mana', -1, ${manaMax})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">-</button>
                            <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:32px; font-size: 1.3em;">
                            <button onclick="adjRes('mana', 1, ${manaMax})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">+</button>
                        </div>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 0.95em;">/ ${manaMax}</div>
                    </div>
                </div>` : ''}

                ${level >= 5 ? `
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px; justify-content: center; text-align: center;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Surge</label>
                    <div style="font-size: 2.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">+${totalWil}</div>
                    <div style="font-size: 0.65em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic;">Regain on Init</div>
                </div>` : ''}

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Cantrips</label>
                    <div style="font-size: 2.0em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">+${derived.cDmg}</div>
                    <div style="font-size: 0.7em; color: var(--gold-light); font-weight:bold; font-family:'Cinzel';">DMG</div>
                </div>
            </div>
            ${subclass === "Chaos" ? `
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15); display: flex; flex-direction: column; text-align: center;">
                <div class="roll-link" onclick="dispatchRoll('1d20', 'Invoke Chaos')" style="color: var(--class-accent); font-size: 0.85em; font-weight: bold; text-transform: uppercase; font-family: 'Cinzel'; letter-spacing: 1px; cursor:pointer;">Invoke Chaos (1d20)</div>
            </div>` : subclass === "Control" && level >= 3 ? `
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15); display: flex; flex-direction: column; gap: 2px; text-align: center;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px; font-size: 0.65em; color: var(--text-muted); font-family: 'Crimson Text';">
                    <div style="text-align: right;"><strong>I INSIST:</strong> Cantrip Hit</div>
                    <div style="text-align: left;"><strong>AFFLICTION:</strong> Condition</div>
                    <div style="text-align: right;"><strong>NO:</strong> Disarm Harm</div>
                    <div style="text-align: left;"><strong>LOSE:</strong> ALL (GM)</div>
                </div>
            </div>` : ''}
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = MAGE_FEATURES.subclasses[subclass] || {};
        const replacedIds = new Set();

        Object.values(subData).forEach(lvlFeats => {
            lvlFeats.forEach(f => {
                if (f.replaces) {
                    if (Array.isArray(f.replaces)) f.replaces.forEach(id => replacedIds.add(id));
                    else replacedIds.add(f.replaces);
                }
            });
        });

        for (let l = 1; l <= level; l++) {
            if (MAGE_FEATURES.core[l]) {
                MAGE_FEATURES.core[l].forEach(feat => {
                    if (!replacedIds.has(feat.id)) {
                        fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips, rSSC);
                    }
                });
            }
            if (subData[l]) {
                subData[l].forEach(feat => {
                    fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips, rSSC, sCls);
                });
            }
        }

        return fHtml;
    },

    renderFeature: function (feat, level, subclass, state, bFeat, iStats, formatPips, rSSC, cssClass) {
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice";
        let count = feat.type === "dynamic_choice" ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let context = (feat.id === "spellcasting" || feat.id === "tempest") ? { type: 'cantrip' } : {};
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state), rSSC) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        const statsMap = { str: state.baseStr + state.addStr, dex: state.baseDex + state.addDex, int: state.baseInt + state.addInt, wil: state.baseWil + state.addWil };

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(MAGE_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && MAGE_OPTIONS[collection][val]) ? MAGE_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, statsMap, context)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice, level, statsMap, context);
    },

    getAvailableSpells: function(level, subclass, state, derived) {
        let spells = [];
        const baseSchools = ["Fire", "Ice", "Lightning"];
        
        // 1. Gather all tiered spells and cantrips from base schools
        baseSchools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : (tNum * 2);
                if (level >= requiredLevel) {
                    spells.push({ name, ...data, school });
                }
            });
        });

        // 2. Subclass-specific additions
        if (subclass === "Control" && level >= 7) {
            if (SPELL_REGISTRY["Necrotic"]) {
                const necroticSpells = Object.entries(SPELL_REGISTRY["Necrotic"]);
                const cantrip = necroticSpells.find(([n, d]) => d.tier.includes("Cantrip"));
                if (cantrip) spells.push({ name: cantrip[0], ...cantrip[1], school: "Necrotic" });
                const tiered = necroticSpells.find(([n, d]) => !d.tier.includes("Cantrip"));
                if (tiered) spells.push({ name: tiered[0], ...tiered[1], school: "Necrotic" });
            }
        } else if (subclass === "Chaos" && level >= 7) {
            if (SPELL_REGISTRY["Wind"]) {
                const windSpells = Object.entries(SPELL_REGISTRY["Wind"]);
                const cantrip = windSpells.find(([n, d]) => d.tier.includes("Cantrip"));
                if (cantrip) spells.push({ name: cantrip[0], ...cantrip[1], school: "Wind" });
                const tiered = windSpells.find(([n, d]) => !d.tier.includes("Cantrip"));
                if (tiered) spells.push({ name: tiered[0], ...tiered[1], school: "Wind" });
            }
        }

        // 3. Elemental Mastery (Utility Spells)
        const masterySelections = state.selectedMastery || [];
        masterySelections.forEach(sch => {
            if (sch !== "None" && UTILITY_SPELLS[sch]) {
                Object.entries(UTILITY_SPELLS[sch]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school: sch });
                });
            }
        });

        return spells;
    }
};