const SHADOWMANCER_OPTIONS = {
    lesserInvocations: {
        "Abhorrent Speech": { desc: "You can communicate with horrible creatures (aberrations, undead, etc.)." },
        "Beguiling Influence": { desc: "(1/day) You may reroll an Influence check." },
        "Blood Sight": { desc: "(1/day) You may reroll an Examination check. Additionally, you can detect traces of blood on a surface, even after it has been cleaned." },
        "Devoted Acolyte": { desc: "Learn 2 of the following languages: Celestial, Draconic, Deep Speak, Infernal, or Primordial. Advantage on Lore checks related to those 2 languages." },
        "Eldritch Sense": { desc: "You can sense the presence of any shapechanger or creature concealed by magic while within 6 spaces of them." },
        "Gaze of Two Minds": { desc: "Touch a willing creature and perceive through its senses instead of your own for as long as you hold concentration." },
        "Knowledge from Beyond": { desc: "Whenever you fail an Insight or Arcana check, you may suffer 1 Wound to succeed instead." },
        "My Favored Pet": { desc: "One shadow minion can begrudgingly tolerate you outside of combat. It can (very creepily) do any menial task a below average commoner could." },
        "Voice of the Dark": { desc: "You can communicate telepathically with a humanoid within 6 spaces." },
        "Whispers of the Grave": { desc: "(1/day) You can ask a dead creature 3 yes/no questions. It can never be questioned this way again." }
    },
    greaterInvocations: {
        "Armor of Shadows": { desc: "Reduce all damage you receive by an amount equal to the number of minions you have." },
        "Fiendish Boon": { desc: "Increase your DEX or INT by 1. You have 1 fewer maximum Hit Dice." },
        "Hungering Shadows": { desc: "Whenever one of your shadows would crit, the next tiered spell you cast this encounter does not cost a use of Pilfered Power." },
        "One with Shadows": { desc: "Action: When you are in an area of dim light or darkness, you may become Invisible until you move or attack." },
        "Repelling Blast": { desc: "When you hit a Medium or smaller creature with Shadow Blast, you can push the creature up to 2 spaces away from yourself." },
        "Shadow Magus": { desc: "Your minions gain +4 Reach and deal d10 damage instead." },
        "Shadow Spear": { desc: "Your Shadow Blast can target creatures twice as far away, it ignores cover, and you may attack Prone targets with advantage with it (instead of disadvantage)." },
        "Shadow Rush": { desc: "When your shadow minions attack, instead of rolling damage, you may have any of them deal the max amount, then die." },
        "Shadow Warp": { desc: "Action: Switch places with a creature within 12 spaces that has been dealt necrotic damage this turn." },
        "Swarming Shadows": { desc: "Whenever one of your shadows would crit, summon another shadow minion adjacent to the target." },
        "Vengeful Blast": { desc: "Whenever a minion dies, you may cast Shadow Blast as a reaction (even if you already cast it this turn)." }
    }
};

