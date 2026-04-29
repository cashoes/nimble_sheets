const SHEPHERD_DATA = {
    graces: [
        "Assist Me, My Friend!",
        "Empowered Companion",
        "Guiding Spirit",
        "Hasty Companion",
        "Illuminate Soul",
        "Light Bearer",
        "Not Beyond MY Reach",
        "Vengeful Spirit"
    ],
    unlocked: [
        { lvl: 1, school: "Radiant", name: "Rebuke" },
        { lvl: 1, school: "Necrotic", name: "Shadow Blast" },
        { lvl: 2, school: "Radiant", name: "Heal" },
        { lvl: 2, school: "Necrotic", name: "Shadow Trap" },
        { lvl: 4, school: "Radiant", name: "Warding Bond" },
        { lvl: 4, school: "Necrotic", name: "Dread Visage" },
        { lvl: 6, school: "Radiant", name: "Shield of Justice" },
        { lvl: 6, school: "Necrotic", name: "Greater Shadow" },
        { lvl: 8, school: "Radiant", name: "Condemn" },
        { lvl: 8, school: "Necrotic", name: "Gangrenous Burst" },
        { lvl: 10, school: "Radiant", name: "Vengeance" },
        { lvl: 10, school: "Necrotic", name: "Unspeakable Word" },
        { lvl: 12, school: "Radiant", name: "Sacrifice" },
        { lvl: 12, school: "Necrotic", name: "Creeping Death" }
    ]
};

const GRACE_DESCS = {
    "Assist Me, My Friend!": "Whenever you make your first melee attack each round, you may add your Lifebinding Spirit's damage to the attack.",
    "Empowered Companion": "When summoning your Spirit, you cast it as if you spent 1 additional mana (ignoring tier limits). Max die size becomes d20.",
    "Guiding Spirit": "When your Spirit rolls a 6+ on damage, the target glows; the next attack against them has advantage.",
    "Hasty Companion": "+4 Reach for your Spirit. It can act for free when summoned.",
    "Illuminate Soul": "Action: A creature within 6 spaces glows for 1 round; attacks against them have advantage OR disadvantage (your choice). WIL times/Safe Rest.",
    "Light Bearer": "Regain 1 Searing Light use when you roll Initiative (expires at end of combat).",
    "Not Beyond MY Reach": "Target dead <1 round for healing. For every 10 HP healed, they recover 1 Wound instead (must heal 1+ Wound to revive).",
    "Vengeful Spirit": "Action: Spirit sacrifices itself in a vortex of light. At end of your turn, deals dmg to all enemies within 3 spaces equal to its remaining healing charges."
};

