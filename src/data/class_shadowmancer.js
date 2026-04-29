const SHADOWMANCER_DATA = {
    lesserInvocations: [
        "Abhorrent Speech",
        "Beguiling Influence",
        "Blood Sight",
        "Devoted Acolyte",
        "Eldritch Sense",
        "Gaze of Two Minds",
        "Knowledge from Beyond",
        "My Favored Pet",
        "Voice of the Dark",
        "Whispers of the Grave"
    ],
    greaterInvocations: [
        "Armor of Shadows",
        "Fiendish Boon",
        "Hungering Shadows",
        "One with Shadows",
        "Repelling Blast",
        "Shadow Magus",
        "Shadow Spear",
        "Shadow Rush",
        "Shadow Warp",
        "Swarming Shadows",
        "Vengeful Blast"
    ],
    unlocked: [
        { tier: "Cantrip", name: "Shadow Blast" },
        { tier: "Cantrip", name: "Summon Shadow" },
        { tier: "Tier 1", name: "Shadow Trap" },
        { tier: "Tier 2", name: "Dread Visage" },
        { tier: "Tier 3", name: "Vampiric Greed" },
        { tier: "Tier 4", name: "Greater Shadow" },
        { tier: "Tier 5", name: "Gangrenous Burst" },
        { tier: "Tier 6", name: "Unspeakable Word" },
        { tier: "Tier 7", name: "Creeping Death" }
    ]
};

const INVOCATION_DESCS = {
    "Abhorrent Speech": "Communicate with aberrations, undead, etc.",
    "Beguiling Influence": "(1/day) Reroll an Influence check.",
    "Blood Sight": "(1/day) Reroll Examination. Detect blood traces even if cleaned.",
    "Devoted Acolyte": "Learn 2 exotic languages. Advantage on related Lore checks.",
    "Eldritch Sense": "Sense shapechangers/magical concealment within 6 spaces.",
    "Gaze of Two Minds": "Touch willing creature: perceive through its senses while concentrating.",
    "Knowledge from Beyond": "Fail Insight/Arcana: Suffer 1 Wound to succeed instead.",
    "My Favored Pet": "One shadow minion can perform menial non-combat tasks for you.",
    "Voice of the Dark": "Telepathically communicate with humanoid within 6 spaces.",
    "Whispers of the Grave": "(1/day) Ask dead creature 3 yes/no questions.",
    "Armor of Shadows": "Reduce all incoming damage by total number of minions you have.",
    "Fiendish Boon": "+1 INT or DEX. -1 max Hit Dice.",
    "Hungering Shadows": "When a shadow crits, next tiered spell this combat costs 0 Pilfered Power.",
    "One with Shadows": "Action: Dim light/darkness: turn Invisible until move or attack.",
    "Repelling Blast": "Hit with Shadow Blast: push Medium or smaller 2 spaces.",
    "Shadow Magus": "Minions gain +4 Reach and deal d10 damage instead.",
    "Shadow Spear": "Shadow Blast: 2x range, ignore cover, ADV vs Prone targets.",
    "Shadow Rush": "Minions Attack: deal MAX damage and then die instead of rolling.",
    "Shadow Warp": "Action: Switch places with creature in 12 reach dealt necrotic dmg this turn.",
    "Swarming Shadows": "When shadow crits, summon 1 free shadow minion.",
    "Vengeful Blast": "Minion dies: Cast Shadow Blast as a Reaction (even if used this turn)."
};

