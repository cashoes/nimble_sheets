/**
 * Songweaver Class
 * Musical mystic who weaves spells through song.
 * @extends BaseClass
 */
class SongweaverClass extends BaseClass {
    /**
     * Initializes the Songweaver class with its core configuration.
     */
    constructor() {
        super({
            name: "Songweaver",
            subtitle: "Musical mystic who weaves spells through song",
            keyStats: ['wil', 'int'],
            saves: { adv: 'wil', dis: 'str' },
            proficiencies: { armor: "Cloth, Leather", weapons: "DEX, Wands" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#fbbf24",
                accentDim: "#d97706",
                bodyBg: "#05070a",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a160f 0%, #05070a 100%)",
                panelBg: "rgba(35, 25, 15, 0.8)",
                border: "rgba(251, 191, 36, 0.25)"
            },
            initialStats: { baseStr: -1, baseDex: 1, baseInt: 2, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "HeraldSnark", label: "Herald of Snark", accent: "#f59e0b" },
                { value: "HeraldCourage", label: "Herald of Courage", accent: "#38bdf8" }
            ],
            scalingStats: {
                vmDice: (level, subclass) => (subclass === "HeraldSnark" && level >= 15) ? "1d6" : "1d4",
                vmBonus: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    let bonus = statsMap.int;
                    if (level >= 5) bonus += 2;
                    if (level >= 10) bonus += 2;
                    if (level >= 15) bonus += 2;
                    if (subclass === "HeraldSnark" && level >= 15) bonus += statsMap.wil;
                    return bonus;
                },
                manaMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    return level >= 2 ? (statsMap.int * 3) + level : 0;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                if (level >= 2) {
                    builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
                }
                const vmDisplay = `${derived.vmDice}+${derived.vmBonus}`;
                builder.addRollDisplay(vmDisplay, 'Vicious Mockery', vmDisplay, 'Range 12 | Taunts | Psychic', { type: 'cantrip', school: 'Wind' });
            },
            onInitiative: (level, subclass, state, derived) => {
                if (level >= 3) {
                    const statsMap = getStatsMap(state);
                    const current = state.resourceValues?.inspiration || 0;
                    const max = (statsMap.wil * 2) + (state.selectedLyrical?.includes("Heroic Ballad") ? 2 : 0);
                    state.resourceValues.inspiration = Math.min(max, current + 2);
                }
            },
            statModifiers: [
                { id: "heroic_ballad_max", stat: "inspirationBonus", value: 2, condition: (l, s, state) => (state.selectedLyrical || []).includes("Heroic Ballad") }
            ],
            grantedSpells: [
                { level: 1, spells: ["Wind Cantrips", "Vicious Mockery"] }
            ],
            spellSchools: ["Wind"],
            extraSchoolsKeys: ["secondarySchool"],
            spellProgression: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18],
            includeUtilitySpells: createUtilityConfig((level) => level >= 14, ["selectedWindbag"]),
            resources: [
                createManaResource('int', 'Mana Pool', { hideMechanic: true }),
                createSimpleResource('inspiration', 'Inspiration', (level, stats) => stats.wil * 2, { hideMechanic: true, bonusKey: 'inspirationBonus', reset: 'Safe Rest' })
            ],
            featuresData: SongweaverClass.FEATURES,
            optionsData: SongweaverClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            lyricalWeaponry: {
                "Heroic Ballad": { desc: "+2 max Songweaver’s Inspiration charges. When used to reroll an ally’s attack, your Songweaver’s Inspiration also grants them +WIL damage on the attack." },
                "Inspiring Anthem": { desc: "([[uAnthem]] 1/encounter) Action: Grant all friendly Dying creatures who can hear you 1 HP and 1 action." },
                "Not My Beautiful Faaace!": { desc: "([[uFaaace]] 1/encounter) When you Defend, force the attacker to choose another target within range on a failed WIL save (if there is none, the attack fails). If they fail by 5 or more, they attack themselves as punishment for even thinking they could harm you! On save, they attack you with disadvantage." },
                "Rhapsody of the Normal": { desc: "When you roll 4 or more on your Vicious Mockery, you may spend a Songweaver’s Inspiration charge to temporarily suppress any special abilities they have until the end of their next turn. They can do only what an untrained average villager can do, attack once for 1d4 damage and move up to 6 spaces (no armor, spellcasting, flying, regeneration, other inherent or trained features)." },
                "Song of Domination": { desc: "([[uDomination]] 1/encounter) 2 actions: Play a bewitching tune, and all enemies within 6 spaces who hear it must make a WIL save. If they fail, you move them up to 6 spaces in any direction, and they cannot move on their next turn." }
            },
            friends: {
                "Stompy": { desc: "3 actions: Summon a huge hill giant for 1 round. As he enters the battlefield adjacent to you, use Stompy’s Stomp: Make a DC 10 Influence check. On a success, he moves 6 spaces in a direction you choose; on a failure, he moves towards YOU instead (\"YOU NOT FRIEND!\"). He deals everything in his path damage equal to LVL+Influence check. ANY creature within 6 spaces of Stompy can use this ability once instead of an attack." },
                "Mal, the Malevolent Imp": { desc: "Summon a tiny fiend for 1 night. He can find out dangerous information you have no right to know! Or “take care” of a problem with only the slightest chance of things going wrong. Make an Influence check to convince him to help you (advantage if you ask him to do something he would find mischievous or fun; with disadvantage if it is something he would find good or menial)." },
                "Gran Gran (NOT a hag)": { desc: "When resting, you may summon her for 1 hour to soothe your wounds (and hassle you for not eating enough). She bakes and hands out pastries equal to your WIL+INT. Eating one recovers one mana, Hit Die, or Wound. Eat them while they’re warm! They expire in 10 minutes." },
                "Linos, the Everfriendly": { desc: "Summon a legendary flying (but friendly) creature to take you and your party wherever you need to go. He may request a very large amount of food as payment." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or INT', 'STR or DEX', true, [1, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        core[1] = [
            FeatureGen.createSpellChoiceFeature({ id: "wind_spellcasting", name: "Wind Spellcasting and…", level: 1, spellType: "school", schools: ["Fire", "Ice", "Lightning", "Radiant", "Necrotic"], stateKey: "secondarySchool", desc: "You know cantrips from the Wind school and 1 other school of your choice." }),
            { id: "vicious_mockery", name: "Vicious Mockery", desc: (level) => `You know the unique Wind cantrip <strong>Vicious Mockery</strong>. Range: 12. Damage: 1d4+INT psychic (ignoring armor). On hit: the target is Taunted during their next turn. High Levels: +2 damage every 5 levels.` },
            { id: "inspiration", name: "Songweaver’s Inspiration", resourceId: "inspiration", desc: "Free Reaction: Allow an ally to reroll a single die related to an attack or save (must keep either result)." }
        ];

        core[2] = [
            { id: "mana", name: "Mana and Unlock Tier 1 Spells", desc: "You unlock tier 1 spells in the schools you know and gain a mana pool. This mana pool’s maximum is always equal to (INT×3)+LVL and recharges on a Safe Rest." },
            { id: "jack", name: "Jack of All Trades", desc: "When you Safe Rest, you may move a skill point as if you just leveled up." },
            { id: "song_rest", name: "Song of Rest", desc: "([[uSongRest]] 1/day) Whenever you Field Rest, you may play a song and allow anyone who spends Hit Dice to heal additional HP equal to your WIL." }
        ];

        core[3] = [
            { id: "subclass", name: "Subclass", desc: "Choose a Songweaver subclass." },
            { id: "quick_wit", name: "Quick Wit", desc: "When you roll Initiative, you may regain 2 spent uses of your Songweaver’s Inspiration (these expire at the end of combat if left unused)." },
            FeatureGen.createSpellChoiceFeature({
                id: "windbag",
                name: "Windbag",
                level: 3,
                stateKey: "selectedWindbag",
                milestones: [3, 6, 14],
                getCount: (l) => l >= 14 ? 0 : 2,
                getSlots: (level, subclass, state) => {
                    if (level >= 14) return [];
                    const schools = ["Wind", state.secondarySchool || "Fire"];
                    return schools.map(s => ({ type: 'utility', schools: [s], label: `${s} Utility` }));
                },
                desc: (l) => l >= 14 ? "You know all Utility Spells from the spell schools you know." : "Choose 1 Utility Spell from each spell school you know."
            })
        ];

        core[4].push({ id: "lyrical", name: "Lyrical Weaponry", type: "dynamic_choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", milestones: [4, 9, 13, 17], desc: "Choose a Lyrical Weaponry ability.", getCount: FeatureGen.createStandardCount([4, 9, 13, 17]) });

        core[5].push({ id: "people", name: "A “People“ Person", type: "dynamic_choice", collection: "friends", stateKey: "selectedFriends", milestones: [5], desc: "Choose 2 friends you know.", getCount: () => 2 });

        core[20].push({ id: "famous", name: "I’m So Famous!", desc: "+1 to any 2 of your stats. Your Songweaver’s Inspiration cannot fail (your target succeeds)." });

        subclasses["HeraldSnark"] = {
            3: [{ id: "snark", name: "Opportunistic Snark", desc: "Reaction (when an enemy within Range 12 misses an attack): You may cast Vicious Mockery at them; it deals double damage when cast this way." }],
            7: [{ id: "picker", name: "Fight Picker", desc: "(1/turn) When an enemy is damaged by your Vicious Mockery, you may have one of your allies Taunt them until the end of the enemy’s turn instead." }],
            11: [{ id: "chord", name: "Chord of Chaos", desc: "([[uChord]] 1/encounter) Action: You may move ALL creatures within hearing of your song up to 3 spaces as long as they do not move into an obviously dangerous place." }],
            15: [{ id: "words", name: "Words Like Swords", desc: "Your Vicious Mockery damage becomes 1d6+INT+WIL." }]
        };

        subclasses["HeraldCourage"] = {
            3: [{ id: "presence", name: "Inspiring Presence", desc: "Whenever you use Songweaver’s Inspiration, your allies within 12 spaces who can hear you gain WIL temp HP." }],
            7: [{ id: "courage", name: "Unfailing Courage", desc: "Your Songweaver’s Inspiration allows your target to roll with advantage." }],
            11: [{ id: "bones", name: "Fire in my Bones", desc: "Your Songweaver’s Inspiration also grants your target 1 additional action." }],
            15: [{ id: "chorus", name: "Chorus of Champions", desc: "([[uChorus]] 1/encounter) Free Reaction: Give all party members 1 action." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new SongweaverClass();
