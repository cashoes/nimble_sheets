const SHEPHERD_OPTIONS = {
    graces: {
        "Assist Me, My Friend!": { desc: "Whenever you make your first melee attack each round, you may add your Lifebinding Spirit's damage to the attack." },
        "Empowered Companion": { desc: "When summoning your Spirit, you cast it as if you spent 1 additional mana (ignoring tier limits). Max die size becomes d20." },
        "Guiding Spirit": { desc: "When your Spirit rolls a 6+ on damage, the target glows; the next attack against them has advantage." },
        "Hasty Companion": { desc: "+4 Reach for your Spirit. It can act for free when summoned." },
        "Illuminate Soul": { desc: "Action: A creature within 6 spaces glows for 1 round; attacks against them have advantage OR disadvantage (your choice). WIL times/Safe Rest." },
        "Light Bearer": { desc: "Regain 1 Searing Light use when you roll Initiative (expires at end of combat)." },
        "Not Beyond MY Reach": { desc: "Target dead <1 round for healing. For every 10 HP healed, they recover 1 Wound instead (must heal 1+ Wound to revive)." },
        "Vengeful Spirit": { desc: "Action: Spirit sacrifices itself in a vortex of light. At end of your turn, deals dmg to all enemies within 3 spaces equal to its remaining healing charges." }
    }
};

