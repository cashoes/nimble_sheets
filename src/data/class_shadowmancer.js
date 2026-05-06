const SHADOWMANCER_OPTIONS = {
    lesserInvocations: {
        "Abhorrent Speech": { desc: "(1/encounter) Target makes WIL save (DC 10+INT). Fail: they are Taunted to only attack you until end of their turn." },
        "Fiendish Boon": { desc: "+1 DEX or INT. You have 1 fewer maximum Hit Dice." },
        "Grim Reaper": { desc: "Bonescythe: deal INT necrotic damage to all enemies within Reach 2 on a hit." },
        "Shadow Rush": { desc: "Minion attack: instead of rolling, deal max damage and die." },
        "Unseen Servant": { desc: "Minions gain Blindsight 6 and have Advantage on Stealth checks." }
    },
    greaterInvocations: {
        "Army of Darkness": { desc: "+2 max shadow minions. Summon 2 minions with 1 action." },
        "Deadly Reach": { desc: "Shadow Blast range +4. Bonescythe reach +2." },
        "Lingering Shadows": { desc: "Minions survive 1 round after you leave combat or drop to 0 HP." },
        "Shadow Armor": { desc: "While you have at least 1 minion, you gain +2 Armor." },
        "Soul Steal": { desc: "Whenever a minion kills an enemy, you regain 1 mana." }
    }
};

