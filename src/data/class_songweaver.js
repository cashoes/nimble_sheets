class SongweaverClass extends BaseClass {
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
            initialStats: { baseStr: -1, baseDex: 0, baseInt: 2, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "HeraldSnark", label: "Herald of Snark", accent: "#ef4444" },
                { value: "HeraldCourage", label: "Herald of Courage", accent: "#fbbf24" }
            ],
            spellSchools: ["Wind"],
            includeUtilitySpells: createUtilityConfig(false, null), // Special windbag logic
            resources: [
                createManaResource('wil'),
                createSimpleResource('inspiration', 'Inspiration', (level, stats, state) => (stats.wil * 2) + (state.selectedLyrical?.includes("Heroic Ballad") ? 2 : 0))
            ],
            featuresData: SongweaverClass.FEATURES,
            optionsData: SongweaverClass.OPTIONS
        });
    }

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
            },
            schools: {
                "Fire": { desc: "Master the school of Fire." },
                "Ice": { desc: "Master the school of Ice." },
                "Lightning": { desc: "Master the school of Lightning." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or INT', 'STR or DEX', true);
        
        core[1] = [
            { id: "school_choice", name: "Secondary School", type: "choice", collection: "schools", stateKey: "secondarySchool", desc: "Master a second elemental school (Fire, Ice, or Lightning).", count: 1 },
            { id: "vicious_mockery", name: "Vicious Mockery", desc: "You know the unique Wind cantrip <strong>Vicious Mockery</strong>. Range: 12. Damage: 1d4+INT psychic (ignoring armor). Taunts on hit. +2 damage every 5 levels." },
            { id: "inspiration", name: "Songweaver’s Inspiration", desc: (level, subclass, state, derived) => `(<strong>${derived.resourceMaxes.inspiration}</strong> uses/Safe Rest) Free Reaction: Allow an ally to reroll a single die related to an attack or save.` }
        ];
        core[2].push({ id: "jack", name: "Jack of All Trades", desc: "When you Safe Rest, you may move a skill point as if you just leveled up." });
        core[2].push({ id: "song_rest", name: "Song of Rest", desc: "(1/day) Whenever you Field Rest, allow anyone spending HD to heal extra HP equal to your WIL." });
        
        core[3].push({ id: "quick_wit", name: "Quick Wit", desc: "When you roll Initiative, regain 2 spent uses of Inspiration (expire end of combat)." });
        core[3].push({ id: "windbag", name: "Windbag", desc: (level) => level >= 14 ? "You know all Utility Spells from the spell schools you know." : "Choose 1 Utility Spell from each spell school you know." });
        
        core[4].push({ id: "lyrical_1", name: "Lyrical Weaponry", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, desc: "Choose 1 ability from the Lyrical Weaponry list." });
        core[5].push({ id: "people", name: "A “People“ Person", type: "choice", collection: "friends", stateKey: "selectedFriends", count: 2, desc: "Choose 2 friends you can temporarily summon via song (1/Safe Rest each)." });
        
        core[9].push({ id: "lyrical_2", name: "Lyrical Weaponry (2)", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, startIndex: 1, desc: "Choose a 2nd Lyrical Weaponry ability." });
        core[13].push({ id: "lyrical_3", name: "Lyrical Weaponry (3)", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, startIndex: 2, desc: "Choose a 3rd Lyrical Weaponry ability." });
        core[17].push({ id: "lyrical_4", name: "Lyrical Weaponry (4)", type: "choice", collection: "lyricalWeaponry", stateKey: "selectedLyrical", count: 1, startIndex: 3, desc: "Choose a 4th Lyrical Weaponry ability." });
        
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

    getDerivedStats(level, subclass, state) {
        const statsMap = getStatsMap(state);
        let vmDie = (level >= 15 && subclass === "HeraldSnark") ? "1d6" : "1d4";
        let vmBonus = statsMap.int + (Math.floor(level / 5) * 2);
        if (level >= 15 && subclass === "HeraldSnark") vmBonus += statsMap.wil;
        let vmDisplay = `${vmDie}${vmBonus >= 0 ? "+" : ""}${vmBonus}`;

        return { speed: 6, woundMax: 6, vmDisplay };
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        
        builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        builder.addResource('inspiration', 'Inspiration', state.resourceValues.inspiration, derived.resourceMaxes.inspiration);
        
        builder.addRollDisplay(derived.vmDisplay, 'Vicious Mockery', derived.vmDisplay, 'Range 12 | Taunts', { type: 'cantrip', school: 'Wind' });

        return builder.build();
    }

    getAvailableSpells(level, subclass, state, derived) {
        const spells = super.getAvailableSpells(level, subclass, state, derived);
        const secondary = (state.secondarySchool || [])[0] || "None";
        const schools = ["Wind"];
        if (secondary !== "None") schools.push(secondary);

        // Windbag Utility Logic
        if (level >= 14) {
            schools.forEach(sch => {
                if (UTILITY_SPELLS[sch]) {
                    Object.entries(UTILITY_SPELLS[sch]).forEach(([name, desc]) => {
                        spells.push({ name, desc, tier: "Utility", school: sch });
                    });
                }
            });
        } else if (level >= 3) {
            schools.forEach(sch => {
                const selKey = `windbagSpells_${sch}`;
                const val = (state[selKey] || [])[0] || "None";
                if (val !== "None" && UTILITY_SPELLS[sch]?.[val]) {
                    const desc = UTILITY_SPELLS[sch][val];
                    let customHtml = `<select onchange="updateClassState('${selKey}', 0, this.value)" style="border-bottom-color: var(--class-accent);"><option value="None">Select ${sch} Utility...</option>${Object.keys(UTILITY_SPELLS[sch]).map(k => `<option value="${k}" ${k===val?'selected':''}>${k}</option>`).join('')}</select><div style="margin-top:8px;">${desc}</div>`;
                    spells.push({ name: "", tier: "Utility", school: sch, customHtml });
                } else {
                    let customHtml = `<select onchange="updateClassState('${selKey}', 0, this.value)" style="border-bottom-color: var(--class-accent);"><option value="None">Select ${sch} Utility...</option>${Object.keys(UTILITY_SPELLS[sch] || {}).map(k => `<option value="${k}">${k}</option>`).join('')}</select>`;
                    spells.push({ name: "", tier: "Utility", school: sch, customHtml });
                }
            });
        }

        return spells;
    }
}

const CLASS_CONFIG = new SongweaverClass();
