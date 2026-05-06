const HUNTER_OPTIONS = {
    tothAbilities: {
        "Addling Arrow": { desc: "Action: Attack with a ranged weapon. The next attack the target makes must be against the closest other creature, chosen at random." },
        "Come Get Some!": { desc: "Action: Attack a target. It is Taunted by you until the end of their next turn." },
        "Decoy": { desc: "When you Defend: The attack misses instead, and you can move up to half your speed away (where you really were all along!)." },
        "Fleet Feet": { desc: "Move up to your speed for free, ignoring difficult terrain." },
        "Grease Trap": { desc: "(1/encounter) Reaction (enemy moves within 6 spaces): Target falls Prone, is vulnerable to fire damage, and is treated as Smoldering." },
        "Hail of Arrows": { desc: "(Half range) 2 actions: Shoot all creatures within a 3x3 area. Their speed is halved until the end of their next turn." },
        "Heavy Shot": { desc: "(Half range) Action: Attack with a ranged weapon and push your target: 4 spaces for small, 2 for medium, 1 for large." },
        "Incendiary Shot": { desc: "(Half range) Action: Attack with a ranged weapon, add WIL d8 fire damage." },
        "Multishot": { desc: "(Half range) Action: Attack your quarry with a ranged weapon and load an extra projectile. Select a 2nd target within 2 spaces to take the same damage." },
        "Pinning Shot": { desc: "Spend 3 actions shooting your quarry. They are Restrained until they can escape (DC 10+WIL)." },
        "Snare Trap": { desc: "(1/encounter) Reaction (enemy moves within 6 spaces): Move them back 1 space, they are Restrained until they can escape (DC 10+WIL)." },
        "Sharpshooter": { desc: "Action: If you have not moved this turn and your quarry is 4 or more spaces away, attack them for double damage." },
        "Vital Shot": { desc: "(Half range) Action: Attack your Hampered quarry with a ranged weapon, ignoring armor or doubling Hunter's Mark damage." },
        "Wild Instinct": { desc: "(1/round, costs 0 TotH) If you have none, Assess for free, with advantage." },
        "Go for the Throat!": { desc: "Command companion to attack your quarry. Small: 1 TotH (1d4+LVL), Med: 1 TotH (1d8+3x LVL), Large: 2 TotH/2 Actions (1d12+4xLVL)." },
        "Protect Me!": { desc: "Command companion to defend you. Small: Miss on Defend, Med: Free counter-attack (1d4+LVL), Large: Half damage from first attack each round." }
    },
    companionSizes: {
        "None": { desc: "No companion selected." },
        "Small": { desc: "Keen Eyes: Mark a target for free (1/encounter). Protect Me!: Attacks against you miss when you Defend. Go for the Throat! (1/round): 1 TotH charge, 1d4+LVL dmg." },
        "Medium": { desc: "Ferocious: When you or companion crit, companion attacks again for LVL dmg. Protect Me!: When you Defend, first attack that creature (1d4+LVL). Go for the Throat!: 1 TotH charge, 1d8+3x LVL dmg." },
        "Large": { desc: "Alpha Protector: Damage from first attack against you each round is halved. Protect Me!: After a Wound, whisked up to 12 spaces away. Go for the Throat!: 2 TotH charges, 2 actions, 1d12+4xLVL dmg." }
    }
};

