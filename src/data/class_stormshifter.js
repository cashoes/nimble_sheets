const STORMSHIFTER_OPTIONS = {
    forms: {
        "Normal": { desc: "Standard humanoid form. No bonuses." },
        "Harmless": { desc: "Tiny beast (Squirrel, Bird). Speed: 6. Speak with animals. Ending ends form." },
        "Fearsome": { desc: "Large beast. Gain DEX+LVL temp HP. Attack: Gore (1d6+LVL). Reroll Defend/Interpose for 1 mana." },
        "Beast of the Pack": { desc: "Medium beast. Gain +DEX Speed. Attack: Thunderfang (1d4+LVL). Kill: +1d4 lightning (cumulative). Spend WIL mana for +1d8/pt dmg." },
        "Beast of Nightmares": { desc: "Tiny beast. Speed: 2. Attack: Sting (1d4+3xLVL acid). Silent But Deadly: Cannot be targeted until you attack." }
    },
    chimericBoons: {
        "Beast of the Sea (Swim/Breath)": { desc: "Swim speed equal to normal speed. Can breathe underwater." },
        "Climber (Walk walls/ceilings)": { desc: "Walk on walls and ceilings as normal ground; ignore difficult terrain." },
        "Fleet Footed (+2 Speed, ADV Stealth)": { desc: "+2 speed. Advantage on Stealth and against Grappled." },
        "Earthwalker (+2 Armor, Burrow)": { desc: "+2 armor. Burrow at 1/2 speed. Advantage vs Prone." },
        "Keen Senses (ADV Perception/Assess)": { desc: "Advantage on Perception and Assess. Unaffected by Blinded." },
        "Leader of the Pack (ADV Fear/Charm for 6r aura)": { desc: "Advantage vs Fear and Charm for you and allies in 6 reach." },
        "Phasebeast (Teleport 6 on shift)": { desc: "Teleport up to 6 spaces when shifting in or out of form." },
        "Prehensile Tail (Grapple on melee hit)": { desc: "Melee hit on targets your size or smaller: they are Grappled. Large targets: you move with them." },
        "Winged (Fly speed, forced move 2x)": { desc: "Gain fly speed. Forced movement moves you twice as far." }
    },
    studySchools: {
        "Ice": { desc: "Gain access to all Ice spells. (Spirit of the Tundra)" },
        "Radiant": { desc: "Gain access to all Radiant spells. (Spirit of the Sun)" }
    }
};

