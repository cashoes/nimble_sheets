const CHEAT_OPTIONS = {
    underhanded: {
        "Creative Accounting": { desc: "Steal up to INT actions from your next turn (Gain actions now, subtract from next). You cannot use this 2 turns in a row." },
        "Exploit Weakness": { desc: "Action: Make a contested INT check against an enemy. If you win, you can use Vicious Opportunist against them, even if they are not Distracted. This lasts for 1 minute or until you use this ability against another target." },
        "Feinting Attack": { desc: "If you miss for the 2nd time in a single round, you may change the primary die roll to any result instead." },
        "How'd YOU get here?!": { desc: "2 actions: “Teleport” up to 4 spaces away, adjacent to a Distracted target, and make a melee attack against them. If you crit, you may \"teleport\" again." },
        "I’m Outta Here!": { desc: "When an ally within 4 spaces is crit, you may turn invisible until the end of your next turn and then move up to half your speed for free." },
        "Misdirection": { desc: "Gain INT armor. Whenever you Defend, you may halve the damage instead." },
        "Steal Tempo": { desc: "When you land a critical hit for the second time on a turn, your target loses 1 action and you gain 1 action." },
        "Sunder Armor (Medium)": { desc: "Action: When you crit an enemy with medium armor, sunder their armor. Until the start of your next turn, ALL melee attacks against that target ignore its armor." },
        "Sunder Armor (Heavy)": { desc: "Req. Sunder Armor (Medium). Your Sunder Armor ability now also applies to enemies wearing heavy armor." },
        "Trickshot": { desc: "When you throw a dagger, it returns back to your hand at the end of your turn. On a hit, it ricochets to another creature within 2 spaces, dealing half as much damage to them." }
    }
};

