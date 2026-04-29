const STORMSHIFTER_DATA = {
    forms: {
        "Normal": "Standard humanoid form. No bonuses.",
        "Harmless": "Tiny beast (Squirrel, Bird). Speed: 6. Speak with animals. Ending ends form.",
        "Fearsome": "Large beast. Gain DEX+LVL temp HP. Attack: Gore (1d6+LVL). Reroll Defend/Interpose for 1 mana.",
        "Beast of the Pack": "Medium beast. Gain +DEX Speed. Attack: Thunderfang (1d4+LVL). Kill: +1d4 lightning (cumulative). Spend WIL mana for +1d8/pt dmg.",
        "Beast of Nightmares": "Tiny beast. Speed: 2. Attack: Sting (1d4+3xLVL acid). Silent But Deadly: Cannot be targeted until you attack."
    },
    chimericBoons: [
        "Beast of the Sea (Swim/Breath)",
        "Climber (Walk walls/ceilings)",
        "Fleet Footed (+2 Speed, ADV Stealth)",
        "Earthwalker (+2 Armor, Burrow)",
        "Keen Senses (ADV Perception/Assess)",
        "Leader of the Pack (ADV Fear/Charm for 6r aura)",
        "Phasebeast (Teleport 6 on shift)",
        "Prehensile Tail (Grapple on melee hit)",
        "Winged (Fly speed, forced move 2x)"
    ],
    unlocked: [
        { school: "Lightning", tier: "Cantrip", name: "Zap" },
        { school: "Lightning", tier: "Cantrip", name: "Overload" },
        { school: "Wind", tier: "Cantrip", name: "Razor Wind" },
        { school: "Wind", tier: "Cantrip", name: "Breath of Life" },
        { school: "Wind", tier: "Tier 1", name: "Blustery Gale" },
        { school: "Lightning", tier: "Tier 1", name: "Arc Lightning" },
        { school: "Wind", tier: "Tier 2", name: "Barrier of Wind" },
        { school: "Lightning", tier: "Tier 2", name: "Alacrity" },
        { school: "Wind", tier: "Tier 3", name: "Fly" },
        { school: "Lightning", tier: "Tier 3", name: "Stormlash" }
    ]
};

const BOON_DESCS = {
    "Beast of the Sea (Swim/Breath)": "Swim speed equal to normal speed. Can breathe underwater.",
    "Climber (Walk walls/ceilings)": "Walk on walls and ceilings as normal ground; ignore difficult terrain.",
    "Fleet Footed (+2 Speed, ADV Stealth)": "+2 speed. Advantage on Stealth and against Grappled.",
    "Earthwalker (+2 Armor, Burrow)": "+2 armor. Burrow at 1/2 speed. Advantage vs Prone.",
    "Keen Senses (ADV Perception/Assess)": "Advantage on Perception and Assess. Unaffected by Blinded.",
    "Leader of the Pack (ADV Fear/Charm for 6r aura)": "Advantage vs Fear and Charm for you and allies in 6 reach.",
    "Phasebeast (Teleport 6 on shift)": "Teleport up to 6 spaces when shifting in or out of form.",
    "Prehensile Tail (Grapple on melee hit)": "Melee hit on targets your size or smaller: they are Grappled. Large targets: you move with them.",
    "Winged (Fly speed, forced move 2x)": "Gain fly speed. Forced movement moves you twice as far."
};

