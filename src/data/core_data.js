const ITEM_TEMPLATES = {
    melee: {
        "Light & Precise": ["dagger", "sickle", "shortsword", "rapier"],
        "One-Handed": ["clubmace", "handaxe"],
        "Heavy & Two-Handed": ["staff", "longsword", "battleaxe", "polehammer", "glaive", "spear", "greatmaul", "greataxe", "greatsword"]
    },
    ranged: {
        "Bows & Ballistae": ["shortbow", "longbow", "crossbow", "handheldballista"],
        "Thrown & Slings": ["sling", "javelins", "throwinghammers"]
    },
    armor: {
        "Light Armor": ["adventurersgarb", "minorenchant", "majorenchant", "epicenchant", "cheaphides", "oxhide", "hardleather", "wyrmhide"],
        "Medium Armor": ["rustymail", "chainshirt", "scalemail", "dragonscale"],
        "Heavy Armor": ["rustyplate", "halfplate", "fullplate", "mithrilplate"],
        "Shields": ["woodenbuckler", "ironshield", "towershield", "dragonshield"]
    },
    data: {
        "dagger": { name: "Dagger", type: "weapon", dmgDice: "1d4", stat: "dex", props: "Light, Thrown 4", slots: 1, equipped: true, cost: 3 },
        "sickle": { name: "Sickle", type: "weapon", dmgDice: "1d4", stat: "dex", props: "Vicious", slots: 1, equipped: true, cost: 10 },
        "clubmace": { name: "Club/Mace", type: "weapon", dmgDice: "1d6", stat: "str", props: "", slots: 1, equipped: true, cost: 2 },
        "handaxe": { name: "Hand Axe", type: "weapon", dmgDice: "1d6", stat: "str", props: "Thrown 4", slots: 1, equipped: true, cost: 8 },
        "shortsword": { name: "Short Sword", type: "weapon", dmgDice: "1d6", stat: "dex", props: "Light", slots: 1, equipped: true, cost: 10 },
        "rapier": { name: "Rapier", type: "weapon", dmgDice: "2d4", stat: "dex", props: "", slots: 1, equipped: true, cost: 60 },
        "staff": { name: "Staff", type: "weapon", dmgDice: "1d8", stat: "str", props: "2-handed", slots: 2, equipped: true, cost: 8 },
        "longsword": { name: "Longsword", type: "weapon", dmgDice: "1d8", stat: "str", props: "2-handed (1-handed: Req. 2 STR)", slots: 2, equipped: true, cost: 60 },
        "battleaxe": { name: "Battleaxe", type: "weapon", dmgDice: "1d10", stat: "str", props: "2-handed", slots: 2, equipped: true, cost: 30 },
        "polehammer": { name: "Pole Hammer", type: "weapon", dmgDice: "1d10", stat: "str", props: "2-handed, Reach 2", slots: 2, equipped: true, cost: 60 },
        "glaive": { name: "Glaive", type: "weapon", dmgDice: "1d10", stat: "str", props: "2-handed, Reach 2", slots: 2, equipped: true, cost: 60 },
        "spear": { name: "Spear", type: "weapon", dmgDice: "1d10", stat: "str", props: "2-handed", slots: 2, equipped: true, cost: 20 },
        "greatmaul": { name: "Greatmaul", type: "weapon", dmgDice: "1d12", stat: "str", props: "2-handed (Req. 2 STR)", slots: 2, equipped: true, cost: 80 },
        "greataxe": { name: "Greataxe", type: "weapon", dmgDice: "2d6", stat: "str", props: "2-handed", slots: 2, equipped: true, cost: 100 },
        "greatsword": { name: "Greatsword", type: "weapon", dmgDice: "3d4", stat: "str", props: "2-handed (Req. 2 STR)", slots: 2, equipped: true, cost: 120 },
        "sling": { name: "Sling", type: "weapon", dmgDice: "1d4", stat: "dex", props: "2-handed, Range 12, Vicious", slots: 2, equipped: true, cost: 4 },
        "javelins": { name: "Javelins", type: "weapon", dmgDice: "1d6", stat: "str", props: "Range 8, Stack of 4", slots: 1, equipped: true, cost: 20 },
        "throwinghammers": { name: "Throwing Hammers", type: "weapon", dmgDice: "1d8", stat: "str", props: "Range 4, Stack of 3", slots: 1, equipped: true, cost: 25 },
        "shortbow": { name: "Shortbow", type: "weapon", dmgDice: "1d6", stat: "dex", props: "2-handed, Range 12", slots: 2, equipped: true, cost: 25 },
        "longbow": { name: "Longbow", type: "weapon", dmgDice: "1d8", stat: "dex", props: "2-handed, Range 16 (Req. 1 STR)", slots: 2, equipped: true, cost: 30 },
        "crossbow": { name: "Crossbow", type: "weapon", dmgDice: "4d4", stat: "dex", props: "2-handed, Load: 1 action, Range 8", slots: 2, equipped: true, cost: 60 },
        "handheldballista": { name: "Handheld Ballista", type: "weapon", dmgDice: "1d20", stat: "dex", props: "2-handed, Load: 2 actions, Range 8 (Req. 2 STR)", slots: 2, equipped: true, cost: 120 },
        "adventurersgarb": { name: "Adventurer's Garb", type: "armor", armor: 2, armorType: "light", dexMax: 99, slots: 1, equipped: true, cost: 10 },
        "minorenchant": { name: "Minor Enchantment", type: "armor", armor: 3, armorType: "light", dexMax: 99, slots: 1, equipped: true, cost: 100 },
        "majorenchant": { name: "Major Enchantment", type: "armor", armor: 4, armorType: "light", dexMax: 99, slots: 1, equipped: true, cost: 1000 },
        "epicenchant": { name: "Epic Enchantment", type: "armor", armor: 5, armorType: "light", dexMax: 99, slots: 1, equipped: true, cost: 10000 },
        "cheaphides": { name: "Cheap Hides", type: "armor", armor: 3, armorType: "light", dexMax: 99, slots: 1, equipped: true, cost: 5 },
        "oxhide": { name: "Ox Hide", type: "armor", armor: 4, armorType: "light", dexMax: 99, slots: 1, equipped: true, cost: 45 },
        "hardleather": { name: "Hard Leather", type: "armor", armor: 5, armorType: "light", dexMax: 99, props: "Req. 1 STR", slots: 1, equipped: true, cost: 300 },
        "wyrmhide": { name: "Wyrmhide", type: "armor", armor: 6, armorType: "light", dexMax: 99, props: "Req. 1 STR", slots: 1, equipped: true, cost: 2000 },
        "rustymail": { name: "Rusty Mail", type: "armor", armor: 6, armorType: "medium", dexMax: 2, slots: 1, equipped: true, cost: 15 },
        "chainshirt": { name: "Chain Shirt", type: "armor", armor: 9, armorType: "medium", dexMax: 2, props: "Req. 2 STR", slots: 1, equipped: true, cost: 60 },
        "scalemail": { name: "Scale Mail", type: "armor", armor: 12, armorType: "medium", dexMax: 2, props: "Req. 3 STR", slots: 1, equipped: true, cost: 700 },
        "dragonscale": { name: "Dragonscale", type: "armor", armor: 15, armorType: "medium", dexMax: 2, props: "Req. 4 STR", slots: 1, equipped: true, cost: 3000 },
        "rustyplate": { name: "Rusty Plate", type: "armor", armor: 10, armorType: "heavy", dexMax: 0, props: "Req. 2 STR", slots: 1, equipped: true, cost: 25 },
        "halfplate": { name: "Half Plate", type: "armor", armor: 14, armorType: "heavy", dexMax: 0, props: "Req. 3 STR", slots: 1, equipped: true, cost: 200 },
        "fullplate": { name: "Full Plate", type: "armor", armor: 18, armorType: "heavy", dexMax: 0, props: "Req. 4 STR", slots: 1, equipped: true, cost: 2000 },
        "mithrilplate": { name: "Mithril Plate", type: "armor", armor: 22, armorType: "heavy", dexMax: 0, props: "Req. 5 STR", slots: 1, equipped: true, cost: 5000 },
        "woodenbuckler": { name: "Wooden Buckler", type: "shield", armor: 2, slots: 1, equipped: true, cost: 5 },
        "ironshield": { name: "Iron Shield", type: "shield", armor: 4, props: "Req. 2 STR", slots: 1, equipped: true, cost: 80 },
        "towershield": { name: "Tower Shield", type: "shield", armor: 6, props: "Req. 3 STR", slots: 1, equipped: true, cost: 1500 },
        "dragonshield": { name: "Dragon Shield", type: "shield", armor: 8, props: "Req. 3 STR", slots: 1, equipped: true, cost: 9000 }
    }
};