const SHADOWMANCER_FEATURES = {
    core: {
        1: [
            { id: "conduit", name: "Conduit of Shadow", desc: "Your Patron grants you knowledge of Shadow Blast (1d12+KEY, +1d12 every 5 levels) and Summon Shadows (Reach 1, +1 every 5 levels). You can summon a max of INT or LVL minions, whichever is lower. (1/turn) Command ALL minions to move 6 then attack (Reach 1, 1d12 each)." },
            { id: "minions", name: "Shadow Minions", desc: "They have 1 HP, no damage bonus, and do not crit. They abandon you immediately outside of combat. You and your minions count as different creatures." }
        ],
        2: [
            { id: "master_darkness", name: "Master of Darkness", desc: "You know Necrotic cantrips and tier 1 spells." },
            { id: "pilfer", name: "Pilfered Power", desc: "You may steal power to cast spells at the highest tier you have unlocked. You can do this DEX times before your patron damages you for half your max HP. Resets on Safe Rest." }
        ],
        3: [
            { id: "subclass", name: "Subclass", desc: "Choose a Shadowmancer subclass.", minor: true },
            { id: "lesser_1", name: "Lesser Invocation", type: "choice", collection: "lesserInvocations", stateKey: "selectedLesser", count: 1, desc: "Choose 1 Lesser Shadow Invocation." }
        ],
        4: [
            { id: "key_stat_1", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "greater_1", name: "A Gift from the Master", type: "choice", collection: "greaterInvocations", stateKey: "selectedGreater", count: 1, desc: "Choose 1 Greater Shadow Invocation." }
        ],
        5: [
            { id: "tier_2", name: "Tier 2 Spells", desc: "You may now cast tier 2 spells; all of your spells are cast at this tier.", minor: true },
            { id: "upgraded_cantrips", name: "Upgraded Cantrips", desc: "Your cantrips grow stronger.", minor: true },
            { id: "sec_stat_1", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        6: [
            { id: "greater_2", name: "A Gift from the Master (2)", type: "choice", collection: "greaterInvocations", stateKey: "selectedGreater", count: 1, startIndex: 1, desc: "Choose a 2nd Greater Shadow Invocation." },
            { id: "shadowmastery_1", name: "Shadowmastery", desc: "Choose 1 Necrotic Utility Spell." }
        ],
        7: [
            { id: "subclass_feat_1", name: "Subclass Feature", desc: "Gain your Shadowmancer subclass feature.", minor: true },
            { id: "tier_3", name: "Tier 3 Spells", desc: "You may now cast tier 3 spells; all of your spells are cast at this tier.", minor: true }
        ],
        8: [
            { id: "key_stat_2", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true },
            { id: "lesser_2", name: "Lesser Invocation (2)", type: "choice", collection: "lesserInvocations", stateKey: "selectedLesser", count: 1, startIndex: 1, desc: "Choose a 2nd Lesser Shadow Invocation." },
            { id: "shadowmastery_2", name: "Shadowmastery (2)", desc: "Choose a 2nd Necrotic Utility Spell." }
        ],
        9: [
            { id: "greater_3", name: "A Gift from the Master (3)", type: "choice", collection: "greaterInvocations", stateKey: "selectedGreater", count: 1, startIndex: 2, desc: "Choose a 3rd Greater Shadow Invocation." },
            { id: "sec_stat_2", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        10: [
            { id: "tier_4", name: "Tier 4 Spells", desc: "You may now cast tier 4 spells; all of your spells are cast at this tier.", minor: true },
            { id: "upgraded_cantrips_2", name: "Upgraded Cantrips (2)", desc: "Your cantrips grow stronger.", minor: true }
        ],
        11: [
            { id: "subclass_feat_2", name: "Subclass Feature (2)", desc: "Gain your Shadowmancer subclass feature.", minor: true },
            { id: "lesser_3", name: "Lesser Invocation (3)", type: "choice", collection: "lesserInvocations", stateKey: "selectedLesser", count: 1, startIndex: 2, desc: "Choose a 3rd Lesser Shadow Invocation." }
        ],
        12: [
            { id: "greedy_pact", name: "Greedy Pact", desc: "When you would take damage from Pilfer Power, make a STR save: 1-9: Suffer damage as normal. 10-19: Suffer only 10 HP of damage. 20+: Suffer no damage and cast the spell as if it were 1 tier higher." },
            { id: "key_stat_3", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        13: [
            { id: "tier_5", name: "Tier 5 Spells", desc: "You may now cast tier 5 spells; all of your spells are cast at this tier.", minor: true },
            { id: "sec_stat_3", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        14: [
            { id: "greater_4", name: "A Gift from the Master (4)", type: "choice", collection: "greaterInvocations", stateKey: "selectedGreater", count: 1, startIndex: 3, desc: "Choose a 4th Greater Shadow Invocation." },
            { id: "shadowmastery_3", name: "Shadowmastery (3)", desc: "You know all Necrotic Utility Spells." }
        ],
        15: [
            { id: "subclass_feat_3", name: "Subclass Feature (3)", desc: "Gain your Shadowmancer subclass feature.", minor: true },
            { id: "upgraded_cantrips_3", name: "Upgraded Cantrips (3)", desc: "Your cantrips grow stronger.", minor: true }
        ],
        16: [
            { id: "tier_6", name: "Tier 6 Spells", desc: "You may now cast tier 6 spells; all of your spells are cast at this tier.", minor: true },
            { id: "key_stat_4", name: "Key Stat Increase", desc: "+1 INT or DEX.", minor: true }
        ],
        17: [
            { id: "dire_shadows", name: "Dire Shadows", desc: "Attacks against your shadow minions are made with disadvantage. They take no damage from successful saves." },
            { id: "sec_stat_4", name: "Secondary Stat Increase", desc: "+1 STR or WIL.", minor: true }
        ],
        18: [
            { id: "greater_5", name: "A Gift from the Master (5)", type: "choice", collection: "greaterInvocations", stateKey: "selectedGreater", count: 1, startIndex: 4, desc: "Choose a 5th Greater Shadow Invocation." }
        ],
        19: [
            { id: "epic_boon", name: "Epic Boon", desc: "Choose an Epic Boon (see pg. 23 of the GM's Guide)." },
            { id: "tier_7", name: "Tier 7 Spells", desc: "You may now cast tier 7 spells; all of your spells are cast at this tier.", minor: true }
        ],
        20: [
            { id: "eldritch_usurper", name: "Eldritch Usurper", desc: "+1 to any 2 of your stats. Whenever you summon a single shadow minion, summon 2 instead. They die only when they receive 12 or more damage at one time." },
            { id: "upgraded_cantrips_4", name: "Upgraded Cantrips (4)", desc: "Your cantrips grow stronger.", minor: true }
        ]
    },
    subclasses: {
        "RedDragon": {
            3: [
                { id: "crimson_rite", name: "Draconic Crimson Rite", desc: "Your Patron grants you knowledge of Fire spells. Your shadow minions become flaming dragon wyrmling shadows. Your Shadow Blast and minions can deal fire or necrotic damage and inflict Smoldering whenever they would crit." }
            ],
            7: [
                { id: "all_burn", name: "We’ll ALL Burn!", desc: "You may cast Pyroclasm without Pilfering Power by including yourself in the damage. You have advantage on the save. Choose 1 Fire Utility Spell." }
            ],
            11: [
                { id: "heart_fire", name: "Heart of Burning Fire", desc: "Regain 1 use of Pilfered Power each time you roll Initiative. This expires at the end of combat if unused." }
            ],
            15: [
                { id: "enveloped", name: "Enveloped by the Master", desc: "Gain 1d4 Wounds to cast Dragonform." }
            ]
        },
        "AbyssalDepths": {
            3: [
                { id: "master_nightfrost", name: "Master of Nightfrost", desc: "Your Patron grants you knowledge of Ice spells. Gain the ability to breathe underwater. Your shadow minions become beings of nightfrost. Your shadow blast and minions can deal cold or necrotic damage, and whenever they would crit, you gain INT+LVL temp HP." }
            ],
            7: [
                { id: "shadowfrost", name: "Shadowfrost", desc: "Your Shadow Blast also Slows. You can cast Cryosleep or Rimeblades without Pilfering Power by expending 10 temp HP. Choose 1 Ice Utility Spell." }
            ],
            11: [
                { id: "glacial_resilience", name: "Glacial Resilience", desc: "(1/Safe Rest) Reaction (whenever you are attacked or would gain a condition), gain 10×LVL temp HP and end ALL negative conditions on yourself. At the end of your next turn, any remaining temp HP are lost." }
            ],
            15: [
                { id: "reprisal", name: "Cryomancer’s Reprisal", desc: "Pay half your max HP to cast ANY Ice spell. After casting an Ice spell in this way, you gain an invisible aura: the next creature that hits you with a melee attack this encounter takes cold damage equal to half the HP you spent on this casting." }
            ]
        },
        "Reaver": {
            1: [
                { id: "hollow_one", replaces: ["conduit", "pilfer"], name: "Hollow One", desc: "Cut off from your patron, you can no longer cast Shadow Blast and you can no longer cast tiered spells using Pilfered Power. However, you have stolen the magical Bonescythe." },
                { id: "bonescythe", name: "Bonescythe", desc: "Action: Summon a magical Bonescythe, a melee weapon: 2d12 slashing+DEX necrotic damage to each die (Reach: 2). It shatters after you hit with it (or when combat ends). Any Invocations affecting Shadow Blast affect your Bonescythe Instead." }
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
                { id: "blood_power", name: "My Blood, My Power", desc: "You may take 1 Wound to cast a tiered spell you know at the highest tier you have unlocked." },
                { id: "otherworldly_might", name: "Otherworldly Might", desc: "Advantage on concentration checks if you have any shadow minions." }
            ],
            15: [
                { id: "patron_now", name: "I’m the Patron Now!", desc: "Summon 2 shadow minions for free when you roll Initiative." }
            ]
        }
    }
};

class ShadowmancerClass extends BaseClass {
    constructor() {
        super({
            name: "Shadowmancer",
            subtitle: "Dark mystic who commands spirits & shadows",
            keyStats: ['int', 'dex'],
            saves: { adv: 'int', dis: 'str' },
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
                bodyBg: "#050308",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 100%), linear-gradient(180deg, #120a1a 0%, #050308 100%)",
                panelBg: "rgba(25, 15, 35, 0.7)",
                border: "rgba(168, 85, 247, 0.3)"
            },
            initialStats: { baseStr: -1, baseDex: 2, baseInt: 2, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "RedDragon", label: "Pact of the Red Dragon", accent: "#ef4444" },
                { value: "AbyssalDepths", label: "Pact of the Abyssal Depths", accent: "#bae6fd" },
                { value: "Reaver", label: "Reaver (Extra)", accent: "#94a3b8" }
            ],
            resources: [
                { id: 'mana', label: 'Mana Pool', manual: true, calcMax: (level, stats) => level >= 2 ? (stats.int * 3) + level : 0 },     
                { id: 'pilfer', label: 'Pilfer Uses', manual: true, isVisible: (level, subclass) => subclass !== "Reaver", calcMax: (level, stats) => level >= 2 ? stats.dex : 0 }
            ],
            featuresData: SHADOWMANCER_FEATURES,
            optionsData: SHADOWMANCER_OPTIONS
        });
    }

    getDerivedStats(level, subclass, state) {
        let speed = 6; let woundMax = 6;
        const totalInt = (state.baseInt || 0) + (state.addInt || 0);
        let minionMax = Math.max(1, Math.min(totalInt, level));

        const greater = state.selectedGreater || [];
        if (greater.includes("Shadow Rush")) { /* Logic handled in minionDmg display */ }
        if (level >= 20) minionMax *= 2;

        let minionDmg = `${minionMax}d12`;
        if (greater.includes("Shadow Magus")) minionDmg = `${minionMax}d10`;

        return { speed, woundMax, minionMax, minionDmg };
    }

    getStatOverrides(level, subclass, state, statsMap) {
        let overrides = {};
        const selectedGreater = state.selectedGreater || [];
        if (selectedGreater.some(b => b.startsWith("Fiendish Boon"))) {
            // This is complex because it can be DEX or INT.
            // For now we assume the user just takes the bonus manually, or we could add a state key.
        }
        return overrides;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const totalInt = (state.baseInt || 0) + (state.addInt || 0);
        const totalDex = (state.baseDex || 0) + (state.addDex || 0);
        const manaMax = derived.resourceMaxes.mana;
        const pilferMax = derived.resourceMaxes.pilfer;
        const currentPilfer = state.resourceValues.pilfer || 0;

        const greater = state.selectedGreater || [];

        // Primary Attack Logic
        let primaryName = subclass === 'Reaver' ? 'Bonescythe' : 'Shadow Blast';
        let primaryDice = 1 + Math.floor(level / 5);
        if (subclass === 'Reaver') primaryDice = 2 + Math.floor(level / 5);
        
        let primaryStat = subclass === 'Reaver' ? 'dex' : 'int';
        let primaryMod = subclass === 'Reaver' ? totalDex : totalInt;
        
        let dmgDie = (subclass === 'Reaver' || greater.includes('Shadow Magus')) ? '12' : '12'; // PDF says 1d12 for Blast, 2d12 for Scythe
        if (greater.includes('Shadow Magus') && subclass !== 'Reaver') { /* Shadow Blast doesn't change die size from Magus, only minions */ }
        
        let primaryDmg = `${primaryDice}d12${primaryMod >= 0 ? "+" : ""}${primaryMod}`;
        if (subclass === 'Reaver') {
            primaryDmg = `${primaryDice}d12+${primaryDice * totalDex}`; // Scythe adds DEX to EACH die
        }

        let primarySub = subclass === 'Reaver' ? 'REACH 2' : 'RANGE 8';

        // Pilfer Pips
        let pilferPips = "";
        if (level >= 2 && subclass !== "Reaver") {
            for (let i = 0; i < pilferMax; i++) {
                const checked = currentPilfer > i;
                pilferPips += `<input type="checkbox" class="pip" ${checked ? 'checked' : ''} onclick="handleResPipClick('pilfer', ${i}, ${pilferMax})" style="width:10px; height:10px; border-color:var(--save-dis);">`;
            }
        }

        return `
        <div class="panel mechanic-panel" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: stretch; gap: 8px;">
                <!-- Section 1: Mana & Pilfer -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Mana Pool</label>
                    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: ${level >= 2 ? '4px' : '0'};">        
                        <div class="dark-incrementer">
                            <button onclick="adjRes('mana', -1, ${manaMax})">-</button>
                            <input type="number" id="res_mana" value="${state.resourceValues.mana||0}" onchange="adjRes('mana', parseInt(this.value), ${manaMax}, true)">
                            <button onclick="adjRes('mana', 1, ${manaMax})">+</button>
                        </div>
                        <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 0.9em;">/ ${manaMax}</div>
                    </div>
                    ${(level >= 2 && subclass !== "Reaver") ? `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <label style="font-size: 0.6em; color: var(--text-muted); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold;">Pilfer</label>
                        <div style="display: flex; gap: 2px;">${pilferPips}</div>
                    </div>` : ''}
                </div>

                <!-- Section 2: Primary Attack -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 8px;">
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">${primaryName}</label>
                    <div class="roll-link" onclick="dispatchRoll('${primaryDmg}', '${primaryName}', { stat: '${primaryStat}', type: 'attack' })" style="font-size: 1.8em; color: #fff; font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; cursor:pointer;">${primaryDmg}</div>
                    <div style="font-size: 0.65em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">${primarySub}</div>
                </div>

                <!-- Section 3: Minion Attack -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">        
                    <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Minion Attack</label>
                    <div class="roll-link" onclick="dispatchRoll('${derived.minionDmg}', 'Minion Attack', { isMinion: true })" style="font-size: 1.8em; color: var(--class-accent); font-family: 'Cinzel', serif; font-weight: bold; line-height: 1; cursor:pointer;">${derived.minionDmg}</div>
                    <div style="font-size: 0.65em; color: var(--text-muted); font-family:'Cinzel'; font-weight:bold;">${greater.includes('Shadow Rush') ? 'MAX DMG' : `MAX ${derived.minionMax}`}</div>
                </div>
            </div>
        </div>`;
    }

    getAvailableSpells(level, subclass, state, derived) {
        let spells = [];
        const school = "Necrotic";
        const progress = [0, 2, 5, 7, 10, 13, 16, 19];

        // 1. Gather tiered spells from known schools
        const schools = [school];
        if (subclass === "RedDragon") schools.push("Fire");
        if (subclass === "AbyssalDepths") schools.push("Ice");

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

        // 2. Shadowmastery Selections (Utility Spells)
        if (level >= 6) {
            let numSpells = level >= 14 ? 99 : level >= 8 ? 2 : 1;
            if (numSpells === 99) {
                if (UTILITY_SPELLS[school]) {
                    Object.entries(UTILITY_SPELLS[school]).forEach(([name, desc]) => {
                        spells.push({ name, desc, tier: "Utility", school: school });
                    });
                }
            } else {
                for(let i=0; i<numSpells; i++) {
                    let val = state.shadowmasterySpells?.[i] || "None";
                    let opts = `<option value="None">Select Utility Spell...</option>`;
                    Object.keys(UTILITY_SPELLS[school]).forEach(k => opts += `<option value="${k}">${k}</option>`);
                    let customHtml = `<select onchange="updateClassState('shadowmasterySpells', ${i}, this.value)" style="border-bottom-color: var(--class-accent);">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>`;
                    if (val !== "None") customHtml += `<div style="margin-top:8px;">${UTILITY_SPELLS[school][val]}</div>`;
                    spells.push({ name: "", tier: "Utility", school: school, customHtml: customHtml });
                }
            }
        }

        // 3. Subclass-specific Utility
        if (subclass === "RedDragon" && level >= 7) {
            let val = state.subclassUtility?.[0] || "None";
            let opts = `<option value="None">Select Fire Utility...</option>`;
            Object.keys(UTILITY_SPELLS.Fire).forEach(k => opts += `<option value="${k}">${k}</option>`);
            let customHtml = `<select onchange="updateClassState('subclassUtility', 0, this.value)" style="border-bottom-color: var(--class-accent);">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>`;
            if (val !== "None") customHtml += `<div style="margin-top:8px;">${UTILITY_SPELLS.Fire[val]}</div>`;
            spells.push({ name: "", tier: "Utility", school: "Fire", customHtml: customHtml });
        } else if (subclass === "AbyssalDepths" && level >= 7) {
            let val = state.subclassUtility?.[0] || "None";
            let opts = `<option value="None">Select Ice Utility...</option>`;
            Object.keys(UTILITY_SPELLS.Ice).forEach(k => opts += `<option value="${k}">${k}</option>`);
            let customHtml = `<select onchange="updateClassState('subclassUtility', 0, this.value)" style="border-bottom-color: var(--class-accent);">${opts.replace(`value="${val}"`, `value="${val}" selected`)}</select>`;
            if (val !== "None") customHtml += `<div style="margin-top:8px;">${UTILITY_SPELLS.Ice[val]}</div>`;
            spells.push({ name: "", tier: "Utility", school: "Ice", customHtml: customHtml });
        }

        return spells;
    }
}

const CLASS_CONFIG = new ShadowmancerClass();
