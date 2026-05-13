/**
 * Shepherd Class
 * Master of life and death, leader of spirits.
 * @extends BaseClass
 */
class ShepherdClass extends BaseClass {
    /**
     * Initializes the Shepherd class with its core configuration.
     */
    constructor() {
        super({
            name: "Shepherd",
            subtitle: "Master of life and death, leader of spirits",
            keyStats: ['wil', 'str'],
            saves: { adv: 'wil', dis: 'dex' },
            proficiencies: { armor: "Mail Armor, Shields", weapons: "STR Weapons, Wands" },
            baseHp: 17,
            hpPerLevel: 7,
            hitDie: 10,
            theme: {
                accent: "#d946ef",
                accentDim: "#a21caf",
                bodyBg: "#080508",
                containerBg: "radial-gradient(circle at 50% 0%, rgba(217, 70, 239, 0.05) 0%, transparent 100%), linear-gradient(180deg, #1a0a1a 0%, #080508 100%)",
                panelBg: "rgba(35, 15, 35, 0.8)",
                border: "rgba(217, 70, 239, 0.25)"
            },
            initialStats: { baseStr: 1, baseDex: -1, baseInt: 0, baseWil: 3 },
            subclasses: [
                { value: "None", label: "None (Lvl 3)" },
                { value: "Mercy", label: "Luminary of Mercy", accent: "#f0f9ff" },
                { value: "Malice", label: "Luminary of Malice", accent: "#312e81" }
            ],
            scalingStats: {
                spiritDie: (level, subclass, state) => {
                    const maxT = level >= 8 ? 4 : (level >= 6 ? 3 : (level >= 4 ? 2 : (level >= 2 ? 1 : 0)));
                    const manaSpent = state.resourceValues?.spirit_tier || Math.max(1, maxT);
                    const sizes = ["d6", "d8", "d10", "d12", "d20"];
                    let idx = Math.max(1, manaSpent) - 1;
                    if ((state.selectedGraces || []).includes("Empowered Companion")) idx++;
                    return sizes[Math.min(sizes.length - 1, idx)] || "d6";
                },
                spiritDiceCount: (level) => level >= 20 ? 2 : 1,
                manaMax: (level, subclass, state) => {
                    const statsMap = getStatsMap(state);
                    return level >= 2 ? (statsMap.wil * 3) + level : 0;
                }
            },
            mechanicPanelExtension: (builder, level, state, derived, statsMap) => {
                if (level >= 2) {
                    const sDie = derived.spiritDie || "d6";
                    const sCount = derived.spiritDiceCount || 1;
                    let bonus = statsMap.wil;
                    if (state.subclass === 'Malice' && level >= 11) bonus += statsMap.str;

                    const maxT = level >= 8 ? 4 : (level >= 6 ? 3 : (level >= 4 ? 2 : (level >= 2 ? 1 : 0)));
                    const tierVal = state.resourceValues?.spirit_tier || Math.max(1, maxT);

                    const notation = `${sCount}${sDie}+${bonus}`;
                    const label = `Spirit (Tier ${tierVal})`;
                    const spiritHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <label class="roll-link" onclick="dispatchRoll('${notation}', 'Lifebinding Spirit')" 
                                  style="font-size: 0.8em; color: var(--gold-light); text-transform: uppercase; font-family: 'Cinzel', serif; font-weight: bold; cursor: pointer;">
                                ${label}
                            </label>
                            <div class="roll-link" onclick="dispatchRoll('${notation}', 'Lifebinding Spirit')" 
                                 style="font-size: 2.2em; color: #fff; font-weight: bold; font-family: 'Cinzel', serif; line-height: 1; cursor: pointer;">
                                ${sCount}${sDie}+${bonus}
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                                <div class="dark-incrementer">
                                    <button onclick="adjRes('spirit_tier', Math.max(1, ${tierVal} - 1), ${maxT}, true)">-</button>
                                    <input type="number" id="res_spirit_tier" value="${tierVal}" onchange="adjRes('spirit_tier', Math.max(1, Math.min(${maxT}, parseInt(this.value))), ${maxT}, true)">
                                    <button onclick="adjRes('spirit_tier', Math.min(${maxT}, ${tierVal} + 1), ${maxT}, true)">+</button>
                                </div>
                                <div style="font-family: 'Cinzel'; font-weight: bold; color: var(--text-muted); font-size: 0.9em;">TIER CAST</div>
                            </div>                        </div>
                    `;
                    builder.addHtml(spiritHtml, { flex: 1.2 });
                }
            },
            grantedSpells: [
                { level: 1, spells: ["Radiant Cantrips", "Necrotic Cantrips"] },
                { level: 2, spells: ["Lifebinding Spirit"] }
            ],
            spellSchools: ["Radiant", "Necrotic"],
            spellProgression: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18],
            includeUtilitySpells: createUtilityConfig((level) => level >= 11, ["selectedTwilight"]),
            resources: [
                createManaResource('wil'),
                createSimpleResource('spirit_tier', 'Spirit Tier', (l) => l >= 8 ? 4 : (l >= 6 ? 3 : (l >= 4 ? 2 : (l >= 2 ? 1 : 0))), { visible: false }),
                createSimpleResource('searing', 'Searing Light', (l, stats) => stats.wil, { visible: false, reset: 'Safe Rest' }),
                createSimpleResource('powerful_healer', 'Powerful Healer', (l, stats) => stats.wil, { visible: false, reset: 'Safe Rest' })
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
                "Illuminate Soul": {
                    desc: (level, subclass, state) => {
                        const statsMap = getStatsMap(state);
                        const wilVal = statsMap.wil;
                        let pips = "";
                        for (let i = 0; i < wilVal; i++) {
                            pips += `[[uIlluminate:${i}]] `;
                        }
                        return `Action: A creature within 6 spaces begins to glow with radiant light. For 1 Round, attacks against them are made with your choice of advantage or disadvantage. You may do this (${pips.trim()}) ${wilVal} times per Safe Rest.`;
                    }
                },
                "Light Bearer": { desc: "Regain 1 use of Searing Light when you roll Initiative (this expires if unspent at the end of combat)." },
                "Not Beyond MY Reach": { desc: "You may target creatures who have been dead less than 1 round for healing. For every 10 HP a dead creature is healed this way, you may have them recover 1 Wound instead (you must heal at least 1 Wound to revive them)." },
                "Vengeful Spirit": { desc: "Action: Your Lifebinding Spirit sacrifices itself to transform into a swirling vortex of radiant light. At the end of your turn, it damages all enemies within 3 spaces of you, ignoring armor and cover. This lasts for a number of rounds equal to the healing charges left on the Lifebinding Spirit. This effect ends early if you summon your spirit again." }
            }
        };
    }

    static get FEATURES() {
        const { core, subclasses } = FeatureGen.generateStandardFeatures('WIL', 'STR', true, [1, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        core[1] = [
            { id: "keeper", name: "Keeper of Life & Death", desc: "You know Radiant and Necrotic cantrips." },
            { id: "searing", name: "Searing Light", resourceId: "searing", desc: "Action: Heal or Inflict grievous injuries: <ul><li>Heal WIL d8 HP to a Dying creature within Reach 6.</li><li>Inflict WIL d8 radiant damage to an undead or Bloodied enemy within Reach 6.</li></ul>" }
        ];

        core[2] = [
            { id: "mana", name: "Mana and Unlock Tier 1 Spells", desc: "You unlock tier 1 Radiant and Necrotic spells and gain a mana pool. This mana pool’s maximum is always equal to (WIL×3)+LVL and recharges on a Safe Rest." },
            { id: "spirit", name: "Lifebinding Spirit", desc: "Action: Summon a spirit companion that follows you and is immune to harm. It lasts until you cast this spell again, take a Safe Rest, or it heals a number of times equal to the mana spent summoning it. Action: It attacks or heals a creature within Reach 4. It attacks for 1d6+WIL radiant damage (ignoring armor), or heals for the same amount. Upcasting: Increment its die size by 1 (max d12), +1 healing use." }
        ];

        core[3] = [
            { id: "subclass", name: "Subclass", desc: "Choose a Shepherd subclass." },
            FeatureGen.createSpellChoiceFeature({
                id: "twilight",
                name: "Master of Twilight",
                level: 3,
                stateKey: "selectedTwilight",
                milestones: [3, 11],
                getCount: (l) => l >= 11 ? 0 : 2,
                getSlots: (level, subclass, state) => {
                    if (level >= 11) return [];
                    return [
                        { type: 'utility', schools: ["Necrotic"], label: 'Necrotic Utility' },
                        { type: 'utility', schools: ["Radiant"], label: 'Radiant Utility' }
                    ];
                },
                desc: (l) => l >= 11 ? "You know all Necrotic and Radiant Utility Spells." : "Choose 1 Necrotic and 1 Radiant Utility Spell."
            })
        ];

        core[5].push({ id: "graces", name: "Sacred Grace", type: "dynamic_choice", collection: "graces", stateKey: "selectedGraces", milestones: [5, 9, 13], desc: "Choose a Sacred Grace.", getCount: FeatureGen.createStandardCount([5, 9, 13]) });

        core[17] = [{ id: "revitalizing", name: "Revitalizing Blessing", desc: "(1/round) Whenever you roll a 6 or higher on one or more healing die, the target may recover one Wound." }];

        core[20].push({ id: "sage", name: "Twilight Sage", desc: "+1 to any 2 of your stats. Your Lifebinding Spirit rolls twice as many dice." });

        subclasses["Mercy"] = {
            3: [{ id: "mercy_heal", name: "Merciful Healing", desc: "When an effect caused by you heals a Dying creature, they are healed for twice as much. (1/round) Your Lifebinding Spirit can act for free while you are Dying." },
            { id: "beautiful", name: "Life is Beautiful", desc: "Harmless and lovely creatures such as butterflies and humming birds are attracted to your presence and often follow you. Flowers bloom more vibrantly in your presence." }],
            7: [{ id: "conduit_light", name: "Conduit of Light", desc: "When an effect caused by you would heal HP, you may expend 1 use of Searing Light to heal (or damage, ignoring armor) another target within 6 spaces of yourself for the same amount." }],
            11: [{ id: "powerful_healer", name: "Powerful Healer", resourceId: "powerful_healer", desc: "(WIL times/Safe Rest) Whenever you would roll dice to heal damage, you may instead heal the max amount you could roll, or give that many temp HP." }],
            15: [{ id: "empowered_conduit", name: "Empowered Conduit", desc: "Your Conduit of Light may target 1 additional creature. Regain 1 charge of Searing Light when you roll Initiative (this expires if unspent at the end of combat)." }]
        };

        subclasses["Malice"] = {
            3: [{ id: "soul_reaper", name: "Soul Reaper", desc: "When you use Searing Light to harm an enemy, make a 2nd enemy within range take the same amount of damage (ignoring armor)." },
            { id: "decay", name: "Harbinger of Decay", desc: "Vibrant colors and lovely smells are suppressed near you. Foods spoil more rapidly in your presence, and you frequently awaken to flies wherever you lodge. You may have your Lifebinding Spirit shift into a deathly version of itself (a zombie dog, a devious imp, etc.) and have its damage type become necrotic." }],
            7: [{ id: "veilwalker", name: "Veilwalker’s Blessing", resourceId: "veilwalker", desc: "([[uVeilwalker]] 1/Safe Rest) Reaction (when you would drop to 0 HP): Drop to 1 HP instead and force an enemy within 6 spaces to make a STR save. On a failure, they become Bloodied, or if they are already Bloodied, they drop to 0 HP." }],
            11: [{ id: "death_touch", name: "Deathbringer’s Touch", desc: "Your first melee attack each round against a Bloodied creature is an automatic critical hit. Your Lifebinding Spirit deals additional damage equal to your STR." }],
            15: [{ id: "conduit_death", name: "Conduit of Death", desc: "Your Veilwalker’s Blessing ability recharges when you roll Initiative. This charge is lost if unspent at the end of combat." }]
        };

        return { core, subclasses };
    }
}

const CLASS_CONFIG = new ShepherdClass();