const SKILL_LIST = [
    { id: 'arcana', name: 'Arcana', stat: 'int' }, { id: 'examination', name: 'Examination', stat: 'int' },
    { id: 'finesse', name: 'Finesse', stat: 'dex' }, { id: 'influence', name: 'Influence', stat: 'wil' },
    { id: 'insight', name: 'Insight', stat: 'wil' }, { id: 'lore', name: 'Lore', stat: 'int' },
    { id: 'might', name: 'Might', stat: 'str' }, { id: 'naturecraft', name: 'Naturecraft', stat: 'wil' },
    { id: 'perception', name: 'Perception', stat: 'wil' }, { id: 'stealth', name: 'Stealth', stat: 'dex' }
];

const CONDITIONS_LIST = [
    { id: 'blinded', name: 'Blinded', type: 'debuff', desc: "Can't see. Attacks against you have adv, yours have dis." },
    { id: 'bloodied', name: 'Bloodied', type: 'debuff', desc: "At half HP or less." },
    { id: 'charmed', name: 'Charmed', type: 'debuff', desc: "Sees charmer as ally." },
    { id: 'dazed', name: 'Dazed', type: 'debuff', desc: "Lose 1 action." },
    { id: 'dying', name: 'Dying', type: 'debuff', desc: "At 0 HP. Damage causes 2 Wounds." },
    { id: 'frightened', name: 'Frightened', type: 'debuff', desc: "Disadvantage on rolls." },
    { id: 'grappled', name: 'Grappled / Restrained', type: 'debuff', desc: "Cannot move." },
    { id: 'hampered', name: 'Hampered', type: 'debuff', desc: "Actions or movement reduced." },
    { id: 'incapacitated', name: 'Incapacitated', type: 'debuff', desc: "Can't do anything." },
    { id: 'invisible', name: 'Invisible', type: 'buff', desc: "Cannot be seen." },
    { id: 'petrified', name: 'Petrified', type: 'debuff', desc: "Incapacitated. Immune to most damage." },
    { id: 'poisoned', name: 'Poisoned', type: 'debuff', desc: "Disadvantage on rolls." },
    { id: 'prone', name: 'Prone', type: 'debuff', desc: "Movement costs 2x. Disadvantage on attacks." },
    { id: 'riding', name: 'Riding', type: 'buff', desc: "Move with mount." },
    { id: 'slowed', name: 'Slowed', type: 'debuff', desc: "Speed halved." },
    { id: 'taunted', name: 'Taunted', type: 'debuff', desc: "Disadvantage except against taunter." },
    { id: 'wounded', name: 'Wounded', type: 'debuff', desc: "Has any Wounds." }
];