const CLASS_CONFIG = {
    name: "Shepherd",
    subtitle: "Master of life and death, leader of spirits",
    keyStats: ['wil', 'str'], 
    saves: { adv: 'wil', dis: 'dex' }, 
    baseHp: 17,
    hpPerLevel: 8,
    hitDie: 10,
    
    theme: {
        accent: "#a855f7",
        accentDim: "#6b21a8",
        bodyBg: "#0a0712",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.1) 0%, transparent 100%), linear-gradient(180deg, #130f24 0%, #0a0712 100%)",
        panelBg: "rgba(25, 20, 45, 0.75)",
        border: "rgba(168, 85, 247, 0.3)"
    },

    initialStats: {
        baseStr: 1, baseDex: 0, baseInt: 1, baseWil: 2
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Mercy", label: "Luminary of Mercy", accent: "#f8fafc" },
        { value: "Malice", label: "Luminary of Malice", accent: "#4ade80" }
    ],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.wil * 3) + level : 0 },
        { id: 'searingLight', label: 'Searing Light', manual: true, calcMax: (level, stats) => stats.wil }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; 
        let woundMax = 6;
        let hdFace = 10;
        
        let spiritDmg = "1d6";
        if (level >= 5) spiritDmg = "1d8"; 
        
        return { speed, woundMax, hdFace, spiritDmg };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        if (subclass === "Malice" && level >= 15) overrides.armor = (overrides.armor || 0) + statsMap.wil;
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const manaMax = ((state.baseWil + state.addWil) * 3) + level;
        const searingMax = state.baseWil + state.addWil;
        
        let spiritType = subclass === "Malice" ? "Deadly" : "Lifebinding";
        let spiritColor = subclass === "Malice" ? "var(--save-adv)" : "var(--class-accent)";

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 12px;">
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

                <!-- Column 2: Searing Light -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Searing Light</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('searingLight', -1, ${searingMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_searingLight" value="${state.resourceValues.searingLight||0}" onchange="adjRes('searingLight', parseInt(this.value), ${searingMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('searingLight', 1, ${searingMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${searingMax}</div>
                </div>

                <!-- Column 3: Spirit -->
                <div style="flex: 1.4; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Twilight Spirit ${level < 2 ? '(Lvl 2)' : ''}</label>
                    ${level >= 2 ? `
                        <div style="font-size: 1.8em; color: ${spiritColor}; font-weight: bold; font-family: 'Cinzel', serif; text-transform: uppercase; line-height: 1; margin: auto 0;">${spiritType}</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: auto; font-family:'Cinzel'; font-weight:bold;">${derived.spiritDmg}+WIL</div>
                    ` : '<div style="font-size: 0.8em; color: var(--text-muted); font-style: italic; margin: auto 0;">Unlocked at Level 2</div>'}
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Shepherd Basics", "", `<strong>Hit Die:</strong> 1d${derived.hdFace} | <strong>Saves:</strong> WIL(+), DEX(-)<br><strong>Armor:</strong> Mail, Shields | <strong>Weapons:</strong> STR Weapons, Wands`, "", true);
        fHtml += bFeat("Searing Light", 1, `Action: Heal <strong>WIL</strong> d8 HP to Dying creature within 6. OR: Inflict <strong>WIL</strong> d8 radiant damage to Undead/Bloodied enemy.`);
        
        if (level >= 2) {
            fHtml += bFeat("Lifebinding Spirit", 2, `Action: Summon spirit companion. Lasts until rest or it acts (attacks/heals) a number of times equal to <strong>Mana Spent</strong> to summon it.`);
        }

        if (level >= 3) {
            if (subclass === "Mercy") {
                fHtml += bFeat("Merciful Healing", 3, `Effects that heal Dying creatures heal twice as much. (1/round) Spirit acts for free while you are Dying.`, sCls);
                fHtml += bFeat("Life is Beautiful", 3, `Harmless creatures follow you. Flowers bloom vibrantly in your presence.`, sCls);
            } else if (subclass === "Malice") {
                fHtml += bFeat("Soul Reaper", 3, `When using Searing Light to harm, make a 2nd enemy within range take same damage.`, sCls);
                fHtml += bFeat("Harbinger of Decay", 3, `Foods spoil and flies awaken where you lodge. Spirit deals Necrotic damage.`, sCls);
            }
        }

        if (level >= 4) {
            fHtml += bFeat("Key Stat Increase", 4, `+1 WIL or STR.`);
        }

        if (level >= 5) {
            let numGraces = level >= 17 ? 4 : level >= 13 ? 3 : level >= 9 ? 2 : 1;
            let gState = state.selectedGraces || [];
            let opts = `<option value="None">Select a Sacred Grace...</option>`;
            SHEPHERD_DATA.graces.forEach(k => opts += `<option value="${k}">${k}</option>`);
            
            let gHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<numGraces; i++) {
                let val = gState[i] || "None";
                gHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedGraces', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(168, 85, 247, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(GRACE_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Sacred Graces", 5, `Choose <strong>${numGraces}</strong> graces.${gHtml}</div>`, "", true);
            fHtml += bFeat("Secondary Stat Increase", 5, `+1 INT or DEX.`);
            fHtml += bFeat("Upgraded Cantrips", 5, `Your shadow/radiant cantrips grow stronger.`);
        }

        if (level >= 7) {
            if (subclass === "Mercy") fHtml += bFeat("Conduit of Light", 7, `When an effect caused by you would heal HP, you may expend 1 use of Searing Light to heal another target within 6 spaces for the same amount.`, sCls);
            else if (subclass === "Malice") fHtml += bFeat("Veilwalker’s Blessing", 7, `(1/Safe Rest) Reaction: When you would drop to 0 HP, drop to 1 instead and force enemy in 6 reach to STR save or become Bloodied (or 0 HP if already Bloodied).`, sCls);
        }

        if (level >= 8) fHtml += bFeat("Key Stat Increase", 8, `+1 WIL or STR.`);
        if (level >= 9) fHtml += bFeat("Secondary Stat Increase", 9, `+1 INT or DEX.`);

        if (level >= 11) {
            if (subclass === "Mercy") fHtml += bFeat("Powerful Healer", 11, `(WIL times/Safe Rest) When rolling dice to heal, you may take the max possible amount or give that many Temp HP.`, sCls);
            else if (subclass === "Malice") fHtml += bFeat("Deathbringer’s Touch", 11, `First melee attack each round against Bloodied creature is auto-crit. Spirit deals +STR damage.`, sCls);
        }

        if (level >= 12) fHtml += bFeat("Key Stat Increase", 12, `+1 WIL or STR.`);
        if (level >= 13) fHtml += bFeat("Secondary Stat Increase", 13, `+1 INT or DEX.`);

        if (level >= 15) {
            if (subclass === "Mercy") fHtml += bFeat("Empowered Conduit", 15, `Conduit of Light may target 1 additional creature. Regain 1 Searing Light use on Initiative.`, sCls);
            else if (subclass === "Malice") fHtml += bFeat("Conduit of Death", 15, `Veilwalker’s Blessing recharges whenever you roll Initiative.`, sCls);
            fHtml += bFeat("Upgraded Cantrips", 15, `Your cantrips grow stronger.`);
        }

        if (level >= 16) fHtml += bFeat("Key Stat Increase", 16, `+1 WIL or STR.`);

        if (level >= 17) {
            fHtml += bFeat("Revitalizing Blessing", 17, `(1/round) Whenever you roll a 6 or higher on a healing die, target may recover one Wound.`);
            fHtml += bFeat("Secondary Stat Increase", 17, `+1 INT or DEX.`);
        }

        if (level >= 19) fHtml += bFeat("Epic Boon", 19, `Choose an Epic Boon (see pg. 23 of the GM's Guide).`);
        if (level >= 20) fHtml += bFeat("Twilight Sage", 20, `+1 to any 2 of your stats. Your Lifebinding Spirit rolls twice as many dice. Upgraded Cantrips.`);

        return fHtml;
    },

    getSpellCardsHTML: function(level, subclass, state, derived, formatPips, iStats) {
        let sHtml = ""; 
        const ssCls = "subclass-spell";
        const radiantStyle = `style="border-left-color: #38bdf8; background: linear-gradient(90deg, rgba(56, 189, 248, 0.05) 0%, transparent 100%), var(--class-panel-bg);"`;
        const necroticStyle = `style="border-left-color: #a855f7; background: linear-gradient(90deg, rgba(168, 85, 247, 0.05) 0%, transparent 100%), var(--class-panel-bg);"`;
        
        if (level >= 3) {
            let numPairs = level >= 11 ? 99 : level >= 6 ? 2 : 1;
            if (numPairs === 99) {
                for (const [school, schoolSpells] of Object.entries(UTILITY_SPELLS)) {
                    if (school === "Radiant" || school === "Necrotic") {
                        const style = school === "Radiant" ? radiantStyle : necroticStyle;
                        for (const [name, desc] of Object.entries(schoolSpells)) {
                            sHtml += `<div class="spell-card" ${style}><h4>${name} <span class="tier-tag">${formatPips("Utility")}</span></h4><div class="spell-desc">${iStats(desc)}</div></div>`;
                        }
                    }
                }
            } else {
                for(let i=0; i<numPairs; i++) {
                    let rVal = state.spiritSpellsRadiant?.[i] || "None";
                    let rOpts = `<option value="None">Select Radiant Utility...</option>`;
                    Object.keys(UTILITY_SPELLS.Radiant).forEach(k => rOpts += `<option value="${k}">${k}</option>`);
                    sHtml += `<div class="spell-card" ${radiantStyle}><h4><select onchange="updateClassState('spiritSpellsRadiant', ${i}, this.value)" style="border:none; border-bottom:1px solid var(--slate-lighter); background:transparent; color:#fff; width:70%; font-size: 1em;">${rOpts.replace(`value="${rVal}"`, `value="${rVal}" selected`)}</select><span class="tier-tag">${formatPips("Utility")}</span></h4><div class="spell-desc">${rVal !== "None" ? iStats(UTILITY_SPELLS.Radiant[rVal]) : ""}</div></div>`;
                    
                    let nVal = state.spiritSpellsNecrotic?.[i] || "None";
                    let nOpts = `<option value="None">Select Necrotic Utility...</option>`;
                    Object.keys(UTILITY_SPELLS.Necrotic).forEach(k => nOpts += `<option value="${k}">${k}</option>`);
                    sHtml += `<div class="spell-card" ${necroticStyle}><h4><select onchange="updateClassState('spiritSpellsNecrotic', ${i}, this.value)" style="border:none; border-bottom:1px solid var(--slate-lighter); background:transparent; color:#fff; width:70%; font-size: 1em;">${nOpts.replace(`value="${nVal}"`, `value="${nVal}" selected`)}</select><span class="tier-tag">${formatPips("Utility")}</span></h4><div class="spell-desc">${nVal !== "None" ? iStats(UTILITY_SPELLS.Necrotic[nVal]) : ""}</div></div>`;
                }
            }
        }

        SHEPHERD_DATA.unlocked.filter(s => level >= s.lvl).forEach(spell => {
            const data = SPELL_REGISTRY[spell.school][spell.name];
            if (data) {
                const style = spell.school === "Radiant" ? radiantStyle : necroticStyle;
                sHtml += `<div class="spell-card" ${style}><h4>${spell.name} <span class="tier-tag">${formatPips(data.tier)}</span></h4><div class="spell-desc">${iStats(data.desc)}</div></div>`;
            }
        });

        return sHtml;
    }
};