const CHEAT_FEATURES = {
    core: {
        1: [
            { id: "basics", name: "Cheat Basics", desc: "Hit Die: 1d6 | Saves: DEX(+), WIL(-)<br>Armor: Leather Armor | Weapons: DEX Weapons" },
            { id: "sneak_attack", name: "Sneak Attack", desc: "(1/turn) When you crit, deal +LVL damage (scales with level)." },
            { id: "vicious_opp", name: "Vicious Opportunist", desc: "(1/turn) When you hit a Distracted target with a melee attack, you may change the Primary Die roll to whatever you like (changing it to the max value counts as a crit)." }
        ],
        2: [
            { id: "cheat", name: "Cheat", desc: "You’re a well-rounded cheater. Gain the following abilities:<ul><li>(1/round) You may either Move or Hide for free.</li><li>(1/day) You may change any skill check to 10+INT.</li><li>If you roll less than 10 on Initiative, you may change it to 10 instead.</li><li>You may gain advantage on skill checks while playing any games, competitions, or placing wagers.</li></ul>" }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Cheat subclass.", minor: true },
            { id: "sneak_attack_2", name: "Sneak Attack (1d8)", desc: "Your Sneak Attack becomes 1d8.", minor: true },
            { id: "thieves_cant", name: "Thieves’ Cant", desc: "You learn the secret language of rogues and scoundrels." }
        ],
        4: [
            { id: "underhanded", name: "Underhanded Abilities", type: "dynamic_choice", collection: "underhanded", stateKey: "selectedUnderhanded", desc: "Choose Underhanded Abilities as you level up.", getCount: (level) => level >= 18 ? 8 : level >= 16 ? 7 : level >= 14 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 },
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 DEX or INT.", minor: true }
        ],
        5: [
            { id: "twist_blade", name: "Twist the Blade", desc: "Action: Change one of your Sneak Attack dice to whatever you like." },
            { id: "quick_read", name: "Quick Read", desc: "Gain advantage on an Assess check (1/encounter) and an Examination check (1/day)." },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 WIL or STR.", minor: true }
        ],
        6: [
            { id: "not_what_happened", name: "THAT'S Not What Happened!", desc: "(1/Safe Rest) Action: After a Distracted enemy attacks you, you may change the Primary Die roll to whatever you like (changing the die to the minimum value counts as a miss)." }
        ],
        7: [
            { id: "sneak_attack_3", name: "Sneak Attack (2d8)", desc: "Your Sneak Attack becomes 2d8.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 DEX or INT.", minor: true }
        ],
        9: [
            { id: "sneak_attack_4", name: "Sneak Attack (2d10)", desc: "Your Sneak Attack becomes 2d10.", minor: true },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 WIL or STR.", minor: true }
        ],
        11: [
            { id: "sneak_attack_5", name: "Sneak Attack (2d12)", desc: "Your Sneak Attack becomes 2d12.", minor: true }
        ],
        12: [
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 DEX or INT.", minor: true }
        ],
        13: [
            { id: "twist_blade_2", name: "Twist the Blade (2)", desc: "(1/turn) You can Twist the Blade for free." },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 WIL or STR.", minor: true }
        ],
        15: [
            { id: "sneak_attack_6", name: "Sneak Attack (2d20)", desc: "Your Sneak Attack becomes 2d20.", minor: true }
        ],
        16: [
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 DEX or INT.", minor: true }
        ],
        17: [
            { id: "sneak_attack_7", name: "Sneak Attack (3d20)", desc: "Your Sneak Attack becomes 3d20.", minor: true },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 WIL or STR.", minor: true }
        ],
        20: [
            { id: "supreme_exec", name: "Supreme Execution", desc: "+1 to any 2 of your stats. When you attack with a blade, you do not require targets to be Distracted to trigger Vicious Opportunist." }
        ]
    },
    subclasses: {
        "SilentBlade": {
            3: [
                { id: "commotion", name: "Amidst All This Commotion…", desc: "If a creature dies while you Sneak Attack them, you may turn Invisible until you attack again or until the beginning of your next turn." },
                { id: "no_trace", name: "Leave No Trace", desc: "Advantage on Stealth checks when you are at full health." }
            ],
            7: [
                { id: "cunning_strike", name: "Cunning Strike", desc: "(2/encounter) When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, they deal the maximum amount of damage (if your target saves, regain 1 use)." }
            ],
            11: [
                { id: "skulker", name: "Professional Skulker", desc: "Gain a climbing speed and advantage on Stealth checks (replaces Leave No Trace).", replaces: "no_trace" }
            ],
            15: [
                { id: "kill", name: "KILL", desc: "When you crit an enemy with fewer max HP than you, it dies." }
            ]
        },
        "Scoundrel": {
            3: [
                { id: "low_blow", name: "Low Blow", desc: "When you Sneak Attack, you may spend 2 additional actions to Incapacitate your target for their next turn on a failed STR save (DC 10+INT). Save or fail, they are Taunted by you until you drop to 0 HP." },
                { id: "sweet_talk", name: "Sweet Talk", desc: "You may gain advantage on all Influence checks with NPCs you’ve just met for the first time. This lasts until you fail an Influence check with them or until you meet a 2nd time. You have disadvantage on Influence checks with them after you use this ability (until you get back on their good side)." }
            ],
            7: [
                { id: "pocket_sand", name: "Pocket Sand", desc: "(2/encounter—you’ve got to collect more sand!) When you Defend against a melee attack, Blind the attacker until the start of their next turn and force them to reroll the attack (Blinded creatures attack with disadvantage)." }
            ],
            11: [
                { id: "escape_plan", name: "Escape Plan", desc: "(1/Safe Rest) When you would drop to 0 HP or gain a Wound, you don’t. Instead, you turn Invisible for 1 minute or until you attack." }
            ],
            15: [
                { id: "heads_i_win", name: "Heads I Win, Tails You Lose", desc: "(1/encounter) Attacks you make this round don’t miss, you crit on 1 less than normally needed, and you gain LVL temp HP." }
            ]
        }
    }
};