const ANCESTRIES = {
    "Common Folk": ["Human", "Dwarf", "Elf", "Halfling", "Gnome"],
    "Rare & Exotic": ["Bunbun", "Dragonborn", "Fiendkin", "Goblin", "Kobold", "Orc", "Birdfolk", "Celestial", "Changeling", "Crystalborn", "Dryad/Shroomling", "Half-Giant", "Minotaur/Beastfolk", "Oozeling/Construct", "Planarbeing", "Ratfolk", "Stoatling", "Turtlefolk", "Wyrdling"]
};

const ANCESTRY_FEATURES = {
    "Human": { desc: "Tenacious: +1 to all skills and Initiative.", modInit: 1, modAllSkills: 1 },
    "Dwarf": { desc: "Stout: +2 max Hit Dice, +1 max Wounds, -1 Speed. You know Dwarvish if your INT is not negative.", modHD: 2, modWounds: 1, modSpeed: -1 },
    "Elf": { desc: "Lithe: Advantage on Initiative, +1 Speed. You know Elvish if your INT is not negative.", modSpeed: 1, modInitAdv: true },
    "Halfling": { desc: "Elusive: +1 to Stealth. If you fail a save, you can succeed instead, 1/Safe Rest.", modSkill: { id: 'stealth', val: 1 }, modSize: 'Small' },
    "Gnome": { desc: "Optimistic: Allow an ally within Reach 6 to reroll any single die, resets when healed to your max HP. -1 Speed. You know Dwarvish if your INT is not negative.", modSpeed: -1, modSize: 'Small' },
    "Bunbun": { desc: "Bunny Legs: Before Interposing or after Defending (after damage), hop up to your Speed in any direction for free, 1/encounter.", modSize: 'Small' },
    "Dragonborn": { desc: "Draconic Heritage: +1 Armor. When you attack: deal an additional LVL+KEY damage (ignoring armor) divided as you choose among any of your targets; recharges whenever you Safe Rest or gain a Wound.", modArmor: 1 },
    "Fiendkin": { desc: "Flameborn: 1 of your neutral saves is advantaged instead." },
    "Goblin": { desc: "Skedaddle: Can move 2 spaces for free after you become the target of an attack or negative effect (after damage, ignoring difficult terrain). You know Goblin if your INT is not negative.", modSize: 'Small' },
    "Kobold": { desc: "Wily: Force an enemy to reroll a non-critical attack against you, 1/encounter. +3 to Influence friendly characters. Advantage on skill checks related to dragons. You know Draconic if your INT is not negative.", modSkill: { id: 'influence', val: 3 }, modSize: 'Small' },
    "Orc": { desc: "Relentless: When you would drop to 0 HP, you may set your HP to LVL instead, 1/Safe Rest. +1 Might. You know Goblin if your INT is not negative.", modSkill: { id: 'might', val: 1 } },
    "Birdfolk": { desc: "Hollow Bones: You have a fly Speed as long as you are wearing armor no heavier than Leather. Crits against you are Vicious (the attacker rolls 1 additional die). Forced movement moves you twice as far.", modFlySpeed: true, modSize: 'Small' },
    "Celestial": { desc: "Highborn: Your disadvantaged save is Neutral instead. You know Celestial if your INT isn't negative." },
    "Changeling": { desc: "New Place, New Face: +2 shifting skill points. You may take on the appearance of any ancestry. When you do, you may place your 2 shifting skill points into any 1 skill. 1/day." },
    "Crystalborn": { desc: "Reflective Aura: When you Defend, gain KEY armor and deal KEY damage back to the attacker. 1/encounter." },
    "Dryad/Shroomling": { desc: "Danger Pollen/Spores: Whenever an enemy causes you one or more Wounds, you excrete soporific spores: all adjacent enemies are Dazed. You know Elvish if your INT is not negative.", modSize: 'Small' },
    "Half-Giant": { desc: "Strength of Stone: Force an enemy to reroll a crit against you, 1/encounter. +2 Might. You know Dwarvish if your INT is not negative.", modSkill: { id: 'might', val: 2 }, modSize: 'Large' },
    "Minotaur/Beastfolk": { desc: "Charge: When you move at least 4 spaces, you can push a creature in your path. Medium: 1 space; Small/Tiny: up to 2 spaces. 1/turn." },
    "Oozeling/Construct": { desc: "Odd Constitution: Increment your Hit Dice one step (d6 » d8 » d10 » d12 » d20); they always heal you for the maximum amount. Magical healing always heals you for the minimum amount.", modHDStep: 1 },
    "Planarbeing": { desc: "Planeshift: Whenever you Defend, you can gain 1 Wound to temporarily phase out of the material plane and ignore the damage. -2 max Wounds.", modWounds: -2 },
    "Ratfolk": { desc: "Scurry: Gain +2 armor if you moved on your last turn.", modSize: 'Small' },
    "Stoatling": { desc: "Small But Ferocious: Whenever you make a single-target attack against a creature larger than you, roll 1 additional d6 for each size category it is larger. They do the same.", modSize: 'Small' },
    "Turtlefolk": { desc: "Slow & Steady: +4 Armor, -2 speed.", modArmor: 4, modSpeed: -2 },
    "Wyrdling": { desc: "Chaotic Surge: Whenever you or a willing ally within Reach 6 casts a tiered spell, you may allow them to roll on the Chaos Table. 1/encounter.", modSize: 'Small' }
};

