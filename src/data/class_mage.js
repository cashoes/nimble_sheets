const MAGE_DATA = {
    spellshapers: [
        "Dimensional Compression",
        "Echo Casting",
        "Elemental Destruction",
        "Elemental Transmutation",
        "Extra-Dimensional Vision",
        "Methodical Spellweaver",
        "Precise Casting",
        "Stretch Time"
    ],
    controlTable: [
        "I INSIST (Cast free cantrip, no DIS, cannot miss)",
        "ELEMENTAL AFFLICTION (12 reach: Charged, Smoldering, or Slowed)",
        "NO (Choose creature; cannot harm chosen target next turn)",
        "LOSE CONTROL (GM chooses one of the above)"
    ]
};

const MAGE_DESCS = {
    "Dimensional Compression": "+4 range to a spell for each additional mana spent.",
    "Echo Casting": "(2x mana) Cast a tiered, single-target spell, then cast a free copy on a 2nd target.",
    "Elemental Destruction": "(1+ mana) After hit: spend 1-WIL mana to reroll 1 die per mana spent.",
    "Elemental Transmutation": "(1 mana) Change spell damage type to: Fire, Ice, Lightning, Necrotic, or Radiant.",
    "Extra-Dimensional Vision": "(2 mana) Ignore line of sight and obstacles to reach target you know is within range.",
    "Methodical Spellweaver": "(-2 mana) Spend 1 additional action to reduce spell cost by 2 (min 1).",
    "Precise Casting": "(1+ mana) Choose 1 creature per mana spent to be unaffected by your AoE spell.",
    "Stretch Time": "(2 mana) Reduce the action cost of a spell by 1 (min 1)."
};

const CLASS_CONFIG = {
    name: "Mage",
    subtitle: "Master of elemental forces and spellshaping",
    keyStats: ['int', 'wil'], 
    saves: { adv: 'int', dis: 'str' }, 
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
        baseStr: -1, baseDex: 1, baseInt: 3, baseWil: 1
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
        const manaMax = (state.baseInt + state.addInt) * 3 + level;

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 15px; justify-content: center;">
                ${level >= 2 ? `
                <!-- Column 1: Mana -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <!-- Column 2: Elemental Surge -->
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; ${level >= 2 ? 'border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px;' : ''} justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Surge</label>
                    <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">+${state.baseWil + state.addWil}</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 8px; font-family: 'Crimson Text'; font-style: italic;">Regain on Initiative</div>
                </div>

                <!-- Column 3: Cantrip Power -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Cantrips</label>
                    <div style="font-size: 2.2em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">+${derived.cDmg}</div>
                    <div style="font-size: 0.8em; color: var(--gold-light); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">BONUS</div>
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Mage Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> INT(+), STR(-)<br><strong>Armor:</strong> Cloth | <strong>Weapons:</strong> Blades, Staves, Wands`, "", true);
        fHtml += bFeat("Elemental Spellcasting", 1, `You know all cantrips from the Fire, Ice, and Lightning schools.`);

        if (level >= 2) {
            fHtml += bFeat("Mana Pool", 2, `You gain a mana pool (<strong>INTx3+LVL</strong>) to cast tiered spells.`);
            fHtml += bFeat("Talented Researcher", 2, `Advantage on Arcana/Lore checks when you have access to books/study time.`);
        }

        if (level >= 3) {
            fHtml += bFeat("Elemental Mastery", 3, `Learn all Utility spells from one elemental school of your choice.`);
            if (subclass === "Control") {
                fHtml += bFeat("Force of Will", 3, `1/round: Choose 1 option from the Control Table. You must cycle through all options before resetting.`, sCls);
                fHtml += bFeat("Control Table", 3, `<div style="font-size:0.9em; color:var(--text-muted); margin-top:8px;">● <strong>I INSIST:</strong> Free cantrip, no DIS, cannot miss.<br>● <strong>AFFLICTION:</strong> Target in 12 reach Smolders, Slows, or Charges.<br>● <strong>NO:</strong> Creature cannot harm chosen target next turn.</div>`, sCls, true);
            } else if (subclass === "Chaos") {
                fHtml += bFeat("Force of Chaos", 3, `Spend 1 less mana on a spell to Invoke Chaos: Roll on the Chaos Table if you crit or roll a 1.`, sCls);
            }
        }

        if (level >= 4) {
            let nShapers = level >= 13 ? 3 : level >= 9 ? 2 : 1;
            let sState = state.selectedShapers || [];
            let opts = `<option value="None">Select a Spellshaper...</option>`;
            MAGE_DATA.spellshapers.forEach(k => opts += `<option value="${k}">${k}</option>`);

            let sHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<nShapers; i++) {
                let val = sState[i] || "None";
                sHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedShapers', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(96, 165, 250, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(MAGE_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Spellshaper", 4, `Choose <strong>${nShapers}</strong> modular spell upgrades.${sHtml}</div>`, "", true);
        }

        if (level >= 5) {
            let surge = `WIL`;
            if (level >= 17) surge = `WIL+2d4`;
            else if (level >= 10) surge = `WIL+1d4`;
            fHtml += bFeat("Elemental Surge", 5, `Roll Init: Regain <strong>${surge}</strong> mana (expires end of combat).`);
        }

        return fHtml;
    },

    getSpellCardsHTML: function(level, subclass, state, derived, formatPips, iStats) {
        let sHtml = "";
        const schools = ["Fire", "Ice", "Lightning"];

        schools.forEach(school => {
            sHtml += `<h3 style="font-family:'Cinzel'; font-size:0.8em; color:var(--gold-light); margin:10px 0 5px 0; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:2px;">${school}</h3>`;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                if (data.tier.includes("Cantrip") || (level >= 2 && level >= (tNum*2))) {
                    sHtml += `<div class="spell-card ${school.toLowerCase()}"><h4>${name} <span class="tier-tag">${formatPips(data.tier)}</span></h4><div class="spell-desc">${iStats(data.desc)}</div></div>`;
                }
            });
        });

        return sHtml;
    }
};