const SONGWEAVER_OPTIONS = {
    lyricalWeaponry: {
        "Heroic Ballad": { desc: "+2 max Inspiration charges. When used to reroll an ally's attack, grants them +WIL damage on the attack." },
        "Inspiring Anthem": { desc: "(1/encounter) Action: Grant all friendly Dying creatures who can hear you 1 HP and 1 action." },
        "Not My Beautiful Faaace!": { desc: "(1/encounter) When you Defend, force attacker to choose another target on failed WIL save (DC 10+WIL). Fail by 5+: they attack themselves." },
        "Rhapsody of the Normal": { desc: "Roll 4+ on Vicious Mockery: spend Inspiration to suppress target's special abilities until end of next turn. They become an untrained villager (1d4 dmg, no features)." },
        "Song of Domination": { desc: "(1/encounter) 2 actions: Play tune. All enemies in 6 reach must WIL save (DC 10+WIL). Fail: move them up to 6 spaces; they cannot move next turn." }
    },
    friends: {
        "Stompy (Hill Giant)": { desc: "3 actions: Summon for 1 round. Success on DC 10 Influence: move 6 then Stomp (LVL+Influence dmg to path). Allies in 6 can also trigger Stomp." },
        "Mal, the Malevolent Imp": { desc: "Summon for 1 night. Find dangerous info or 'take care' of a problem. Influence check to help (ADV for mischief, DIS for menial tasks)." },
        "Gran Gran (NOT a hag)": { desc: "Summon for 1 hour while resting. Bakes pastries (WIL+INT). Eating one recovers 1 mana, HD, or Wound. Expire in 10 mins." },
        "Linos, the Everfriendly": { desc: "Summon legendary flying creature to transport party. May request large amount of food as payment." }
    },
    schools: {
        "Fire": { desc: "Master the school of Fire." },
        "Ice": { desc: "Master the school of Ice." },
        "Lightning": { desc: "Master the school of Lightning." }
    }
};