const HUNTER_FEATURES = {
    core: {
        1: [
            { id: "mark", name: "Hunter's Mark", desc: "Action: Mark a quarry for 1 day. Attacks against it have advantage OR +<strong>LVL</strong> damage." },
            { id: "forager", name: "Forager", desc: "Advantage on skill checks to find food and water in the wild." }
        ],
        2: [
            { id: "toth", name: "Thrill of the Hunt", desc: "Gain a charge whenever: Quarry dies, you hit quarry in melee, or you crit quarry at range." },
            { id: "roll_strike", name: "Roll & Strike", desc: "Action: If you have no TotH charges, move up to speed and make a free melee attack." },
            { id: "toth_abilities", name: "Thrill of the Hunt Abilities", type: "dynamic_choice", collection: "tothAbilities", stateKey: "selectedToth", desc: "Choose TotH abilities as you level up.", getCount: (level) => level >= 14 ? 7 : level >= 12 ? 6 : level >= 8 ? 5 : level >= 6 ? 4 : level >= 4 ? 3 : 2 }
        ],
        3: [
            { id: "intuition", name: "Tracker's Intuition", desc: "Accurately discern numbers, direction, and timing of past encounters by tracks." }
        ],
        4: [
            { id: "explorer", name: "Explorer of the Wilds", desc: "+2 speed and gain a climbing speed.<br><strong>Key Stat Increase:</strong> +1 DEX or WIL." }
        ],
        5: [
            { id: "resolve", name: "Hunter's Resolve", desc: "When you have no TotH charges, treat all creatures as your quarry for movement and melee attacks." },
            { id: "takedown", name: "Final Takedown", desc: "Spend 1 TotH charge to turn a hit on a Bloodied quarry into a crit and double Mark damage. If they survive, they crit you back." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        6: [
            { id: "bowmaster", name: "Versatile Bowmaster", desc: "When attacking with Longbow, roll <strong>2d4</strong> instead of 1d8; or Crossbow, <strong>2d8</strong> instead of 4d4." }
        ],
        8: [
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        9: [
            { id: "no_escape", name: "No Escape", desc: "When an ally makes an opportunity attack, you may make a ranged opportunity attack against the same target." },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        10: [
            { id: "stalker", name: "Veteran Stalker", desc: "Gain a TotH charge when first Bloodied and for every Wound gained." },
            { id: "steady_hand", name: "Keen Eye, Steady Hand", desc: "Add <strong>WIL</strong> to your ranged weapon damage." }
        ],
        12: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        13: [
            { id: "keen_sight", name: "Keen Sight", desc: "Advantage on Perception checks." },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        16: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 DEX or WIL.", minor: true }
        ],
        17: [
            { id: "peerless", name: "Peerless Hunter", desc: "You can Defend against your quarry for free." },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 STR or INT.", minor: true }
        ],
        18: [
            { id: "wild_endurance", name: "Wild Endurance", desc: "Gain 1 Thrill of the Hunt charge at the start of your turns." }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." }
        ],
        20: [
            { id: "nemesis", name: "Nemesis", desc: "+1 to any 2 of your stats. Your Hunter’s Mark can target any number of creatures simultaneously." }
        ]
    },
    subclasses: {
        "Shadowpath": {
            3: [
                { id: "ambusher", name: "Ambusher", desc: "Mark quarry for free on Initiative. Advantage on first attack each encounter." },
                { id: "skilled_tracker", name: "Skilled Tracker", desc: "Advantage on skill checks to track creatures." }
            ],
            7: [
                { id: "primal_predator", name: "Primal Predator", desc: "(1/encounter) Your weapon attacks ignore cover and armor this turn." }
            ],
            11: [
                { id: "pack_hunter", name: "Pack Hunter", desc: "When you mark a creature, mark another within 6 spaces for free." }
            ],
            15: [
                { id: "apex_predator", name: "Apex Predator", desc: "Use Primal Predator twice per encounter. Gain 1 TotH charge on Initiative." }
            ]
        },
        "WildHeart": {
            3: [
                { id: "form", name: "Impressive Form", desc: "+5 max HP. Upgrade Hit Dice to d10s." },
                { id: "high_ground", name: "I Have the High Ground", desc: "Gain 1/2 speed for free on Init or when gaining TotH charges." }
            ],
            7: [
                { id: "herbalist", name: "Resourceful Herbalist", desc: "(1/Safe Rest) Craft <strong>WIL</strong> Healing Salves (Heal WIL d6 HP)." }
            ],
            11: [
                { id: "here", name: "Ha! I'm Over Here!", desc: "(1/Safe Rest) If an attack would drop you to 0 HP, move speed away and take no damage." }
            ],
            15: [
                { id: "survivalist", name: "Unparalleled Survivalist", desc: "Gain <strong>+WIL</strong> Armor. When attacking at range, move 1/2 speed for free first." }
            ]
        },
        "Beastmaster": {
            3: [
                { id: "companion", name: "Animal Companion", type: "choice", collection: "companionSizes", stateKey: "selectedCompanion", desc: "No stats or actions to track. Your companion's attacks count as your own for TotH." }
            ],
            7: [
                { id: "scaling_1", name: "Companion Scaling", desc: "Small: Keen Eyes (2/enc), Protect Me! upgrades. Med: Ferocious (4 spaces). Large: Protect Me! upgrades." }
            ],
            11: [
                { id: "scaling_2", name: "Companion Scaling", desc: "Small: Keen Eyes (3/enc), Go for the Throat! (2/enc). Med: Go for the Throat! (2/enc). Large: Go for the Throat! (2/enc)." }
            ],
            15: [
                { id: "scaling_3", name: "Companion Scaling", desc: "Small: Go for the Throat! (3/enc). Med: Ferocious (6 spaces). Large: Protect Me! (2/enc)." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Hunter",
    subtitle: "Resourceful survivalist, bowmaster, and skilled tracker",
    keyStats: ['dex', 'wil'], 
    saves: { adv: 'dex', dis: 'int' }, 
    proficiencies: {
        armor: "Leather Armor",
        weapons: "DEX Weapons"
    },
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#4ade80",
        accentDim: "#166534",
        bodyBg: "#061008",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(74, 222, 128, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0d1a0f 0%, #061008 100%)",
        panelBg: "rgba(20, 35, 25, 0.8)",
        border: "rgba(74, 222, 128, 0.2)"
    },

    initialStats: {
        baseStr: -1, baseDex: 3, baseInt: -1, baseWil: 1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Shadowpath", label: "Keeper of the Shadowpath", accent: "#94a3b8" },
        { value: "WildHeart", label: "Keeper of the Wild Heart", accent: "#f59e0b" },
        { value: "Beastmaster", label: "Beastmaster", accent: "#86efac" }
    ],

    resources: [
        { id: 'tothCharges', label: 'TotH Charges', manual: true, calcMax: (level, stats) => Math.max(1, Math.max(stats.dex, stats.wil)) }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; 
        let woundMax = 6;
        if (level >= 4) speed += 2; 

        // Dynamic HP scaling for Impressive Form
        if (subclass === "WildHeart" && level >= 3) {
            CLASS_CONFIG.hitDie = 10;
            CLASS_CONFIG.baseHp = 18; // Base 13 + 5
        } else {
            CLASS_CONFIG.hitDie = 8;
            CLASS_CONFIG.baseHp = 13;
        }

        return { speed, woundMax };
    },

    getStatOverrides: function(level, subclass, state, statsMap) {
        let overrides = {};
        if (subclass === "WildHeart" && level >= 15) overrides.armor = (overrides.armor || 0) + statsMap.wil;
        return overrides;
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        let maxCharges = Math.max(state.baseDex + state.addDex, state.baseWil + state.addWil);
        let currentCharges = state.resourceValues.tothCharges || 0;

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 15px;">
               <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Hunter's Mark</label>
                   <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.2; text-align: center; margin: auto 0;">Advantage<br><span style="font-size: 0.8em; color: var(--gold-light);">OR</span> +${level} Dmg</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); text-align: center; margin-top: auto; font-family:'Cinzel'; font-weight:bold;">Primary Quarry</div>
               </div>

               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">TotH Charges</label>
                   <div style="display: flex; align-items: center; gap: 8px;">
                       <div class="dark-incrementer" style="padding: 4px 10px;">
                           <button onclick="adjRes('tothCharges', -1, ${maxCharges})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">-</button>
                           <input type="number" id="res_tothCharges" value="${currentCharges}" min="0" max="${maxCharges}" 
                                  onchange="adjRes('tothCharges', parseInt(this.value), ${maxCharges}, true)" style="width:30px; font-size: 1.3em;">
                           <button onclick="adjRes('tothCharges', 1, ${maxCharges})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">+</button>
                       </div>
                       <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 1.1em;">/ <span style="color: var(--text-main);">${maxCharges}</span></div>
                   </div>
               </div>

               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                   <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Gain Charge</label>
                   <div style="font-size: 0.65em; color: var(--text-muted); line-height: 1.3; margin: auto 0; font-family:'Crimson Text'; font-style:italic;">
                        ● Quarry Dies<br>
                        ● Melee Hit<br>
                        ● Ranged Crit
                   </div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Cinzel'; font-weight:bold;">RECOVERY</div>
               </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips, rSSC) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = HUNTER_FEATURES.subclasses[subclass] || {};
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
            if (HUNTER_FEATURES.core[l]) {
                HUNTER_FEATURES.core[l].forEach(feat => {
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

        const statsMap = { str: state.baseStr + state.addStr, dex: state.baseDex + state.addDex, int: state.baseInt + state.addInt, wil: state.baseWil + state.addWil };
        let context = { type: 'attack', stat: 'dex' };

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(HUNTER_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && HUNTER_OPTIONS[collection][val]) ? HUNTER_OPTIONS[collection][val].desc : "";

                let abilityContext = { ...context };
                if (val === "Go for the Throat!" || val === "Protect Me!") abilityContext.isMinion = true;

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="border-bottom-color: var(--class-accent); margin-bottom: 5px;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d, level, statsMap, abilityContext)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice, level, statsMap, context);
    }
};