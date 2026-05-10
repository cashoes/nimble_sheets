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
                bodyBg: "#070401",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 100%), linear-gradient(180deg, #1a140a 0%, #070401 100%)",
                panelBg: "rgba(35, 25, 15, 0.7)",
                border: "rgba(251, 191, 36, 0.3)"
            },
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 2, baseWil: 3 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "HeraldSnark", label: "Herald of Snark", accent: "#be123c" },
                { value: "HeraldCourage", label: "Herald of Courage", accent: "#4338ca" }
            ],
            scalingStats: {
                vmDisplay: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    const die = (level >= 15 && subclass === "HeraldSnark") ? "1d6" : "1d4";
                    let bonus = statsMap.int + (Math.floor(level / 5) * 2);
                    if (level >= 15 && subclass === "HeraldSnark") bonus += statsMap.wil;
                    return `${die}${bonus >= 0 ? "+" : ""}${bonus}`;
                }
            },
            statModifiers: [
                { id: "heroic_ballad_max", stat: "inspirationBonus", value: 2, condition: (l, s, state) => (state.selectedLyrical || []).includes("Heroic Ballad") }
            ],
            spellSchools: ["Wind"],
            extraSchoolsKeys: ["secondarySchool"],
            resources: [
                createManaResource('wil'),
                createSimpleResource('inspiration', 'Inspiration', (level, stats, state) => {
                    let max = stats.wil * 2;
                    return max;
                }, { bonusKey: 'inspirationBonus' })
            ],
            featuresData: SongweaverClass.FEATURES,
            optionsData: SongweaverClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Songweaver class (Lyrical Weaponry, Friends).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            lyricalWeaponry: {
                "Heroic Ballad": { desc: "+2 max Songweaver’s Inspiration charges. When used to reroll an ally’s attack, your Songweaver’s Inspiration also grants them +WIL damage on the attack." },
                "Inspiring Anthem": { desc: "(1/encounter) Action: Grant all friendly Dying creatures who can hear you 1 HP and 1 action." },
                "Not My Beautiful Faaace!": { desc: "(1/encounter) When you Defend, force the attacker to choose another target within range on a failed WIL save (if there is none, the attack fails). If they fail by 5+ they attack themselves." },
                "Rhapsody of the Normal": { desc: "When you roll 4+ on Vicious Mockery, spend Inspiration to suppress special abilities until end of next turn. They become an untrained villager (1d4 dmg, spd 6, no features)." },
                "Song of Domination": { desc: "(1/encounter) 2 actions: All enemies within 6 must make a WIL save. If they fail, you move them up to 6 spaces; they cannot move on their next turn." }
            },
            friends: {
                "Stompy": { desc: "3 actions: Summon huge hill giant for 1 round. Success on DC 10 Influence: move 6 then Stomp (LVL+Influence dmg to path). Allies within 6 can also trigger Stomp." },
                "Mal, the Malevolent Imp": { desc: "Summon for 1 night. Find dangerous information you have no right to know! Or “take care” of a problem with only the slightest chance of things going wrong. Influence check to help." },
                "Gran Gran (NOT a hag)": { desc: "Summon for 1 hour while resting. Bakes pastries equal to WIL+INT. Eating one recovers mana, Hit Die, or Wound. Expire in 10 mins." },
                "Linos, the Everfriendly": { desc: "Summon legendary flying creature to transport party. May request a very large amount of food as payment." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Songweaver class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or INT', 'STR or DEX', true);

        core[1] = [
            FeatureGen.createSpellChoiceFeature({
                id: "school_choice",
                name: "Wind Spellcasting and…",
                level: 1,
                spellType: "school",
                schools: ["Fire", "Ice", "Lightning", "Radiant", "Necrotic"],
                stateKey: "secondarySchool",
                desc: "You know cantrips from the Wind school and 1 other school of your choice."
            }),
            {
                id: "vicious_mockery",
                name: "Vicious Mockery",
                desc: (level) => FeatureGen.createScalingList(
                    "You know the unique Wind cantrip <strong>Vicious Mockery</strong>. Range: 12. Damage: 1d4+INT psychic (ignoring armor). Taunts on hit.",
                    [
                        { level: 1, text: "Damage is 1d4+INT." },
                        { level: 5, text: "Damage bonus increases by +2." },
                        { level: 10, text: "Damage bonus increases by +4." },
                        { level: 15, text: "Damage bonus increases by +6." }
                    ],
                    level
                )
            },
            { id: "inspiration", name: "Songweaver’s Inspiration", desc: (level, subclass, state, derived) => `(<strong>${derived.resourceMaxes.inspiration}</strong> uses/Safe Rest) Free Reaction: Allow an ally to reroll a single die related to an attack or save.` }
        ];
        core[2].push({ id: "jack", name: "Jack of All Trades", desc: "When you Safe Rest, you may move a skill point as if you just leveled up." });
        core[2].push({
            id: "song_rest",
            name: "Song of Rest",
            desc: (level) => FeatureGen.createScalingList(
                "(1/day) Whenever you Field Rest, allow anyone spending HD to heal extra HP equal to your WIL.",
                [{ level: 1, text: "Bonus healing is WIL." }],
                level
            )
        });

        core[3].push({ id: "quick_wit", name: "Quick Wit", desc: "When you roll Initiative, regain 2 spent uses of Inspiration (expire end of combat)." });
        core[3].push(FeatureGen.createSpellChoiceFeature({
            id: "windbag",
            name: "Master of Verse",
            level: 3,
            spellType: "utility",
            stateKey: "selectedSubclassSpells",
            perSchool: true,
            multiplier: (level) => level >= 14 ? 0 : 1,
            milestones: [3, 14],
            desc: (level) => FeatureGen.createScalingList(
                "Choose 1 Utility Spell from each spell school you know.",
                [{ level: 14, text: "You know all Utility Spells from the spell schools you know." }],
                level
            )
        }));

        core[4].push({ id: "lyrical", name: "Lyrical Weaponry", type: "dynamic_choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", milestones: [4, 9, 13, 17], desc: "Choose abilities from the Lyrical Weaponry list as you level up.", getCount: (level) => level >= 17 ? 4 : level >= 13 ? 3 : level >= 9 ? 2 : 1 });
        core[5].push({ id: "people", name: "A “People“ Person", type: "dynamic_choice", collection: "friends", stateKey: "selectedFriends", milestones: [5], desc: "Choose friends you can temporarily summon via song (1/Safe Rest each).", getCount: (level) => 2 });

        core[20].push({ id: "famous", name: "I’m So Famous!", desc: "+1 to any 2 of your stats. Your Songweaver’s Inspiration cannot fail (your target succeeds)." });

        subclasses["HeraldSnark"] = {
            3: [{ id: "snark", name: "Opportunistic Snark", desc: "Reaction (when enemy in Range 12 misses): Cast Vicious Mockery; it deals double damage." }],
            7: [{ id: "picker", name: "Fight Picker", desc: "(1/turn) When enemy is damaged by Vicious Mockery, you may have an ally Taunt them instead." }],
            11: [{ id: "chord", name: "Chord of Chaos", desc: "(1/encounter) Action: Move ALL creatures within hearing up to 3 spaces (not into danger)." }],
            15: [{ id: "words", name: "Words Like Swords", desc: "Your Vicious Mockery damage becomes 1d6+INT+WIL." }]
        };
        subclasses["HeraldCourage"] = {
            3: [{ id: "presence", name: "Inspiring Presence", desc: "Whenever you use Songweaver’s Inspiration, allies in 12 reach who hear you gain WIL temp HP." }],
            7: [{ id: "courage", name: "Unfailing Courage", desc: "Your Songweaver’s Inspiration allows your target to roll with advantage." }],
            11: [{ id: "bones", name: "Fire in my Bones", desc: "Your Songweaver’s Inspiration also grants your target 1 additional action." }],
            15: [{ id: "chorus", name: "Chorus of Champions", desc: "(1/encounter) Free Reaction: Give all party members 1 action." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Mana, Inspiration, and Vicious Mockery displays for the Songweaver's mechanic panel.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived statistics.
     * @returns {string} HTML string.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();

        builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        builder.addResource('inspiration', 'Inspiration', state.resourceValues.inspiration, derived.resourceMaxes.inspiration);

        builder.addRollDisplay(derived.vmDisplay, 'Vicious Mockery', derived.vmDisplay, 'Range 12 | Taunts', { type: 'cantrip', school: 'Wind' });

        return builder.build();
    }
}

const CLASS_CONFIG = new SongweaverClass();
