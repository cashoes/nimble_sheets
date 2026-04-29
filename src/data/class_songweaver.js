const SONGWEAVER_DATA = {
    lyricalWeaponry: [
        "Heroic Ballad",
        "Inspiring Anthem",
        "Not My Beautiful Faaace!",
        "Rhapsody of the Normal",
        "Song of Domination"
    ],
    people: [
        "Stompy (Huge Hill Giant)",
        "Gran Gran (Healing Pastries)",
        "Mal, the Malevolent Imp",
        "Linos, the Everfriendly"
    ],
    unlocked: [
        { tier: "Cantrip", name: "Vicious Mockery" },
        { tier: "Tier 1", name: "Blustery Gale" },
        { tier: "Tier 2", name: "Barrier of Wind" },
        { tier: "Tier 3", name: "Fly" },
        { tier: "Tier 4", name: "Eye of the Storm" },
        { tier: "Tier 5", name: "Updraft" },
        { tier: "Tier 6", name: "Thousand Cuts" },
        { tier: "Tier 7", name: "Boisterous Winds" }
    ]
};

const LYRICAL_DESCS = {
    "Heroic Ballad": "+2 max Inspiration charges. Reroll an ally's attack: they also gain +WIL damage.",
    "Inspiring Anthem": "(1/encounter) Action: Grant all friendly Dying creatures you can hear 1 HP and 1 action.",
    "Not My Beautiful Faaace!": "(1/encounter) Defend: Attacker must make WIL save or target someone else. Fail by 5+: they hit themselves with DIS.",
    "Rhapsody of the Normal": "Roll 4+ on Vicious Mockery: spend 1 Inspiration to temporarily suppress a target's special abilities until end of next turn.",
    "Song of Domination": "(1/encounter) 2 actions: Enemies in 6 spaces must make WIL save or move 6 spaces in any direction and cannot move next turn."
};

const PEOPLE_DESCS = {
    "Stompy (Huge Hill Giant)": "3 actions: Summon for 1 round. Stomp: DC 10 Influence check. Success: move Stompy 6. Failure: he moves toward YOU. Deals LVL+Influence damage to all in path.",
    "Gran Gran (Healing Pastries)": "Summon for 1 hour while resting. Hands out pastries: recover 1 mana, Hit Die, or Wound. (Eat within 10 min).",
    "Mal, the Malevolent Imp": "Summon for 1 night. Can find dangerous info or 'take care' of problems with a slight chance of things going wrong. Influence check to convince.",
    "Linos, the Everfriendly": "Summon legendary flying creature to transport party. May request a very large amount of food as payment."
};