const SHADOWMANCER_FEATURES = {
    core: {
        1: [
            { id: "scythe", name: "Bonescythe", desc: "You can summon a scythe of pure shadow (1d12+INT, Reach 2)." },
            { id: "minions", name: "Shadow Minions", desc: (level, subclass, state) => {
                const totalInt = (state.baseInt || 0) + (state.addInt || 0);
                const minions = Math.max(1, Math.min(totalInt, level));
                return `1 Action. Reach: 1. Summon a shadow minion (max <strong>${minions}</strong>). They have 1 HP, no damage bonus, and do not crit. They abandon you outside of combat.<br>
                <strong>Minion Attack:</strong> 1 Action. Range: 1. Damage: 1d12 psychic.`;
            }}
        ],
        2: [
            { id: "mana", name: "Mana Pool", desc: "You gain a mana pool (<strong>INTx3+LVL</strong>) to cast tiered spells." },
            { id: "pilfer", name: "Pilfer Power", desc: (level, subclass, state) => {
                const totalDex = (state.baseDex || 0) + (state.addDex || 0);
                return `Steal power to cast spells at max tier. <strong>${totalDex}</strong> uses/Safe Rest. Exceed limit: suffer half max HP damage.`;
            }},
            { id: "tier_1", name: "Tier 1 Spells", desc: "You gain access to Tier 1 spells.", minor: true }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Shadowmancer subclass.", minor: true },
            { id: "lesser_1", name: "Lesser Invocation", type: "choice", collection: "lesserInvocations", stateKey: "selectedLesser", count: 1, desc: "Choose a minor shadow power." }
        ],
        4: [
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "tier_2", name: "Tier 2 Spells", desc: "You gain access to Tier 2 spells.", minor: true },
            { id: "greater_1", name: "Greater Invocation", type: "dynamic_choice", collection: "greaterInvocations", stateKey: "selectedGreater", desc: "Choose modular shadow powers.", getCount: (level) => level >= 13 ? 3 : level >= 9 ? 2 : 1 }
        ],
        5: [
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true },
            { id: "upgraded_minions", name: "Upgraded Minions", desc: "Minions reach +1, Shadow Blast damage +5.", minor: true }
        ],
        6: [
            { id: "lesser_2", name: "Lesser Invocation (2)", type: "choice", collection: "lesserInvocations", stateKey: "selectedLesser", count: 1, startIndex: 1, desc: "Choose a 2nd shadow power." },
            { id: "tier_3", name: "Tier 3 Spells", desc: "You gain access to Tier 3 spells.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "tier_4", name: "Tier 4 Spells", desc: "You gain access to Tier 4 spells.", minor: true }
        ],
        10: [
            { id: "upgraded_minions_2", name: "Upgraded Minions (2)", desc: "Minions reach +1, Shadow Blast damage +5.", minor: true },
            { id: "tier_5", name: "Tier 5 Spells", desc: "You gain access to Tier 5 spells.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "tier_6", name: "Tier 6 Spells", desc: "You gain access to Tier 6 spells.", minor: true }
        ],
        14: [
            { id: "lesser_3", name: "Lesser Invocation (3)", type: "choice", collection: "lesserInvocations", stateKey: "selectedLesser", count: 1, startIndex: 2, desc: "Choose a 3rd shadow power." },
            { id: "tier_7", name: "Tier 7 Spells", desc: "You gain access to Tier 7 spells.", minor: true }
        ],
        15: [
            { id: "upgraded_minions_3", name: "Upgraded Minions (3)", desc: "Minions reach +1, Shadow Blast damage +5.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "tier_8", name: "Tier 8 Spells", desc: "You gain access to Tier 8 spells.", minor: true }
        ],
        18: [
            { id: "tier_9", name: "Tier 9 Spells", desc: "You gain access to Tier 9 spells.", minor: true }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "overlord", name: "Shadow Overlord", desc: "+1 to any 2 of your stats. You may have twice as many minions. Minions ignore Reach limit." },
            { id: "upgraded_minions_4", name: "Upgraded Minions (4)", desc: "Minions reach +1, Shadow Blast damage +5.", minor: true }
        ]
    },
    subclasses: {
        "Reaver": {
            3: [
                { id: "conduit", name: "Shadow Conduit", desc: "Shadow Blast: deal damage with your Bonescythe instead (using INT). Add DEX bludgeoning damage to scythe hits." }
            ],
            7: [
                { id: "reap", name: "Soul Reaper", desc: "Whenever you kill an enemy with your Bonescythe, summon a minion for free." }
            ],
            11: [
                { id: "dance", name: "Blade Dance", desc: "(1/encounter) Action: Teleport up to 12 reach, making a Bonescythe attack against every enemy you pass." }
            ],
            15: [
                { id: "ghastly", name: "Ghastly Strike", desc: "Bonescythe crits on 19-20. On crit: target is stunned until end of next turn." }
            ]
        },
        "Shadowbinder": {
            3: [
                { id: "shackles", name: "Shadow Shackles", desc: "Whenever a minion hits, the target's speed is halved until end of next turn." }
            ],
            7: [
                { id: "meld", name: "Meld with Shadows", desc: "As long as you are adjacent to a minion, you are Unseen." }
            ],
            11: [
                { id: "sacrifice", name: "Shadow Sacrifice", desc: "Reaction: Suffer 1 Wound to prevent a minion from dying. It regains all HP." }
            ],
            15: [
                { id: "master", name: "Master Binder", desc: "You can cast spells through your minions as if you were in their space." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Shadowmancer",
    subtitle: "Dark mystic who commands spirits & shadows",
    keyStats: ['int', 'dex'], 
    saves: { adv: 'int', dis: 'str' }, 
    proficiencies: {
        armor: "Cloth",
        weapons: "Blades, Staves, Scythes"
    },
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#a855f7",
        accentDim: "#7e22ce",
        bodyBg: "#050308",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 100%), linear-gradient(180deg, #120a1a 0%, #050308 100%)",
        panelBg: "rgba(25, 15, 35, 0.7)",
        border: "rgba(168, 85, 247, 0.3)"
    },

    initialStats: {
        baseStr: -1, baseDex: 2, baseInt: 2, baseWil: 0
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Reaver", label: "Path of the Reaver", accent: "#ef4444" },
        { value: "Shadowbinder", label: "Path of the Binder", accent: "#a855f7" }
    ],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.int * 3) + level : 0 },
        { id: 'pilfer', label: 'Pilfer Uses', manual: true, calcMax: (level, stats) => level >= 2 ? stats.dex : 0 }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        return { speed, woundMax };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function (level, subclass, state, derived) {
        const totalInt = (state.baseInt || 0) + (state.addInt || 0);
        const totalDex = (state.baseDex || 0) + (state.addDex || 0);
        const manaMax = (totalInt * 3) + level;
        const pilferMax = totalDex;
        const currentPilfer = state.resourceValues.pilfer !== undefined ? state.resourceValues.pilfer : pilferMax;
        const minions = Math.max(1, Math.min(totalInt, level));

        let html = `<div class="panel mechanic-panel" style="min-height: 100px; padding: 5px 10px; display: flex; flex-direction: column; justify-content: center;">`;
        
        // Row 1: Attack + Minions
        if (subclass === "Reaver") {
            let scytheDice = 2 + Math.floor(level / 5);
            let scytheDmg = `${scytheDice}d12${totalDex >= 0 ? "+" : ""}${totalDex}`;
            html += `
                <div style="display: flex; align-items: stretch; gap: 8px; justify-content: center; ${level >= 2 ? 'padding-bottom: 4px; border-bottom: 1px dashed rgba(255,255,255,0.15); margin-bottom: 4px;' : ''}">
                    <div style="flex: 1.2; display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                        <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Bonescythe</label>
                        <div class="roll-link" onclick="dispatchRoll('${scytheDmg}', 'Bonescythe')" style="font-size: 1.3em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.1;">${scytheDmg}</div>
                        <div style="font-size: 0.6em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">REACH 2</div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Minions</label>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: #fff; font-size: 1.3em; line-height: 1.1;">/ <span style="color: var(--text-main);">${minions}</span></div>
                        <div style="font-size: 0.6em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;"><span class="roll-link" onclick="dispatchRoll('1d12', 'Minion Attack', { isMinion: true })" style="color: var(--class-accent);">ATK 1d12</span></div>
                    </div>
                </div>`;
        } else {
            let blastDice = 1 + Math.floor(level / 5);
            let blastDmg = `${blastDice}d12${totalInt >= 0 ? "+" : ""}${totalInt}`;
            html += `
                <div style="display: flex; align-items: stretch; gap: 8px; justify-content: center; ${level >= 2 ? 'padding-bottom: 4px; border-bottom: 1px dashed rgba(255,255,255,0.15); margin-bottom: 4px;' : ''}">
                    <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px; justify-content: center;">
                        <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Shadow Blast</label>
                        <div class="roll-link" onclick="dispatchRoll('${blastDmg}', 'Shadow Blast')" style="font-size: 1.3em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.1;">${blastDmg}</div>
                        <div style="font-size: 0.6em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">RANGE 8</div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Minions</label>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: #fff; font-size: 1.3em; line-height: 1.1;">/ <span style="color: var(--text-main);">${minions}</span></div>
                        <div style="font-size: 0.6em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;"><span class="roll-link" onclick="dispatchRoll('1d12', 'Minion Attack', { isMinion: true })" style="color: var(--class-accent);">ATK 1d12</span></div>
                    </div>
                </div>`;
        }

        // Row 2: Resources
        if (level >= 2 && subclass !== "Reaver") {
            html += `
            <div style="display: flex; align-items: stretch; gap: 8px; justify-content: center;">
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Mana</label>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="dark-incrementer" style="padding: 3px 5px;">
                            <button onclick="adjRes('mana', -1, ${manaMax})" style="width:18px; height:18px; line-height:1; font-size:1.0em;">-</button>
                            <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:30px; font-size: 1.2em;">
                            <button onclick="adjRes('mana', 1, ${manaMax})" style="width:18px; height:18px; line-height:1; font-size:1.0em;">+</button>
                        </div>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 0.9em;">/ ${manaMax}</div>
                    </div>
                </div>

                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; padding-left: 4px;">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Pilfer</label>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="dark-incrementer" style="padding: 3px 5px; border-color: var(--save-dis);">
                            <button onclick="adjRes('pilfer', -1, ${pilferMax})" style="width:18px; height:18px; line-height:1; font-size:1.0em;">-</button>
                            <input type="number" id="res_pilfer" value="${currentPilfer}" onchange="adjRes('pilfer', parseInt(this.value), ${pilferMax}, true)" style="width:28px; font-size: 1.2em;">
                            <button onclick="adjRes('pilfer', 1, ${pilferMax})" style="width:18px; height:18px; line-height:1; font-size:1.0em;">+</button>
                        </div>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 0.9em;">/ ${pilferMax}</div>
                    </div>
                </div>
            </div>`;
        }

        html += `</div>`;
        return html;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
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
        let context = (feat.id === "conduit") ? { stat: 'int', type: 'attack' } : {};
        let desc = (typeof feat.desc === "function") ? feat.desc(level, subclass, state, CLASS_CONFIG.getDerivedStats(level, subclass, state), rSSC) : (feat.desc || "");

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        const statsMap = { str: state.baseStr + state.addStr, dex: state.baseDex + state.addDex, int: state.baseInt + state.addInt, wil: state.baseWil + state.addWil };
        let context = (feat.id === "conduit") ? { stat: 'int', type: 'attack' } : (feat.id === "minions" ? { isMinion: true } : {});

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
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, statsMap, context)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice, level, statsMap, context);
    },

    getAvailableSpells: function(level, subclass, state, derived) {
        let spells = [];
        const school = "Necrotic";
        const progress = [0, 2, 5, 7, 10, 13, 16, 19];

        // 1. Gather tiered spells from known schools (Necrotic + Subclass)
        const schools = [school];
        if (subclass === "Shadowbinder") schools.push("Ice");

        schools.forEach(sch => {
            if (!SPELL_REGISTRY[sch]) return;
            Object.entries(SPELL_REGISTRY[sch]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                let requiredLevel = data.tier.includes("Cantrip") ? 1 : progress[tNum] || (tNum * 2);
                if (level >= requiredLevel) {
                    spells.push({ name, ...data, school: sch });
                }
            });
        });

        // 2. Utility Spells (Necrotic only by default)
        if (UTILITY_SPELLS[school]) {
            Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                spells.push({ name, desc, tier: "Utility", school: school });
            });
        }
        
        // 3. Shadowbinder extra school
        if (subclass === "Shadowbinder" && level >= 7) {
            if (UTILITY_SPELLS["Ice"]) {
                Object.entries(UTILITY_SPELLS["Ice"]).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school: "Ice" });
                });
            }
        }

        return spells;
    }
};