const CLASS_CONFIG = {
    name: "Cheat",
    subtitle: "Master of stealth, dirty fighting, and breaking rules",
    keyStats: ['dex', 'int'],
    saves: { adv: 'dex', dis: 'wil' },
    baseHp: 10,
    hpPerLevel: 5,
    hitDie: 6,

    theme: {
        accent: "#cbd5e1",
        accentDim: "#64748b",
        bodyBg: "#0f1115",
        containerBg: "radial-gradient(circle at 50% 50%, rgba(203, 213, 225, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1e2125 0%, #0f1115 100%)",
        panelBg: "rgba(35, 40, 45, 0.8)",
        border: "rgba(203, 213, 225, 0.2)"
    },

    initialStats: {
        baseStr: -1, baseDex: 3, baseInt: 1, baseWil: -1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "SilentBlade", label: "Tools of the Silent Blade", accent: "#94a3b8" },
        { value: "Scoundrel", label: "Tools of the Scoundrel", accent: "#22c55e" }
    ],

    resources: [],

    customHeaderStats: [],

    getDerivedStats: function (level, subclass, state) {
        let speed = 6;
        let woundMax = 6;

        let saDice = "1d6";
        if (level >= 3) saDice = "1d8";
        if (level >= 7) saDice = "2d8";
        if (level >= 9) saDice = "2d10";
        if (level >= 11) saDice = "2d12";
        if (level >= 15) saDice = "2d20";
        if (level >= 17) saDice = "3d20";

        return { speed, woundMax, saDice };
    },

    getStatOverrides: function (level, subclass, state, statsMap) {
        let overrides = {};
        let underhanded = state.selectedUnderhanded || [];
        if (underhanded.includes("Misdirection")) overrides.armor = (overrides.armor || 0) + statsMap.int;
        return overrides;
    },

    getShieldBonus: function (level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function (level, subclass, state, derived) {
        let cunningHtml = "";
        let oppBorder = "";
        if (level >= 2) {
            oppBorder = " border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;";
            cunningHtml = `
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Cunning</label>
                   <div style="font-size: 2.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">10+</div>
                   <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">Init Floor. Free Move/Hide.</div>
               </div>`;
        }

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 15px;">
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Sneak Attack</label>
                   <div style="font-size: 2.2em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; margin: auto 0;">${derived.saDice}</div>
                   <div style="font-size: 0.75em; color: var(--text-muted); text-align: center; margin-top: auto; font-family:'Cinzel'; font-weight:bold;">On Critical Hit</div>
               </div>

               <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; text-align: center;${oppBorder}">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Opportunist</label>
                   <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; text-transform: uppercase; line-height: 1.1; margin: auto 0;">Max Roll</div>
                   <div style="font-size: 0.7em; color: var(--text-muted); margin-top: auto; font-family:'Crimson Text'; font-style:italic;">Vs. Distracted targets</div>
               </div>
${cunningHtml}
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function (level, subclass, state, derived, bFeat, iStats, formatPips) {
        let fHtml = "";
        const sCls = "subclass-feature";
        const subData = CHEAT_FEATURES.subclasses[subclass] || {};
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
            if (CHEAT_FEATURES.core[l]) {
                CHEAT_FEATURES.core[l].forEach(feat => {
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
        let desc = feat.desc || "";

        let finalCssClass = cssClass || "";
        if (feat.minor) finalCssClass += " minor-feature";

        if (feat.type === "choice" || feat.type === "dynamic_choice") {
            let choiceHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            let selection = state[feat.stateKey] || [];
            let options = Object.keys(CHEAT_OPTIONS[collection] || {});

            let optsHtml = `<option value="None">-- Select Option --</option>`;
            options.forEach(opt => optsHtml += `<option value="${opt}">${opt}</option>`);

            for (let i = 0; i < count; i++) {
                let idx = (feat.startIndex || 0) + i;
                let val = selection[idx] || "None";
                let d = (val !== "None" && CHEAT_OPTIONS[collection][val]) ? CHEAT_OPTIONS[collection][val].desc : "";

                choiceHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('${feat.stateKey}', ${idx}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(245, 158, 11, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${optsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(d)}</div>
                </div>`;
            }
            desc += choiceHtml + `</div>`;
        }

        return bFeat(feat.name, feat.level || "", desc, finalCssClass, isChoice);
    }
};