const SONGWEAVER_FEATURES = {
    core: {
        1: [
            { id: "school_choice", name: "Secondary School", type: "choice", collection: "schools", stateKey: "secondarySchool", desc: "Master a second elemental school (Fire, Ice, or Lightning).", count: 1 },
            { id: "vicious_mockery", name: "Vicious Mockery", desc: (level, subclass, state, derived, rSSC) => {
                const totalInt = (state.baseInt || 0) + (state.addInt || 0);
                const totalWil = (state.baseWil || 0) + (state.addWil || 0);
                let vmDie = (level >= 15 && subclass === "HeraldSnark") ? "1d6" : "1d4";
                let vmBonus = totalInt + Math.floor(level / 5) * 2;
                if (level >= 15 && subclass === "HeraldSnark") vmBonus += totalWil;
                let vmDisplay = `<strong>${vmDie}${vmBonus >= 0 ? "+" : ""}${vmBonus}</strong>`;
                
                let intro = `You know the unique Wind cantrip <strong>Vicious Mockery</strong>:`;
                let card = rSSC({ 
                    name: "Vicious Mockery", 
                    tier: "Cantrip", 
                    school: "Wind", 
                    desc: `1 Action. Range: 12. Damage: ${vmDisplay} psychic (ignoring armor). On hit: target is Taunted during their next turn.` 
                }, level, { str: state.baseStr+state.addStr, dex: state.baseDex+state.addDex, int: totalInt, wil: totalWil });
                
                return intro + card;
            } },
            { id: "inspiration", name: "Songweaver’s Inspiration", desc: (level, subclass, state) => {
                let uses = (state.baseWil + state.addWil) * 2;
                return `(<strong>${uses}</strong> uses/Safe Rest) Free Reaction: Allow an ally to reroll a die for an attack or save (must keep result).`;
            }}
        ],
        2: [
            { id: "mana", name: "Mana Pool", desc: "You gain a mana pool (<strong>WILx3+LVL</strong>) to cast tiered spells." },
            { id: "tier_1", name: "Tier 1 Spells", desc: "You gain access to Tier 1 spells.", minor: true },
            { id: "jack", name: "Jack of All Trades", desc: "When you Safe Rest, you may move a skill point as if you just leveled up." },
            { id: "song_rest", name: "Song of Rest", desc: "(1/day) Whenever you Field Rest, allow anyone spending HD to heal extra HP equal to your <strong>WIL</strong>." }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Songweaver subclass.", minor: true },
            { id: "quick_wit", name: "Quick Wit", desc: "Roll Init: regain 2 spent Inspiration charges (expire end of combat)." },
            { id: "windbag", name: "Windbag", type: "windbag_choice", desc: (level) => level >= 14 ? "You know all Utility Spells from the spell schools you know." : "Learn a Utility Spell from each spell school you know.", getCount: (level) => level >= 14 ? 0 : level >= 6 ? 2 : 1 }
        ],
        4: [
            { id: "lyrical_1", name: "Lyrical Weaponry", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, desc: "Choose a special musical ability." },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 WIL or INT.", minor: true },
            { id: "tier_2", name: "Tier 2 Spells", desc: "You gain access to Tier 2 spells.", minor: true }
        ],
        5: [
            { id: "friends", name: "A “People“ Person", type: "choice", collection: "friends", stateKey: "selectedFriends", count: 2, desc: "Choose 2 friends you can temporarily summon via song (1/Safe Rest each)." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true },
            { id: "cantrips_1", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        6: [
            { id: "tier_3", name: "Tier 3 Spells", desc: "You gain access to Tier 3 spells.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 WIL or INT.", minor: true },
            { id: "tier_4", name: "Tier 4 Spells", desc: "You gain access to Tier 4 spells.", minor: true }
        ],
        9: [
            { id: "lyrical_2", name: "Lyrical Weaponry (2)", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, startIndex: 1, desc: "Choose a 2nd modular ability." },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        10: [
            { id: "cantrips_2", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true },
            { id: "tier_5", name: "Tier 5 Spells", desc: "You gain access to Tier 5 spells.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 WIL or INT.", minor: true },
            { id: "tier_6", name: "Tier 6 Spells", desc: "You gain access to Tier 6 spells.", minor: true }
        ],
        13: [
            { id: "lyrical_3", name: "Lyrical Weaponry (3)", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, startIndex: 2, desc: "Choose a 3rd modular ability." },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        14: [
            { id: "tier_7", name: "Tier 7 Spells", desc: "You gain access to Tier 7 spells.", minor: true }
        ],
        15: [
            { id: "cantrips_3", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 WIL or INT.", minor: true },
            { id: "tier_8", name: "Tier 8 Spells", desc: "You gain access to Tier 8 spells.", minor: true }
        ],
        17: [
            { id: "lyrical_4", name: "Lyrical Weaponry (4)", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, startIndex: 3, desc: "Choose a 4th modular ability." },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 STR or DEX.", minor: true }
        ],
        18: [
            { id: "tier_9", name: "Tier 9 Spells", desc: "You gain access to Tier 9 spells.", minor: true }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "famous", name: "I’m So Famous!", desc: "+1 to any 2 of your stats. Your Songweaver’s Inspiration cannot fail (your target succeeds)." },
            { id: "cantrips_4", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ]
    },
    subclasses: {
        "HeraldSnark": {
            3: [
                { id: "snark", name: "Opportunistic Snark", desc: "Reaction (enemy in 12 reach misses): Cast Vicious Mockery at them; it deals double damage." }
            ],
            7: [
                { id: "picker", name: "Fight Picker", desc: "(1/turn) When enemy is damaged by Vicious Mockery, you may have an ally Taunt them until end of enemy's turn instead." }
            ],
            11: [
                { id: "chord", name: "Chord of Chaos", desc: "(1/encounter) Action: Move ALL creatures within hearing up to 3 spaces (not into obvious danger)." }
            ],
            15: [
                { id: "words_swords", name: "Words Like Swords", desc: "Your Vicious Mockery damage becomes <strong>1d6+INT+WIL</strong>." }
            ]
        },
        "HeraldCourage": {
            3: [
                { id: "presence", name: "Inspiring Presence", desc: "Whenever you use Songweaver’s Inspiration, your allies within 12 spaces gain <strong>WIL</strong> temp HP." }
            ],
            7: [
                { id: "courage", name: "Unfailing Courage", desc: "Your Songweaver’s Inspiration allows your target to roll with advantage." }
            ],
            11: [
                { id: "bones", name: "Fire in my Bones", desc: "Your Songweaver’s Inspiration also grants your target 1 additional action." }
            ],
            15: [
                { id: "chorus", name: "Chorus of Champions", desc: "(1/encounter) Free Reaction: Give all party members 1 action." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Songweaver",
    subtitle: "Musical mystic who weaves spells through song",
    keyStats: ['wil', 'int'], 
    saves: { adv: 'wil', dis: 'str' }, 
    proficiencies: {
        armor: "Cloth, Leather",
        weapons: "Staves, Instruments"
    },
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#fbbf24",
        accentDim: "#d97706",
        bodyBg: "#070401",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 100%), linear-gradient(180deg, #1a140a 0%, #070401 100%)",
        panelBg: "rgba(35, 25, 15, 0.7)",
        border: "rgba(251, 191, 36, 0.3)"
    },

    initialStats: {
        baseStr: -1, baseDex: 1, baseInt: 1, baseWil: 3
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "HeraldSnark", label: "Herald of Snark", accent: "#ef4444" },
        { value: "HeraldCourage", label: "Herald of Courage", accent: "#fbbf24" }
    ],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.wil * 3) + level : 0 },
        { id: 'inspiration', label: 'Inspiration', manual: true, calcMax: (level, stats, state) => {
            let max = stats.wil * 2;
            let lyrical = state.selectedLyrical || [];
            if (lyrical.includes("Heroic Ballad")) max += 2;
            return max;
        }}
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        return { speed, woundMax };
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const manaMax = (state.baseWil + state.addWil) * 3 + level;
        
        let inspMax = (state.baseWil + state.addWil) * 2;
        let lyrical = state.selectedLyrical || [];
        if (lyrical.includes("Heroic Ballad")) inspMax += 2;
        
        const inspCur = state.resourceValues.inspiration !== undefined ? state.resourceValues.inspiration : inspMax;

        // Vicious Mockery Calculation
        const totalInt = (state.baseInt || 0) + (state.addInt || 0);
        const totalWil = (state.baseWil || 0) + (state.addWil || 0);
        let vmDie = (level >= 15 && subclass === "HeraldSnark") ? "1d6" : "1d4";
        let vmBonus = totalInt + Math.floor(level / 5) * 2;
        if (level >= 15 && subclass === "HeraldSnark") vmBonus += totalWil;
        let vmDisplay = `${vmDie}${vmBonus >= 0 ? "+" : ""}${vmBonus}`;

        return `
        <div class="panel mechanic-panel" style="min-height: 100px;">
            <div style="display: flex; align-items: stretch; gap: 15px; justify-content: center;">
                ${level >= 2 ? `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:22px; height:22px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Inspiration</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--class-accent);">
                        <button onclick="adjRes('inspiration', -1, ${inspMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_inspiration" value="${inspCur}" onchange="adjRes('inspiration', parseInt(this.value), ${inspMax}, true)" style="width:30px; font-size: 1.4em;">
                        <button onclick="adjRes('inspiration', 1, ${inspMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${inspMax}</div>
                </div>

                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Vicious Mockery</label>
                    <div style="font-size: 2.2em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">${vmDisplay}</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 4px; font-family: 'Crimson Text'; font-style: italic;">Reach 12</div>
                    <div style="font-size: 0.65em; color: var(--text-muted); line-height: 1.1; font-family: 'Crimson Text'; max-width: 120px;">On hit: the target is Taunted during their next turn.</div>
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = SONGWEAVER_FEATURES.subclasses[subclass] || {};
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
            if (SONGWEAVER_FEATURES.core[l]) {
                SONGWEAVER_FEATURES.core[l].forEach(feat => {
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
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice" || feat.type === "windbag_choice";
        let count = (typeof feat.getCount === "function") ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state), rSSC) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(SONGWEAVER_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && SONGWEAVER_OPTIONS[collection][val]) ? SONGWEAVER_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        } else if (feat.type === "windbag_choice" && count > 0) {
            const knownSchools = ["Wind"];
            if (state.secondarySchool?.[0] && state.secondarySchool[0] !== "None") knownSchools.push(state.secondarySchool[0]);

            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;

            knownSchools.forEach(sch => {
                let stateKey = `windbagSpells_${sch}`;
                let selection = state[stateKey] || [];
                
                for (let i = 0; i < count; i++) {
                    let optsHtml = `<option value="None">-- Select ${sch} Utility --</option>`;
                    if (UTILITY_SPELLS[sch]) {
                        Object.keys(UTILITY_SPELLS[sch]).forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);
                    }
                    
                    let val = selection[i] || "None";
                    let d = (val !== "None" && UTILITY_SPELLS[sch]?.[val]) || "";

                    choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        <div style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; margin-bottom: 4px; font-family:'Cinzel'; font-weight:bold;">${sch} Utility ${i+1}</div>
                        <select onchange="updateClassState('${stateKey}', ${i}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                        <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                    </div>`;
                }
            });
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice);
    },

    getAvailableSpells: function(level, subclass, state, derived) {
        let spells = [];
        const masteredSchools = ["Wind"];
        if (state.secondarySchool && state.secondarySchool[0] !== "None") {
            masteredSchools.push(state.secondarySchool[0]);
        }

        // 1. Core Tiered Spells (Mastered Schools only)
        masteredSchools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : (tNum * 2);
                if (level >= requiredLevel) {
                    spells.push({ name, ...data, school });
                }
            });
        });

        // 2. Windbag Feature: Utility from mastered schools
        if (level >= 14) {
            masteredSchools.forEach(sch => {
                if (UTILITY_SPELLS[sch]) {
                    Object.entries(UTILITY_SPELLS[sch]).forEach(([name, desc]) => {
                        if (!spells.find(s => s.name === name)) {
                            spells.push({ name, desc, tier: "Utility", school: sch });
                        }
                    });
                }
            });
        } else if (level >= 3) {
            masteredSchools.forEach(sch => {
                let selection = state[`windbagSpells_${sch}`] || [];
                selection.forEach(name => {
                    if (name !== "None" && UTILITY_SPELLS[sch]?.[name]) {
                        spells.push({ name, desc: UTILITY_SPELLS[sch][name], tier: "Utility", school: sch });
                    }
                });
            });
        }

        return spells;
    }
};