const CLASS_CONFIG = {
    name: "Songweaver",
    subtitle: "Inspiring presence with a sharp wit and sharper tongue",
    keyStats: ['wil', 'int'], 
    saves: { adv: 'wil', dis: 'str' }, 
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#fb7185",
        accentDim: "#e11d48",
        bodyBg: "#0f0505",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(251, 113, 133, 0.08) 0%, transparent 100%), linear-gradient(180deg, #1a0f11 0%, #0f0505 100%)",
        panelBg: "rgba(35, 20, 22, 0.8)",
        border: "rgba(251, 113, 133, 0.3)"
    },

    initialStats: {
        baseStr: -1, baseDex: 1, baseInt: 1, baseWil: 3
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "Snark", label: "Herald of Snark", accent: "#a855f7" },
        { value: "Courage", label: "Herald of Courage", accent: "#f59e0b" }
    ],

    resources: [
        { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.int * 3) + level : 0 },
        { id: 'inspiration', label: 'Inspiration', manual: true, calcMax: (level, state) => {
            let max = (state.baseWil + state.addWil) * 2;
            if (state.selectedLyrical && state.selectedLyrical.includes("Heroic Ballad")) max += 2;
            return max;
        }}
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        let mockDmg = 0;
        if (level >= 5) mockDmg += 2;
        if (level >= 10) mockDmg += 2;
        if (level >= 15) mockDmg += 2;
        if (level >= 20) mockDmg += 2;

        return { speed, woundMax, mockDmg };
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const manaMax = (state.baseInt + state.addInt) * 3 + level;
        let insMax = (state.baseWil + state.addWil) * 2;
        if (state.selectedLyrical && state.selectedLyrical.includes("Heroic Ballad")) insMax += 2;

        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 15px; justify-content: center;">
                ${level >= 2 ? `
                <!-- Column 1: Mana -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Mana Pool</label>
                    <div class="dark-incrementer" style="padding: 4px 10px;">
                        <button onclick="adjRes('mana', -1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                        <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('mana', 1, ${manaMax})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MAX ${manaMax}</div>
                </div>` : ''}

                <!-- Column 2: Inspiration -->
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Inspiration</label>
                    <div class="dark-incrementer" style="padding: 4px 10px; border-color: var(--gold-dim);">
                        <button onclick="adjRes('inspiration', -1, ${insMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">-</button>
                        <input type="number" id="res_inspiration" value="${state.resourceValues.inspiration||0}" onchange="adjRes('inspiration', parseInt(this.value), ${insMax}, true)" style="width:35px; font-size: 1.4em;">
                        <button onclick="adjRes('inspiration', 1, ${insMax})" style="width:22px; height:22px; line-height:1; font-size:1.0em;">+</button>
                    </div>
                    <div style="font-size: 0.65em; color: var(--text-muted); margin-top: 8px; font-family: 'Crimson Text'; font-style: italic;">Free Reaction Reroll</div>
                </div>

                <!-- Column 3: Mockery -->
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">V. Mockery</label>
                    <div style="font-size: 1.8em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">1d4+${state.baseInt + state.addInt + derived.mockDmg}</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Crimson Text'; font-style:italic;">Psychic. Taunts on hit.</div>
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Songweaver Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> WIL(+), STR(-)<br><strong>Armor:</strong> Leather | <strong>Weapons:</strong> DEX, Wands`, "", true);
        fHtml += bFeat("Songweaver's Inspiration", 1, `(2xWIL/Safe Rest) Free Reaction: Allow an ally to reroll a single attack or save die.`);

        if (level >= 2) {
            fHtml += bFeat("Jack of All Trades", 2, `When you Safe Rest, move 1 skill point as if you just leveled up.`);
            fHtml += bFeat("Song of Rest", 2, `(1/day) Field Rest: Everyone spending HD heals additional HP equal to your <strong>WIL</strong>.`);
        }

        if (level >= 3) {
            fHtml += bFeat("Quick Wit", 3, `Roll Init: Regain 2 spent uses of Inspiration (cannot exceed max).`);
            fHtml += bFeat("Windbag", 3, `Learn 1 Utility Spell from each elemental spell school.`);
            if (subclass === "Snark") {
                fHtml += bFeat("Opportunistic Snark", 3, `Reaction (enemy in 12 misses attack): Cast Vicious Mockery; deals 2x damage.`, sCls);
            } else if (subclass === "Courage") {
                fHtml += bFeat("Inspiring Presence", 3, `Whenever you use Inspiration, allies within 12 spaces gain <strong>WIL</strong> temp HP.`, sCls);
            }
        }

        if (level >= 4) {
            fHtml += bFeat("Key Stat Increase", 4, `+1 WIL or INT.`);
            let nLyrical = level >= 17 ? 4 : level >= 13 ? 3 : level >= 9 ? 2 : 1;
            let lState = state.selectedLyrical || [];
            let opts = `<option value="None">Select Lyrical Weaponry...</option>`;
            SONGWEAVER_DATA.lyricalWeaponry.forEach(k => opts += `<option value="${k}">${k}</option>`);
            
            let lHtml = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
            for(let i=0; i<nLyrical; i++) {
                let val = lState[i] || "None";
                lHtml += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                    <select onchange="updateClassState('selectedLyrical', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(251, 113, 133, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                    <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(LYRICAL_DESCS[val]) : ""}</div>
                </div>`;
            }
            fHtml += bFeat("Lyrical Weaponry", 4, `Choose <strong>${nLyrical}</strong> techniques.${lHtml}</div>`, "", true);
        }

        if (level >= 5) {
            let pSize = (state.selectedPeople && state.selectedPeople[0]) || "None";
            let opts = ""; SONGWEAVER_DATA.people.forEach(k => opts += `<option value="${k}" ${k===pSize?'selected':''}>${k}</option>`);
            let pHtml = `<div style="margin-top: 10px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                <select onchange="updateClassState('selectedPeople', 0, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(251, 113, 133, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts}</select>
                <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${iStats(PEOPLE_DESCS[pSize] || "")}</div>
            </div>`;
            fHtml += bFeat("A \"People\" Person", 5, `Summon friends (1/Safe Rest each).${pHtml}`, "", true);
            fHtml += bFeat("Secondary Stat Increase", 5, `+1 STR or DEX.`);
        }

        if (level >= 6) {
            fHtml += bFeat("Windbag (2)", 6, `Learn a 2nd Utility Spell from each spell school you know.`);
        }

        if (level >= 7) {
            if (subclass === "Snark") fHtml += bFeat("Fight Picker", 7, `(1/turn) When enemy is damaged by Vicious Mockery, you may have one ally Taunt them until the end of the enemy's turn instead.`, sCls);
            else if (subclass === "Courage") fHtml += bFeat("Unfailing Courage", 7, `Your presence inspires others to feats of heroism. Your Inspiration allows target to roll with advantage.`, sCls);
        }

        if (level >= 8) fHtml += bFeat("Key Stat Increase", 8, `+1 WIL or INT.`);
        if (level >= 9) fHtml += bFeat("Secondary Stat Increase", 9, `+1 STR or DEX.`);

        if (level >= 11) {
            if (subclass === "Snark") fHtml += bFeat("Chord of Chaos", 11, `(1/encounter) Action: Move ALL creatures within hearing up to 3 spaces (not into obviously dangerous places).`, sCls);
            else if (subclass === "Courage") fHtml += bFeat("Fire in my Bones", 11, `Your Songweaver's Inspiration also grants the target 1 additional action.`, sCls);
        }

        if (level >= 12) fHtml += bFeat("Key Stat Increase", 12, `+1 WIL or INT.`);
        if (level >= 13) fHtml += bFeat("Secondary Stat Increase", 13, `+1 STR or DEX.`);

        if (level >= 14) fHtml += bFeat("Windbag (3)", 14, `You know ALL Utility Spells from the spell schools you know.`);

        if (level >= 15) {
            if (subclass === "Snark") fHtml += bFeat("Words Like Swords", 15, `Your Vicious Mockery damage becomes <strong>1d6 + INT + WIL</strong>.`, sCls);
            else if (subclass === "Courage") fHtml += bFeat("Chorus of Champions", 15, `(1/encounter) Free Reaction: Give all party members 1 action.`, sCls);
        }

        if (level >= 16) fHtml += bFeat("Key Stat Increase", 16, `+1 WIL or INT.`);
        if (level >= 17) fHtml += bFeat("Secondary Stat Increase", 17, `+1 STR or DEX.`);

        if (level >= 19) fHtml += bFeat("Epic Boon", 19, `Choose an Epic Boon (see pg. 23 of the GM's Guide).`);
        if (level >= 20) fHtml += bFeat("I'm So Famous!", 20, `+1 to any 2 stats. Your Songweaver's Inspiration cannot fail (your target succeeds).`);

        return fHtml;
    },

    getSpellCardsHTML: function(level, subclass, state, derived, formatPips, iStats) {
        let sHtml = "";
        
        SONGWEAVER_DATA.unlocked.forEach(spell => {
            const school = "Wind"; // All are wind
            const data = SPELL_REGISTRY[school][spell.name];
            if (data) {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                if (data.tier.includes("Cantrip") || (level >= 2 && level >= (tNum*2))) {
                    sHtml += `<div class="spell-card wind"><h4>${spell.name} <span class="tier-tag">${formatPips(data.tier)}</span></h4><div class="spell-desc">${iStats(data.desc)}</div></div>`;
                }
            }
        });

        return sHtml;
    }
};