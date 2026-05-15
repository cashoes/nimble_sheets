/**
 * Shadowmancer Class
 * Dark mystic who commands spirits & shadows.
 * @extends BaseClass
 */
class ShadowmancerClass extends BaseClass {
    /**
     * Initializes the Shadowmancer class with its core configuration.
     */
    constructor() {
        super({
            name: "Shadowmancer",
            subtitle: "Dark mystic who commands spirits & shadows",
            keyStats: ['int', 'dex'],
            saves: { adv: 'int', dis: 'str' },
            proficiencies: { armor: "Cloth Armor", weapons: "Blades, Staves, Wands" },
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
                {
                    value: "RedDragon",
                    label: "Pact of the Red Dragon",
                    accent: "#fb923c",
                    config: {
                        spellSchools: ["Fire"],
                        includeUtilitySpells: createUtilityConfig(false, ["selectedRedDragonUtility"])
                    }
                },
                {
                    value: "AbyssalDepths",
                    label: "Pact of the Abyssal Depths",
                    accent: "#38bdf8",
                    config: {
                        spellSchools: ["Ice"],
                        includeUtilitySpells: createUtilityConfig(false, ["selectedAbyssalUtility"])
                    }
                },
                {
                    value: "Reaver",
                    label: "Reaver (Extra)",
                    accent: "#be123c",
                    config: {
                        scalingStats: {
                            blastName: (l) => "Bonescythe",
                            blastRange: (l) => "Reach 2",
                            blastStat: (l) => "DEX",
                            pilferMax: (l) => 0,
                            blastDice: (level) => Math.floor(level / 5) + 2,
                            multipliedBonus: (l) => true
                        },
                        resources: []
                    }
                }
            ],
            scalingStats: {
                minionReach: { 1: 1, 5: 2, 10: 3, 15: 4, 20: 5 },
                blastDice: { 1: 1, 5: 2, 10: 3, 15: 4, 20: 5 },
                blastName: (l) => "Shadow Blast",
                blastRange: (l) => "Range 8",
                blastStat: (l) => "INT",
                multipliedBonus: (l) => false,
                pilferMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    return level >= 2 ? statsMap.dex : 0;
                },
                minionMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    const mainStat = Math.max(statsMap.int, statsMap.dex);
                    let max = Math.max(1, Math.min(mainStat, level));
                    if (level >= 20) max *= 2;
                    return max;
                },
                minionDmg: (level, subclass, state) => {
                    const count = state.resourceValues?.minions || 0;
                    const greater = state.selectedGreater || [];
                    return greater.includes("Shadow Magus") ? `${count}d10` : `${count}d12`;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                const bStat = derived.blastStat.toLowerCase();
                const bonusPerDie = statsMap[bStat];
                const bTotalBonus = derived.multipliedBonus ? (derived.blastDice * bonusPerDie) : bonusPerDie;
                const bDisplay = `${derived.blastDice}d12+${bTotalBonus}`;
                builder.addRollDisplay(`${derived.blastDice}d12+${bTotalBonus}`, derived.blastName, bDisplay, `${derived.blastRange} | Necrotic`, { type: 'attack', school: 'Necrotic', stat: bStat });

                const minionVal = state.resourceValues?.minions || 0;
                builder.addRollWithResource(
                    derived.minionDmg,
                    `Minions (${minionVal})`,
                    derived.minionDmg,
                    'minions',
                    derived.minionMax,
                    { rollContext: { isMinion: true } }
                );
            },
            statModifiers: [
                { id: "fiendish_boon_stats", stat: "addDex", value: 1, condition: (l, s, state) => (state.selectedGreater || []).includes("Fiendish Boon") },
                { id: "fiendish_boon_hd", stat: "hdMax", value: -1, condition: (l, s, state) => (state.selectedGreater || []).includes("Fiendish Boon") }
            ],
            grantedSpells: [
                { level: 1, spells: ["Shadow Blast", "Summon Shadows"] }
            ],
            spellSchools: ["Necrotic"],
            spellProgression: [2, 2, 4, 6, 8, 10, 12, 14, 16, 18],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14 ? ["Necrotic"] : false, ["selectedShadowmastery"]),
            featuresData: ShadowmancerClass.FEATURES,
            optionsData: ShadowmancerClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Shadowmancer class.
     */
    static get OPTIONS() {
        return {
            lesser: {
                "Abhorrent Speech": { desc: "You can communicate with horrible creatures (aberrations, undead, etc.)." },
                "Beguiling Influence": { desc: "([[uBeguiling]] 1/day) You may reroll an Influence check." },
                "Blood Sight": { desc: "([[uBloodSight]] 1/day) You may reroll an Examination check. Additionally, you can detect traces of blood on a surface, even after it has been cleaned." },
                "Devoted Acolyte": { desc: "Learn 2 of the following languages: Celestial, Draconic, Deep Speak, Infernal, or Primordial. Advantage on Lore checks related to those 2 languages." },
                "Eldritch Sense": { desc: "You can sense the presence of any shapechanger or creature concealed by magic while within 6 spaces of them." },
                "Gaze of Two Minds": { desc: "Touch a willing creature and perceive through its senses instead of your own for as long as you hold concentration." },
                "Knowledge from Beyond": { desc: "Whenever you fail an Insight or Arcana check, you may suffer 1 Wound to succeed instead." },
                "My Favored Pet": { desc: "One shadow minion can begrudgingly tolerate you outside of combat. It can (very creepily) do any menial task a below average commoner could." },
                "Voice of the Dark": { desc: "You can communicate telepathically with a humanoid within 6 spaces." },
                "Whispers of the Grave": { desc: "([[uWhispers]] 1/day) You can ask a dead creature 3 yes/no questions. It can never be questioned this way again." }
            },
            greater: {
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

    /**
     * Defines the core and subclass features for the Shadowmancer class.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('INT or DEX', 'STR or WIL', true, [1, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        core[1] = [
            {
                id: "blast", name: "Shadow Blast", desc: (level, subclass, state, derived) => {
                    const dice = derived.blastDice || 1;
                    const stat = derived.blastStat || "INT";
                    const name = derived.blastName || "Shadow Blast";
                    const range = derived.blastRange || "Range 8";
                    return `You know the unique Necrotic cantrip <strong>${name}</strong>. ${range}. Damage: ${dice}d12+${stat} necrotic. High Levels: +1d12 damage every 5 levels.`;
                }
            },
            { id: "sum_shadows", name: "Summon Shadows", desc: (level, subclass, state, derived) => `Action: Summon a shadow minion within Reach 1 (you can summon a max of INT or LVL minions this way, whichever is lower). Expend 1 mana. Action: (1/turn) Command ALL of your minions to move 6 then attack (Reach 1, 1d12 each). <br><em>Shadow Minions have 1 HP, no damage bonus, and do not crit. Command them to attack without the Rushed Attack penalty! (see pg. 13 of the Core Rules).</em>` }
        ];

        core[2] = [
            { id: "master_darkness", name: "Master of Darkness", desc: "Your Patron grants you knowledge of Necrotic cantrips and tier 1 spells." },
            { id: "pilfer", name: "Pilfered Power", resourceId: "pilfer", desc: (level, subclass, state, derived) => `You may steal power from your patron to cast tiered spells, always casting them at the highest tier you have unlocked. You can do this <strong>${getStatsMap(state).dex}</strong> (DEX) times before your patron takes notice. Each time you exceed this limit, your patron damages you for half your max HP as recompense. Resets on Safe Rest.` }
        ];

        core[3] = [
            { id: "pact_is_sealed", name: "THE PACT IS SEALED", desc: "Choose a subclass and 1 Lesser Shadow Invocation." },
            { id: "lesser", name: "Lesser Shadow Invocation", type: "dynamic_choice", collection: "lesser", stateKey: "selectedLesser", milestones: [3, 8, 11], desc: "Choose a Lesser Shadow Invocation.", getCount: FeatureGen.createStandardCount([3, 8, 11]) }
        ];

        core[4].push({ id: "greater", name: "A Gift from the Master", type: "dynamic_choice", collection: "greater", stateKey: "selectedGreater", milestones: [4, 6, 9, 14, 18], desc: "Choose Greater Shadow Invocations.", getCount: FeatureGen.createStandardCount([4, 6, 9, 14, 18]) });

        core[6].push(FeatureGen.createSpellChoiceFeature({
            id: "mastery",
            name: "Shadowmastery",
            level: 6,
            spellType: "utility",
            schools: ["Necrotic"],
            stateKey: "selectedShadowmastery",
            getCount: (l) => l >= 14 ? 0 : (l >= 8 ? 2 : 1),
            milestones: [6, 8, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Choose a Necrotic Utility Spell.",
                [{ level: 14, text: "Shadowmastery (3): You know all Necrotic Utility spells." }],
                level
            )
        }));

        core[12] = [{ id: "greedy", name: "Greedy Pact", desc: "When you would take damage from Pilfer Power, make a STR save: <ul><li>1–9: Suffer damage as normal.</li><li>10–19: Suffer only 10 HP of damage.</li><li>20+: Suffer no damage and cast the spell as if it were 1 tier higher.</li></ul>" }];

        core[17] = [{ id: "dire", name: "Dire Shadows", desc: "Attacks against your shadow minions are made with disadvantage. They take no damage from successful saves." }];

        core[20].push({ id: "overlord", name: "Eldritch Usurper", desc: "+1 to any 2 of your stats. Whenever you summon a single shadow minion, summon 2 instead. They die only when they receive 12 or more damage at one time." });

        subclasses["RedDragon"] = {
            3: [{ id: "dragon_rite", name: "Draconic Crimson Rite", desc: "Your Patron grants you knowledge of Fire spells. Your shadow minions become flaming dragon wyrmling shadows. Your Shadow Blast and minions can deal fire or necrotic damage and inflict Smoldering whenever they would crit." }],
            7: [
                { id: "all_burn", name: "We’ll ALL Burn!", desc: "You may cast Pyroclasm without Pilfering Power by including yourself in the damage. You have advantage on the save. Choose 1 Fire Utility Spell." },
                FeatureGen.createSpellChoiceFeature({ id: "red_utility", name: "Fire Utility", level: 7, spellType: "utility", schools: ["Fire"], stateKey: "selectedRedDragonUtility", getCount: () => 1, desc: "Choose 1 Fire Utility Spell." })
            ],
            11: [{ id: "heart_fire", name: "Heart of Burning Fire", desc: "Regain 1 use of Pilfered Power each time you roll Initiative. This expires at the end of combat if unused." }],
            15: [{ id: "enveloped", name: "Enveloped by the Master", desc: "Gain 1d4 Wounds to cast Dragonform." }]
        };

        subclasses["AbyssalDepths"] = {
            3: [{ id: "nightfrost", name: "Master of Nightfrost", desc: "Your Patron grants you knowledge of Ice spells. Gain the ability to breathe underwater. Your shadow minions become beings of nightfrost. Your shadow blast and minions can deal cold or necrotic damage, and whenever they would crit, you gain INT+LVL temp HP." }],
            7: [
                { id: "shadowfrost", name: "Shadowfrost", desc: "Your Shadow Blast also Slows. You can cast Cryosleep or Rimeblades without Pilfering Power by expending 10 temp HP. Choose 1 Ice Utility Spell." },
                FeatureGen.createSpellChoiceFeature({ id: "abyssal_utility", name: "Ice Utility", level: 7, spellType: "utility", schools: ["Ice"], stateKey: "selectedAbyssalUtility", getCount: () => 1, desc: "Choose 1 Ice Utility Spell." })
            ],
            11: [{ id: "glacial", name: "Glacial Resilience", desc: "([[uGlacial]] 1/Safe Rest) Reaction (whenever you are attacked or would gain a condition), gain 10×LVL temp HP and end ALL negative conditions on yourself. At the end of your next turn, any remaining temp HP are lost." }],
            15: [{ id: "cryo_reprisal", name: "Cryomancer’s Reprisal", desc: "Pay half your max HP to cast ANY Ice spell. After casting an Ice spell in this way, you gain an invisible aura: the next creature that hits you with a melee attack this encounter takes cold damage equal to half the HP you spent on this casting." }]
        };

        subclasses["Reaver"] = {
            3: [
                { id: "hollow", replaces: ["blast", "pilfer"], name: "Hollow One", desc: "Cut off from your patron, you can no longer cast Shadow Blast and you can no longer cast tiered spells using Pilfered Power. However, as a parting token, you have stolen a secret from your patron: The magical Bonescythe, a weapon of sinew and bone, infused with shadowy magic." },
                { id: "bonescythe", name: "Bonescythe", desc: "Action: Summon a magical Bonescythe, a melee weapon: 2d12 slashing+DEX necrotic damage per die (Reach: 2). It shatters after you hit with it (or when combat ends). Any Invocations affecting Shadow Blast affect your Bonescythe Instead. High Levels: Every 5 levels, add 1 extra damage die (Level 5: 3d12, Level 10: 4d12, etc.)." },
                { id: "shadow_exploit", name: "Shadow Exploit", desc: "Sacrifice a shadow minion to cast a spell at the highest tier you have unlocked. Each subsequent spell you cast in this encounter costs 1 additional minion." },
                { id: "martyr", name: "Martyr Spawn", desc: "Whenever you Defend, you can sacrifice a shadow minion to take no damage." }
            ],
            7: [
                { id: "harrow", name: "Grim Harrow", desc: "When you strike with your Bonescythe, you may divide the dice as you choose amongst any number of adjacent targets within Reach." },
                { id: "reap", name: "Reap", desc: "When your Bonescythe crits, or kills a creature, summon a shadow minion for free." }
            ],
            11: [
                { id: "blood_power", name: "My Blood, My Power", desc: "You may take 1 Wound to cast a tiered spell you know at the highest tier you have unlocked." },
                { id: "might", name: "Otherworldly Might", desc: "Advantage on concentration checks if you have any shadow minions." }
            ],
            15: [{ id: "patron", name: "I’m the Patron Now!", desc: "Summon 2 shadow minions for free when you roll Initiative." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new ShadowmancerClass();