const BACKGROUNDS = {
    "Academic & Professional": ["Academy Dropout", "History Buff", "Tradesman/Artisan"],
    "Athletic & Wild": ["Accidental Acrobat", "Acrobat", "At Home Underground", "Home at Sea", "Survivalist", "Wild One"],
    "Mystical & Strange": ["Fey Touched", "Haunted Past", "Raised by Another Ancestry", "(Secretly) Undead"],
    "Special & Criminal": ["Back Out of Retirement (Old Bones)", "Back Out of Retirement (Remember)", "Bumblewise", "Devoted Protector", "Ear to the Ground", "(Former) Con Artist", "Made a BAD Choice", "So Dumb I'm Smart Sometimes", "What? I've Been Around", "Wily Underdog"]
};

const BACKGROUND_FEATURES = {
    "Academy Dropout": { desc: "School just isn't for everyone! You learn by experience in the real world. Learn any 1 Utility Spell.", customUI: "academyDropout" },
    "Accidental Acrobat": { desc: "(Req. 0 or negative DEX) Whenever you fail a DEX-related roll, you may roll again. If you still fail, the consequences are BAD." },
    "Acrobat": { desc: "Can be thrown by a larger ally, REALLY far. Half damage from falling and forced movement." },
    "At Home Underground": { desc: "Dig twice as fast. Safe rests underground count as Lavish. Must make an INT save to rest while it's raining." },
    "Back Out of Retirement (Old Bones)": { desc: "Your age has long since started to show. -1 max Wounds.", modWounds: -1 },
    "Back Out of Retirement (Remember)": { desc: "Gain 1 Wound to use an ability or cast a spell as if you were 1 level higher." },
    "Bumblewise": { desc: "(Req. 0 or negative WIL) A result of 1 or less on any WIL-related roll counts as a natural 20." },
    "Devoted Protector": { desc: "Choose 1 ally in your party. You can survive +3 max Wounds as long as they are nearby. Whenever they take a Wound, you do too.", modWounds: 3 },
    "Ear to the Ground": { desc: "Advantage on checks to obtain gossip for recent or upcoming events." },
    "Fearless": { desc: "You simply do not feel fear like others do. You cannot be Frightened or Intimidated." },
    "Fey Touched": { desc: "Half damage from all magical effects, double damage from metal weapons." },
    "(Former) Con Artist": { desc: "You can forge most documents or mimic voices flawlessly. You have a criminal contact in most major cities." },
    "Haunted Past": { desc: "Advantage against fear." },
    "History Buff": { desc: "+1 Lore. Advantage on Lore checks regarding historical events, ancient ruins, or old nobility.", modSkill: {id: 'lore', val: 1} },
    "Home at Sea": { desc: "Recover twice as many Wounds and HP on a ship/water. Advantage on water-related skill checks." },
    "Made a BAD Choice": { desc: "Start with 500-1000 extra gold, or an uncommon/rare magical item. Gain an equally powerful curse or enemy who wants it back." },
    "Raised by Another Ancestry": { desc: "You speak their language, understand their customs, and have advantage on Influence checks when dealing with members of the ancestry that raised you." },
    "(Secretly) Undead": { desc: "You do not need to breathe, eat, or sleep. You are immune to the Poisoned condition. Healing magic heals you for minimum value." },
    "So Dumb I'm Smart Sometimes": { desc: "(Req. 0 or negative INT) Reroll an INT-related skill check, 1/day. Reroll a failed INT save with advantage, 1/Safe Rest." },
    "Survivalist": { desc: "+1 Max Hit Dice. Advantage against poison. You always manage to forage enough personal rations in the wild.", modHD: 1 },
    "Taste for the Finer Things": { desc: "You can accurately appraise the value of luxury goods. When you take a Lavish Safe Rest, gain temporary HP equal to your level." },
    "Tradesman/Artisan": { desc: "Choose a profession (Baker/Cook, Smith, Stonemason, Weaver, Leatherworker, etc.). Checks you make related to that profession are made with advantage." },
    "What? I've Been Around": { desc: "1/location, you know someone who can help. Roll a d20 to see if they want you dead, owe you, or love you." },
    "Wild One": { desc: "Wild creatures are less frightened of you and more willing to aid you. +1 Naturecraft. While Field Resting, roll Hit Dice with advantage while in the wild.", modSkill: {id: 'naturecraft', val: 1} },
    "Wily Underdog": { desc: "(Req. 0 or negative STR) Reroll a failed STR-related roll and use another stat instead, 1/day." }
};