const STORMSHIFTER_FEATURES = {
    core: {
        1: [
            { id: "master", name: "Master of Storms", desc: "You know all cantrips from the Lightning and Wind schools." },
            { id: "shift", name: "Beastshift", desc: "Action: Transform into a harmless beast. Speek with animals. DEX charges/Safe Rest. Form ends if you drop to 0 HP or cast spell." }
        ],
        2: [
            { id: "mana", name: "Mana Pool", desc: "You gain a mana pool (<strong>WILx3+LVL</strong>) to cast Tempest spells." },
            { id: "tier_1", name: "Tier 1 Spells", desc: "You gain access to Tier 1 spells.", minor: true },
            { id: "dire_1", name: "Direbeast Form", desc: "You can now Beastshift into a <strong>Fearsome Beast</strong> (Large)." }
        ],
        3: [
            { id: "dire_2", name: "Direbeast Form (2)", desc: "You can now Beastshift into a <strong>Beast of the Pack</strong> (Medium)." }
        ],
        4: [
            { id: "caller", name: "Stormcaller", type: "stormcaller_choice", desc: "Learn a Utility Spell from each spell school you know.", getCount: (level) => level >= 7 ? 2 : 1 },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 WIL or DEX.", minor: true },
            { id: "tier_2", name: "Tier 2 Spells", desc: "You gain access to Tier 2 spells.", minor: true }
        ],
        5: [
            { id: "dire_3", name: "Direbeast Form (3)", desc: "You can now Beastshift into a <strong>Beast of Nightmares</strong> (Tiny)." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true },
            { id: "cantrips", name: "Upgraded Cantrips", desc: "Your lightning/wind cantrips grow stronger." }
        ],
        6: [
            { id: "boons", name: "Chimeric Boons", type: "dynamic_choice", collection: "chimericBoons", stateKey: "selectedBoons", desc: "Choose form mutations.", getCount: (level) => level >= 17 ? 5 : level >= 12 ? 4 : level >= 9 ? 3 : 2 },
            { id: "expert", name: "Expert Shifter", desc: "Gain 1 additional use of Beastshift per Safe Rest." },
            { id: "tier_3", name: "Tier 3 Spells", desc: "You gain access to Tier 3 spells.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 WIL or DEX.", minor: true },
            { id: "stormborn", name: "Stormborn", desc: "Gain resistance to lightning damage. (1/day) You may gain advantage on a Naturecraft check or Concentration check." },
            { id: "tier_4", name: "Tier 4 Spells", desc: "You gain access to Tier 4 spells.", minor: true }
        ],
        9: [
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        10: [
            { id: "tier_5", name: "Tier 5 Spells", desc: "You gain access to Tier 5 spells.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 WIL or DEX.", minor: true },
            { id: "tier_6", name: "Tier 6 Spells", desc: "You gain access to Tier 6 spells.", minor: true }
        ],
        13: [
            { id: "stormborn_2", name: "Stormborn (2)", desc: "Spend Beastshift charge to deal max damage with a Wind spell. Cast cantrip for free when ending shift." },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        14: [
            { id: "tier_7", name: "Tier 7 Spells", desc: "You gain access to Tier 7 spells.", minor: true }
        ],
        15: [
            { id: "cantrips_2", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 WIL or DEX.", minor: true },
            { id: "tier_8", name: "Tier 8 Spells", desc: "You gain access to Tier 8 spells.", minor: true }
        ],
        17: [
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        18: [
            { id: "tier_9", name: "Tier 9 Spells", desc: "You gain access to Tier 9 spells.", minor: true }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "druid", name: "Archdruid", desc: "+1 to any 2 of your stats. (1/encounter) Cast a spell up to tier 4 for free when you enter or leave a Beastshift form. Upgraded Cantrips." }
        ]
    },
    subclasses: {
        "SkyStorm": {
            3: [
                { id: "study", name: "Deepening Study", type: "choice", collection: "studySchools", stateKey: "deepeningStudySchool", count: 1, desc: "Choose the Ice or Radiant school to learn. Cast spells while Beastshifted." }
            ],
            7: [
                { id: "tempest", name: "Raging Tempest", desc: "Whenever you crit with a tiered spell, you may cast a cantrip for free from a school you know and haven't used this turn (at the same level of dis/advantage)." }
            ],
            11: [
                { id: "primordial", name: "Primordial Force", desc: "Spending 2+ mana on a spell grants an additional effect:<ul><li><strong>Ice:</strong> Gain WIL temp HP.</li><li><strong>Lightning:</strong> Deal additional damage equal to your WIL.</li><li><strong>Radiant:</strong> You may heal a creature within 6 spaces WIL HP.</li><li><strong>Wind:</strong> Gain a flying speed this turn. Move up to 6 spaces for free.</li></ul>" }
            ],
            15: [
                { id: "master_storm", name: "Master of Storm", desc: "Concentrate on 1 lightning and 1 wind spell at the same time. (1/Safe Rest) Cast Ride the Lightning for 0 mana." }
            ]
        },
        "FangClaw": {
            3: [
                { id: "swiftshift", name: "Swiftshift", desc: "Init: Beastshift or Move for free. Shift between Direbeast forms for free (Reaction for 1 mana)." },
                { id: "windborne", name: "Windborne Protector", desc: "(1/encounter) Reaction: When an enemy attacks, spend 2 mana to shift into Fearsome Beast, Interpose from 12 reach, and Defend for free." },
                { id: "friend", name: "Friend of Beasts", desc: "Beasts won't attack unless harmed. Transform into harmless beasts without spending charges." }
            ],
            7: [
                { id: "unleash", name: "Unleash the Beast", desc: "(1/encounter) When you miss, you can crit instead." },
                { id: "wake", name: "Storm Wake", desc: "(1/encounter) Action: Spend 3 mana to shift into Beast of the Pack, teleport 12 reach in a line, and deal <strong>WIL</strong> d8 lightning dmg to targets in path." }
            ],
            11: [
                { id: "forms", name: "Master of Forms", desc: "Your shapeshift forms can have 2 Chimeric Boons at a time." },
                { id: "gaze", name: "Venomous Gaze", desc: "(1/encounter) Action: Spend 2 mana to shift into Beast of Nightmares, pull enemy within 12 by 2xWIL spaces, and free Sting on contact." }
            ],
            15: [
                { id: "forms_2", name: "Master of Forms (2)", desc: "Beastshift 2 additional times per Safe Rest. Your Direbeast forms can have 3 Boons at a time." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Stormshifter",
    subtitle: "Master of weather, beast, and nature",
    keyStats: ['wil', 'dex'], 
    saves: { adv: 'wil', dis: 'str' }, 
    proficiencies: {
        armor: "Cloth, Leather",
        weapons: "Staves, Wands"
    },
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#2dd4bf",
        accentDim: "#0d9488",
        bodyBg: "#040a09",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.08) 0%, transparent 100%), linear-gradient(180deg, #0f1a18 0%, #040a09 100%)",
        panelBg: "rgba(20, 35, 33, 0.7)",
        border: "rgba(45, 212, 191, 0.3)"
    },

    initialStats: {
        baseStr: -1, baseDex: 1, baseInt: 1, baseWil: 3
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "SkyStorm", label: "Circle of Sky & Storm", accent: "#bae6fd" },
        { value: "FangClaw", label: "Circle of Fang & Claw", accent: "#f97316" }
    ],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.wil * 3) + level : 0 },
        { id: 'shiftUses', label: 'Beastshift', manual: true, calcMax: (level, stats) => {
            let base = stats.dex;
            if (level >= 6) base += 1;
            if (level >= 9) base += 1;
            if (level >= 12) base += 1;
            if (level >= 15) base += 2; // Expert Shifter (approximate)
            return Math.max(1, base);
        }}
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        const activeForm = (state.currentForm && state.currentForm[0]) || "Normal";
        let speed = (activeForm === "Beast of Nightmares") ? 2 : 6;
        let woundMax = 6;

        return { speed, woundMax };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        const activeForm = (state.currentForm && state.currentForm[0]) || "Normal";
        const selectedBoons = state.selectedBoons || [];

        // Form-based Speed
        if (activeForm === "Beast of the Pack") {
            overrides.speed = (overrides.speed || 0) + statsMap.dex;
        }

        // Earthwalker Armor Bonus
        if (selectedBoons.some(b => b.startsWith("Earthwalker"))) {
            overrides.armor = (overrides.armor || 0) + 2;
        }

        // Fleet Footed Speed Bonus
        if (selectedBoons.some(b => b.startsWith("Fleet Footed"))) {
            overrides.speed = (overrides.speed || 0) + 2;
        }

        // Winged Fly Speed
        if (selectedBoons.some(b => b.startsWith("Winged"))) {
            overrides.modFlySpeed = true;
        }

        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const manaMax = (state.baseWil + state.addWil) * 3 + level;
        let shiftMax = (state.baseDex + state.addDex);
        if (level >= 6) shiftMax += 1;
        if (level >= 9) shiftMax += 1;
        if (level >= 12) shiftMax += 1;
        if (level >= 15) shiftMax += 2;
        shiftMax = Math.max(1, shiftMax);

        let activeForm = (state.currentForm && state.currentForm[0]) || "Normal";
        let opts = ""; Object.keys(STORMSHIFTER_OPTIONS.forms).forEach(k => {
            let show = true;
            if (k === "Fearsome" && level < 2) show = false;
            if (k === "Beast of the Pack" && level < 3) show = false;
            if (k === "Beast of Nightmares" && level < 5) show = false;
            if (show) opts += `<option value="${k}" ${k===activeForm?'selected':''}>${k}</option>`;
        });

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 12px; justify-content: center; flex: 1;">
                ${level >= 2 ? `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">+</button>
                    </div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px; justify-content: center; text-align: center;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Beastshift</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('shiftUses', -1, ${shiftMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                        <input type="number" id="res_shiftUses" value="${state.resourceValues.shiftUses||0}" onchange="adjRes('shiftUses', parseInt(this.value), ${shiftMax}, true)" style="width:32px; font-size: 1.4em;">
                        <button onclick="adjRes('shiftUses', 1, ${shiftMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">+</button>
                    </div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${shiftMax}</div>
                </div>

                <div style="flex: 1.5; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Current Form</label>
                    <select onchange="updateClassState('currentForm', 0, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(45, 212, 191, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%; text-align-last: center;">${opts}</select>
                    <div style="height: 38px; display: flex; align-items: center; justify-content: center;">
                        <div style="font-size: 0.75em; color: var(--text-muted); line-height: 1.1; font-family:'Crimson Text'; font-style:italic; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${STORMSHIFTER_OPTIONS.forms[activeForm]?.desc || ""}</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = STORMSHIFTER_FEATURES.subclasses[subclass] || {};
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
            if (STORMSHIFTER_FEATURES.core[l]) {
                STORMSHIFTER_FEATURES.core[l].forEach(feat => {
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
        let isChoice = feat.type === "choice" || feat.type === "dynamic_choice" || feat.type === "stormcaller_choice";
        let count = (typeof feat.getCount === "function") ? feat.getCount(level) : (feat.count || 1);
        let collection = feat.collection;
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state)) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(STORMSHIFTER_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && STORMSHIFTER_OPTIONS[collection][val]) ? STORMSHIFTER_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(45, 212, 191, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        } else if (feat.type === "stormcaller_choice") {
            const knownSchools = ["Lightning", "Wind"];
            if (subclass === "SkyStorm" && state.deepeningStudySchool?.[0] && state.deepeningStudySchool[0] !== "None") knownSchools.push(state.deepeningStudySchool[0]);

            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;

            knownSchools.forEach(sch => {
                let stateKey = `stormcallerSpells_${sch}`;
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
                        <select onchange="updateClassState('${stateKey}', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(45, 212, 191, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
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
        
        // Known Schools
        const schools = ["Lightning", "Wind"];
        if (subclass === "SkyStorm" && state.deepeningStudySchool?.[0] && state.deepeningStudySchool[0] !== "None") {
            schools.push(state.deepeningStudySchool[0]);
        }

        // Tiered Spells
        schools.forEach(school => {
            if (!SPELL_REGISTRY[school]) return;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : (tNum * 2);
                if (level >= requiredLevel) {
                    spells.push({ name, ...data, school });
                }
            });
        });

        // Stormcaller Utility Selections
        if (level >= 4) {
            schools.forEach(sch => {
                let selection = state[`stormcallerSpells_${sch}`] || [];
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