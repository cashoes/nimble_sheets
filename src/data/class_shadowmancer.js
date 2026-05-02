const SHADOWMANCER_OPTIONS = {
    lesserInvocations: {
        "Abhorrent Speech": { desc: "You can communicate with horrible creatures (aberrations, undead, etc.)." },
        "Beguiling Influence": { desc: "(1/day) You may reroll an Influence check." },
        "Blood Sight": { desc: "(1/day) You may reroll an Examination check. Detect traces of blood even after cleaning." },
        "Devoted Acolyte": { desc: "Learn 2 languages (Celestial, Draconic, etc.). ADV on Lore checks for those languages." },
        "Eldritch Sense": { desc: "Sense shapechangers or magic-concealed creatures within 6 spaces." },
        "Gaze of Two Minds": { desc: "Touch a willing creature and perceive through its senses while you hold concentration." },
        "Knowledge from Beyond": { desc: "Fail Insight or Arcana: suffer 1 Wound to succeed instead." },
        "My Favored Pet": { desc: "One shadow minion can tolerate you outside combat and perform menial tasks." },
        "Voice of the Dark": { desc: "Communicate telepathically with a humanoid within 6 spaces." },
        "Whispers of the Grave": { desc: "(1/day) Ask a dead creature 3 yes/no questions." }
    },
    greaterInvocations: {
        "Armor of Shadows": { desc: "Reduce all incoming damage by the number of minions you have." },
        "Fiendish Boon": { desc: "+1 DEX or INT. You have 1 fewer maximum Hit Dice." },
        "Hungering Shadows": { desc: "Shadow crits: next tiered spell this encounter costs 0 Pilfered Power." },
        "One with Shadows": { desc: "Action (dim light/darkness): Become Invisible until you move or attack." },
        "Repelling Blast": { desc: "Shadow Blast hit (Med/Smaller): Push them up to 2 spaces away." },
        "Shadow Magus": { desc: "Your minions gain +4 Reach and deal d10 damage instead." },
        "Shadow Spear": { desc: "Shadow Blast: 2x range, ignore cover, ADV on Prone targets." },
        "Shadow Rush": { desc: "Minion attack: instead of rolling, deal max damage and die." },
        "Shadow Warp": { desc: "Action: Switch places with creature in 12 reach dealt necrotic damage this turn." },
        "Swarming Shadows": { desc: "Shadow crits: summon another shadow minion adjacent to target." },
        "Vengeful Blast": { desc: "Reaction (minion dies): Cast Shadow Blast (even if already cast this turn)." }
    },
    masterySchools: {
        "Necrotic": { desc: "Gain access to all Necrotic utility spells." }
    }
};

