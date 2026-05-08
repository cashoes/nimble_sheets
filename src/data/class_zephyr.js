class ZephyrClass extends BaseClass {
    constructor() {
        super({
            name: "Zephyr",
            subtitle: "A disciplined martial artist with swift hands",
            keyStats: ['dex', 'str'],
            saves: { adv: 'dex', dis: 'int' },
            proficiencies: { armor: "None", weapons: "Melee" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#60a5fa",
                accentDim: "#2563eb",
                bodyBg: "#050810",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(96, 165, 251, 0.07) 0%, transparent 100%), linear-gradient(180deg, #0a0f1e 0%, #050810 100%)",
                panelBg: "rgba(15, 23, 42, 0.7)",
                border: "rgba(96, 165, 251, 0.3)"
            },
            initialStats: { baseStr: 2, baseDex: 2, baseInt: -1, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "WayOfPain", label: "Way of Pain", accent: "#ef4444" },
                { value: "WayOfFlame", label: "Way of Flame", accent: "#f97316" }
            ],
            resources: [
                createSimpleResource('burstSpeed', 'Bursts of Speed', (level, stats) => level >= 2 ? stats.dex : 0)
            ],
            featuresData: ZephyrClass.FEATURES,
            optionsData: ZephyrClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            martial: {
                "Airshift": { desc: "You cannot be Grappled while conscious. While moving, you may travel across all terrain as normal ground (ignoring all ill effects)." },
                "Blur": { desc: "(1/encounter) When you Defend, you may first move up to half your speed away, taking no damage if you are now out of range or have Full Cover." },
                "Bodily Discipline": { desc: "You may spend 1 action to end any non-Wound condition on yourself." },
                "Enduring Soul": { desc: "Each time you roll Initiative, gain Hit Dice equal to the actions you get on your first turn. These Hit Dice expire at the end of combat if unused." },
                "I Jump On His Back!": { desc: "While moving with your Windstep, if you move into the space of a creature your size or larger, you may jump onto its back. Gain advantage on melee attacks against it, and any damage you avoid is dealt to it instead." },
                "Kinetic Barrage": { desc: "Whenever you miss an attack, gain a cumulative +STR bonus to all damage you do for the rest of this encounter (a disciplined martial artist does not miss on purpose)." },
                "Mighty Soul": { desc: "You cannot be moved against your will. Whenever you would fail a saving throw, you may gain a Wound in order to add your STR to the result you rolled. You may repeat this any number of times." },
                "Quickstrike": { desc: "When you Interpose, you may first make an unarmed strike against the enemy for free." },
                "Use Momentum": { desc: "Whenever you avoid all of the damage of a melee attack (whether it misses or you Defend), you may swap places with the attacker and then choose another target that is now within the attack’s reach, and they are hit instead." },
                "Vital Rejuvenation": { desc: "When you receive healing for the first time on a turn, you may heal another target within 6 spaces HP equal to your STR." },
                "Windstrider": { desc: "If you move through the space of a willing creature while using Windstep, they can move with you and choose any space adjacent to your path of movement to end in." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or STR', 'INT or WIL', false);
        
        core[1] = [
            { id: "iron", name: "Iron Defense", desc: "Your armor equals DEX+STR as long as you are unarmored." },
            { id: "fists", name: "Swift Fists", desc: "Your unarmed strikes are not subject to disadvantage imposed by Rushed Attacks, and their damage is 1d4+STR." }
        ];
        core[2] = [
            { id: "feet", name: "Swift Feet", desc: "While unarmored, gain +2 speed and +LVL Initiative." },
            { id: "burst", name: "Burst of Speed", desc: "When you roll Initiative, gain DEX Bursts of Speed to use during that encounter. (1/turn) You may spend 1 Burst of Speed for free: <ul><li><strong>Slipstream:</strong> Defend, and the attack misses.</li><li><strong>Whirling Defense:</strong> Defend and apply your armor to every attack this round.</li><li><strong>Swiftstrike:</strong> Attack on your turn, and ignore disadvantage from Rushed Attacks.</li><li><strong>Windstep:</strong> Move on your turn, ignoring difficult terrain.</li></ul>" }
        ];
        core[3].push({ id: "kinetic", name: "Kinetic Momentum", desc: "Whenever you gain a Wound, gain a Burst of Speed." });
        core[3].push({ id: "projection", name: "Ethereal Projection", desc: "(1/day) Meditate 10 mins: Project an ethereal version of yourself up to 30 ft away for 10 mins." });
        
        core[4].push({ id: "resolve", name: "Unyielding Resolve", desc: "Ignore the first Wound you would suffer each encounter." });
        core[4].push({ id: "martial", name: "Martial Master", type: "dynamic_choice", collection: "martial", stateKey: "selectedMartial", desc: "Choose Martial Arts abilities.", getCount: (level) => level >= 18 ? 8 : level >= 16 ? 7 : level >= 14 ? 6 : level >= 12 ? 5 : level >= 10 ? 4 : level >= 8 ? 3 : level >= 6 ? 2 : 1 });
        
        core[5].push({ id: "reverb", name: "Reverberating Strikes", desc: "Add LVL bludgeoning damage to all of your melee attacks." });
        core[6].push({ id: "infuse", name: "Infuse Strength", desc: "Action: Attack ally to heal them (Hit Dice + STR)." });
        core[9].push({ id: "feet_2", name: "Swift Feet (2)", desc: "Gain an additional +2 speed as long as you are unarmored.", minor: true });
        core[10].push({ id: "resolve_2", name: "Unyielding Resolve (2)", desc: "Ignore the first 2 Wounds you would suffer each encounter.", minor: true });
        core[13].push({ id: "iron_2", name: "Iron Defense (2)", desc: "Your armor is doubled while unarmored.", minor: true });
        core[17].push({ id: "resolve_3", name: "Unyielding Resolve (3)", desc: "Ignore the first 3 Wounds. Advantage on STR saves while Dying.", minor: true });
        
        core[20].push({ id: "windborne", name: "Windborne", desc: "+1 Burst of Speed when you roll Initiative. Permanently gain 1 action (max 2 while dying)." });

        subclasses["WayOfPain"] = {
            3: [{ id: "bring_pain", name: "Bring the Pain", desc: "(1/round) Turn any melee attack against you into a crit. Whenever you are crit, reduce damage by half. Attacker takes same amount you took. Suffer 1 Wound to double the damage the enemy takes." }],
            7: [{ id: "share_pain", name: "Share My Pain", desc: "Your Swiftstrike can also target a 2nd creature within Reach 2." }],
            11: [{ id: "sharpens", name: "Pain Sharpens the Mind", desc: "While Bloodied, gain advantage on the first attack you make each turn, and on all saves." }],
            15: [{ id: "echoed", name: "Echoed Agony", desc: "Your Swiftstrike can also target a 3rd creature within Reach 4." }]
        };
        subclasses["WayOfFlame"] = {
            3: [{ id: "exploding", name: "Exploding Soul", desc: "(1/round) On your turn, you may suffer a Wound. Whenever you gain a Wound, deal STR+Wounds damage within 2 spaces and inflict Smoldering." }],
            7: [{ id: "blazing", name: "Blazing Speed", desc: "Gain +2 speed while using Windstep. After you cease movement, enemies you passed through take STR+DEX fire damage. You may have Smoldering enemies take double, ending the condition." }],
            11: [{ id: "chain", name: "Chain Reaction", desc: "(1/turn) When you crit, deal fire damage equal to your STR+Wounds to creatures within 2 spaces. Can repeat to adjacent targets." }],
            15: [{ id: "burning", name: "Burning Soul", desc: "Double any fire damage you deal." }]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        let speed = 6;
        if (level >= 2) speed += 2;
        if (level >= 9) speed += 2;
        return { speed, woundMax: 6 };
    }

    getStatOverrides(level, subclass, state, statsMap) {
        let overrides = {};
        let isUnarmored = true;
        state.inventory.forEach(item => { if(item.type==='armor' && item.equipped) isUnarmored = false; });

        if (isUnarmored) {
            overrides.armorBase = statsMap.dex + statsMap.str;
            if (level >= 13) overrides.armorBase *= 2;
            if (level >= 2) overrides.init = level;
        }

        return overrides;
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        const statsMap = getStatsMap(state);

        let acVal = statsMap.dex + statsMap.str;
        if (level >= 13) acVal *= 2;
        let isUnarmored = true;
        state.inventory.forEach(item => { if(item.type==='armor' && item.equipped) isUnarmored = false; });

        builder.addCustom(`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px dashed rgba(255,255,255,0.15); padding-right: 10px; justify-content: center;">
                <label style="font-size: 0.75em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; margin-bottom: 2px;">Iron Defense</label>
                ${isUnarmored ? `<div style="font-size: 3.0em; color: #fff; font-family: 'Cinzel', serif; font-weight: 900; line-height: 1;">${acVal}</div><div style="font-size: 0.8em; color: var(--gold-light); margin-top: 2px; font-family:'Cinzel'; font-weight:bold;">AC</div>` : `<div style="font-size: 1em; color: var(--text-muted); font-style: italic; text-align: center; margin: auto 0;">Inactive<br>(Armored)</div>`}
            </div>
        `);

        builder.addResource('burstSpeed', 'Bursts', state.resourceValues.burstSpeed, derived.resourceMaxes.burstSpeed);

        builder.addRollDisplay(`1d4+${statsMap.str}${level >= 5 ? '+'+level : ''}`, 'Swift Fists', `1d4+${statsMap.str}${level >= 5 ? '+'+level : ''}`, 'Ignores Rushed DIS', { type: 'attack', stat: 'str' });

        return builder.build();
    }
}

const CLASS_CONFIG = new ZephyrClass();