const UTILITY_SPELLS = {
    "Fire": {
        "Firebrand": "Touch a surface and secretly mark it with a symbol or brief message. Speaking a chosen command word while nearby reveals it.",
        "Fire Step": "Teleport to a fire source you can see.",
        "Kindle": "Conjure a minor visual illusion, OR ignite a small, unheld item within Range 6."
    },
    "Ice": {
        "Ice Disk": "Conjure a disk of ice that floats just above the ground and follows you. It can carry up to 250 lbs for 1 hour.",
        "Chillcraft": "Harmlessly freeze, thaw, or move a bath-sized amount of water near you, OR conjure a sheet of opaque, mirror-like, or transparent ice the size of a window or small door.",
        "Wintry Scrying": "Turn a small patch of water into a reflective icy mirror. Looking through it grants you vision of any desired location near this same body of water for 10 minutes."
    },
    "Lightning": {
        "Spark Buddy": "Conjure a Tiny (squirrel-sized) electrical helper for up to 1 hour. It can fetch Tiny objects, open unlocked doors, illuminate a small area, or deliver a harmless shock.",
        "Spark Step": "Teleport to a metal object within Range 4.",
        "Tempest’s Command": "Dispel a minor magical effect, or temporarily suppress a stronger one. OR Voice of Thunder: Your eyes glow and your voice is amplified to a booming, thunder-like volume for 1 minute."
    },
    "Wind": {
        "Wind Whisper": "You whisper a message into the wind and it will be secretly carried to a specified target within 100 miles/160 km.",
        "Helpful Gust": "Gently move a Tiny unheld item within Reach 6 in any direction, OR generate an illusory scent.",
        "Feather Fall": "When a creature falls within Reach 6, cause them to gently float to the ground, unharmed."
    },
    "Radiant": {
        "Light": "Cause an item to brightly glow as a torch with radiant light for as long as you hold it.",
        "Beautify": "Clean stains or repair a small tear/break in a non-magical item, or conjure tiny beautiful things like flowers or butterflies.",
        "Bond of Peace": "Telepathically communicate simple thoughts or feelings with a friendly creature you can see, OR imbue your spoken words with calming magic, granting advantage on any check made to soothe anger or fear in creatures who can hear you."
    },
    "Necrotic": {
        "Gravecraft": "Soil a surface with blood, filth, or other disgusting things, OR shape/move a body-sized plot of earth.",
        "False Face": "Change your appearance to look like someone else for 10 minutes (requires a piece of them).",
        "Thought Leech": "Read the surface thoughts of a creature within Reach 6."
    }
};

