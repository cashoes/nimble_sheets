const HUNTER_DATA = {
    tothAbilities: {
        "Offensive": [
            "Addling Arrow",
            "Heavy Shot",
            "Incendiary Shot",
            "Multishot",
            "Sharpshooter",
            "Vital Shot"
        ],
        "Tactical & Control": [
            "Come Get Some!",
            "Decoy",
            "Grease Trap",
            "Pinning Shot",
            "Snare Trap"
        ],
        "Utility & Survival": [
            "Fleet Feet",
            "Hail of Arrows",
            "Wild Instinct"
        ],
        "Beastmaster (Subclass)": [
            "Go for the Throat!",
            "Protect Me!"
        ]
    }
};

const TOTH_DESCS = {
    "Addling Arrow": "Action: Attack with a ranged weapon. The next attack the target makes must be against the closest other creature, chosen at random.",
    "Come Get Some!": "Action: Attack a target. It is Taunted by you until the end of their next turn.",
    "Decoy": "When you Defend: The attack misses instead, and you can move up to half your speed away (where you really were all along!).",
    "Fleet Feet": "Move up to your speed for free, ignoring difficult terrain.",
    "Grease Trap": "(1/encounter) Reaction (enemy moves within 6 spaces): Target falls Prone, is vulnerable to fire damage, and is treated as Smoldering.",
    "Hail of Arrows": "(Half range) 2 actions: Shoot all creatures within a 3x3 area. Their speed is halved until the end of their next turn.",
    "Heavy Shot": "(Half range) Action: Attack with a ranged weapon and push your target: 4 spaces for small, 2 for medium, 1 for large.",
    "Incendiary Shot": "(Half range) Action: Attack with a ranged weapon, add WIL d8 fire damage.",
    "Multishot": "(Half range) Action: Attack your quarry with a ranged weapon and load an extra projectile. Select a 2nd target within 2 spaces to take the same damage.",
    "Pinning Shot": "Spend 3 actions shooting your quarry. They are Restrained until they can escape (DC 10+WIL).",
    "Snare Trap": "(1/encounter) Reaction (enemy moves within 6 spaces): Move them back 1 space, they are Restrained until they can escape (DC 10+WIL).",
    "Sharpshooter": "Action: If you have not moved this turn and your quarry is 4 or more spaces away, attack them for double damage.",
    "Vital Shot": "(Half range) Action: Attack your Hampered quarry with a ranged weapon, ignoring armor or doubling Hunter's Mark damage.",
    "Wild Instinct": "(1/round, costs 0 TotH) If you have none, Assess for free, with advantage.",
    "Go for the Throat!": "Command companion to attack your quarry. Small: 1 TotH (1d4+LVL), Med: 1 TotH (1d8+3xLVL), Large: 2 TotH/2 Actions (1d12+4xLVL).",
    "Protect Me!": "Command companion to defend you. Small: Miss on Defend, Med: Free counter-attack (1d4+LVL), Large: Half damage from first attack each round."
};

const COMPANION_DATA = {
    "None": "No companion selected.",
    "Small": "Keen Eyes: Mark a target for free (1/encounter). Protect Me!: Attacks against you miss when you Defend. Go for the Throat! (1/round): 1 TotH charge, 1d4+LVL dmg.",
    "Medium": "Ferocious: When you or companion crit, companion attacks again for LVL dmg. Protect Me!: When you Defend, first attack that creature (1d4+LVL). Go for the Throat!: 1 TotH charge, 1d8+3xLVL dmg.",
    "Large": "Alpha Protector: Damage from first attack against you each round is halved. Protect Me!: After a Wound, whisked up to 12 spaces away. Go for the Throat!: 2 TotH charges, 2 actions, 1d12+4xLVL dmg."
};