const CLASS_CONFIG = {
    name: "Shadowmancer",
    subtitle: "Pact-bound master of minions and stolen magic",
    keyStats: ['int', 'dex'], 
    saves: { adv: 'int', dis: 'wil' }, 
    baseHp: 13,
    hpPerLevel: 6,
    hitDie: 8,
    
    theme: {
        accent: "#a855f7",
        accentDim: "#6b21a8",
        bodyBg: "#02040a",
        containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 100%), linear-gradient(180deg, #0f0a1a 0%, #02040a 100%)",
        panelBg: "rgba(25, 20, 35, 0.7)",
        border: "rgba(168, 85, 247, 0.3)"
    },

    initialStats: {
        baseStr: -1, baseDex: 1, baseInt: 3, baseWil: 1
    },

    subclasses: [
        { value: "None", label: "None (Lvl 3)" },
        { value: "RedDragon", label: "Pact of the Red Dragon", accent: "#ef4444" },
        { value: "Abyssal", label: "Pact of the Abyssal Depths", accent: "#38bdf8" },
        { value: "Reaver", label: "Reaver", accent: "#94a3b8" }
    ],

    resources: [
        { id: 'pilfer', label: 'Patron Favor', manual: true, calcMax: (level, stats) => stats.dex }
    ],

    customHeaderStats: [],

    getDerivedStats: function(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        let minionLimit = Math.min(state.baseInt + state.addInt, level);
        if (level >= 20) minionLimit += 2; 

        let bsDice = 2 + Math.floor(level/5);
        let bsText = subclass === "Reaver" ? `${bsDice}d12+DEX` : "";

        return { speed, woundMax, minionLimit, bsText };
    },

    getShieldBonus: function(level, subclass, stats) { return 0; },

    getMechanicPanelHTML: function(level, subclass, state, derived) {
        const dexVal = state.baseDex + state.addDex;
        
        return `
        <div class="panel mechanic-panel">
            <div style="display: flex; align-items: stretch; gap: 15px;">
                <!-- Column 1: Favor/Scythe -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px;">
                    ${subclass === "Reaver" ? `
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Bonescythe</label>
                        <div style="font-size: 1.8em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.1; margin: auto 0;">${derived.bsText}</div>
                        <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Cinzel'; font-weight:bold;">MELEE DMG</div>
                    ` : `
                        <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Patron Favor</label>
                        <div class="dark-incrementer" style="padding: 4px 10px;">
                            <button onclick="adjRes('pilfer', -1, ${dexVal})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">-</button>
                            <input type="number" id="res_pilfer" value="${state.resourceValues.pilfer||0}" onchange="adjRes('pilfer', parseInt(this.value), ${dexVal}, true)" style="width:35px; font-size: 1.4em;">
                            <button onclick="adjRes('pilfer', 1, ${dexVal})" style="width:24px; height:24px; line-height:1; font-size:1.1em;">+</button>
                        </div>
                        <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Crimson Text'; font-style:italic;">Next: 1/2 Max HP Dmg</div>
                    `}
                </div>

                <!-- Column 2: Shadow Minions -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding: 0 10px; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Shadow Limit</label>
                    <div style="font-size: 2.5em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1;">${derived.minionLimit}</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family: 'Cinzel'; font-weight: bold;">ACTIVE MINIONS</div>
                </div>

                <!-- Column 3: Casting Tier -->
                <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <label style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 5px;">Power Level</label>
                    <div style="font-size: 1.6em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: bold; line-height: 1.1;">Tier ${Math.max(1, Math.floor(level/2))}</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px; font-family:'Crimson Text'; font-style:italic;">All spells cast at max tier</div>
                </div>
            </div>
        </div>`;
    },

    actions: {},

    getFeaturesHTML: function(level, subclass, state, derived, bFeat, iStats) {
        let fHtml = "";
        const sCls = "subclass-feature";

        fHtml += bFeat("Shadowmancer Basics", "", `<strong>Hit Die:</strong> 1d${this.hitDie} | <strong>Saves:</strong> INT(+), WIL(-)<br><strong>Armor:</strong> Cloth | <strong>Weapons:</strong> Blades, Wands`, "", true);
        
        if (subclass === "Reaver") {
            fHtml += bFeat("Hollow One", 1, `You can no longer cast Shadow Blast or tiered spells using Pilfered Power. Instead, you summon a magical <strong>Bonescythe</strong> (<strong>${derived.bsText}</strong>).`, sCls);
        } else {
            fHtml += bFeat("Conduit of Shadow", 1, `You know the <strong>Shadow Blast</strong> and <strong>Summon Shadows</strong> cantrips.`);
        }

        if (level >= 2 && subclass !== "Reaver") {
            fHtml += bFeat("Pilfered Power", 2, `You may cast tiered spells using Patron Favor (<strong>DEX</strong> times). Exceeding this limit deals 1/2 max HP dmg.`);
        }

        if (level >= 3) {
            if (subclass === "RedDragon") {
                fHtml += bFeat("Draconic Crimson Rite", 3, `Learn Fire spells. Minions become wyrmlings. Crits deal Fire/Necrotic and Smolder.`, sCls);
            } else if (subclass === "Abyssal") {
                fHtml += bFeat("Master of Nightfrost", 3, `Learn Ice spells. Breathe underwater. Minions deal Cold/Necrotic; crits grant <strong>INT+LVL</strong> temp HP.`, sCls);
            } else if (subclass === "Reaver") {
                fHtml += bFeat("Shadow Exploit", 3, `Sacrifice a minion to cast a tiered spell at max tier. Cost increases by 1 minion each time this encounter.`, sCls);
                fHtml += bFeat("Martyr Spawn", 3, `Whenever you Defend, you can sacrifice a minion to take no damage.`, sCls);
            }

            // Invocations logic
            const buildInvocations = (title, num, key, data) => {
                let iState = state[key] || [];
                let opts = `<option value="None">Select Invocation...</option>`;
                data.forEach(k => opts += `<option value="${k}">${k}</option>`);
                let html = `<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">`;
                for(let i=0; i<num; i++) {
                    let val = iState[i] || "None";
                    html += `<div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid var(--class-border); border-left: 3px solid var(--class-accent);">
                        <select onchange="updateClassState('${key}', ${i}, this.value)" style="margin-bottom: 5px; border-bottom: 1px solid rgba(168, 85, 247, 0.3); color: #fff; font-size: 0.9em; background: transparent; padding: 2px; width: 100%;">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>
                        <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.3;">${val !== "None" ? iStats(INVOCATION_DESCS[val]) : ""}</div>
                    </div>`;
                }
                return bFeat(title, 3, `Choose <strong>${num}</strong> shadow gifts.${html}</div>`, "", true);
            };

            let nLesser = level >= 11 ? 3 : level >= 8 ? 2 : 1;
            fHtml += buildInvocations("Lesser Invocations", nLesser, "selectedLesser", SHADOWMANCER_DATA.lesserInvocations);
            
            if (level >= 4) {
                fHtml += bFeat("Key Stat Increase", 4, `+1 INT or DEX.`);
                let nGreater = level >= 18 ? 5 : level >= 14 ? 4 : level >= 9 ? 3 : level >= 6 ? 2 : 1;
                fHtml += buildInvocations("Greater Invocations", nGreater, "selectedGreater", SHADOWMANCER_DATA.greaterInvocations);
            }
        }

        if (level >= 5) {
            fHtml += bFeat("Secondary Stat Increase", 5, `+1 STR or WIL.`);
            fHtml += bFeat("Upgraded Cantrips", 5, `Your shadow cantrips grow stronger.`);
        }

        if (level >= 7) {
            if (subclass === "RedDragon") fHtml += bFeat("We'll ALL Burn!", 7, `May cast Pyroclasm without Pilfering by including self in damage. ADV on save.`, sCls);
            else if (subclass === "Abyssal") fHtml += bFeat("Shadowfrost", 7, `Shadow Blast also Slows. Cast Cryosleep/Rimeblades for 10 temp HP instead of Favor.`, sCls);
            else if (subclass === "Reaver") {
                fHtml += bFeat("Grim Harrow", 7, `Divide Bonescythe dice amongst any number of adjacent targets within Reach.`, sCls);
                fHtml += bFeat("Reap", 7, `When your Bonescythe crits or kills a creature, summon a minion for free.`, sCls);
            }
        }

        if (level >= 8) fHtml += bFeat("Key Stat Increase", 8, `+1 INT or DEX.`);
        if (level >= 9) fHtml += bFeat("Secondary Stat Increase", 9, `+1 STR or WIL.`);

        if (level >= 11) {
            if (subclass === "RedDragon") fHtml += bFeat("Heart of Burning Fire", 11, `Regain 1 use of Patron Favor each time you roll Initiative.`, sCls);
            else if (subclass === "Abyssal") fHtml += bFeat("Glacial Resilience", 11, `(1/Safe Rest) Reaction: Gain 10xLVL temp HP and end ALL negative conditions on yourself.`, sCls);
            else if (subclass === "Reaver") {
                fHtml += bFeat("My Blood, My Power", 11, `Take 1 Wound to cast a tiered spell at max tier. ADV on concentration if you have minions.`, sCls);
            }
        }

        if (level >= 12) {
            fHtml += bFeat("Greedy Pact", 12, `When taking Pilfer dmg, make a STR save: 10-19 (Take only 10 dmg), 20+ (No dmg, cast 1 tier higher).`);
            fHtml += bFeat("Key Stat Increase", 12, `+1 INT or DEX.`);
        }

        if (level >= 13) fHtml += bFeat("Secondary Stat Increase", 13, `+1 STR or WIL.`);

        if (level >= 15) {
            if (subclass === "RedDragon") fHtml += bFeat("Enveloped by the Master", 15, `Gain 1d4 Wounds to cast Dragonform.`, sCls);
            else if (subclass === "Abyssal") fHtml += bFeat("Cryomancer's Reprisal", 15, `Pay half max HP for ANY Ice spell. Gain aura: melee attackers take half that HP as cold dmg.`, sCls);
            else if (subclass === "Reaver") fHtml += bFeat("I'm the Patron Now!", 15, `Summon 2 shadow minions for free when you roll Initiative.`, sCls);
        }

        if (level >= 16) fHtml += bFeat("Key Stat Increase", 16, `+1 INT or DEX.`);

        if (level >= 17) {
            fHtml += bFeat("Dire Shadows", 17, `Attacks against your minions have DIS. They take no damage from successful saves.`);
            fHtml += bFeat("Secondary Stat Increase", 17, `+1 STR or WIL.`);
        }

        if (level >= 19) fHtml += bFeat("Epic Boon", 19, `Choose an Epic Boon (see pg. 23 of the GM's Guide).`);
        if (level >= 20) fHtml += bFeat("Eldritch Usurper", 20, `+1 to any 2 of your stats. Summon 2 minions instead of 1. They die only when receiving 12+ damage at once.`);

        return fHtml;
    },

    getSpellCardsHTML: function(level, subclass, state, derived, formatPips, iStats) {
        let sHtml = "";
        const schools = ["Necrotic"];
        if (subclass === "RedDragon") schools.push("Fire");
        if (subclass === "Abyssal") schools.push("Ice");

        schools.forEach(school => {
            sHtml += `<h3 style="font-family:'Cinzel'; font-size:0.8em; color:var(--gold-light); margin:10px 0 5px 0; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:2px;">${school}</h3>`;
            Object.entries(SPELL_REGISTRY[school]).forEach(([name, data]) => {
                let tNum = parseInt(data.tier.replace(/\D/g, '')) || 0;
                if (data.tier.includes("Cantrip") || (level >= 2 && level >= (tNum*2))) {
                    sHtml += `<div class="spell-card ${school.toLowerCase()}"><h4>${name} <span class="tier-tag">${formatPips(data.tier)}</span></h4><div class="spell-desc">${iStats(data.desc)}</div></div>`;
                }
            });
        });

        return sHtml;
    }
};