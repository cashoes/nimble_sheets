class ShepherdClass extends BaseClass {
    constructor() {
        super({
            name: "Shepherd",
            subtitle: "Master of life and death, leader of spirits",
            keyStats: ['wil', 'str'],
            saves: { adv: 'wil', dis: 'dex' },
            proficiencies: { armor: "Mail, Shields", weapons: "STR Weapons, Wands" },
            baseHp: 17,
            hpPerLevel: 8,
            hitDie: 10,
            theme: {
                accent: "#a855f7",
                accentDim: "#6b21a8",
                bodyBg: "#0a0712",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.1) 0%, transparent 100%), linear-gradient(180deg, #130f24 0%, #0a0712 100%)",
                panelBg: "rgba(25, 20, 45, 0.75)",
                border: "rgba(168, 85, 247, 0.3)"
            },
            initialStats: { baseStr: 2, baseDex: 0, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Mercy", label: "Luminary of Mercy", accent: "#f8fafc" },
                { value: "Malice", label: "Luminary of Malice", accent: "#4ade80" }
            ],
            spellSchools: ["Radiant", "Necrotic"],
            includeUtilitySpells: createUtilityConfig(false, null), // Special handling
            resources: [
                createManaResource('wil'),
                createSimpleResource('searingLight', 'Searing Light', (level, stats) => stats.wil)
            ],
            featuresData: ShepherdClass.FEATURES,
            optionsData: ShepherdClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            graces: {
                "Assist Me, My Friend!": { desc: "Whenever you make your first melee attack each round, you may add your Lifebinding Spirit’s damage to the attack." },
                "Empowered Companion": { desc: "Whenever you spend mana to call forth your Lifebinding Spirit, you cast it as if you spent 1 additional mana (ignoring the typical spell tier restrictions). The maximum die size is now a d20." },
                "Guiding Spirit": { desc: "When your Lifebinding Spirit rolls a 6 or higher on its damage die, the target begins to glow with radiant light. The next attack against that target has advantage." },
                "Hasty Companion": { desc: "+4 Reach for your Lifebinding Spirit. It can also act for free when summoned." },
                "Illuminate Soul": { desc: "Action: A creature within 6 spaces begins to glow with radiant light. For 1 Round, attacks against them are made with your choice of advantage or disadvantage. You may do this WIL times per Safe Rest." },
                "Light Bearer": { desc: "Regain 1 use of Searing Light when you roll Initiative (this expires if unspent at the end of combat)." },
                "Not Beyond MY Reach": { desc: "You may target creatures who have been dead less than 1 round for healing. For every 10 HP a dead creature is healed this way, you may have them recover 1 Wound instead (you must heal at least 1 Wound to revive them)." },
                "Vengeful Spirit": { desc: "Action: Your Lifebinding Spirit sacrifices itself to transform into a swirling vortex of radiant light. At the end of your turn, it damages all enemies within 3 spaces of you, ignoring armor and cover. This lasts for a number of rounds equal to the healing charges left on the Lifebinding Spirit. This effect ends early if you summon your spirit again." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or STR', 'INT or DEX', true);
        
        core[1] = [
            { id: "keeper", name: "Keeper of Life & Death", desc: "You know Radiant and Necrotic cantrips." },
            { id: "searing", name: "Searing Light", desc: "(WIL times/Safe Rest) Action: Heal or Inflict grievous injuries: <ul><li>Heal WIL d8 HP to a Dying creature within Reach 6.</li><li>Inflict WIL d8 radiant damage to an undead or Bloodied enemy within Reach 6.</li></ul>" }
        ];
        core[2].push({ id: "spirit", name: "Lifebinding Spirit", desc: "You know the unique Radiant spell <strong>Lifebinding Spirit</strong> (Tier 1). Action: Summon spirit (ignores harm, lasts until cast again or healing spent). Action: Attack/Heal within Reach 4 for 1d6+WIL radiant. Upcasting: +1 die size (max d12), +1 use." });
        
        core[3].push({ id: "twilight", name: "Master of Twilight", desc: "Choose 1 Necrotic and 1 Radiant Utility Spell." });
        core[5].push({ id: "graces", name: "Sacred Grace", type: "dynamic_choice", collection: "graces", stateKey: "selectedGraces", desc: "Choose modular graces.", getCount: (level) => level >= 17 ? 4 : level >= 13 ? 3 : level >= 9 ? 2 : 1 });
        
        core[6].push({ id: "twilight_2", name: "Master of Twilight (2)", desc: "Choose a 2nd Necrotic and Radiant Utility Spell." });
        core[11].push({ id: "twilight_3", name: "Master of Twilight (3)", desc: "You know all Necrotic and Radiant Utility Spells." });
        
        core[17] = [{ id: "revitalizing", name: "Revitalizing Blessing", desc: "(1/round) Whenever you roll a 6 or higher on one or more healing die, the target may recover one Wound." }];
        core[20].push({ id: "sage", name: "Twilight Sage", desc: "+1 to any 2 of your stats. Your Lifebinding Spirit rolls twice as many dice." });

                subclasses["Mercy"] = {
            3: [{ id: "merciful", name: "Merciful Healing", desc: "When an effect caused by you heals a Dying creature, they are healed for twice as much. (1/round) Your Lifebinding Spirit can act for free while you are Dying." }, { id: "beautiful", name: "Life is Beautiful", desc: "Harmless and lovely creatures follow you. Flowers bloom more vibrantly in your presence." }],
            7: [{ id: "conduit", name: "Conduit of Light", desc: "When an effect caused by you would heal HP, you may expend 1 use of Searing Light to heal (or damage, ignoring armor) another target within 6 spaces of yourself for the same amount." }],
            11: [{ id: "powerful", name: "Powerful Healer", desc: "(WIL times/Safe Rest) Whenever you would roll dice to heal damage, you may instead heal the max amount you could roll, or give that many temp HP." }],
            15: [{ id: "empowered", name: "Empowered Conduit", desc: "Your Conduit of Light may target 1 additional creature. Regain 1 charge of Searing Light when you roll Initiative." }]
        };
        subclasses["Malice"] = {
            3: [{ id: "reaper", name: "Soul Reaper", desc: "When you use Searing Light to harm an enemy, make a 2nd enemy within range take the same amount of damage (ignoring armor)." }, { id: "decay", name: "Harbinger of Decay", desc: "Foods spoil more rapidly in your presence. You may have your Lifebinding Spirit shift into a deathly version of itself and have its damage type become necrotic." }],
            7: [{ id: "veilwalker", name: "Veilwalker’s Blessing", desc: "(1/Safe Rest) Reaction (when you would drop to 0 HP): Drop to 1 HP instead and force an enemy within 6 spaces to make a STR save. On a failure, they become Bloodied, or if they are already Bloodied, they drop to 0 HP." }],
            11: [{ id: "deathbringer", name: "Deathbringer’s Touch", desc: "Your first melee attack each round against a Bloodied creature is an automatic critical hit. Your Lifebinding Spirit deals additional damage equal to your STR." }],
            15: [{ id: "conduit_death", name: "Conduit of Death", desc: "Your Veilwalker’s Blessing ability recharges when you roll Initiative." }]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        let maxTier = Math.max(1, Math.floor(level / 2));
        let effectiveTier = maxTier + (state.selectedGraces?.includes("Empowered Companion") ? 1 : 0);
        let dieSizes = ['1d6', '1d8', '1d10', '1d12', '1d20'];
        let spiritDmg = dieSizes[Math.min(dieSizes.length - 1, effectiveTier - 1)];
        if (level >= 20) spiritDmg = spiritDmg.replace('1', '2');

        return { speed: 6, woundMax: 6, spiritDmg };
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);

        if (level >= 2) {
            builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        }
        builder.addResource('searingLight', 'Searing Light', state.resourceValues.searingLight, derived.resourceMaxes.searingLight);

        let spiritType = subclass === "Malice" ? "Deadly" : "Lifebinding";
        builder.addRollDisplay(`${derived.spiritDmg}+${statsMap.wil}`, `${spiritType} Spirit`, `${derived.spiritDmg}+${statsMap.wil}`, `Reach 4 | T${Math.max(1, Math.floor(level/2))} uses`, { isMinion: true });

        return builder.build();
    }

    getAvailableSpells(level, subclass, state, derived) {
        let spells = super.getAvailableSpells(level, subclass, state, derived);
        
        // Shepherd paired utility selection (Level 3+)
        if (level >= 3 && level < 11) {
            let numPairs = level >= 6 ? 2 : 1;
            for (let i = 0; i < numPairs; i++) {
                // Radiant
                let rVal = (state.spiritSpellsRadiant || [])[i] || "None";
                let rOpts = `<option value="None">Select Radiant Utility...</option>`;
                Object.keys(UTILITY_SPELLS.Radiant || {}).forEach(k => rOpts += `<option value="${k}">${k}</option>`);
                let rCustom = `<select onchange="updateClassState('spiritSpellsRadiant', ${i}, this.value)" style="border-bottom-color: var(--class-accent);">${rOpts.replace(`value="${rVal}"`, `value="${rVal}" selected`)}</select>`;
                if (rVal !== "None") rCustom += `<div style="margin-top:8px;">${UTILITY_SPELLS.Radiant[rVal]}</div>`;
                spells.push({ name: "", tier: "Utility", school: "Radiant", customHtml: rCustom });

                // Necrotic
                let nVal = (state.spiritSpellsNecrotic || [])[i] || "None";
                let nOpts = `<option value="None">Select Necrotic Utility...</option>`;
                Object.keys(UTILITY_SPELLS.Necrotic || {}).forEach(k => nOpts += `<option value="${k}">${k}</option>`);
                let nCustom = `<select onchange="updateClassState('spiritSpellsNecrotic', ${i}, this.value)" style="border-bottom-color: var(--class-accent);">${nOpts.replace(`value="${nVal}"`, `value="${nVal}" selected`)}</select>`;
                if (nVal !== "None") nCustom += `<div style="margin-top:8px;">${UTILITY_SPELLS.Necrotic[nVal]}</div>`;
                spells.push({ name: "", tier: "Utility", school: "Necrotic", customHtml: nCustom });
            }
        } else if (level >= 11) {
            ["Radiant", "Necrotic"].forEach(sch => {
                Object.entries(UTILITY_SPELLS[sch] || {}).forEach(([name, desc]) => {
                    spells.push({ name, desc, tier: "Utility", school: sch });
                });
            });
        }
        
        return spells;
    }
}

const CLASS_CONFIG = new ShepherdClass();
