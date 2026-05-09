class ShadowmancerClass extends BaseClass {
    constructor() {
        super({
            name: "Shadowmancer",
            subtitle: "Dark mystic who commands spirits & shadows",
            keyStats: ['int', 'dex'],
            saves: { adv: 'int', dis: 'str' },
            proficiencies: { armor: "Cloth", weapons: "Blades, Wands" },
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
            initialStats: { baseStr: -1, baseDex: 1, baseInt: 3, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "RedDragon", label: "Pact of the Red Dragon", accent: "#fb923c" },
                { value: "AbyssalDepths", label: "Pact of the Abyssal Depths", accent: "#38bdf8" },
                { value: "Reaver", label: "Pact of the Reaver (Extra)", accent: "#be123c" }
            ],
            scalingStats: {
                minionReach: { 1: 1, 5: 2, 10: 3, 15: 4, 20: 5 },
                blastDice: { 1: 1, 5: 2, 10: 3, 15: 4, 20: 5 }
            },
            spellSchools: ["Necrotic"],
            subclassSchools: { "RedDragon": ["Fire"], "AbyssalDepths": ["Ice"] },
            extraSchoolsKeys: [],
            spellProgression: [2, 2, 5, 7, 10, 13, 16, 19, 21, 23],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, ["selectedShadowmastery", "selectedSubclassSpells"]),
            includeTieredSpells: [],
            resources: [
                createManaResource('int'),
                createSimpleResource('pilfer', 'Pilfer Uses', (level, stats, state, subclass) => subclass !== "Reaver" && level >= 2 ? stats.dex : 0)
            ],
            featuresData: ShadowmancerClass.FEATURES,
            optionsData: ShadowmancerClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
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
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('INT or DEX', 'STR or WIL', true, [2, 2, 5, 7, 10, 13, 16, 19, 21, 23]);
        
        core[1] = [
            { id: "conduit", name: "Conduit of Shadow", milestones: [1, 5, 10, 15, 20], context: { type: 'attack', stat: 'int' }, desc: (level) => {
                const blastDice = 1 + Math.floor(level / 5);
                const summonReach = 1 + Math.floor(level / 5);
                return FeatureGen.createScalingList(
                    `Your Patron grants you knowledge of Shadow Blast (<strong>${blastDice}d12+KEY</strong>) and Summon Shadows (Reach <strong>${summonReach}</strong>). You can summon a max of INT or character level minions, whichever is lower. (1/turn) Command ALL minions to move 6 then attack (Reach 1, 1d12 each).`,
                    [
                        { level: 5, text: "Shadow Blast increases to 2d12, Summon Reach increases to 2." },
                        { level: 10, text: "Shadow Blast increases to 3d12, Summon Reach increases to 3." },
                        { level: 15, text: "Shadow Blast increases to 4d12, Summon Reach increases to 4." },
                        { level: 20, text: "Shadow Blast increases to 5d12, Summon Reach increases to 5." }
                    ],
                    level
                );
            }},
            { id: "minions", name: "Shadow Minions", context: { isMinion: true }, desc: "They have 1 HP, no damage bonus, and do not crit. They abandon you immediately outside of combat. You and your minions count as different creatures." }
        ];
        core[2].push({ id: "master_darkness", name: "Master of Darkness", desc: "You know Necrotic cantrips. You gain INT mana whenever you roll Initiative (this expires if unspent at the end of combat)." });
        core[2].push({ id: "pilfer", name: "Pilfered Power", desc: "You may steal power to cast spells at the highest tier you have unlocked. You can do this DEX times before your patron damages you for half your max HP. Resets on Safe Rest." });
        
        core[3].push({ id: "lesser", name: "Lesser Invocation", type: "dynamic_choice", collection: "lesserInvocations", stateKey: "selectedLesser", milestones: [3, 8, 11], desc: (level) => FeatureGen.createScalingList(
            "Choose Lesser Shadow Invocations as you level up.",
            [
                { level: 8, text: "Learn a 2nd invocation." },
                { level: 11, text: "Learn a 3rd invocation." }
            ],
            level
        ), getCount: FeatureGen.createStandardCount([3, 8, 11]) });
        core[4].push({ id: "greater", name: "A Gift from the Master", type: "dynamic_choice", collection: "greaterInvocations", stateKey: "selectedGreater", milestones: [4, 6, 9, 14, 18], desc: (level) => FeatureGen.createScalingList(
            "Choose Greater Shadow Invocations as you level up.",
            [
                { level: 6, text: "Learn a 2nd invocation." },
                { level: 9, text: "Learn a 3rd invocation." },
                { level: 14, text: "Learn a 4th invocation." },
                { level: 18, text: "Learn a 5th invocation." }
            ],
            level
        ), getCount: FeatureGen.createStandardCount([4, 6, 9, 14, 18]) });
        
        core[6].push(FeatureGen.createSpellChoiceFeature({
            id: "shadowmastery",
            name: "Shadowmastery",
            level: 6,
            spellType: "utility",
            schools: ["Necrotic"],
            stateKey: "selectedShadowmastery",
            getCount: (level) => level >= 14 ? 0 : (level >= 8 ? 2 : 1),
            milestones: [6, 8, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Choose Necrotic Utility Spells.",
                [
                    { level: 8, text: "Learn a 2nd Necrotic Utility Spell." },
                    { level: 14, text: "You know all Necrotic Utility Spells." }
                ],
                level
            )
        }));

        core[12].push({ id: "greedy_pact", name: "Greedy Pact", desc: "When you would take damage from Pilfer Power, make a STR save: 1-9: Suffer damage as normal. 10-19: Suffer only 10 HP of damage. 20+: Suffer no damage and cast the spell as if it were 1 tier higher." });
        core[17].push({ id: "dire_shadows", name: "Dire Shadows", desc: "Attacks against your shadow minions are made with disadvantage. They take no damage from successful saves." });
        
        core[20].push({ id: "eldritch_usurper", name: "Eldritch Usurper", desc: "+1 to any 2 of your stats. Whenever you summon a single shadow minion, summon 2 instead. They die only when they receive 12 or more damage at one time." });

        subclasses["RedDragon"] = {
            3: [{ id: "crimson_rite", name: "Draconic Crimson Rite", desc: "Your Patron grants you knowledge of Fire spells. Your shadow minions become flaming dragon wyrmling shadows. Your Shadow Blast and minions can deal fire or necrotic damage and inflict Smoldering whenever they would crit." }],
            7: [
                FeatureGen.createSpellChoiceFeature({
                    id: "all_burn",
                    name: "We’ll ALL Burn!",
                    level: 7,
                    spellType: "utility",
                    schools: ["Fire"],
                    stateKey: "selectedSubclassSpells",
                    getCount: 1,
                    desc: "You may cast Pyroclasm without Pilfering Power by including yourself in the damage. You have advantage on the save. Additionally, choose 1 Fire Utility Spell."
                })
            ],
            11: [{ id: "heart_fire", name: "Heart of Burning Fire", desc: "Regain 1 use of Pilfered Power each time you roll Initiative. This expires at the end of combat if unused." }],
            15: [{ id: "enveloped", name: "Enveloped by the Master", desc: "Gain 1d4 Wounds to cast Dragonform." }]
        };
        subclasses["AbyssalDepths"] = {
            3: [{ id: "master_nightfrost", name: "Master of Nightfrost", desc: "Your Patron grants you knowledge of Ice spells. Gain the ability to breathe underwater. Your shadow minions become beings of nightfrost. Your shadow blast and minions can deal cold or necrotic damage, and whenever they would crit, you gain INT+LVL temp HP." }],
            7: [
                FeatureGen.createSpellChoiceFeature({
                    id: "shadowfrost",
                    name: "Shadowfrost",
                    level: 7,
                    spellType: "utility",
                    schools: ["Ice"],
                    stateKey: "selectedSubclassSpells",
                    getCount: 1,
                    desc: "Your Shadow Blast also Slows. You can cast Cryosleep or Rimeblades without Pilfering Power by expending 10 temp HP. Additionally, choose 1 Ice Utility Spell."
                })
            ],
            11: [{ id: "glacial_resilience", name: "Glacial Resilience", desc: "(1/Safe Rest) Reaction (whenever you are attacked or would gain a condition), gain 10×LVL temp HP and end ALL negative conditions on yourself. At the end of your next turn, any remaining temp HP are lost." }],
            15: [{ id: "reprisal", name: "Cryomancer’s Reprisal", desc: "Pay half your max HP to cast ANY Ice spell. After casting an Ice spell in this way, you gain an invisible aura: the next creature that hits you with a melee attack this encounter takes cold damage equal to half the HP you spent on this casting." }]
        };
        subclasses["Reaver"] = {
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
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        const stats = super.getDerivedStats(level, subclass, state);
        const statsMap = getStatsMap(state);
        stats.minionMax = Math.max(1, Math.min(statsMap.int, level));
        if (level >= 20) stats.minionMax *= 2;
        const greater = state.selectedGreater || [];
        
        stats.minionDmg = `${stats.minionMax}d12`;
        if (greater.includes("Shadow Magus")) stats.minionDmg = `${stats.minionMax}d10`;

        return stats;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);

        builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        if (subclass !== "Reaver") {
            builder.addResource('pilfer', 'Pilfer', state.resourceValues.pilfer, derived.resourceMaxes.pilfer);
        }

        let primaryName = subclass === 'Reaver' ? 'Bonescythe' : 'Shadow Blast';
        let primaryDice = (subclass === 'Reaver' ? 2 : 1) + Math.floor(level / 5);
        let primaryDmg = `${primaryDice}d12${statsMap.int >= 0 ? "+" : ""}${statsMap.int}`;
        if (subclass === 'Reaver') primaryDmg = `${primaryDice}d12+${primaryDice * statsMap.dex}`;

        builder.addRollDisplay(primaryDmg, primaryName, primaryDmg, subclass === 'Reaver' ? 'REACH 2' : 'RANGE 8', { type: 'attack', stat: subclass === 'Reaver' ? 'dex' : 'int' });
        
        builder.addRollDisplay(derived.minionDmg, 'Minions', derived.minionDmg, `MAX ${derived.minionMax}`, { isMinion: true });

        return builder.build();
    }
}

const CLASS_CONFIG = new ShadowmancerClass();