const CLASS_CONFIG = {
    name: "Stormshifter",
    subtitle: "Master of weather, beast, and nature",
    keyStats: ['wil', 'dex'], 
    saves: { adv: 'wil', dis: 'str' }, 
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
            return Math.max(1, base);
        }}
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        if (level >= 2) speed += 2;
        if (level >= 9) speed += 2;

        return { speed, woundMax };
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const manaMax = (state.baseWil + state.addWil) * 3 + level;
        let shiftMax = (state.baseDex + state.addDex);
        if (level >= 6) shiftMax += 1;
        if (level >= 9) shiftMax += 1;
        if (level >= 12) shiftMax += 1;
        shiftMax = Math.max(1, shiftMax);

        let activeForm = (state.currentForm && state.currentForm[0]) || "Normal";
        let opts = ""; Object.keys(STORMSHIFTER_DATA.forms).forEach(k => {
            // Level gate forms
            let show = true;
            if (k === "Fearsome" && level < 2) show = false;
            if (k === "Beast of the Pack" && level < 3) show = false;
            if (k === "Beast of Nightmares" && level < 5) show = false;
            if (show) opts += `<option value="${k}" ${k===activeForm?'selected':''}>${k}</option>`;
        });

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 12px; justify-content: center;">
                ${level >= 2 ? `
                <!-- Column 1: Mana -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.0em;">+</button>
                    </div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <!-- Column 2: Shift Charges -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Beastshift</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('shiftUses', -1, ${shiftMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                        <input type="number" id="res_shiftUses" value="${state.resourceValues.shiftUses||0}" onchange="adjRes('shiftUses', parseInt(this.value), ${shiftMax}, true)" style="width:32px; font-size: 1.4em;">
                        <button onclick="adjRes('shiftUses', 1, ${shiftMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">+</button>
                    </div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${shiftMax}</div>
                </div>

                <!-- Column 3: Active Form -->
                <div style="flex: 1.5; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Current Form</label>
                    <select onchange="updateClassState('currentForm', 0, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(45, 212, 191, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%; text-align-last: center;">${opts}</select>
                    <div style="font-size: 0.75em; color: var(--text-muted); line-height: 1.2; font-family:'Crimson Text'; font-style:italic;">${STORMSHIFTER_DATA.forms[activeForm]}</div>
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Stormshifter Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> WIL(+), STR(-)<br><strong>Armor:</strong> Cloth, Leather | <strong>Weapons:</strong> Staves, Wands`, "", true);
        fHtml += bFeat("Master of Storms", 1, `You know all cantrips from the Lightning and Wind schools.`);
        fHtml += bFeat("Beastshift", 1, `Action: Transform into a harmless beast. Speek with animals. DEX charges/Safe Rest. Form ends if you drop to 0 HP or cast spell.`);

        if (level >= 2) {
            fHtml += bFeat("Mana Pool", 2, `You gain a mana pool (<strong>WILx3+LVL</strong>) to cast Tempest spells.`);
            fHtml += bFeat("Direbeast Form", 2, `You can now Beastshift into a <strong>Fearsome Beast</strong> (Large).`);
        }

        if (level >= 3) {
            fHtml += bFeat("Direbeast Form (2)", 3, `You can now Beastshift into a <strong>Beast of the Pack</strong> (Medium).`);
            if (subclass === "SkyStorm") {
                fHtml += bFeat("Deepening Study", 3, `Learn all spells from the Ice or Radiant school. Cast spells while Beastshifted.`, sCls);
            } else if (subclass === "FangClaw") {
                fHtml += bFeat("Swiftshift", 3, `Init: Beastshift or Move for free. Shift between Direbeast forms for free (Reaction for 1 mana).`, sCls);
                fHtml += bFeat("Windborne Protector", 3, `(1/encounter) Reaction: When an enemy attacks, spend 2 mana to shift into Fearsome Beast, Interpose from 12 reach, and Defend for free.`, sCls);
                fHtml += bFeat("Friend of Beasts", 3, `Beasts won't attack unless harmed. Transform into harmless beasts without spending charges.`, sCls);
            }
        }

        if (level >= 4) {
            fHtml += bFeat("Stormcaller", 4, `Learn 1 Utility Spell from each elemental spell school.<br><strong>Key Stat Increase:</strong> +1 WIL or DEX.`);
        }
        if (level >= 5) {
            fHtml += bFeat("Direbeast Form (3)", 5, `You can now Beastshift into a <strong>Beast of Nightmares</strong> (Tiny).`);
            fHtml += bFeat("Secondary Stat Increase", 5, `+1 STR or INT.`);
            fHtml += bFeat("Upgraded Cantrips", 5, `Your lightning/wind cantrips grow stronger.`);
        }

        if (level >= 6) {
            let nBoons = level >= 17 ? 5 : level >= 12 ? 4 : level >= 9 ? 3 : 2;
            let bState = state.selectedBoons || [];
            let opts = `<option value="None">Select Chimeric Boon...</option>`;
            STORMSHIFTER_DATA.chimericBoons.forEach(k => opts += `<option value="${k}">${k}</option>`);
            
            let bHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<nBoons; i++) {
                let val = bState[i] || "None";
                bHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedBoons', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(45, 212, 191, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(BOON_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Chimeric Boons", 6, `Choose <strong>${nBoons}</strong> form mutations.${bHtml}</div>`, "", true);
            fHtml += bFeat("Expert Shifter", 6, `Gain 1 additional use of Beastshift per Safe Rest.`);
        }

        if (level >= 7) {
            if (subclass === "SkyStorm") fHtml += bFeat("Raging Tempest", 7, `Whenever you crit with a tiered spell, you may cast a cantrip for free from a school you know and haven't used this turn.`, sCls);
            else if (subclass === "FangClaw") {
                fHtml += bFeat("Unleash the Beast", 7, `(1/encounter) When you miss, you can crit instead.`, sCls);
                fHtml += bFeat("Storm Wake", 7, `(1/encounter) Action: Spend 3 mana to shift into Beast of the Pack, teleport 12 reach in a line, and deal <strong>WIL</strong> d8 lightning dmg to targets in path.`, sCls);
            }
        }

        if (level >= 8) fHtml += bFeat("Key Stat Increase", 8, `+1 WIL or DEX.`);
        if (level >= 9) fHtml += bFeat("Secondary Stat Increase", 9, `+1 STR or INT.`);

        if (level >= 11) {
            if (subclass === "SkyStorm") fHtml += bFeat("Primordial Force", 11, `2+ mana spells grant riders: Ice (WIL temp HP), Lightning (WIL dmg), Radiant (Heal WIL HP in 6), Wind (Fly speed + 6 move free).`, sCls);
            else if (subclass === "FangClaw") {
                fHtml += bFeat("Master of Forms", 11, `Your shapeshift forms can have 2 Chimeric Boons at a time.`, sCls);
                fHtml += bFeat("Venomous Gaze", 11, `(1/encounter) Action: Spend 2 mana to shift into Beast of Nightmares, pull enemy within 12 by 2xWIL spaces, and free Sting on contact.`, sCls);
            }
        }

        if (level >= 12) fHtml += bFeat("Key Stat Increase", 12, `+1 WIL or DEX.`);

        if (level >= 13) {
            fHtml += bFeat("Stormborn (2)", 13, `Spend Beastshift charge to deal max damage with a Wind spell. Cast cantrip for free when ending shift.`);
            fHtml += bFeat("Secondary Stat Increase", 13, `+1 STR or INT.`);
        }

        if (level >= 15) {
            if (subclass === "SkyStorm") fHtml += bFeat("Master of Storm", 15, `Concentrate on 1 lightning and 1 wind spell at the same time. (1/Safe Rest) Cast Ride the Lightning for 0 mana.`, sCls);
            else if (subclass === "FangClaw") fHtml += bFeat("Master of Forms (2)", 15, `Beastshift 2 additional times per Safe Rest. Your Direbeast forms can have 3 Boons at a time.`, sCls);
            fHtml += bFeat("Upgraded Cantrips", 15, `Your cantrips grow stronger.`);
        }

        if (level >= 16) fHtml += bFeat("Key Stat Increase", 16, `+1 WIL or DEX.`);
        if (level >= 17) fHtml += bFeat("Secondary Stat Increase", 17, `+1 STR or INT.`);

        if (level >= 19) fHtml += bFeat("Epic Boon", 19, `Choose an Epic Boon (see pg. 23 of the GM's Guide).`);
        if (level >= 20) fHtml += bFeat("Archdruid", 20, `+1 to any 2 stats. (1/encounter) Cast a spell up to tier 4 for free when you enter or leave a Beastshift form. Upgraded Cantrips.`);

        return fHtml;
    },

    getSpellCardsHTML: function(level, subclass, state, derived, formatPips, iStats) {
        let sHtml = "";
        
        STORMSHIFTER_DATA.unlocked.forEach(spell => {
            const data = SPELL_REGISTRY[spell.school][spell.name];
            if (data) {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                if (data.tier.includes("Cantrip") || (level >= 2 && level >= (tNum*2))) {
                    sHtml += `<div class="spell-card ${spell.school.toLowerCase()}"><h4>${spell.name} <span class="tier-tag">${formatPips(data.tier)}</span></h4><div class="spell-desc">${iStats(data.desc)}</div></div>`;
                }
            }
        });

        return sHtml;
    }
};