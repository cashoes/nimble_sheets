class StormshifterClass extends BaseClass {
    constructor() {
        super({
            name: "Stormshifter",
            subtitle: "Master of weather, beast, and nature",
            keyStats: ['wil', 'dex'],
            saves: { adv: 'wil', dis: 'str' },
            proficiencies: { armor: "Cloth or Leather Armor", weapons: "Staves, Wands" },
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
            initialStats: { baseStr: 0, baseDex: 2, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "SkyStorm", label: "Circle of Sky & Storm", accent: "#bae6fd" },
                { value: "FangClaw", label: "Circle of Fang & Claw", accent: "#f97316" }
            ],
            spellSchools: ["Lightning", "Wind"],
            subclassSchools: { "SkyStorm": [] }, // Handled by study choice
            includeUtilitySpells: createUtilityConfig(false, null), // Special stormcaller logic
            resources: [
                createManaResource('wil'),
                createSimpleResource('shiftUses', 'Beastshift', (level, stats) => stats.dex + (level >= 6 ? 1 : 0) + (level >= 9 ? 1 : 0) + (level >= 12 ? 1 : 0) + (level >= 15 ? 2 : 0))
            ],
            featuresData: StormshifterClass.FEATURES,
            optionsData: StormshifterClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            forms: {
                "Normal": { desc: "Standard humanoid form. No bonuses." },
                "Harmless": { desc: "Tiny beast (Squirrel, Bird). Speed: 6. Speak with animals. Form ends if you drop to 0 HP, cast a spell, or if you end it on your turn for free." },
                "Fearsome": { desc: "Large beast. Gain DEX+LVL temp HP. Attack: Gore (1d6+LVL). Fearsome: Whenever you Interpose or Defend, you may spend 1 mana to force them to reroll the attack (you must choose either result)." },
                "Beast of the Pack": { desc: "Medium beast. Gain +DEX speed. Thunderfang: 1d4+LVL damage. Whenever you crit or kill, gain cumulative +1d4 lightning damage until combat ends. Supercharge: Spend up to WIL mana for +1d8 lightning dmg per mana spent." },
                "Beast of Nightmares": { desc: "Tiny beast. Speed: 2. Attack: Sting (1d4+3x LVL acid). Silent But Deadly: Cannot be targeted until you attack." }
            },
            chimericBoons: {
                "Beast of the Sea": { desc: "Can move, breathe, and fight underwater without penalty." },
                "Climber": { desc: "Can walk across walls and ceilings; ignores difficult terrain." },
                "Fleet Footed": { desc: "+2 speed. Advantage on Stealth checks and against the Grappled condition." },
                "Earthwalker": { desc: "+2 armor. Can burrow through dirt and unworked rock at half speed. Advantage against the Prone condition." },
                "Keen Senses": { desc: "Advantage on Perception and Assess checks. Unaffected by Blinded." },
                "Leader of the Pack": { desc: "Advantage against fear and charm effects for yourself and allies within 6 spaces." },
                "Phasebeast": { desc: "Whenever you shift between this form and your normal form (and vice versa), you may teleport up to 6 spaces away." },
                "Prehensile Tail": { desc: "Creatures you hit in melee that are your size or smaller are Grappled. If you hit a larger creature, you may move with it." },
                "Winged": { desc: "Gain a flying speed. Forced movement moves you twice as far while flying." }
            },
            studySchools: {
                "Ice": { desc: "Gain access to all Ice spells." },
                "Radiant": { desc: "Gain access to all Radiant spells." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL or DEX', 'STR or INT', true);
        
        core[1] = [
            { id: "master", name: "Master of Storms", desc: "You know all cantrips from the Lightning and Wind schools." },
            { id: "shift", name: "Beastshift", desc: "Action: Transform into a harmless beast. Speak with animals. DEX charges/Safe Rest. Form ends if you drop to 0 HP, cast a spell, or if you end it on your turn for free." }
        ];
        core[2].push({ id: "dire_1", name: "Direbeast Form", desc: "You can Beastshift into a Fearsome Beast." });
        core[3].push({ id: "dire_2", name: "Direbeast Form (2)", desc: "You can Beastshift into a Beast of the Pack." });
        core[4].push({ id: "caller", name: "Stormcaller", desc: "Learn a Utility Spell from each spell school you know." });
        core[5].push({ id: "dire_3", name: "Direbeast Form (3)", desc: "You can Beastshift into a Beast of Nightmares." });
        
        core[6].push({ id: "boon", name: "Chimeric Boon", type: "dynamic_choice", collection: "chimericBoons", stateKey: "selectedBoons", desc: "Choose 2 Chimeric Boons. Whenever you shapeshift into a Direbeast form, you may modify it with 1 Chimeric Boon you know.", getCount: (level) => level >= 17 ? 5 : level >= 12 ? 4 : level >= 9 ? 3 : 2 });
        core[6].push({ id: "expert", name: "Expert Shifter", desc: "Gain 1 additional use of Beastshift per Safe Rest." });
        
        core[8].push({ id: "stormborn", name: "Stormborn", desc: "Gain resistance to lightning damage. (1/day) You may gain advantage on a Naturecraft check or Concentration check." });
        core[13].push({ id: "stormborn_2", name: "Stormborn (2)", desc: "Instead of rolling dice, deal the max damage of a Wind spell by spending a charge of Beastshift. Whenever you end Beastshift, you may cast a cantrip for free." });
        
        core[20].push({ id: "archdruid", name: "Archdruid", desc: "+1 to any 2 of your stats. (1/encounter) Cast a spell up to tier 4 for free when you enter or leave a Beastshift form." });

        subclasses["SkyStorm"] = {
            3: [{ id: "study", name: "Deepening Study", type: "choice", collection: "studySchools", stateKey: "deepeningStudySchool", count: 1, desc: "Choose the Ice or Radiant school to learn." }, { id: "creature", name: "Creature of the Fey", desc: "You may cast spells while Beastshifted." }, { id: "attuned", name: "Attuned to Nature", desc: "(1/day) Add LVL to any skill check related to nature or weather." }],
            7: [{ id: "tempest", name: "Raging Tempest", desc: "Whenever you crit with a tiered spell, you may cast a cantrip for free from a school you know and haven’t used this turn." }],
            11: [{ id: "primordial", name: "Primordial Force", desc: "Spending 2+ mana on a spell grants an additional effect based on school: <ul><li><strong>Ice:</strong> Gain WIL temp HP.</li><li><strong>Lightning:</strong> Deal additional damage equal to your WIL.</li><li><strong>Radiant:</strong> You may heal a creature within 6 spaces WIL HP.</li><li><strong>Wind:</strong> Gain a flying speed this turn. Move up to 6 spaces for free.</li></ul>" }],
            15: [{ id: "master_storm", name: "Master of Storm", desc: "Concentrate on 1 lightning and 1 wind spell at the same time. (1/Safe Rest) Cast Ride the Lightning for 0 mana." }]
        };
        subclasses["FangClaw"] = {
            3: [{ id: "swiftshift", name: "Swiftshift", desc: "Init: Beastshift or move for free. While transformed, you may shift between different Direbeast forms for free (Reaction for 1 mana)." }, { id: "windborne", name: "Windborne Protector", desc: "(1/encounter) Reaction: When an enemy attacks, spend 2 mana to shift into a Fearsome Beast, Interpose from 12 reach, and Defend for free." }, { id: "friend", name: "Friend of Beasts", desc: "Beasts will not attack you until you first harm them. Transform into harmless beasts without spending a charge." }],
            7: [{ id: "unleash", name: "Unleash the Beast", desc: "(1/encounter) When you miss, you can crit instead." }, { id: "wake", name: "Storm Wake", desc: "(1/encounter) Action: Spend 3 mana to shift into a Beast of the Pack, teleport 12 reach in a line, and deal WIL d8 lightning dmg to targets in path." }],
            11: [{ id: "master_forms", name: "Master of Forms", desc: "Your shapeshift forms can have 2 Chimeric Boons at a time." }, { id: "gaze", name: "Venomous Gaze", desc: "(1/encounter) Action: Spend 2 mana to shift into Beast of Nightmares, pull enemy within 12 reach closer by 2x WIL, and Sting for free on contact." }],
            15: [{ id: "master_forms_2", name: "Master of Forms (2)", desc: "Beastshift 2 additional times per Safe Rest. Your Direbeast forms can have 3 Boons at a time." }]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        const activeForm = (state.currentForm || [])[0] || "Normal";
        let speed = activeForm === "Beast of Nightmares" ? 2 : 6;
        return { speed, woundMax: 6 };
    }

    getStatOverrides(level, subclass, state, statsMap) {
        let overrides = {};
        const activeForm = (state.currentForm || [])[0] || "Normal";
        const boons = state.selectedBoons || [];
        if (activeForm === "Beast of the Pack") overrides.speed = statsMap.dex;
        if (boons.includes("Earthwalker")) overrides.armor = 2;
        if (boons.includes("Fleet Footed")) overrides.speed = (overrides.speed || 0) + 2;
        if (boons.includes("Winged")) overrides.modFlySpeed = true;
        return overrides;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
        builder.addResource('shiftUses', 'Beastshift', state.resourceValues.shiftUses, derived.resourceMaxes.shiftUses);

        let activeForm = (state.currentForm || [])[0] || "Normal";
        let opts = Object.keys(StormshifterClass.OPTIONS.forms).map(k => {
            let skip = (k === "Fearsome" && level < 2) || (k === "Beast of the Pack" && level < 3) || (k === "Beast of Nightmares" && level < 5);
            return skip ? '' : `<option value="${k}" ${k===activeForm?'selected':''}>${k}</option>`;
        }).join('');

        builder.addCustom(`
            <div style="flex: 1.6; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <label style="font-size: 0.7em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel'; font-weight: bold; margin-bottom: 2px;">Form</label>
                <select onchange="updateClassState('currentForm', 0, this.value)" style="border-bottom-color: var(--class-accent); font-size: 0.85em;">${opts}</select>
                <div style="font-size: 0.6em; color: var(--text-muted); font-family: 'Crimson Text'; font-style: italic; line-height: 1.1; margin-top: 4px;">
                    ${activeForm === "Fearsome" ? `Gore 1d6+${level} | +${getStatsMap(state).dex + level} THP` : 
                      activeForm === "Beast of the Pack" ? `Thunderfang 1d4+${level} | +${getStatsMap(state).dex} SPD` : 
                      activeForm === "Beast of Nightmares" ? `Sting 1d4+${3*level} | SPD 2 | Unseen` : 'Standard Form'}
                </div>
            </div>
        `);

        return builder.build();
    }

    getAvailableSpells(level, subclass, state, derived) {
        const spells = super.getAvailableSpells(level, subclass, state, derived);
        const schools = ["Lightning", "Wind"];
        const study = (state.deepeningStudySchool || [])[0] || "None";
        if (study !== "None") schools.push(study);

        // Stormcaller Utility Logic
        schools.forEach(sch => {
            const selKey = `stormcallerSpells_${sch}`;
            const val = (state[selKey] || [])[0] || "None";
            if (val !== "None" && UTILITY_SPELLS[sch]?.[val]) {
                const desc = UTILITY_SPELLS[sch][val];
                let customHtml = `<select onchange="updateClassState('${selKey}', 0, this.value)" style="border-bottom-color: var(--class-accent);"><option value="None">Select ${sch} Utility...</option>${Object.keys(UTILITY_SPELLS[sch]).map(k => `<option value="${k}" ${k===val?'selected':''}>${k}</option>`).join('')}</select><div style="margin-top:8px;">${desc}</div>`;
                spells.push({ name: "", tier: "Utility", school: sch, customHtml });
            } else if (level >= 4) {
                let customHtml = `<select onchange="updateClassState('${selKey}', 0, this.value)" style="border-bottom-color: var(--class-accent);"><option value="None">Select ${sch} Utility...</option>${Object.keys(UTILITY_SPELLS[sch] || {}).map(k => `<option value="${k}">${k}</option>`).join('')}</select>`;
                spells.push({ name: "", tier: "Utility", school: sch, customHtml });
            }
        });

        return spells;
    }
}

const CLASS_CONFIG = new StormshifterClass();
