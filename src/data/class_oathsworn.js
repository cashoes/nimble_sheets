const OATHSWORN_OPTIONS = {
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

const OATHSWORN_FEATURES = {
    core: {
        1: [
            { id: "judgment", name: "Radiant Judgment", desc: (level, subclass, state, derived) => `Whenever an enemy attacks you, if you have no Judgment Dice, roll <strong>${derived.jdText}</strong>. On your next melee hit, deal that much extra radiant damage. Dice are expended whether you hit or miss.` },
            { id: "loh", name: "Lay on Hands", desc: (level) => `Magical pool of <strong>${level * 5}</strong> healing power. Action: Touch target, spend points to restore HP.` }
        ],
        2: [
            { id: "zealot", name: "Zealot", desc: "Whenever you attack with a melee weapon, you may spend mana (up to your highest unlocked tier) to choose one for each mana spent: <strong>Condemning Strike</strong> (+5 radiant damage) or <strong>Blessed Aim</strong> (decrease target's armor by 1 step)." },
            { id: "paragon", name: "Paragon of Virtue", desc: "Advantage on Influence when telling the truth." },
            { id: "tier_1", name: "Tier 1 Spells", desc: "You gain access to Tier 1 spells.", minor: true }
        ],
        3: [
            { id: "decrees", name: "Sacred Decrees", type: "dynamic_choice", collection: "decrees", stateKey: "selectedDecrees", desc: "You know modular Sacred Decrees.", getCount: (level) => level >= 16 ? 6 : level >= 14 ? 5 : level >= 12 ? 4 : level >= 9 ? 3 : level >= 6 ? 2 : 1 }
        ],
        4: [
            { id: "life", name: "My Life, for My Friends", desc: "You may Interpose for free once per round." },
            { id: "tier_2", name: "Tier 2 Spells", desc: "You gain access to Tier 2 spells.", minor: true },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        5: [
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 DEX or INT.", minor: true },
            { id: "cantrips", name: "Upgraded Cantrips", desc: "Your Radiant/Necrotic cantrips grow stronger." }
        ],
        6: [
            { id: "tier_3", name: "Tier 3 Spells", desc: "You gain access to Tier 3 spells.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 STR or WIL.", minor: true },
            { id: "tier_4", name: "Tier 4 Spells", desc: "You gain access to Tier 4 spells.", minor: true }
        ],
        9: [
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 DEX or INT.", minor: true }
        ],
        10: [
            { id: "tier_5", name: "Tier 5 Spells", desc: "You gain access to Tier 5 spells.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        13: [
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 DEX or INT.", minor: true },
            { id: "tier_6", name: "Tier 6 Spells", desc: "You gain access to Tier 6 spells.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        17: [
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 DEX or INT.", minor: true },
            { id: "tier_7", name: "Tier 7 Spells", desc: "You gain access to Tier 7 spells.", minor: true }
        ],
        18: [
            { id: "unending", name: "Unending Judgment", desc: "While you have no Judgment Dice, gain +5 damage to melee attacks." }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "paragon_20", name: "Glorious Paragon", desc: "+1 to any 2 of your stats. Defend for free whenever you Interpose." }
        ]
    },
    subclasses: {
        "Vengeance": {
            3: [
                { id: "zeal", name: "Aura of Zeal", desc: (level, subclass, state, derived) => `Roll 1 more JD. Reach ${derived.auraReach} aura. JD triggers when ally in aura is attacked.` }
            ],
            7: [
                { id: "avenger", name: "Avenger", desc: "When you/ally in aura gain Wounds, set max JD to their max value. Move 1/2 speed free." }
            ],
            11: [
                { id: "unerring", name: "Unerring Judgment", desc: "+1 to Primary Die rolls on melee attacks while you have JD." }
            ],
            15: [
                { id: "maximum", name: "Maximum Judgment", desc: "When attacked, set a Judgment Die to its max value." }
            ]
        },
        "Refuge": {
            3: [
                { id: "aura_refuge", name: "Aura of Refuge", desc: (level, subclass, state, derived) => `Shields gain +WIL armor. Reach ${derived.auraReach} aura. Interpose anywhere within aura.` }
            ],
            7: [
                { id: "face_me", name: "Face Me, Foul Creature!", desc: "When you Interpose, attacker is also Taunted by you." }
            ],
            11: [
                { id: "reprieve", name: "Glorious Reprieve", desc: "Allies in aura gain 1 Wound instead of dropping below 1 HP." }
            ],
            15: [
                { id: "grace", name: "Divine Grace", desc: "Resistant to ALL damage while Interposing." }
            ]
        },
        "Oathbreaker": {
            1: [
                { id: "judgment", replaces: "judgment", name: "Aura of Suffering", desc: (level, subclass, state, derived) => `Replaces standard Radiant Judgment. Judgment Dice (<strong>${derived.jdText}</strong>) trigger whenever you could Interpose but don't. Dealing <strong>necrotic</strong> damage instead.` },
                { id: "dark", name: "Dark Benediction", desc: "Lose access to True Strike, Heal, and Warding Bond. Gain access to Entice, Shadow Trap, and Dread Visage. Choose Radiant or Necrotic Utility Spells." }
            ],
            2: [
                { id: "paragon", replaces: "paragon", name: "Paragon of Power", desc: "Advantage on Might checks to intimidate." }
            ],
            3: [
                { id: "suffer", name: "We All Suffer", desc: (level, subclass, state, derived) => `+2 max Wounds. Reach ${derived.auraReach} aura. Suffer ally's wound/failed save to trigger JD.` },
                { id: "pain", name: "Bring Me Your Pain", desc: "Reaction: Switch HP with willing dying ally." }
            ],
            7: [
                { id: "torment", name: "Torment", desc: "LOH heals you 2x / others 1/2x. Expend LOH points to increase damage (ignoring armor)." }
            ],
            11: [
                { id: "exploit", name: "Exploit", desc: "Reaction: When ally in aura Defends, force enemy in aura to Interpose." }
            ],
            15: [
                { id: "terror", name: "Bloody Terror", desc: "Attacker gains 1 instance of DIS for each Wound you have (max 3)." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Oathsworn",
    subtitle: "Faithful guardian, protector, and avenger",
    keyStats: ['str', 'wil'],
    saves: { adv: 'str', dis: 'dex' },
    proficiencies: {
        armor: "All Armor",
        weapons: "STR Weapons"
    },
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

    spellProgression: [0, 2, 4, 6, 8, 10, 13, 17],

    resources: [
        { id: 'manaCurrent', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? Math.max(0, stats.wil + level) : 0 },
        { id: 'lohCurrent', label: 'Lay on Hands', manual: true, calcMax: (level, stats) => level * 5 }
    ],

    customHeaderStats: [
        { id: 'auraContainer', label: 'Aura', position: 'left', color: 'var(--class-accent)', isVisible: (level, subclass) => level >= 3 && subclass !== 'None', getValue: (derived) => `R ${derived.auraReach}` }
    ],

    getDerivedStats: function (level, subclass, state) {
        let speed = 6; let auraReach = 4; let woundMax = 6;
        let decrees = state.selectedDecrees || [];
        if (decrees.includes("Unstoppable Protector")) speed += 1;
        if (decrees.includes("Improved Aura")) auraReach += 2;
        if (subclass === "Oathbreaker" && level >= 3) woundMax += 2;

        let jdCount = 2; let faces = 6;
        if (level >= 3) { faces = 8; }
        if (level >= 5) { faces = 10; }
        if (level >= 8) { faces = 12; }
        if (level >= 10) { faces = 20; }
        if (level >= 14) { jdCount += 1; }
        if (subclass === "Vengeance" && level >= 3) jdCount += 1;

        let jdAdvText = decrees.includes("Reliable Justice") ? " <em>(Adv)</em>" : "";
        let jdText = `${jdCount}d${faces}${jdAdvText}`;

        return { speed, auraReach, woundMax, jdText, jdCount, jdFaces: faces };
    },

    getShieldBonus: function (level, subclass, stats) {
        return (subclass === 'Refuge' && level >= 3) ? stats.wil : 0;
    },

    getMechanicPanelHTML: function (level, subclass, state, derived) {
        const manaMax = (state.baseWil + state.addWil) + level;
        const lohMax = level * 5;
        let valColor = (state.judgmentValue !== null && state.judgmentValue !== undefined) ? "var(--gold-light)" : "#fff";
        let valText = (state.judgmentValue !== null && state.judgmentValue !== undefined) ? `+${state.judgmentValue}` : "-";
        let detailText = (state.judgmentValue !== null && state.judgmentValue !== undefined) ? `[ ${state.judgmentRolls} ]` : "Uncharged";

        let decrees = state.selectedDecrees || [];
        let isAdv = decrees.includes("Reliable Justice");
        let tags = `<span style="color:var(--text-muted); opacity:0.6; font-size:1.1em;">● Expended on hit/miss</span>`;
        if (isAdv) tags += `<span style="color:var(--save-adv); margin-left:12px; font-size:1.1em;">● Advantage</span>`;

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 15px;">
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
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('manaCurrent', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_manaCurrent" value="${state.resourceValues.manaCurrent || 0}" onchange="adjRes('manaCurrent', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('manaCurrent', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Lay on Hands</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('lohCurrent', -1, ${lohMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_lohCurrent" value="${state.resourceValues.lohCurrent || 0}" onchange="adjRes('lohCurrent', parseInt(this.value), ${lohMax}, true)" style="width:45px; font-size: 1.4em;">
                        <button onclick="adjRes('lohCurrent', 1, ${lohMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${lohMax}</div>
                </div>
            </div>
        </div>`;
    },

    actions: {
        rollJudgmentDice: function () {
            let level = state.level; let subclass = state.subclass; let decrees = state.selectedDecrees || [];
            let jdCount = 2; let faces = 6;
            if (level >= 3) { faces = 8; }
            if (level >= 5) { faces = 10; }
            if (level >= 8) { faces = 12; }
            if (level >= 10) { faces = 20; }
            if (level >= 14) { jdCount += 1; }
            if (subclass === "Vengeance" && level >= 3) jdCount += 1;

            let hasAdv = decrees.includes("Reliable Justice");
            let rollCount = hasAdv ? jdCount + 1 : jdCount;
            let rolls = [];
            for (let i = 0; i < rollCount; i++) {
                rolls.push(Math.floor(Math.random() * faces) + 1);
            }

            if (hasAdv) {
                let minVal = Math.min(...rolls);
                let minIdx = rolls.indexOf(minVal);
                let droppedValue = rolls[minIdx];
                rolls.splice(minIdx, 1);
                state.judgmentValue = rolls.reduce((a, b) => a + b, 0);
                state.judgmentRolls = `${rolls.join(' + ')} <s>(${droppedValue})</s>`;
            } else {
                state.judgmentValue = rolls.reduce((a, b) => a + b, 0);
                state.judgmentRolls = rolls.join(' + ');
            }
            saveState(); render();
        },
        spendJudgmentDice: function () { state.judgmentValue = null; state.judgmentRolls = null; saveState(); render(); }
    },

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = OATHSWORN_FEATURES.subclasses[subclass] || {};
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
            if (OATHSWORN_FEATURES.core[l]) {
                OATHSWORN_FEATURES.core[l].forEach(feat => {
                    if (!replacedIds.has(feat.id)) {
                        fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips);
                    }
                });
            }
            if (subData[l]) {
                subData[l].forEach(feat => {
                    fHtml += this.renderFeature(feat, level, subclass, state, bFeat, iStats, formatPips, sCls);
                });
            }
        }

        return fHtml;
    },

    renderFeature: function (feat, level, subclass, state, bFeat, iStats, formatPips, cssClass) {
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice";
        let count = feat.type === "dynamic_choice" ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state)) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(OATHSWORN_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && OATHSWORN_OPTIONS[collection][val]) ? OATHSWORN_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice);
    },

    getAvailableSpells: function (level, subclass, state, derived) {
        let spells = [];
        const progress = this.spellProgression;
        const isOathbreaker = subclass === "Oathbreaker";

        // 1. Gather Radiant Spells (Primary School)
        if (SPELL_REGISTRY["Radiant"]) {
            Object.entries(SPELL_REGISTRY["Radiant"]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : (progress[tNum] || 99);

                if (level >= requiredLevel) {
                    // Oathbreaker Replacements
                    if (isOathbreaker) {
                        if (name === "True Strike") return; // Replaced by Entice
                        if (name === "Heal") return;        // Replaced by Shadow Trap
                        if (name === "Warding Bond") return; // Replaced by Dread Visage
                    }
                    spells.push({ name, ...data, school: "Radiant" });
                }
            });
        }

        // 2. Oathbreaker Specific Additions
        if (isOathbreaker) {
            const replacements = [
                { name: "Entice", school: "Necrotic" },
                { name: "Shadow Trap", school: "Necrotic" },
                { name: "Dread Visage", school: "Necrotic" }
            ];

            replacements.forEach(r => {
                const data = SPELL_REGISTRY[r.school]?.[r.name];
                if (data) {
                    let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                    let requiredLevel = data.tier.includes("Cantrip") ? 1 : (progress[tNum] || 99);
                    if (level >= requiredLevel) {
                        spells.push({ name: r.name, ...data, school: r.school });
                    }
                }
            });
        }

        // 3. Utility Selection (Level 7+)
        if (level >= 7) {
            let numSpells = level >= 11 ? 2 : 1;
            for (let i = 0; i < numSpells; i++) {
                let val = state.selectedSpells?.[i] || "None";
                let opts = `<option value="None">Select a Utility Spell...</option>`;
                if (isOathbreaker) {
                    opts += `<optgroup label="Radiant">`; Object.keys(UTILITY_SPELLS.Radiant).forEach(k => opts += `<option value="${k}">${k}</option>`);
                    opts += `</optgroup><optgroup label="Necrotic">`; Object.keys(UTILITY_SPELLS.Necrotic).forEach(k => opts += `<option value="${k}">${k}</option>`); opts += `</optgroup>`;
                } else { Object.keys(UTILITY_SPELLS.Radiant).forEach(k => opts += `<option value="${k}">${k}</option>`); }

                let school = (isOathbreaker && UTILITY_SPELLS.Necrotic[val]) ? "Necrotic" : "Radiant";
                let desc = UTILITY_SPELLS[school][val] || "";

                let customHtml = `<select onchange="updateClassState('selectedSpells', ${i}, this.value)" style="border-bottom-color: var(--class-accent);">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>`;
                if (val !== "None") customHtml += `<div style="margin-top:8px;">${desc}</div>`;

                spells.push({ name: "", tier: "Utility", school: school, customHtml: customHtml });
            }
        }

        return spells;
    }
};
