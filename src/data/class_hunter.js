/**
 * Hunter Class
 * Resourceful survivalist, bowmaster, and skilled tracker.
 * @extends BaseClass
 */
class HunterClass extends BaseClass {
    /**
     * Initializes the Hunter class with its core configuration.
     */
    constructor() {
        super({
            name: "Hunter",
            subtitle: "Resourceful survivalist, bowmaster, and skilled tracker",
            keyStats: ['dex', 'wil'],
            saves: { adv: 'dex', dis: 'str' },
            proficiencies: { armor: "Mail", weapons: "All Simple & Martial Weapons" },
            baseHp: 13,
            hpPerLevel: 6,
            hitDie: 8,
            theme: {
                accent: "#16a34a",
                accentDim: "#15803d",
                bodyBg: "#050805",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(22, 163, 74, 0.05) 0%, transparent 100%), linear-gradient(180deg, #0a120a 0%, #050805 100%)",
                panelBg: "rgba(15, 25, 15, 0.8)",
                border: "rgba(22, 163, 74, 0.2)"
            },
            initialStats: { baseStr: 0, baseDex: 2, baseInt: -1, baseWil: 2 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Shadowpath", label: "Keeper of the Shadowpath", accent: "#1e1b4b" },
                { 
                    value: "WildHeart", 
                    label: "Keeper of the Wild Heart", 
                    accent: "#ea580c",
                    config: {
                        statModifiers: [
                            { id: "wildheart_hd", stat: "hdFace", value: 2, level: 3 },
                            { id: "wildheart_hp", stat: "baseHp", value: 5, level: 3 },
                            { id: "wildheart_armor", stat: "armor", level: 15, getMod: (stats) => stats.wil }
                        ]
                    }
                },
                { value: "Beastmaster", label: "Beastmaster", accent: "#d9f99d" }
            ],
            scalingStats: {
                saDice: { 1: "None", 3: "1d8", 7: "2d8", 9: "2d10", 11: "2d12", 15: "2d20", 17: "3d20" }
            },
            grantedSpells: [
                { level: 1, spells: ["Hunter's Mark"] }
            ],
            resources: [
                createSimpleResource('tothCharges', 'Thrill of the Hunt', (level, stats, state) => stats.wil)
            ],
            featuresData: HunterClass.FEATURES,
            optionsData: HunterClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Hunter class (Martial Talents).
     * @returns {Object} Dictionary of class options.
     */
    static get OPTIONS() {
        return {
            martialTalents: {
                "Volley": { desc: "2 actions: Make a ranged attack against all enemies in a 4-space contiguous area within your weapon's range." },
                "Quick Trap": { desc: "Action: Deploy a hidden trap in an adjacent space. The first creature to enter that space takes 1d10 damage and is Restrained (STR save DC 10+DEX to escape)." },
                "Vanish": { desc: "Bonus Action: Move up to half your speed and Hide. You can do this even if you are being observed." },
                "Giant Slayer": { desc: "Whenever a Large or larger creature misses you with a melee attack, you can make a weapon attack against it for free." },
                "Eagle Eye": { desc: "Your ranged attacks ignore half and three-quarters cover. Additionally, you do not have disadvantage when attacking at long range." }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Hunter class.
     * @returns {Object} Core and subclass feature data.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or WIL', 'STR or INT', false);

        core[1] = [
            { id: "quarry", name: "Hunter’s Mark", desc: "Action/Free action (when you hit): Mark a target as your Quarry. You deal extra damage equal to your Level on every hit against it. Only 1 mark active at a time." },
            { id: "scout", name: "Natural Explorer", desc: "You have advantage on Examination and Lore checks related to the natural world. Your party cannot be surprised while you are conscious in a natural environment." }
        ];
        core[2].push({ id: "toth", name: "Thrill of the Hunt", desc: (level, subclass, state, derived) => `(<strong>${derived.resourceMaxes.tothCharges}</strong> charges/encounter) When you or an ally drops your Quarry to 0 HP, gain 1 charge. You also gain a charge on a melee hit or ranged crit. Expend a charge to move half speed or make a free Examination check.` });

        core[3].push({ id: "subclass_feat", name: "Ranger’s Path", desc: "Your specialized training grants you unique survival and combat techniques." });
        core[4].push({ id: "talent", name: "Martial Talent", type: "dynamic_choice", collection: "martialTalents", stateKey: "selectedMartial", milestones: [4, 10, 16], desc: "Choose a Martial Talent as you level up.", getCount: createStandardCount([4, 10, 16]) });

        core[18] = [{ id: "apex", name: "Apex Predator", desc: "Your Hunter’s Mark no longer requires an action to apply. Whenever your Quarry misses you with an attack, you may make a weapon attack against it for free." }];
        core[20].push({ id: "master_tracker", name: "Master of the Hunt", desc: "+1 to any 2 stats. You can maintain 2 Hunter’s Marks simultaneously. If both marks are on the same target, double the extra damage." });

        subclasses["Shadowpath"] = {
            3: [{ id: "gloom", name: "Gloom Walker", desc: "You have advantage on Hide checks while in dim light or darkness. Your first attack after being hidden deals an extra 1d8 necrotic damage." }],
            7: [{ id: "shadow_step", name: "Shadow Step", desc: "Bonus Action: Teleport up to 6 spaces from one area of dim light/darkness to another." }],
            11: [{ id: "wraith", name: "Wraith’s Strike", desc: "Once per turn, you can make one ranged attack that ignores all armor (DEX d20 vs 10)." }],
            15: [{ id: "void", name: "Void Mark", desc: "When your Quarry dies, it explodes in a burst of shadow. Each enemy within 2 spaces takes 2d10 necrotic damage." }]
        };
        subclasses["WildHeart"] = {
            3: [{ id: "primal", name: "Wild Resilience", desc: "Your Hit Die becomes a d10 and you gain +5 max HP. You have advantage on saves against poisons and diseases." }],
            7: [{ id: "beast_sense", name: "Feral Senses", desc: "You have blindsight out to 6 spaces. You can see invisible creatures within this range." }],
            11: [{ id: "rage", name: "Heart of the Wild", desc: "Whenever you are below half HP, you deal an extra 1d8 damage with all weapon attacks." }],
            15: [{ id: "unparalleled", name: "Unparalleled Survivalist", desc: "While you are not wearing Heavy Armor, add your WIL to your Armor Class." }]
        };
        subclasses["Beastmaster"] = {
            3: [{ id: "bond", name: "Primal Companion", desc: "You have a loyal beast companion. It acts on your turn. It has HP equal to 4x your Level and deals 1d6+DEX damage." }],
            7: [{ id: "command", name: "Exceptional Training", desc: "Bonus Action: Command your beast to Dash, Disengage, or Help. Its attacks now count as magical." }],
            11: [{ id: "fury", name: "Bestial Fury", desc: "When you use your action to attack, your beast can make two attacks (or one attack as a reaction)." }],
            15: [{ id: "shared_spell", name: "Shared Senses", desc: "You can perceive through your beast’s senses. While within 12 spaces, any spell you cast on yourself also affects your beast." }]
        };

        return { core, subclasses };
    }

    /**
     * Renders the Hunter's Mark and Thrill of the Hunt charges for the Hunter's mechanic panel.
     * @param {number} level - Current character level.
     * @param {string} subclass - Selected subclass.
     * @param {Object} state - Current character state.
     * @param {Object} derived - Derived statistics.
     * @returns {string} HTML string.
     */
    getMechanicPanelHTML(level, subclass, state, derived) {
        const builder = new PanelBuilder();

        builder.addRollDisplay(derived.saDice, 'Hunter Mark', derived.saDice, '+LVL Dmg on hit', { type: 'attack', school: 'Radiant' });
        builder.addResource('tothCharges', 'Thrill of the Hunt', state.resourceValues.tothCharges, derived.resourceMaxes.tothCharges);

        builder.addStatDisplay('', 'Gain Charge', '● Quarry Dies<br>● Melee Hit<br>● Ranged Crit', { borderLeft: true });

        return builder.build();
    }
}

const CLASS_CONFIG = new HunterClass();
