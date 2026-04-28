const OATHSWORN_SPELLS = {
    decrees: {
      "Aura Support": [
          "Improved Aura",
          "Radiant Aura",
          "Well Armored"
      ],
      "Combat Offense": [
          "Explosive Judgment",
          "Reliable Justice",
          "Shining Mandate"
      ],
      "Protection": [
          "Blinding Aura",
          "Courage!",
          "Stand Fast, Friends!",
          "Unstoppable Protector"
      ]
    },
    unlocked: [
      { lvl: 2, school: "Radiant", name: "Rebuke" },
      { lvl: 2, school: "Radiant", name: "True Strike" },
      { lvl: 2, school: "Radiant", name: "Heal" },
      { lvl: 4, school: "Radiant", name: "Warding Bond" },
      { lvl: 6, school: "Radiant", name: "Shield of Justice" },
      { lvl: 8, school: "Radiant", name: "Condemn" },
      { lvl: 10, school: "Radiant", name: "Vengeance" },
      { lvl: 13, school: "Radiant", name: "Sacrifice" }
    ]
};

const DECREE_DESCS = {
    "Blinding Aura": "(1/Safe Rest) Action: Enemies in your aura are Blinded until the end of their next turn.",
    "Courage!": "(1/encounter) When you or an ally in your aura would drop to 0 HP, set their HP to 1 instead.",
    "Explosive Judgment": "(1/encounter) 2 actions: Expend your Judgment Dice, deal that much radiant damage to all enemies in your aura.",
    "Improved Aura": "+2 aura Reach.",
    "Radiant Aura": "Action: End any single harmful condition or effect on yourself or another willing creature within your aura. You may use this ability WIL times/Safe Rest.",
    "Reliable Justice": "Whenever you roll Judgment Dice, roll with advantage (roll one extra and drop the lowest).",
    "Shining Mandate": "The first time each round you are attacked while you already have Judgment Dice, select an ally within your aura to roll one and apply it to their next attack. You have advantage on skill checks to see through illusions.",
    "Stand Fast, Friends!": "When you roll Initiative, grant allies temp HP equal to your STR+WIL. You and allies within your aura have advantage against fear and effects that would move or knock Prone.",
    "Unstoppable Protector": "Gain +1 speed. You may Interpose even if you are restrained, stunned, or otherwise incapacitated. If you Interpose for a noncombatant NPC, you may Interpose again this round.",
    "Well Armored": "Whenever you Interpose, gain temp HP equal to your STR."
};