const SHADOWMANCER_FEATURES = {
    core: {
        1: [
            { id: "conduit", name: "Conduit of Shadow", desc: (level, subclass, state) => {
                const totalInt = (state.baseInt || 0) + (state.addInt || 0);
                const minions = Math.max(1, Math.min(totalInt, level));
                let blastDice = 1 + Math.floor(level / 5);
                let bonusReach = Math.floor(level / 5);
                let blastDmg = `<strong>${blastDice}d12${totalInt >= 0 ? "+" : ""}${totalInt}</strong>`;
                return `Your Patron grants you knowledge of two unique Necrotic cantrips:<br>
                <div style="margin-top:8px;"><strong>Shadow Blast.</strong> (1/round) Action. Range: 8. Damage: ${blastDmg}.</div>
                <div style="margin-top:8px;"><strong>Summon Shadows.</strong> Action. Summon a shadow minion within Reach 1 (max <strong>${minions}</strong>). They have 1 HP, no damage bonus, and do not crit. They abandon you outside of combat.<br>
                Action: (1/turn) command ALL minions to move 6 then attack (Reach <strong>${1 + bonusReach}</strong>, 1d12 each).</div>`;
            }}
        ],
        2: [
            { id: "master_darkness", name: "Master of Darkness", desc: "You know all Necrotic cantrips and Tier 1 spells." },
            { id: "pilfered_power", name: "Pilfered Power", desc: (level, subclass, state) => {
                const totalDex = (state.baseDex || 0) + (state.addDex || 0);
                return `Steal power to cast spells at max tier. <strong>${totalDex}</strong> uses/Safe Rest. Exceed limit: suffer half max HP damage.`;
            }}
        ],
        3: [
            { id: "subclass", name: "The Pact is Sealed", desc: "Choose a Shadowmancer subclass.", minor: true },
            { id: "lesser_invocations", name: "Lesser Invocations", type: "dynamic_choice", collection: "lesserInvocations", stateKey: "selectedLesser", desc: "Choose modular shadow powers.", getCount: (level) => level >= 11 ? 3 : level >= 8 ? 2 : 1 }
        ],
        4: [
            { id: "greater_invocations", name: "A Gift from the Master", type: "dynamic_choice", collection: "greaterInvocations", stateKey: "selectedGreater", desc: "Choose powerful modular shadow powers.", getCount: (level) => level >= 18 ? 5 : level >= 14 ? 4 : level >= 9 ? 3 : level >= 6 ? 2 : 1 },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        5: [
            { id: "tier_2", name: "Tier 2 Spells", desc: "You cast all spells at Tier 2.", minor: true },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true },
            { id: "cantrips_1", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        6: [
            { id: "mastery_1", name: "Shadowmastery", desc: "Choose 1 Necrotic Utility Spell.", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1 }
        ],
        7: [
            { id: "tier_3", name: "Tier 3 Spells", desc: "You cast all spells at Tier 3.", minor: true }
        ],
        8: [
            { id: "mastery_2", name: "Shadowmastery (2)", desc: "Choose a 2nd Necrotic Utility Spell.", type: "choice", collection: "masterySchools", stateKey: "selectedMastery", count: 1, startIndex: 1 },
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        9: [
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        10: [
            { id: "tier_4", name: "Tier 4 Spells", desc: "You cast all spells at Tier 4.", minor: true },
            { id: "cantrips_2", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        11: [
            { id: "lesser_invocations_2", name: "Lesser Invocations (2)", desc: "Choose a 3rd Lesser Shadow Invocation.", minor: true }
        ],
        12: [
            { id: "greedy_pact", name: "Greedy Pact", desc: "When taking Pilfer damage, STR save (DC 10): 10-19 (Suffer 10), 20+ (No dmg, +1 Tier)." },
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        13: [
            { id: "tier_5", name: "Tier 5 Spells", desc: "You cast all spells at Tier 5.", minor: true },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        14: [
            { id: "mastery_3", name: "Shadowmastery (3)", desc: "You know all Necrotic Utility Spells." }
        ],
        15: [
            { id: "cantrips_3", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ],
        16: [
            { id: "tier_6", name: "Tier 6 Spells", desc: "You cast all spells at Tier 6.", minor: true },
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        17: [
            { id: "dire_shadows", name: "Dire Shadows", desc: "Attacks against your minions have DIS. They take no damage from successful saves." },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        18: [
            { id: "greater_invocations_5", name: "A Gift from the Master (5)", desc: "Choose a 5th Greater Shadow Invocation." }
        ],
        19: [
            { id: "tier_7", name: "Tier 7 Spells", desc: "You cast all spells at Tier 7.", minor: true },
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "eldritch_usurper", name: "Eldritch Usurper", desc: "+1 to any 2 of your stats. Summoning 1 minion summons 2 instead. They die only if they receive 12+ damage at once." },
            { id: "cantrips_4", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true }
        ]
    },
    subclasses: {
        "RedDragon": {
            3: [
                { id: "crimson_rite", name: "Draconic Crimson Rite", desc: "Minions become Flaming Dragon Wyrmlings. Deal fire/necrotic dmg and Smolder on crit." }
            ],
            7: [
                { id: "burn", name: "We'll ALL Burn!", desc: "Cast Pyroclasm without Pilfering by including yourself in damage. ADV on the save. Choose 1 Fire Utility Spell." }
            ],
            11: [
                { id: "heart_fire", name: "Heart of Burning Fire", desc: "Regain 1 use of Pilfered Power each time you roll Initiative." }
            ],
            15: [
                { id: "enveloped", name: "Enveloped by the Master", desc: "Gain 1d4 Wounds to cast Dragonform." }
            ]
        },
        "AbyssalDepths": {
            3: [
                { id: "nightfrost", name: "Master of Nightfrost", desc: "Minions become beings of nightfrost. Deal cold/necrotic dmg and gain INT+LVL temp HP on crit." }
            ],
            7: [
                { id: "shadowfrost", name: "Shadowfrost", desc: "Shadow Blast Slows. Cast Cryosleep/Rimeblades without Pilfering for 10 temp HP. Choose 1 Ice Utility Spell." }
            ],
            11: [
                { id: "glacial", name: "Glacial Resilience", desc: "(1/Safe Rest) Reaction (attack/condition): gain 10xLVL temp HP and end negative conditions." }
            ],
            15: [
                { id: "reprisal", name: "Cryomancer's Reprisal", desc: "Pay half max HP to cast ANY Ice spell. Gains aura dealing half spent HP as cold damage on melee hit." }
            ]
        },
        "Reaver": {
            1: [
                { id: "hollow_one", replaces: "conduit", name: "Hollow One & Bonescythe", desc: (level, subclass, state) => {
                    const totalInt = (state.baseInt || 0) + (state.addInt || 0);
                    const totalDex = (state.baseDex || 0) + (state.addDex || 0);
                    const minions = Math.max(1, Math.min(totalInt, level));
                    let bonusReach = Math.floor(level / 5);
                    let scytheDice = 2 + Math.floor(level / 5);
                    let scytheDmg = `<strong>${scytheDice}d12${totalDex >= 0 ? "+" : ""}${totalDex}</strong>`;
                    return `You can no longer cast Shadow Blast. Instead: <br>
                    <div style="margin-top:8px;"><strong>Bonescythe.</strong> Action: Summon a magical Bonescythe, a melee weapon: ${scytheDmg} slashing + necrotic damage (Reach: 2). It shatters after a hit or when combat ends. Any Invocations affecting Shadow Blast affect your Bonescythe instead.</div>
                    <div style="margin-top:8px;"><strong>Summon Shadows.</strong> Action. Summon a shadow minion within Reach 1 (max <strong>${minions}</strong>). They have 1 HP, no damage bonus, and do not crit. They abandon you outside of combat.<br>
                    Action: (1/turn) command ALL minions to move 6 then attack (Reach <strong>${1 + bonusReach}</strong>, 1d12 each).</div>`;
                }}
            ],
            2: [
                { id: "cut_off", replaces: "pilfered_power", name: "Cut Off", desc: "You can no longer cast tiered spells using Pilfered Power." }
            ],
            3: [
                { id: "shadow_exploit", name: "Shadow Exploit", desc: "Sacrifice a shadow minion to cast a spell at the highest tier you have unlocked. Each subsequent spell you cast in this encounter costs 1 additional minion." },
                { id: "martyr_spawn", name: "Martyr Spawn", desc: "Whenever you Defend, you can sacrifice a shadow minion to take no damage." }
            ],
            7: [
                { id: "grim_harrow", name: "Grim Harrow", desc: "When you strike with your Bonescythe, you may divide the dice as you choose amongst any number of adjacent targets within Reach." },
                { id: "reap", name: "Reap", desc: "When your Bonescythe crits, or kills a creature, summon a shadow minion for free." }
            ],
            11: [
                { id: "my_blood", name: "My Blood, My Power", desc: "You may take 1 Wound to cast a tiered spell you know at the highest tier you have unlocked." },
                { id: "otherworldly", name: "Otherworldly Might", desc: "Advantage on concentration checks if you have any shadow minions." }
            ],
            12: [
                { id: "no_greedy", replaces: "greedy_pact", name: "Greedy Pact (Lost)", desc: "As a Reaver, you no longer Pilfer Power from a Patron.", minor: true }
            ],
            15: [
                { id: "patron_now", name: "I'm the Patron Now!", desc: "Summon 2 shadow minions for free when you roll Initiative." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Shadowmancer",
    subtitle: "Summoner of shadows and stealer of eldritch power",
    keyStats: ['int', 'dex'], 
    saves: { adv: 'int', dis: 'wil' }, 
    proficiencies: {
        armor: "Cloth",
        weapons: "Blades, Wands"
    },
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#a855f7",
        accentDim: "#7e22ce",
        bodyBg: "#05020a",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 100%), linear-gradient(180deg, #0f0a1a 0%, #05020a 100%)",
        panelBg: "rgba(20, 10, 35, 0.7)",
        border: "rgba(168, 85, 247, 0.3)"
    },

    initialStats: {
        baseStr: -1, baseDex: 1, baseInt: 3, baseWil: 1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "RedDragon", label: "Pact of the Red Dragon", accent: "#ef4444" },
        { value: "AbyssalDepths", label: "Pact of the Abyssal Depths", accent: "#38bdf8" },
        { value: "Reaver", label: "Reaver (Story-Based)", accent: "#9ca3af" }
    ],

    spellProgression: [0, 2, 5, 7, 10, 13, 16, 19],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.int * 3) + level : 0 },
        { id: 'pilfer', label: 'Pilfer Uses', manual: true, calcMax: (level, stats) => level >= 2 ? stats.dex : 0 }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        return { speed, woundMax };
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const totalInt = (state.baseInt || 0) + (state.addInt || 0);
        const totalDex = (state.baseDex || 0) + (state.addDex || 0);
        let pilferMax = totalDex;
        let manaMax = level >= 2 ? (totalInt * 3) + level : 0;
        const currentPilfer = state.resourceValues.pilfer !== undefined ? state.resourceValues.pilfer : pilferMax;

        const minions = Math.max(1, Math.min(totalInt, level));
        let html = `<div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">`;
        
        // Spells/Weapon Box
        if (subclass === "Reaver") {
            let scytheDice = 2 + Math.floor(level / 5);
            let scytheDmg = `${scytheDice}d12${totalDex >= 0 ? "+" : ""}${totalDex}`;
            html += `
                <div style="display: flex; align-items: stretch; gap: 15px; justify-content: center;">
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Bonescythe</label>
                        <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.2;">${scytheDmg}</div>
                        <div style="font-size: 0.75em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">REACH 2</div>
                    </div>
                    <div style="width: 1px; background: rgba(255,255,255,0.15);"></div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Shadow Minions</label>
                        <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.2;">MAX ${minions}</div>
                        <div style="font-size: 0.75em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">REACH ${1 + Math.floor(level / 5)}</div>
                    </div>
                </div>`;
        } else {
            let blastDice = 1 + Math.floor(level / 5);
            let blastDmg = `${blastDice}d12${totalInt >= 0 ? "+" : ""}${totalInt}`;
            html += `
                <div style="display: flex; align-items: stretch; gap: 15px; justify-content: center; padding-bottom: ${level >= 2 ? '10px' : '0'}; ${level >= 2 ? 'border-bottom: 1px dashed rgba(255,255,255,0.15); margin-bottom: 10px;' : ''}">
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Shadow Blast</label>
                        <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.2;">${blastDmg}</div>
                        <div style="font-size: 0.75em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">RANGE 8</div>
                    </div>
                    <div style="width: 1px; background: rgba(255,255,255,0.15);"></div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Shadow Minions</label>
                        <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.2;">MAX ${minions}</div>
                        <div style="font-size: 0.75em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">REACH ${1 + Math.floor(level / 5)}</div>
                    </div>
                </div>`;
        }

        if (level >= 2 && subclass !== "Reaver") {
            html += `
            <div style="display: flex; align-items: stretch; gap: 15px; justify-content: center;">
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Pilfer Power</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--save-dis);">
                        <button onclick="adjRes('pilfer', -1, ${pilferMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_pilfer" value="${currentPilfer}" onchange="adjRes('pilfer', parseInt(this.value), ${pilferMax}, true)" style="width:30px; font-size: 1.4em;">
                        <button onclick="adjRes('pilfer', 1, ${pilferMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">USES: ${pilferMax}</div>
                </div>
            </div>`;
        }

        html += `</div>`;
        return html;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = SHADOWMANCER_FEATURES.subclasses[subclass] || {};
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
            if (SHADOWMANCER_FEATURES.core[l]) {
                SHADOWMANCER_FEATURES.core[l].forEach(feat => {
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
            let options = Object.keys(SHADOWMANCER_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && SHADOWMANCER_OPTIONS[collection][val]) ? SHADOWMANCER_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", iStats(desc), finalCssClass, isChoice);
    },

    getAvailableSpells: function(level, subclass, state, derived) {
        let spells = [];
        const school = "Necrotic";
        const progress = [0, 2, 5, 7, 10, 13, 16, 19];

        // 1. Gather tiered spells from known schools (Necrotic + Subclass)
        const schools = [school];
        if (subclass === "RedDragon" && level >= 3) schools.push("Fire");
        if (subclass === "AbyssalDepths" && level >= 3) schools.push("Ice");

        schools.forEach(sch => {
            if (!SPELL_REGISTRY[sch]) return;
            Object.entries(SPELL_REGISTRY[sch]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : (sch === school ? progress[tNum] : tNum * 2);
                if (level >= requiredLevel) {
                    spells.push({ name, ...data, school: sch });
                }
            });
        });

        // 2. Shadowmastery (Utility Spells)
        if (level >= 14) {
            if (UTILITY_SPELLS[school]) {
                Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school });
                });
            }
        } else {
            if (level >= 6 && UTILITY_SPELLS[school]) {
                Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school });
                });
            }
        }

        // 3. Subclass Utility (Lvl 7)
        if (level >= 7) {
            if (subclass === "RedDragon" && UTILITY_SPELLS["Fire"]) {
                Object.entries(UTILITY_SPELLS["Fire"]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school: "Fire" });
                });
            } else if (subclass === "AbyssalDepths" && UTILITY_SPELLS["Ice"]) {
                Object.entries(UTILITY_SPELLS["Ice"]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school: "Ice" });
                });
            }
        }

        return spells;
    }
};