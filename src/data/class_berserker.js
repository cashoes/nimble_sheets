class BerserkerClass extends BaseClass {
    constructor() {
        super({
            name: "Berserker",
            subtitle: "Avatar of rage, fury, and raw power",
            keyStats: ['str', 'dex'],
            saves: { adv: 'str', dis: 'int' },
            proficiencies: { armor: "None", weapons: "all STR weapons" },
            baseHp: 20,
            hpPerLevel: 8,
            hitDie: 12,
            theme: {
                accent: "#ef4444",
                accentDim: "#991b1b",
                bodyBg: "#0a0505",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.15) 0%, transparent 100%), linear-gradient(180deg, #1a0f1f 0%, #0a0505 100%)",
                panelBg: "rgba(45, 20, 20, 0.7)",
                border: "rgba(239, 68, 68, 0.3)"
            },
            initialStats: { baseStr: 3, baseDex: 1, baseInt: -1, baseWil: 0 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "RedMist", label: "Path of the Red Mist", accent: "#f87171" },
                { value: "Mountainheart", label: "Path of the Mountainheart", accent: "#9ca3af" }
            ],
            featuresData: BerserkerClass.FEATURES,
            optionsData: BerserkerClass.OPTIONS
        });
    }

    static get OPTIONS() {
        return {
            arsenal: {
                "Death Blow": { desc: "After you deal damage from a crit, you may expend any number of Fury Dice. Sum the dice and deal double that amount of damage." },
                "Deathless Rage": { desc: "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action." },
                "Eager for Battle": { desc: "Gain advantage on Initiative. Move 2×DEX spaces for free on your first turn each encounter." },
                "Into the Fray": { desc: "Action: Leap up to 2×DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, make an attack against 1 of them for free." },
                "Mighty Endurance": { desc: "You can now survive an additional 4 Wounds before death." },
                "MORE BLOOD!": { desc: "Whenever an enemy crits you, gain 1 Fury Die." },
                "Rampage": { desc: "(1/ turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again." },
                "Swift Fury": { desc: "Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain." },
                "Thunderous Steps": { desc: "After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop." },
                "Unstoppable Force": { desc: "While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3)." },
                "Whirlwind": { desc: "2 actions: Attack ALL targets within your melee weapon’s reach." },
                "You’re Next!": { desc: "Action: While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('STR or DEX', 'WIL or INT', false);
        
        core[1] = [
            { id: "rage", name: "Rage", desc: "(1/turn) Action: Roll a Fury Die (1d4) and set it aside. Add it to every STR attack you make. You can have a max of KEY Fury Dice; they are lost when your Rage ends." },
            { id: "got", name: "That all you got?!", desc: "When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR+DEX for each die spent." }
        ];
        core[2] = [
            { id: "intensifying", name: "Intensifying Fury", desc: "If you are Raging at the beginning of your turn, roll 1 Fury Die for free." },
            { id: "one_ancients", name: "One with the Ancients", desc: "(1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path." }
        ];
        core[3].push({ id: "bloodlust", name: "Bloodlust", desc: "Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free." });
        
        core[4].push({ id: "enduring_rage", name: "Enduring Rage", desc: "While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks." });
        core[4].push({ id: "arsenal_1", name: "Savage Arsenal", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, desc: "Choose 1 ability from the Savage Arsenal." });
        
        core[6].push({ id: "arsenal_2", name: "Savage Arsenal (2)", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, startIndex: 1, desc: "Choose a 2nd Savage Arsenal ability." });
        core[6].push({ id: "intensifying_2", name: "Intensifying Fury (2)", desc: "Your Fury Dice are now d6s.", minor: true });
        
        core[8].push({ id: "arsenal_3", name: "Savage Arsenal (3)", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, startIndex: 2, desc: "Choose a 3rd Savage Arsenal ability." });
        core[9].push({ id: "intensifying_3", name: "Intensifying Fury (3)", desc: "Your Fury Dice are now d8s.", minor: true });
        core[10].push({ id: "arsenal_4", name: "Savage Arsenal (4)", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, startIndex: 3, desc: "Choose a 4th Savage Arsenal ability." });
        core[12].push({ id: "arsenal_5", name: "Savage Arsenal (5)", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, startIndex: 4, desc: "Choose a 5th Savage Arsenal ability." });
        core[13].push({ id: "intensifying_4", name: "Intensifying Fury (4)", desc: "Your Fury Dice are now d10s.", minor: true });
        core[14].push({ id: "arsenal_6", name: "Savage Arsenal (6)", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, startIndex: 5, desc: "Choose a 6th Savage Arsenal ability." });
        core[16].push({ id: "arsenal_7", name: "Savage Arsenal (7)", type: "choice", collection: "arsenal", stateKey: "selectedArsenal", count: 1, startIndex: 6, desc: "Choose a 7th Savage Arsenal ability." });
        core[17].push({ id: "intensifying_5", name: "Intensifying Fury (5)", desc: "Your Fury Dice are now d12s.", minor: true });
        
        core[18] = [{ id: "deep_rage", name: "DEEP RAGE", desc: "Dropping to 0 HP does not cause your Rage to end." }];
        core[20].push({ id: "boundless_rage", name: "BOUNDLESS RAGE", desc: "+1 to any 2 of your stats. Anytime you roll less than 6 on a Fury Die, change it to 6 instead." });

        subclasses["Mountainheart"] = {
            3: [{ id: "stones_resilience", name: "Stone’s Resilience", desc: "Whenever you expend Fury Dice to reduce incoming damage, add the value of the die to the amount reduced." }, { id: "mountainous_tenacity", name: "Mountainous Tenacity", desc: "Whenever you expend your Hit Dice to recover HP, for every 10 HP you would recover, you may heal 1 Wound instead." }],
            7: [{ id: "unbreakable", name: "Unbreakable", desc: "(1/encounter) While Raging, if you would suffer your last Wound or other negative condition of your choice, you don’t." }],
            11: [{ id: "titans_fury", name: "Titan’s Fury", desc: "After you miss an attack or are crit by an enemy, Rage for free." }],
            15: [{ id: "mountains_endurance", name: "Mountain’s Endurance", desc: "While Dying, if an attack against you would be a crit, the attack is rerolled instead (when-crit abilities, such as Titan’s Fury, still trigger)." }]
        };
        subclasses["RedMist"] = {
            3: [{ id: "blood_frenzy", name: "Blood Frenzy", desc: "(1/turn) While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum." }, { id: "savage_awareness", name: "Savage Awareness", desc: "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the Blinded condition and can see through darkness and Invisibility within that Range." }],
            7: [{ id: "unstoppable_brutality", name: "Unstoppable Brutality", desc: "While Raging, you may gain 1 Wound to reroll any attack or save." }],
            11: [{ id: "opportunistic_frenzy", name: "Opportunistic Frenzy", desc: "While Raging, you can make opportunity attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon’s reach." }],
            15: [{ id: "onslaught", name: "Onslaught", desc: "While Raging, gain +2 speed. (1/round) you may move for free." }]
        };
        
        return { core, subclasses };
    }

    getDerivedStats(level, subclass, state) {
        const statsMap = getStatsMap(state);
        const furyMax = Math.max(statsMap.str, statsMap.dex);

        let faces = 4;
        if (level >= 17) faces = 12;
        else if (level >= 13) faces = 10;
        else if (level >= 9) faces = 8;
        else if (level >= 6) faces = 6;

        return { speed: 6, woundMax: 6, furyMax, furyText: `d${faces}`, furyFaces: faces };
    }

    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();
        let totalFury = 0;
        (state.furyDice || []).forEach(d => totalFury += d.total);

        builder.addDicePool(
            state.furyDice || [],
            'Fury Dice',
            `d${derived.furyFaces}`,
            'CLASS_CONFIG.actions.rollFury()',
            'CLASS_CONFIG.actions.clearFury()',
            'CLASS_CONFIG.actions.toggleFury'
        );
        
        builder.addCustom(`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 90px;">
                <span style="font-size: 2.2em; font-family: 'Cinzel', serif; font-weight: 900; color: ${totalFury > 0 ? 'var(--gold-light)' : 'var(--text-muted)'}; line-height: 1;">+${totalFury}</span>
                <span style="font-size: 0.6em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-top: 4px;">Total Damage</span>
                <div style="font-size: 0.55em; color: var(--text-muted); margin-top: 8px; font-style: italic; text-align: center; line-height: 1.1;">Gain on hit<br>or dmg taken.</div>
            </div>
        `);

        return builder.build();
    }

    actions = {
        maximizeDie: function(idx) {
            if (!state.furyDice || !state.furyDice[idx]) return;
            const derived = this.getDerivedStats(state.level, state.subclass, state);
            state.furyDice[idx].total = derived.furyFaces;
            saveState(); render();
        },
        toggleFury: function(idx) {
            if (!state.furyDice) state.furyDice = [];
            if (idx < state.furyDice.length) {
                state.furyDice.splice(idx, 1);
            } else {
                const derived = this.getDerivedStats(state.level, state.subclass, state);
                const roll = Math.floor(Math.random() * derived.furyFaces) + 1;
                state.furyDice.push({ total: roll });
            }
            saveState(); render();
        },
        rollFury: function() {
            const derived = this.getDerivedStats(state.level, state.subclass, state);
            if (!state.furyDice) state.furyDice = [];
            if (state.furyDice.length < derived.furyMax) {
                const roll = Math.floor(Math.random() * derived.furyFaces) + 1;
                state.furyDice.push({ total: roll });
                saveState(); render();
            }
        },
        clearFury: function() {
            state.furyDice = [];
            saveState(); render();
        }
    };
}

const CLASS_CONFIG = new BerserkerClass();
