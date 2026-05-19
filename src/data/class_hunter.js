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
            saves: { adv: 'dex', dis: 'int' },
            proficiencies: { armor: "Leather Armor", weapons: "DEX Weapons" },
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
            protectedPips: ["uOverHere"],
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
            scalingStats: {},
            grantedSpells: [
                { level: 1, spells: ["Hunter's Mark"] }
            ],
            resources: [
                createSimpleResource('tothCharges', 'TotH Momentum', (level, stats) => 10, { hideMechanic: true })
            ],
            rollTriggers: [
                {
                    id: "keen_eye",
                    condition: (label, options, state) => (state.level || 1) >= 10 && (/attack|⚔️/i.test(label) || options.type === 'attack') && options.stat === 'dex',
                    getMod: (state) => getStatsMap(state).wil
                }
            ],
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                if (level >= 2) {
                    builder.addResource('tothCharges', 'TotH Momentum', state.resourceValues.tothCharges, 10);
                }
                builder.addRollDisplay('1d20', 'Quarry Hit', `+${level}`, `Adv OR +${level} Damage`, { type: 'attack', context: 'Hunter\'s Mark' });
            },
            featuresData: HunterClass.FEATURES,
            optionsData: HunterClass.OPTIONS
        });
    }

    /**
     * Defines choice-based options for the Hunter class.
     */
    static get OPTIONS() {
        return {
            toth: {
                "Addling Arrow": { desc: "Action: Attack with a ranged weapon. The next attack the target makes must be against the closest other creature, chosen at random." },
                "Come Get Some!": { desc: "Action: Attack a target. It is Taunted by you until the end of their next turn." },
                "Decoy": { desc: "When you Defend: The attack misses instead, and you can move up to half your speed away (where you really were all along!)." },
                "Fleet Feet": { desc: "Move up to your speed for free, ignoring difficult terrain." },
                "Grease Trap": { desc: "([[uGreaseTrap]] 1/encounter) Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Target falls Prone, is vulnerable to the next fire damage it takes, and is treated as if it is Smoldering." },
                "Hail of Arrows": { desc: "(Half range) 2 actions: Shoot all creatures within a 3×3 area. Their speed is halved until the end of their next turn." },
                "Heavy Shot": { desc: "(Half range) Action: Attack with a ranged weapon and push your target: 4 spaces for a small creature, 2 for a medium creature, 1 for a large creature." },
                "Incendiary Shot": { desc: "(Half range) Action: Attack with a ranged weapon, add WIL d8 fire damage." },
                "Multishot": { desc: "(Half range) Action: Attack your quarry with a ranged weapon and load an extra projectile. Select a 2nd target within 2 spaces of them to take the same amount of damage." },
                "Pinning Shot": { desc: "Spend 3 actions shooting your quarry. They are Restrained until they can escape (DC 10+WIL)." },
                "Snare Trap": { desc: "([[uSnareTrap]] 1/encounter) Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Move them back 1 space, they are Restrained until they can escape (DC 10+WIL)." },
                "Sharpshooter": { desc: "Action: If you have not moved this turn and your quarry is 4 or more spaces away, attack them for double damage." },
                "Vital Shot": { desc: "(Half Range) Action: Attack your Hampered quarry with a ranged weapon, ignoring their armor or doubling your Hunter's Mark damage bonus if they have none." },
                "Wild Instinct": { desc: "1/round: (costs 0 TotH charges if you have none.) Assess for free, with advantage." }
            },
            companions: {
                "Small Companion": {
                    desc: (level) => {
                        const keenCount = level >= 11 ? 3 : (level >= 7 ? 2 : 1);
                        const protectCount = level >= 7 ? 2 : 1;
                        const throatCount = level >= 15 ? 3 : (level >= 11 ? 2 : 1);

                        const keen = FeatureGen.createScalingList(`Mark a target for free (1/encounter) ([[uSmallKeen:${keenCount}]]).`, [
                            { level: 7, text: "Keen Eyes (2): 2/encounter." },
                            { level: 11, text: "Keen Eyes (3): 3/encounter." }
                        ], level);
                        const protect = FeatureGen.createScalingList(`Whenever you Defend, companion distracts the attacker (attack misses) and you move up to half your speed away (1/encounter) ([[uSmallProtect:${protectCount}]]).`, [
                            { level: 7, text: "Protect Me! (2): 2/encounter." }
                        ], level);
                        const throat = FeatureGen.createScalingList(`Companion attacks your quarry for 1d4+LVL damage for free (ignoring armor) (1/encounter) ([[uSmallThroat:${throatCount}]]). Costs 1 TotH charge.`, [
                            { level: 11, text: "Go for the Throat! (2): 2/encounter, 1/round." },
                            { level: 15, text: "Go for the Throat! (3): 3/encounter, 1/round." }
                        ], level);

                        return `(Cat, Bat, Hawk, etc.)<div class='scaling-sub-list'>
                            <p><strong>Keen Eyes:</strong> ${keen}</p>
                            <p><strong>Protect Me!:</strong> ${protect}</p>
                            <p><strong>Go for the Throat!:</strong> ${throat}</p>
                        </div>`;
                    }
                },
                "Medium Companion": {
                    desc: (level) => {
                        const throatCount = level >= 11 ? 2 : 1;

                        const ferocious = FeatureGen.createScalingList("Whenever you or your companion crit your quarry, companion attacks again for LVL damage (ignoring armor), and you can move up to 2 spaces for free.", [
                            { level: 7, text: "Ferocious (2): Move up to 4 spaces for free." },
                            { level: 15, text: "Ferocious (3): Move up to 6 spaces for free." }
                        ], level);
                        const throat = FeatureGen.createScalingList(`Companion attacks your quarry for 1d8+(3xLVL) damage (ignoring armor) (1/encounter) ([[uMedThroat:${throatCount}]]). Costs 1 TotH charge.`, [
                            { level: 11, text: "Go for the Throat! (2): 2/encounter." }
                        ], level);

                        return `(Wolf, Panther, Vulture, etc.)<div class='scaling-sub-list'>
                            <p><strong>Ferocious:</strong> ${ferocious}</p>
                            <p><strong>Protect Me!:</strong> When you Defend, your companion may first attack that creature for 1d4+LVL damage.</p>
                            <p><strong>Go for the Throat!:</strong> ${throat}</p>
                        </div>`;
                    }
                },
                "Large Companion": {
                    desc: (level) => {
                        const protectCount = level >= 15 ? 2 : 1;
                        const throatCount = level >= 11 ? 2 : 1;

                        const protect = FeatureGen.createScalingList(`After you gain a Wound, your companion can whisk you away to safety up to 12 spaces (1/encounter) ([[uLargeProtect:${protectCount}]]).`, [
                            { level: 7, text: "Protect Me! (Improved): You are whisked away before gaining the Wound." },
                            { level: 15, text: "Protect Me! (2): 2/encounter." }
                        ], level);
                        const throat = FeatureGen.createScalingList(`Companion attacks your quarry for 1d12+(4xLVL) damage (ignoring armor) (1/encounter) ([[uLargeThroat:${throatCount}]]). If that creature dies, you may deal half as much to another creature within Reach 4. Costs 2 TotH charges.`, [
                            { level: 11, text: "Go for the Throat! (2): 2/encounter." }
                        ], level);

                        return `(Lion, Owlbear, Drake, etc.)<div class='scaling-sub-list'>
                            <p><strong>Alpha Protector:</strong> Damage from the first attack against you each round is halved.</p>
                            <p><strong>Protect Me!:</strong> ${protect}</p>
                            <p><strong>Go for the Throat!:</strong> ${throat}</p>
                        </div>`;
                    }
                }
            }
        };
    }

    /**
     * Defines the core and subclass features for the Hunter class.
     */
    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('DEX or WIL', 'STR or INT', false, null, [2, 2, 4, 6, 8, 10, 13, 17, 19, 21]);

        core[1] = [
            { id: "quarry", name: "Hunter’s Mark", desc: "Action: A creature you can see is marked as your quarry for 1 day (or until you mark another creature). It can’t be hidden from you, and your attacks against it gain your choice of advantage OR +LVL damage (choose before each attack)." },
            { id: "forager", name: "Forager", desc: "Gain advantage on skill checks to find food and water in the wild." }
        ];

        core[2] = [
            {
                id: "toth_choices",
                name: "Thrill of the Hunt",
                type: "dynamic_choice",
                collection: "toth",
                stateKey: "selectedToth",
                milestones: [2, 4, 6, 8, 12, 14],
                desc: (level, subclass, state, derived) => {
                    const baseDesc = `Choose Thrill of the Hunt (TotH) abilities. Unless otherwise noted, each costs 1 charge to use and cannot miss. Gain a charge during an encounter whenever:<ul><li>Your quarry dies.</li><li>You hit your quarry in melee or crit your quarry at range.</li></ul>`;
                    if (subclass === "Beastmaster") {
                        return `${baseDesc}<div class='empowered-subcard' style='margin-top:10px; border-color:var(--subclass-accent);'><strong>Beastmaster:</strong> Your first 2 TotH abilities are replaced by your companion's <em>Go for the Throat!</em> and <em>Protect Me!</em> abilities.</div>`;
                    }
                    return baseDesc;
                },
                getCount: (level, subclass, state) => {
                    let count = FeatureGen.createStandardCount([2, 2, 4, 6, 8, 12, 14])(level, subclass, state);
                    if (subclass === "Beastmaster") count = Math.max(0, count - 2);
                    return count;
                }
            },
            { id: "roll_strike", name: "Roll & Strike", desc: "Action: If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free." }
        ];

        core[3] = [
            { id: "intuition", name: "Tracker’s Intuition", desc: "You can discern the events of a past encounter by studying tracks and other subtle environmental clues, accurately determining the kind and amount of creatures, their direction, key actions, and passage of time." }
        ];

        core[4].push({ id: "explorer", name: "Explorer of the Wilds", desc: "+2 speed; gain a climbing speed." });

        core[5] = [
            { id: "resolve", name: "Hunter's Resolve", desc: "Whenever you have no Thrill of the Hunt charges, gain Hunter's Resolve until the end of your turn: treat all creatures as your quarry for the purposes of movement and melee attacks." },
            { id: "final_takedown", name: "Final Takedown", desc: "Action: Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter’s Mark. If they survive, they crit you back." }
        ];

        core[6].push({ id: "versatile_bow", name: "Versatile Bowmaster", desc: "Whenever you attack with a Longbow, you may roll 2d4 instead of 1d8; or with a Crossbow, 2d8 instead of 4d4." });

        core[9] = [{ id: "no_escape", name: "No Escape", desc: "Whenever you see one or more allies make an opportunity attack, you may also make a ranged opportunity attack against the same target." }];

        core[10] = [
            { id: "veteran_stalker", name: "Veteran Stalker", desc: "Gain a Thrill of the Hunt charge whenever you are first Bloodied in an encounter and for every Wound you gain." },
            { id: "keen_eye", name: "Keen Eye, Steady Hand", desc: "Add WIL to your ranged weapon damage." }
        ];

        core[13] = [{ id: "keen_sight", name: "Keen Sight", desc: "Advantage on Perception checks." }];

        core[17] = [{ id: "peerless_hunter", name: "Peerless Hunter", desc: "You can Defend against your quarry for free." }];

        core[18] = [{ id: "wild_endurance", name: "Wild Endurance", desc: "Gain 1 Thrill of the Hunt charge at the start of your turns." }];

        core[20].push({ id: "nemesis", name: "Nemesis", desc: "+1 to any 2 of your stats. Your Hunter’s Mark can target any number of creatures simultaneously." });

        subclasses["Shadowpath"] = {
            3: [
                { id: "ambusher", name: "Ambusher", desc: "When you roll Initiative, you may use Hunter’s Mark for free. ([[uAmbusher]] 1/encounter) Gain advantage on the first attack you make each encounter." },
                { id: "skilled_tracker", name: "Skilled Tracker", desc: "You have advantage on skill checks to track creatures." },
                { id: "skilled_navigator", name: "Skilled Navigator", desc: "You cannot become lost by nonmagical means." }
            ],
            7: [{ id: "primal_predator", name: "Primal Predator", desc: (level) => {
                const count = level >= 15 ? 2 : 1;
                return `([[uPrimal:${count}]]) Your weapon attacks ignore cover and armor this turn (1/encounter).`;
            }}],
            11: [{ id: "pack_hunter", name: "Pack Hunter", desc: "Whenever you mark a creature, you may also mark another creature within 6 spaces of them for free." }],
            15: [{ id: "apex_predator_shadow", name: "Apex Predator", desc: "You may use your Primal Predator ability twice each encounter. Gain 1 Thrill of the Hunt charge when you roll Initiative." }]
        };

        subclasses["WildHeart"] = {
            3: [
                { id: "impressive", name: "Impressive Form", desc: "+5 max HP. Upgrade your Hit Dice to d10s." },
                { id: "high_ground", name: "I Have the High Ground", desc: "When you roll Initiative or gain one or more Thrill of the Hunt charges, move up to half your speed for free, ignoring difficult terrain." }
            ],
            7: [
                { id: "herbalist", name: "Resourceful Herbalist", desc: "Whenever you Safe Rest in a location near where plants or fungi can grow, you may spend a day collecting healing herbs to craft a number of Healing Salves equal to your WIL." },
                { id: "healing_salve", name: "Healing Salve", desc: "Action: Heal yourself or an adjacent creature WIL d6 HP. Only you or another experienced Herbalist may administer these, and they expire whenever you Safe Rest." }
            ],
            11: [{ id: "im_over_here", name: "Ha! I’m Over Here!", desc: "([[uOverHere]] 1/Safe Rest) If an attack would cause you to drop to 0 HP, you instead move up to your speed away and take no damage." }],
            15: [{ id: "unparalleled_survivalist", name: "Unparalleled Survivalist", desc: "Gain +WIL armor. When you attack with a ranged weapon, you may first move half your speed for free." }]
        };

        subclasses["Beastmaster"] = {
            3: [
                {
                    id: "beastmaster_hub",
                    name: "Beastmaster",
                    type: "choice",
                    collection: "companions",
                    stateKey: "selectedCompanion",
                    count: 1,
                    desc: (level) => `Choose a Small, Medium, or Large animal as your companion. Instead of your first 2 Thrill of the Hunt (TotH) abilities, you use <strong>Go for the Throat!</strong> and <strong>Protect Me!</strong> with your companion.<div style='margin-top:10px; border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-size: 0.85em; color: var(--text-muted);'><em>No Stats or Actions to Track! Your companion’s HP and movement are abstracted; it knows where it is most needed without being told.</em></div>`
                }
            ]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new HunterClass();