const SHEPHERD_FEATURES = {
    core: {
        1: [
            { id: "searing", name: "Searing Light", desc: "Action: Heal <strong>WIL</strong> d8 HP to Dying creature within 6. OR: Inflict <strong>WIL</strong> d8 radiant damage to Undead/Bloodied enemy." }
        ],
        2: [
            { id: "spirit", name: "Lifebinding Spirit", desc: (level, subclass, state, derived, rSSC) => {
                const totalWil = (state.baseWil || 0) + (state.addWil || 0);
                const wilDisplay = `${totalWil >= 0 ? "+" : ""}${totalWil}`;
                
                let intro = `You know the unique Radiant spell <strong>Lifebinding Spirit</strong>:`;
                let card = rSSC({
                    name: "Lifebinding Spirit",
                    tier: "Tier 1",
                    school: "Radiant",
                    desc: `1 Action. Reach: 4. Summon a spirit companion that follows you. It lasts until you cast this spell again, take a Safe Rest, or it heals a number of times equal to the mana spent summoning it.<br>
                    <div style="margin-top:5px;">● It attacks or heals for <strong>1d6${wilDisplay}</strong> radiant damage (ignoring armor), or heals for the same amount.</div>
                    <div style="margin-top:5px;">● <strong>Upcast:</strong> +1 die size (max d12), +1 healing use per tier. <em>(Current max upcast dmg: <strong>${derived.spiritDmg}${wilDisplay}</strong>)</em></div>`
                }, level, { str: state.baseStr+state.addStr, dex: state.baseDex+state.addDex, int: state.baseInt+state.addInt, wil: totalWil });
                
                return intro + card;
            } },
            { id: "tier_1", name: "Tier 1 Spells", desc: "You gain access to Tier 1 spells.", minor: true }
        ],
        4: [
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 WIL or STR.", minor: true },
            { id: "tier_2", name: "Tier 2 Spells", desc: "You gain access to Tier 2 spells.", minor: true }
        ],
        5: [
            { id: "graces", name: "Sacred Graces", type: "dynamic_choice", collection: "graces", stateKey: "selectedGraces", desc: "Choose modular graces.", getCount: (level) => level >= 17 ? 4 : level >= 13 ? 3 : level >= 9 ? 2 : 1 },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "cantrips", name: "Upgraded Cantrips", desc: "Your shadow/radiant cantrips grow stronger." }
        ],
        6: [
            { id: "tier_3", name: "Tier 3 Spells", desc: "You gain access to Tier 3 spells.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 WIL or STR.", minor: true },
            { id: "tier_4", name: "Tier 4 Spells", desc: "You gain access to Tier 4 spells.", minor: true }
        ],
        9: [
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        10: [
            { id: "tier_5", name: "Tier 5 Spells", desc: "You gain access to Tier 5 spells.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 WIL or STR.", minor: true },
            { id: "tier_6", name: "Tier 6 Spells", desc: "You gain access to Tier 6 spells.", minor: true }
        ],
        13: [
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        14: [
            { id: "tier_7", name: "Tier 7 Spells", desc: "You gain access to Tier 7 spells.", minor: true }
        ],
        15: [
            { id: "cantrips_2", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 WIL or STR.", minor: true },
            { id: "tier_8", name: "Tier 8 Spells", desc: "You gain access to Tier 8 spells.", minor: true }
        ],
        17: [
            { id: "revitalizing", name: "Revitalizing Blessing", desc: "(1/round) Whenever you roll a 6 or higher on a healing die, target may recover one Wound." },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        18: [
            { id: "tier_9", name: "Tier 9 Spells", desc: "You gain access to Tier 9 spells.", minor: true }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "sage", name: "Twilight Sage", desc: "+1 to any 2 of your stats. Your Lifebinding Spirit rolls twice as many dice. Upgraded Cantrips." }
        ]
    },
    subclasses: {
        "Mercy": {
            3: [
                { id: "merciful", name: "Merciful Healing", desc: "Effects that heal Dying creatures heal twice as much. (1/round) Spirit acts for free while you are Dying." },
                { id: "beautiful", name: "Life is Beautiful", desc: "Harmless creatures follow you. Flowers bloom vibrantly in your presence." }
            ],
            7: [
                { id: "conduit", name: "Conduit of Light", desc: "When an effect caused by you would heal HP, you may expend 1 use of Searing Light to heal another target within 6 spaces for the same amount." }
            ],
            11: [
                { id: "powerful", name: "Powerful Healer", desc: "(WIL times/Safe Rest) When rolling dice to heal, you may take the max possible amount or give that many Temp HP." }
            ],
            15: [
                { id: "empowered", name: "Empowered Conduit", desc: "Conduit of Light may target 1 additional creature. Regain 1 Searing Light use on Initiative." }
            ]
        },
        "Malice": {
            3: [
                { id: "reaper", name: "Soul Reaper", desc: "When using Searing Light to harm, make a 2nd enemy within range take same damage." },
                { id: "decay", name: "Harbinger of Decay", desc: "Foods spoil and flies awaken where you lodge. Spirit deals Necrotic damage." }
            ],
            7: [
                { id: "veilwalker", name: "Veilwalker’s Blessing", desc: "(1/Safe Rest) Reaction: When you would drop to 0 HP, drop to 1 instead and force enemy in 6 reach to STR save or become Bloodied (or 0 HP if already Bloodied)." }
            ],
            11: [
                { id: "deathbringer", name: "Deathbringer’s Touch", desc: "First melee attack each round against Bloodied creature is auto-crit. Spirit deals +STR damage." }
            ],
            15: [
                { id: "conduit_death", name: "Conduit of Death", desc: "Veilwalker’s Blessing recharges whenever you roll Initiative." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Shepherd",
    subtitle: "Master of life and death, leader of spirits",
    keyStats: ['wil', 'str'], 
    saves: { adv: 'wil', dis: 'dex' }, 
    proficiencies: {
        armor: "Mail, Shields",
        weapons: "STR Weapons, Wands"
    },
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
        
        // Calculate Max Spirit Die based on available Spell Tiers
        let maxTier = Math.max(1, Math.floor(level / 2));
        let graces = state.selectedGraces || [];
        let hasEmpowered = graces.includes("Empowered Companion");
        
        let effectiveTier = maxTier + (hasEmpowered ? 1 : 0);
        let dieSizes = ['1d6', '1d8', '1d10', '1d12'];
        if (hasEmpowered) dieSizes.push('1d20');
        let dieIdx = Math.min(dieSizes.length - 1, effectiveTier - 1);
        
        let spiritDmg = dieSizes[dieIdx];
        if (level >= 20) {
            spiritDmg = spiritDmg.replace('1d', '2d');
        }
        
        return { speed, woundMax, hdFace, spiritDmg };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        if (subclass === "Malice" && level >= 15) overrides.armor = (overrides.armor || 0) + statsMap.wil;
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const totalWil = (state.baseWil || 0) + (state.addWil || 0);
        const manaMax = (totalWil * 3) + level;
        const searingMax = totalWil;
        
        let spiritType = subclass === "Malice" ? "Deadly" : "Lifebinding";
        let spiritColor = subclass === "Malice" ? "var(--save-adv)" : "var(--class-accent)";

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 12px; justify-content: center;">
                ${level >= 2 ? `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Searing Light</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('searingLight', -1, ${searingMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_searingLight" value="${state.resourceValues.searingLight||0}" onchange="adjRes('searingLight', parseInt(this.value), ${searingMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('searingLight', 1, ${searingMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${searingMax}</div>
                </div>

                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">${spiritType} Spirit ${level < 2 ? '(Lvl 2)' : ''}</label>
                    ${level >= 2 ? `
                        <div style="font-size: 2.2em; color: ${spiritColor}; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1;">${derived.spiritDmg}${totalWil >= 0 ? '+' : ''}${totalWil}</div>
                        <div style="font-size: 0.65em; color: var(--text-muted); margin-top: 2px; font-family: 'Crimson Text'; font-style: italic;">(At max tier)</div>
                        <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 4px; font-family: 'Crimson Text'; font-style: italic;">Reach 4</div>
                        <div style="font-size: 0.65em; color: var(--text-muted); line-height: 1.1; font-family: 'Crimson Text'; max-width: 130px;">Upcast: +1 die size (max ${state.selectedGraces?.includes("Empowered Companion") ? "d20" : "d12"}), +1 heal use.</div>
                    ` : '<div style="font-size: 0.8em; color: var(--text-muted); font-style: italic; margin: auto 0;">Unlocked at Level 2</div>'}
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = SHEPHERD_FEATURES.subclasses[subclass] || {};
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
            if (SHEPHERD_FEATURES.core[l]) {
                SHEPHERD_FEATURES.core[l].forEach(feat => {
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
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state), rSSC) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(SHEPHERD_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && SHEPHERD_OPTIONS[collection][val]) ? SHEPHERD_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice);
    },

    getAvailableSpells: function(level, subclass, state, derived) {
        let spells = [];
        const progress = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]; // Default progression
        const schools = ["Radiant", "Necrotic"];

        // 1. Core Tiered Spells (Both Schools)
        schools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : (progress[tNum] || 99);
                if (level >= requiredLevel) {
                    spells.push({ name, ...data, school });
                }
            });
        });

        // 2. Utility Selection (Spirit Spells)
        if (level >= 3) {
            let numPairs = level >= 11 ? 99 : level >= 6 ? 2 : 1;
            if (numPairs === 99) {
                schools.forEach(sch => {
                    if (UTILITY_SPELLS[sch]) {
                        Object.entries(UTILITY_SPELLS[sch]).forEach(([name, desc]) => {
                            spells.push({ name, desc, tier: "Utility", school: sch });
                        });
                    }
                });
            } else {
                for(let i=0; i<numPairs; i++) {
                    // Radiant Utility
                    let rVal = state.spiritSpellsRadiant?.[i] || "None";
                    let rOpts = `<option value="None">Select Radiant Utility...</option>`;
                    Object.keys(UTILITY_SPELLS.Radiant).forEach(k => rOpts += `<option value="${k}">${k}</option>`);
                    let rCustom = `<select onchange="updateClassState('spiritSpellsRadiant', ${i}, this.value)" style="border-bottom-color: var(--class-accent);">${rOpts.replace(`value="${rVal}"`, `value="${rVal}" selected`)}</select>`;
                    if (rVal !== "None") rCustom += `<div style="margin-top:8px;">${UTILITY_SPELLS.Radiant[rVal]}</div>`;
                    spells.push({ name: "", tier: "Utility", school: "Radiant", customHtml: rCustom });
                    
                    // Necrotic Utility
                    let nVal = state.spiritSpellsNecrotic?.[i] || "None";
                    let nOpts = `<option value="None">Select Necrotic Utility...</option>`;
                    Object.keys(UTILITY_SPELLS.Necrotic).forEach(k => nOpts += `<option value="${k}">${k}</option>`);
                    let nCustom = `<select onchange="updateClassState('spiritSpellsNecrotic', ${i}, this.value)" style="border-bottom-color: var(--class-accent);">${nOpts.replace(`value="${nVal}"`, `value="${nVal}" selected`)}</select>`;
                    if (nVal !== "None") nCustom += `<div style="margin-top:8px;">${UTILITY_SPELLS.Necrotic[nVal]}</div>`;
                    spells.push({ name: "", tier: "Utility", school: "Necrotic", customHtml: nCustom });
                }
            }
        }

        return spells;
    }
};