const CLASS_CONFIG = {
    name: "Oathsworn",
    subtitle: "Faithful guardian, protector, and avenger",
    keyStats: ['str', 'wil'], 
    saves: { adv: 'str', dis: 'dex' }, 
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

    initialStats: {
        baseStr: 2, baseDex: 0, baseInt: 1, baseWil: 1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Vengeance", label: "Vengeance", accent: "#ef4444" },
        { value: "Refuge", label: "Refuge", accent: "#f8fafc" },
        { value: "Oathbreaker", label: "Oathbreaker", accent: "#a855f7" }
    ],

    resources: [
        { id: 'manaCurrent', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? Math.max(0, stats.wil + level) : 0 },
        { id: 'lohCurrent', label: 'Lay on Hands', manual: true, calcMax: (level, stats) => level * 5 }
    ],

    customHeaderStats: [
        { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level, subclass) => level >= 3 && subclass !== 'None', getValue: (derived) => `R ${derived.auraReach}` }
    ],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let auraReach = 4; let woundMax = 6;
        let decrees = state.selectedDecrees || [];
        if (decrees.includes("Unstoppable Protector")) speed += 1;
        if (decrees.includes("Improved Aura")) auraReach += 2;
        if (subclass === "Oathbreaker" && level >= 3) woundMax += 2;

        let jdCount = 2; let faces = 6;
        if(level>=3){ faces=8; }
        if(level>=5){ faces=10; }
        if(level>=8){ faces=12; }
        if(level>=10){ faces=20; }
        if(level>=14){ jdCount+=1; }
        if(subclass === "Vengeance" && level >= 3) jdCount+=1;
        
        let jdAdvText = decrees.includes("Reliable Justice") ? " <em>(Adv)</em>" : "";
        let jdExplodeText = " <em>(Exploding)</em>";
        let jdText = `${jdCount}d${faces}${jdAdvText}${jdExplodeText}`;

        return { speed, auraReach, woundMax, jdText, jdCount, jdFaces: faces };
    },

    getShieldBonus: function(level, subclass, stats) {
        return (subclass === 'Refuge' && level >= 3) ? stats.wil : 0;
    },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const manaMax = (state.baseWil + state.addWil) + level;
        const lohMax = level * 5;
        let valColor = (state.judgmentValue !== null && state.judgmentValue !== undefined) ? "var(--gold-light)" : "#fff";
        let valText = (state.judgmentValue !== null && state.judgmentValue !== undefined) ? `+${state.judgmentValue}` : "-";
        let detailText = (state.judgmentValue !== null && state.judgmentValue !== undefined) ? `[ ${state.judgmentRolls} ]` : "Uncharged";
        
        let decrees = state.selectedDecrees || [];
        let isAdv = decrees.includes("Reliable Justice");
        let tags = `<span style="color:var(--text-muted); opacity:0.6; font-size:1.1em;">● Exploding</span>`;
        if (isAdv) tags += `<span style="color:var(--save-adv); margin-left:12px; font-size:1.1em;">● Advantage</span>`;

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 15px;">
                <!-- Column 1: Judgment -->
                <div style="flex: 1.8; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 5px;">
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">Judgment (${derived.jdFaces ? 'd' + derived.jdFaces : ''})</label>
                        <div style="display: flex; gap: 6px;">
                            <button onclick="CLASS_CONFIG.actions.rollJudgmentDice()" style="background: rgba(56,189,248,0.15); border: 1px solid var(--class-accent); color: #fff; font-size: 0.7em; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Roll ${derived.jdCount}</button>
                            <button onclick="CLASS_CONFIG.actions.spendJudgmentDice()" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: var(--text-muted); font-size: 0.7em; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-family:'Cinzel'; font-weight:bold;">Clear</button>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px; margin: 5px 0;">
                        <span style="font-size: 2.8em; font-family: 'Cinzel', serif; font-weight: bold; color: ${valColor}; line-height: 1;">${valText}</span>
                        <span style="font-size: 0.9em; color: var(--text-muted); font-style: italic; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${state.judgmentRolls}">${detailText}</span>
                    </div>
                    <div style="font-size: 0.7em; display: flex; width: 100%; justify-content: center; margin-top: auto; font-family:'Cinzel'; font-weight:bold; letter-spacing:1px;">${tags}</div>
                </div>

                ${level >= 2 ? `
                <!-- Column 2: Mana -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('manaCurrent', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_manaCurrent" value="${state.resourceValues.manaCurrent||0}" onchange="adjRes('manaCurrent', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('manaCurrent', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <!-- Column 3: LoH -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Lay on Hands</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('lohCurrent', -1, ${lohMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_lohCurrent" value="${state.resourceValues.lohCurrent||0}" onchange="adjRes('lohCurrent', parseInt(this.value), ${lohMax}, true)" style="width:28px; font-size: 1.4em;">
                        <button onclick="adjRes('lohCurrent', 1, ${lohMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${lohMax}</div>
                </div>
            </div>
        </div>`;
    },

    actions: {
        rollJudgmentDice: function() {
            let level = state.level; let subclass = state.subclass; let decrees = state.selectedDecrees || [];
            let jdCount = 2; let faces = 6;
            if(level>=3){ faces=8; }
            if(level>=5){ faces=10; }
            if(level>=8){ faces=12; }
            if(level>=10){ faces=20; }
            if(level>=14){ jdCount+=1; }
            if(subclass === "Vengeance" && level >= 3) jdCount+=1;

            let hasAdv = decrees.includes("Reliable Justice");
            let rollCount = hasAdv ? jdCount + 1 : jdCount;
            let diceChains = [];
            for(let i = 0; i < rollCount; i++) {
                let chain = []; let roll;
                do { roll = Math.floor(Math.random() * faces) + 1; chain.push(roll); } while (roll === faces);
                diceChains.push(chain);
            }
            let chainTotals = diceChains.map(c => c.reduce((a, b) => a + b, 0));
            let chainStrings = diceChains.map(c => c.join('+'));

            if (hasAdv) {
                let minVal = Math.min(...chainTotals);
                let minIdx = chainTotals.indexOf(minVal);
                let droppedString = chainStrings[minIdx];
                chainTotals.splice(minIdx, 1);
                chainStrings.splice(minIdx, 1);
                state.judgmentValue = chainTotals.reduce((a, b) => a + b, 0);
                state.judgmentRolls = `${chainStrings.join(', ')} <s>(${droppedString})</s>`;
            } else {
                state.judgmentValue = chainTotals.reduce((a, b) => a + b, 0);
                state.judgmentRolls = chainStrings.join(', ');
            }
            saveState(); render();
        },
        spendJudgmentDice: function() { state.judgmentValue = null; state.judgmentRolls = null; saveState(); render(); }
    },

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = ""; 
        const sCls = "subclass-feature";

        fHtml += bFeat("Oathsworn Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> STR(+), DEX(-)<br><strong>Armor:</strong> All Armor | <strong>Weapons:</strong> STR Weapons`, "", true);
        if (subclass === "Oathbreaker") {
            fHtml += bFeat("Aura of Suffering", 1, `Replaces standard Radiant Judgment. Judgment Dice (<strong>${derived.jdText}</strong>) trigger whenever you could Interpose but don't.`, sCls);
            fHtml += bFeat("Dark Benediction", 1, `Lose access to True Strike, Heal, and Warding Bond. Gain access to Entice, Shadow Trap, and Dread Visage. Choose Radiant or Necrotic Utility Spells.`, sCls);
        } else {
            fHtml += bFeat("Radiant Judgment", 1, `When an enemy attacks you, if you have 0 Judgment Dice, roll <strong>${derived.jdText}</strong>. Next hit deals that much extra radiant damage.`);
        }
        fHtml += bFeat("Lay on Hands", 1, `Magical pool of <strong>${level*5}</strong> healing power. Action: Touch target, spend points to restore HP.`);
        if (level >= 2) {
            fHtml += bFeat("Zealot", 2, "Melee attacks: spend mana for Condemning Strike (+5 radiant dmg) or Blessed Aim (-1 target armor).");
            if (subclass === "Oathbreaker") fHtml += bFeat("Paragon of Power", 2, "Advantage on Might checks to intimidate.", sCls);
            else fHtml += bFeat("Paragon of Virtue", 2, "Advantage on Influence when telling the truth.");
        }
        if (level >= 3) {
            let numDecrees = level>=16?6 : level>=14?5 : level>=12?4 : level>=9?3 : level>=6?2 : 1;
            let dState = state.selectedDecrees || [];
            let opts = `<option value="None">Select a Sacred Decree...</option>`;
            Object.keys(OATHSWORN_SPELLS.decrees).forEach(group => {
                opts += `<optgroup label="${group}">`;
                OATHSWORN_SPELLS.decrees[group].forEach(k => opts += `<option value="${k}">${k}</option>`);
                opts += `</optgroup>`;
            });
            let dHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<numDecrees; i++) {
                let val = dState[i] || "None";
                dHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--slate-lighter); border-left: 3px solid var(--accent-blue);">
                    <select onchange="updateClassState('selectedDecrees', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid var(--slate-lighter); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(DECREE_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Sacred Decrees", 3, `You know <strong>${numDecrees}</strong> Sacred Decree(s).${dHtml}</div>`, "", true);
            if (subclass === "Vengeance") fHtml += bFeat("Aura of Zeal", 3, `Roll 1 more JD. Reach ${derived.auraReach} aura. JD triggers when ally in aura is attacked.`, sCls);
            else if (subclass === "Refuge") fHtml += bFeat("Aura of Refuge", 3, `Shields gain +WIL armor. Reach ${derived.auraReach} aura. Interpose anywhere within aura.`, sCls);
            else if (subclass === "Oathbreaker") {
                fHtml += bFeat("We All Suffer", 3, `+2 max Wounds. Reach ${derived.auraReach} aura. Suffer ally's wound/failed save to trigger JD.`, sCls);
                fHtml += bFeat("Bring Me Your Pain", 3, `Reaction: Switch HP with willing dying ally.`, sCls);
            }
        }
        if (level >= 4) fHtml += bFeat("My Life, for My Friends", 4, "Free Interpose reaction.");
        return fHtml;
    },

    getSpellCardsHTML: function(level, subclass, state, derived, formatPips, iStats) {
        let sHtml = ""; let spells = state.selectedSpells || [];
        const ssCls = "subclass-spell";
        
        if (level >= 7) {
            let numSpells = level >= 11 ? 2 : 1;
            for(let i=0; i<numSpells; i++) {
                let val = spells[i] || "None"; 
                let sClass = subclass==="Oathbreaker" && UTILITY_SPELLS.Necrotic[val] ? ssCls : "";
                let opts = `<option value="None">Select a Utility Spell...</option>`;
                if(subclass==="Oathbreaker") {
                    opts += `<optgroup label="Radiant">`; Object.keys(UTILITY_SPELLS.Radiant).forEach(k => opts += `<option value="${k}">${k}</option>`);
                    opts += `</optgroup><optgroup label="Necrotic">`; Object.keys(UTILITY_SPELLS.Necrotic).forEach(k => opts += `<option value="${k}">${k}</option>`); opts += `</optgroup>`;
                } else { Object.keys(UTILITY_SPELLS.Radiant).forEach(k => opts += `<option value="${k}">${k}</option>`); }
                let desc = UTILITY_SPELLS.Radiant[val] || UTILITY_SPELLS.Necrotic[val] || "";
                sHtml += `<div class="spell-card ${sClass}"><h4><select onchange="updateClassState('selectedSpells', ${i}, this.value)" style="border:none; border-bottom:1px solid var(--slate-lighter); background:transparent; color:#fff; width:70%; font-size: 1em;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select><span class="tier-tag">${formatPips("Utility")}</span></h4><div class="spell-desc">${iStats(desc)}</div></div>`;
            }
        }
        OATHSWORN_SPELLS.unlocked.filter(s => level >= s.lvl).forEach(spell => {
            let name = spell.name; let school = spell.school; let sClass = "";
            if (subclass === "Oathbreaker") {
                sClass = ssCls;
                if (name === "True Strike") { name = "Entice"; school = "Necrotic"; }
                else if (name === "Heal") { name = "Shadow Trap"; school = "Necrotic"; }
                else if (name === "Warding Bond") { name = "Dread Visage"; school = "Necrotic"; }
            }
            const data = SPELL_REGISTRY[school][name];
            if (data) {
                sHtml += `<div class="spell-card ${sClass}"><h4>${name} <span class="tier-tag">${formatPips(data.tier)}</span></h4><div class="spell-desc">${iStats(data.desc)}</div></div>`;
            }
        });
        return sHtml;
    }
};