const SPELL_REGISTRY = {
    "Fire": {
        "Flame Dart": { tier: "Cantrip", desc: "1 Action. Range: 8. Damage: 1d10. On crit: Smoldering. High Levels: +5 damage every 5 levels." },
        "Heart's Fire": { tier: "Cantrip", desc: "1 Action. Range: 4. Give an ally within Range an extra action. Spend 1 mana to cast this when it is not your turn. High Levels: +1 Range every 5 levels." },
        "Ignite": { tier: "Tier 1", desc: "2 Actions. Range: 8. Damage: 4d10 to a Smoldering target, ending the condition on hit. Upcast: +10 damage." },
        "Enchant Weapon": { tier: "Tier 2", desc: "1 Action. Concentration: Up to 1 minute. A weapon you touch is enchanted with magical flame. It deals +KEY damage and inflicts Smoldering on crit. Upcast: +KEY damage." },
        "Flame Barrier": { tier: "Tier 3", desc: "1 Action, Self. Reaction: When attacked, Defend for free. Until the start of your next turn, melee attackers against you take KEY damage (ignoring armor) and gain Smoldering. Upcast: +KEY damage." },
        "Pyroclasm": { tier: "Tier 4", desc: "2 Actions, AoE. Reach: 3. Others within Reach take 2d20+10 damage (ignoring armor) on a failed DEX save. Half damage on save. Smoldering creatures fail. Upcast: +1 Reach, +2 damage." },
        "Fiery Embrace": { tier: "Tier 5", desc: "2 Actions, AoE. Concentration: Up to 1 minute. Reach: 8. While within Reach: 1 ally gains the effects of Enchant Weapon. Enemies gain Smoldering, lose damage resistance, and their damage immunity is reduced to resistance. Upcast: +1 ally." },
        "Living Inferno": { tier: "Tier 7", desc: "3 Actions, Self. Gain the effects of Flame Barrier until your next turn. At the end of this turn and your next turn, cast Pyroclasm for free. Upcast: Upcast Flame Barrier and Pyroclasm." },
        "Dragonform": { tier: "Tier 9", desc: "5 Actions, Self. Transform into a Huge dragon. Gain 3 actions, a fly speed of 12, LVL Armor, 10xLVL temp HP, and:<ul><li>Tooth & Claw. Action: (Reach 2) 1d20+LVL damage (ignoring armor). Inflicts Smoldering.</li><li>Immolating Breath. 2 Actions: (Reach: Cone 8). DC 20 DEX save, KEY d20 damage, half on save. Smoldering targets fail.</li></ul>You can maintain this form for as long as the temp HP granted by this spell remain (max 10 minutes). When it ends, you drop to 0 HP." }
    },
    "Ice": {
        "Ice Lance": { tier: "Cantrip", desc: "1 Action. Range: 12. Damage: 1d6 cold or piercing damage. On hit: Slowed. High Levels: +3 damage every 5 levels." },
        "Snowblind": { tier: "Cantrip", desc: "1 Action. Reach: 1. Damage: 1d6. On hit: Blinded until the end of their next turn. High Levels: +3 damage every 5 levels." },
        "Frost Shield": { tier: "Tier 1", desc: "1 Action, Self. Reaction: When attacked, Gain 2xKEY temp HP and Defend for free. The ice melts and these temp HP are lost at the start of your next turn. Upcast: +2xKEY temp HP." },
        "Shatter": { tier: "Tier 2", desc: "2 Actions. Range: 12. Damage: 3d6. If any die rolls the max against a Hampered target, this counts as a crit. On crit: +20 damage. Upcast: Increase the result of ANY die by 1. +5 damage on crit." },
        "Cryosleep": { tier: "Tier 3", desc: "2 Actions, AoE. Reach: 12. Creatures in a 2x2 area within Reach are Dazed. On a failed STR save, they fall asleep instead, becoming Incapacitated until their next two turns have passed, until damaged, or until an ally uses an action to wake them. Upcast: +1 area, +1 turn asleep." },
        "Rimeblades": { tier: "Tier 4", desc: "3 Actions, AoE. Concentration: Up to 1 minute. Reach: 12. Conjure razor-sharp icy spikes in 5 contiguous spaces within Reach; this area is difficult terrain. Creatures that enter these spaces (or who are in the area when you conjure them) suffer 2d6 damage for each space they touch. Upcast: +1 space, +1 damage." },
        "Arctic Blast": { tier: "Tier 5", desc: "2 Actions, AoE. Reach: Cone 4. Damage: 4d6+10 damage. This area is difficult terrain until the end of your next turn. Surviving creatures must make a STR save or be frozen in place (Restrained) until the end of their next turn; creatures already Hampered are Incapacitated for 1 turn instead. Upcast: +1 Reach." },
        "Glacier Strike": { tier: "Tier 8", desc: "3 Actions, AoE. Range: 12. Damage: d66 bludgeoning to creatures in a 3x3 area. Creatures adjacent to that area take half as much. The entire area permanently becomes difficult terrain. Upcast: +1 initial area." },
        "Arctic Annihilation": { tier: "Tier 9", desc: "3 Actions, AoE. Reach: 12. Choose any number of objects or willing creatures within Reach to encase in ice. They are Incapacitated and immune to damage and negative effects until the start of their next turn. All other creatures and objects within Reach take d66 damage. Any surviving creature who took this damage must make a STR save or be Incapacitated for 1 round. Once you cast this spell, you must Safe Rest for 1 week before using it again." }
    },
    "Lightning": {
        "Zap": { tier: "Cantrip", desc: "1 Action. Range: 12. Damage: 2d8. On miss: the lightning fails to find ground, and strikes you instead. High Levels: +6 damage every 5 levels." },
        "Overload": { tier: "Cantrip", desc: "1 Action, AoE. Castable only if you are Charged, ending the condition. Reach: 2. Damage: 2d8 to others within Reach. High Levels: +4 damage every 5 levels." },
        "Arc Lightning": { tier: "Tier 1", desc: "2 Actions. Range: 12. Damage: 3d8. The bolt also damages the next closest creature to your target. On miss: the lightning fails to find ground and strikes you instead. Upcast: +4 damage." },
        "Alacrity": { tier: "Tier 2", desc: "1 Action, Self. Range: 4. Reaction: When attacked. Defend for free. After damage is dealt, you gain the Charged condition then teleport anywhere within Range. Upcast: +4 Range." },
        "Stormlash": { tier: "Tier 3", desc: "2 Actions, AoE. Line: 12. Damage: 3d8+4 (ignoring metal armor). Surviving creatures are Dazed on a failed STR save, or Incapacitated instead for 1 of their turns if they fail by 5 or more. Creatures with a large amount of metal (e.g., armor or a longsword) roll with disadvantage. Upcast: +4 damage." },
        "Electrickery": { tier: "Tier 4", desc: "3 Actions. Range: 8. Reaction: When an ally is attacked. Choose another creature within Range to swap places with your ally on a failed WIL save (they become the new target). Costs 1 Action while Charged, ending the condition. Upcast: +2 Range." },
        "Electrocharge": { tier: "Tier 5", desc: "2 Actions, Self. Concentration: Up to 1 minute. A creature you touch gains the Charged condition, +1 max action, +5 armor, 2x speed, and advantage on DEX saves. Upcast: +4 Range." },
        "Ride the Lightning": { tier: "Tier 6", desc: "3 Actions, AoE. Teleport up to 12 spaces away to a spot you can see (if a willing creature is there, swap places with them). Adjacent creatures take d88 damage. Surviving creatures must make a STR save or be hurled back 3 spaces, knocked Prone, and deafened for 1 day. Upcast: +1 DC." },
        "Seething Storm": { tier: "Tier 9", desc: "3 Actions, AoE. Concentration: Up to 1 minute. Reach: 4. You become a cloud of tempestuous storm. You can fly, move for free 1/round, and attacks against you are made with disadvantage.<ul><li>At the end of each of your turns, strike up to 4 creatures within Reach with a bolt of lightning for d88 damage (a creature can only be struck 1/round).</li><li>+2 Reach and number of bolts each round. Costs 3 actions each round to maintain.</li></ul>Once you cast this spell, you must Safe Rest for 1 week before you can use it again." }
    },
    "Wind": {
        "Razor Wind": { tier: "Cantrip", desc: "1 Action. Range: 12. Damage: 1d4 slashing (Vicious: roll 1 additional die whenever you roll crit damage). Also damages up to 1 adjacent target. High Levels: +2 damage every 5 levels." },
        "Breath of Life": { tier: "Cantrip", desc: "1 Action. Range: 6. Restore 1 HP to a Dying creature. High Levels: +2 Range every 5 levels." },
        "Blustery Gale": { tier: "Tier 1", desc: "2 Actions. Range: 12. Damage: 3d4 bludgeoning, advantage against flying, Small, or Tiny targets. On hit: Move a Med target 2 spaces away; Small/Tiny twice as far; Large half as far (round down). For each die you would roll due to forced movement from this spell, deal +5 damage instead. Upcast: +1 movement." },
        "Barrier of Wind": { tier: "Tier 2", desc: "1 Action, Self. Reaction: When attacked at Range. Defend for free. Ranged attacks have disadvantage against you this round (including the triggering attack). Upcast: +3 Armor." },
        "Fly": { tier: "Tier 3", desc: "1 Action. Concentration: Up to 10 minutes. Touch a creature, grant a flying speed of 12. Upcast: +1 target." },
        "Eye of the Storm": { tier: "Tier 4", desc: "2 Actions, AoE. Reach: 3. Damage: 4d4+10 bludgeoning to enemies within Reach. You may place surviving creatures anywhere within 1 space of the storm's Reach on a failed STR save. Upcast: +1 Reach." },
        "Updraft": { tier: "Tier 5", desc: "3 Actions, AoE. Reach: 12. Enemies within a 5x5 area must repeat a DEX save until they succeed. For each time they failed they suffer 1d6 falling damage and land prone. Upcast: +2 Range, +1 area." },
        "Thousand Cuts": { tier: "Tier 6", desc: "3 Actions, AoE. Range: 12. Damage: d44 slashing damage (roll with advantage), also damages enemies within Reach 1 of your target. Upcast: +1 Reach." },
        "Boisterous Winds": { tier: "Tier 7", desc: "2 Actions, Multi-target. Concentration: Up to 1 minute. You and up to 12 allies within Reach 12 gain: Ranged attacks have disadvantage against you, a flying speed of 12, and can move for free 1/round. Upcast: +1 minute or +2 targets." },
        "Vicious Mockery": { tier: "Cantrip", desc: "1 Action. Range: 12. Damage: 1d4+INT psychic (ignoring armor). On hit: the target is Taunted during their next turn. High Levels: +2 damage every 5 levels." }
    },
    "Radiant": {
        "Rebuke": { tier: "Cantrip", desc: "1 Action. Reach: 4. Damage: 1d6 (ignoring armor), does not miss. 2x damage against undead or cowardly (those Frightened or behind cover). High Levels: +2 damage every 5 levels." },
        "True Strike": { tier: "Cantrip", desc: "1 Action. Reach: 2. Give a creature advantage on the next attack they make (until the end of their next turn). High Levels: +1 Reach every 5 levels." },
        "Heal": { tier: "Tier 1", desc: "1 Action. Reach: 1. Heal a creature 1d6+KEY HP. Upcast: Choose one: +1 target, +4 Reach, +1d6 healing. If 5+ mana is spent, you may also heal 1 negative condition (e.g., Blind, Poisoned, 1 Wound)." },
        "Warding Bond": { tier: "Tier 2", desc: "1 Action. Designate a willing creature as your ward for 1 minute. They take half damage from all attacks; you are attacked for the other half. Upcast: +1 creature." },
        "Shield of Justice": { tier: "Tier 3", desc: "1 Action, Self. Reaction: When attacked, Defend for free and reflect Radiant damage back at the attacker equal to the amount blocked (ignoring armor). Upcast: +5 Armor." },
        "Condemn": { tier: "Tier 4", desc: "1 Action. Reach: 4. Damage: 30. Can only target an enemy that crit you or an ally since your last turn. Cannot be reduced by any means. The next attack against that enemy is made with advantage. Upcast: +1 Reach, +1 advantage." },
        "Vengeance": { tier: "Tier 5", desc: "1 Action. Reach: 1. Damage: 1d100, to a creature that attacked a Dying ally or reduced one to 0 HP since your last turn. Upcast: +1 Reach, roll w/ advantage." },
        "Sacrifice": { tier: "Tier 6", desc: "1 Action, Special. Reach: 4. Reduce yourself to 0 HP. You cannot have more than 0 HP until you Safe Rest. Heal a number of HP equal to your maximum HP, divided as you choose to any other creatures within Reach. You may revive a creature that has died in the past minute if you give them at least 20 HP (also healing 2 Wounds from them), provided they have not been revived with this spell before. Upcast: +4 Reach." },
        "Redeem": { tier: "Tier 9", desc: "Casting Time: 24 hours. Requires: A diamond worth at least 10,000 gp, which this spell consumes. Revive any number of deceased creatures you choose—within 1 mile—that have died in the past year, provided they have not died of old age or been revived with this spell before." },
        "Lifebinding Spirit": { tier: "Tier 1", desc: "1 Action. Summon a spirit companion that follows you and is immune to harm. It lasts until you cast this spell again, take a Safe Rest, or it heals a number of times equal to the mana spent summoning it.<ul><li>It attacks or heals a creature within Reach 4. It attacks for 1d6+WIL radiant damage (ignoring armor), or heals for the same amount.</li></ul>Upcast: Increment its die size by 1 (max d12), +1 healing use." }
    },
    "Necrotic": {
        "Entice": { tier: "Cantrip", desc: "1 Action. Range: 8. Damage: 1d4 (ignoring armor). On hit: target moves 2 spaces closer to you. High Levels: Increment the die size 1 step every 5 levels (d6 > d8 > d10 > d12)." },
        "Withering Touch": { tier: "Cantrip", desc: "1 Action. Reach: 1. Damage: 1d12. On hit: Target is considered undead for 1 round. High Levels: +6 damage every 5 levels." },
        "Shadow Trap": { tier: "Tier 1", desc: "2 Actions. Concentration: Up to 1 minute. The next creature to move adjacent to you suffers 3d12 damage; if Small or Tiny, it is also Restrained by shadowy tendrils for as long as you maintain concentration or until they escape. Upcast: +1 size category, +1d12 damage when they escape." },
        "Dread Visage": { tier: "Tier 2", desc: "1 Action, Self. Reaction: When attacked, Defend for free. Melee attackers are Frightened of you and suffer 1d12 damage if they attack you this round. Costs 2 mana less while dying. Upcast: +2 damage, +2 armor." },
        "Vampiric Greed": { tier: "Tier 3", desc: "2 Actions, AoE. Gain 1 Wound. 4d12 to all adjacent creatures, and heal HP equal to the damage done. Any surviving creatures make a STR save. Gain 1 additional Wound on a failure. Upcast: +1 DC." },
        "Greater Shadow": { tier: "Tier 4", desc: "2 Actions. Summon a 5d12 Greater Shadow minion (max 1) adjacent to you. When it dies, it explodes into 5 shadow minions (see Summon Shadow). Place them anywhere within 8 spaces. Upcast: +1d12 damage, +1 shadow minion on explosion." },
        "Gangrenous Burst": { tier: "Tier 5", desc: "2 Actions, AoE. Reach: Up to 8. Other damaged creatures must make a STR save or take 3d20 damage (ignoring armor), half on save. The save is rolled with disadvantage while Bloodied. Upcast: +10 damage." },
        "Unspeakable Word": { tier: "Tier 6", desc: "2 Actions, Special. Reach: 8. Damage: d66 (with advantage, ignoring armor, does not miss or crit) on a failed INT save. Target rolls with disadvantage if Bloodied or Frightened. On a success, you both take half of this damage instead. Upcast: +1 DC, +10 damage." },
        "Creeping Death": { tier: "Tier 7", desc: "3 Actions, AoE. Reach: 8. Damage: 4d20. If this kills the creature, it violently erupts and you MUST deal the same amount of damage to another creature within 8 spaces of it that has not yet been damaged by this effect. Repeat until a creature survives this damage or no other creatures are within Reach. Upcast: +1d20 damage." },
        "Shadow Blast": { tier: "Cantrip", desc: "1 Action. Range: 8. Damage: 1d12+KEY. 1/round. High Levels: +1d12 every 5 levels." },
        "Summon Shadow": { tier: "Cantrip", desc: "1 Action. Summon a shadow minion within Reach 1 (you can summon a max of INT or LVL minions this way, whichever is lower). Your shadow minions follow the normal minion rules: they have 1 HP, no damage bonus, and do not crit. They abandon you immediately outside of combat.<ul><li>Action: (1/turn) you may command ALL of your minions to move up to 6 then attack (Reach 1, d12 each).</li></ul>High Levels: +1 Reach every 5 levels." }
    }
};