const CLASS_CONFIG = {
    name: "Hunter",
    subtitle: "Resourceful survivalist, bowmaster, and skilled tracker",
    keyStats: ['dex', 'wil'], 
    saves: { adv: 'dex', dis: 'int' }, 
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
        if (level >= 4) speed += 2; // Explorer of the Wilds

        // Wild Heart Upgrades
        let hpBonus = (subclass === "WildHeart" && level >= 3) ? 5 : 0;
        let hdFace = (subclass === "WildHeart" && level >= 3) ? 10 : 8;

        return { speed, woundMax, hpBonus, hdFace };
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
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 12px;">
               <!-- Column 1: Bonus -->
               <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Hunter's Mark</label>
                   <div style="font-size: 1.4em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.2; text-align: center; margin: auto 0;">Advantage<br><span style="font-size: 0.8em; color: var(--gold-light);">OR</span> +${level} Dmg</div>
                   <div style="font-size: 0.65em; color: var(--text-muted); text-align: center; margin-top: auto; font-family:'Cinzel'; font-weight:bold;">Primary Quarry</div>
               </div>

               <!-- Column 2: Charges -->
               <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                   <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">TotH Charges</label>
                   <div class="dark-incrementer" style="padding: 4px 10px;">
                       <button onclick="adjRes('tothCharges', -1, ${maxCharges})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">-</button>
                       <input type="number" id="res_tothCharges" value="${currentCharges}" min="0" max="${maxCharges}" 
                              onchange="adjRes('tothCharges', parseInt(this.value), ${maxCharges}, true)" style="width:30px; font-size: 1.3em;">
                       <button onclick="adjRes('tothCharges', 1, ${maxCharges})" style="width:20px; height:20px; line-height:1; font-size:1.1em;">+</button>
                   </div>
                   <div style="font-size: 0.65em; color: var(--text-muted); margin-top: auto; font-family:'Cinzel'; font-weight:bold;">MAX ${maxCharges}</div>
               </div>

               <!-- Column 3: The Hunt -->
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

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Hunter Basics", "", `<strong>Hit Die:</strong> 1d${derived.hdFace} | <strong>Saves:</strong> DEX(+), INT(-)<br><strong>Armor:</strong> Leather Armor | <strong>Weapons:</strong> DEX Weapons`, "", true);
        fHtml += bFeat("Hunter's Mark", 1, `Action: Mark a quarry for 1 day. Attacks against it have advantage OR +<strong>LVL</strong> damage.`);
        fHtml += bFeat("Forager", 1, `Advantage on skill checks to find food and water in the wild.`);

        if (level >= 2) {
            fHtml += bFeat("Thrill of the Hunt", 2, `Gain a charge whenever: Quarry dies, you hit quarry in melee, or you crit quarry at range.`);
            fHtml += bFeat("Roll & Strike", 2, `Action: If you have no TotH charges, move up to speed and make a free melee attack.`);
        }

        if (level >= 3) {
            fHtml += bFeat("Tracker's Intuition", 3, `Accurately discern numbers, direction, and timing of past encounters by tracks.`);
            if (subclass === "Shadowpath") {
                fHtml += bFeat("Ambusher", 3, `Mark quarry for free on Initiative. Advantage on first attack each encounter.`, sCls);
                fHtml += bFeat("Skilled Tracker", 3, `Advantage on skill checks to track creatures.`, sCls);
            } else if (subclass === "WildHeart") {
                fHtml += bFeat("Impressive Form", 3, `+5 max HP. Upgrade Hit Dice to d10s.`, sCls);
                fHtml += bFeat("I Have the High Ground", 3, `Gain 1/2 speed for free on Init or when gaining TotH charges.`, sCls);
            } else if (subclass === "Beastmaster") {
                let cSize = (state.selectedCompanion && state.selectedCompanion[0]) || "None";
                let opts = ""; Object.keys(COMPANION_DATA).forEach(k => opts += `<option value="${k}" ${k===cSize?'selected':''}>${k}</option>`);
                let cHtml = `<div style="margin-top: 10px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px; display: block;">Companion Size</label>
                    <select onchange="updateClassState('selectedCompanion', 0, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(134, 239, 172, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(COMPANION_DATA[cSize])}</div>
                </div>`;
                fHtml += bFeat("Animal Companion", 3, `No stats or actions to track. Your companion's attacks count as your own for TotH.${cHtml}`, sCls, true);
            }
        }

        if (level >= 4) {
            fHtml += bFeat("Explorer of the Wilds", 4, `+2 speed and gain a climbing speed.<br><strong>Key Stat Increase:</strong> +1 DEX or WIL.`);
            
            let numToth = level>=14?7 : level>=12?6 : level>=10?5 : level>=8?4 : level>=6?3 : level>=4?2 : 2;
            let hState = state.selectedToth || [];
            let opts = `<option value="None">Select a TotH Ability...</option>`;
            Object.keys(HUNTER_DATA.tothAbilities).forEach(group => {
                opts += `<optgroup label="${group}">`;
                HUNTER_DATA.tothAbilities[group].forEach(k => opts += `<option value="${k}">${k}</option>`);
                opts += `</optgroup>`;
            });
            
            let hHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<numToth; i++) {
                let val = hState[i] || "None";
                hHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedToth', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(TOTH_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Thrill of the Hunt Abilities", 2, `Choose <strong>${numToth}</strong> abilities.${hHtml}</div>`, "", true);
        }

        if (level >= 5) {
            fHtml += bFeat("Hunter's Resolve", 5, `When you have no TotH charges, treat all creatures as your quarry for movement and melee attacks.`);
            fHtml += bFeat("Final Takedown", 5, `Spend 1 TotH charge to turn a hit on a Bloodied quarry into a crit and double Mark damage. If they survive, they crit you back.`);
            fHtml += bFeat("Secondary Stat Increase", 5, `+1 STR or INT.`);
        }

        if (level >= 6) fHtml += bFeat("Versatile Bowmaster", 6, `When attacking with Longbow, roll <strong>2d4</strong> instead of 1d8; or Crossbow, <strong>2d8</strong> instead of 4d4.`);

        if (level >= 7) {
            if (subclass === "Shadowpath") {
                fHtml += bFeat("Primal Predator", 7, `(1/encounter) Your weapon attacks ignore cover and armor this turn.`, sCls);
            } else if (subclass === "WildHeart") {
                fHtml += bFeat("Resourceful Herbalist", 7, `(1/Safe Rest) Craft <strong>WIL</strong> Healing Salves (Heal WIL d6 HP).`, sCls);
            } else if (subclass === "Beastmaster") {
                let upgrade = "Small: Keen Eyes (2/enc), Protect Me! upgrades. Med: Ferocious (4 spaces). Large: Protect Me! upgrades.";
                fHtml += bFeat("Companion Scaling", 7, upgrade, sCls);
            }
        }

        if (level >= 8) fHtml += bFeat("Key Stat Increase", 8, `+1 DEX or WIL.`);

        if (level >= 9) {
            fHtml += bFeat("No Escape", 9, `When an ally makes an opportunity attack, you may make a ranged opportunity attack against the same target.`);
            fHtml += bFeat("Secondary Stat Increase", 9, `+1 STR or INT.`);
        }

        if (level >= 10) {
            fHtml += bFeat("Veteran Stalker", 10, `Gain a TotH charge when first Bloodied and for every Wound gained.`);
            fHtml += bFeat("Keen Eye, Steady Hand", 10, `Add <strong>WIL</strong> to your ranged weapon damage.`);
        }

        if (level >= 11) {
            if (subclass === "Shadowpath") {
                fHtml += bFeat("Pack Hunter", 11, `When you mark a creature, mark another within 6 spaces for free.`, sCls);
            } else if (subclass === "WildHeart") {
                fHtml += bFeat("Ha! I'm Over Here!", 11, `(1/Safe Rest) If an attack would drop you to 0 HP, move speed away and take no damage.`, sCls);
            } else if (subclass === "Beastmaster") {
                let upgrade = "Small: Keen Eyes (3/enc), Go for the Throat! (2/enc). Med: Go for the Throat! (2/enc). Large: Go for the Throat! (2/enc).";
                fHtml += bFeat("Companion Scaling", 11, upgrade, sCls);
            }
        }

        if (level >= 12) fHtml += bFeat("Key Stat Increase", 12, `+1 DEX or WIL.`);

        if (level >= 13) {
            fHtml += bFeat("Keen Sight", 13, `Advantage on Perception checks.`);
            fHtml += bFeat("Secondary Stat Increase", 13, `+1 STR or INT.`);
        }

        if (level >= 15) {
            if (subclass === "Shadowpath") {
                fHtml += bFeat("Apex Predator", 15, `Use Primal Predator twice per encounter. Gain 1 TotH charge on Initiative.`, sCls);
            } else if (subclass === "WildHeart") {
                fHtml += bFeat("Unparalleled Survivalist", 15, `Gain <strong>+WIL</strong> Armor. When attacking at range, move 1/2 speed for free first.`, sCls);
            } else if (subclass === "Beastmaster") {
                let upgrade = "Small: Go for the Throat! (3/enc). Med: Ferocious (6 spaces). Large: Protect Me! (2/enc).";
                fHtml += bFeat("Companion Scaling", 15, upgrade, sCls);
            }
        }

        if (level >= 16) fHtml += bFeat("Key Stat Increase", 16, `+1 DEX or WIL.`);

        if (level >= 17) {
            fHtml += bFeat("Peerless Hunter", 17, `You can Defend against your quarry for free.`);
            fHtml += bFeat("Secondary Stat Increase", 17, `+1 STR or INT.`);
        }

        if (level >= 18) fHtml += bFeat("Wild Endurance", 18, `Gain 1 Thrill of the Hunt charge at the start of your turns.`);
        if (level >= 19) fHtml += bFeat("Epic Boon", 19, `Choose an Epic Boon (see pg. 23 of the GM's Guide).`);
        if (level >= 20) fHtml += bFeat("Nemesis", 20, `+1 to any 2 stats. Your Hunter’s Mark can target any number of creatures simultaneously.`);

        return fHtml;
    }
};