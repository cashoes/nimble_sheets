/**
 * @fileoverview TYPEDEF FILE
 * Contains TypeDefs for complex objects used throughout the engine.
 */

/**
 * @typedef {Object} CharacterState
 * @property {string} charName
 * @property {number} level
 * @property {string} ancestry
 * @property {string} background
 * @property {string} subclass
 * @property {number} baseStr
 * @property {number} addStr
 * @property {number} baseDex
 * @property {number} addDex
 * @property {number} baseInt
 * @property {number} addInt
 * @property {number} baseWil
 * @property {number} addWil
 * @property {number|null} hpCurrent
 * @property {number} tempHP
 * @property {number|null} hdCurrent
 * @property {number} wounds
 * @property {Object.<string, number>} skills
 * @property {string[]} activeConditions
 * @property {Object[]} inventory
 * @property {number} gold
 * @property {Object.<string, number>} resourceValues
 * @property {string} bgSpell
 * @property {boolean} showMinor
 * @property {string[]} selectedDecrees
 * @property {string[]} selectedSpells
 * @property {string[]} selectedArsenal
 * @property {string[]} selectedToth
 * @property {string[]} selectedMastery
 * @property {string[]} selectedGreater
 * @property {string[]} selectedLesser
 * @property {string[]} selectedGraces
 * @property {string[]} selectedLyrical
 * @property {string[]} selectedBoons
 * @property {string[]} selectedMartial
 * @property {string[]} selectedUnderhanded
 * @property {string[]} selectedDeepKnowledge
 * @property {string[]} secondarySchool
 * @property {string[]} selectedSubclassSpells
 * @property {string[]} selectedStudy
 * @property {string[]} selectedTwilight
 * @property {string[]} selectedShadowmastery
 * @property {string[]} currentForm
 * @property {Object[]} furyDice
 * @property {Object|null} judgmentDice
 * @property {string} judgmentBoom
 * @property {string} judgmentMode
 * @property {string} furyBoom
 * @property {number} advantage
 * @property {number} actionsSpent
 */

/**
 * @typedef {Object} DerivedStats
 * @property {number} level
 * @property {Object} statsMap
 * @property {number} hdFace
 * @property {number} maxHP
 * @property {boolean} isBloodied
 * @property {number} hdMax
 * @property {number} armor
 * @property {number|string} speed
 * @property {number} initiative
 * @property {number} woundMax
 * @property {number} maxActions
 * @property {Object.<string, number>} resourceMaxes
 * @property {number} maxTier
 * @property {Object.<string, number>} passMods
 * @property {boolean} initAdv
 * @property {string} size
 */

/**
 * @typedef {Object} ClassConfig
 * @property {string} name
 * @property {string} subtitle
 * @property {string[]} keyStats
 * @property {{adv: string|null, dis: string|null}} saves
 * @property {{armor: string, weapons: string}} proficiencies
 * @property {number} baseHp
 * @property {number} hpPerLevel
 * @property {number} hitDie
 * @property {{accent: string, accentDim: string, bodyBg: string, containerBg: string, panelBg: string, border: string}} theme
 * @property {{baseStr: number, baseDex: number, baseInt: number, baseWil: number}} initialStats
 * @property {{value: string, label: string, config?: Object}[]} subclasses
 * @property {Object[]} resources
 * @property {(null|Function)} spellProgression
 * @property {Object[]} customHeaderStats
 * @property {(null|Function)} mechanicPanelExtension
 * @property {{}} optionExtensions
 * @property {string[]} grantedSpells
 * @property {string[]} statModifiers
 * @property {string[]} spellSchools
 * @property {{[subclass:string]: string[]}} subclassSchools
 * @property {string[]} extraSchoolsKeys
 * @property {boolean|Function|string[]} includeUtilitySpells
 * @property {string[]} includeTieredSpells
 * @property {string[]} includeCantripSpells
 * @property {Object[]} spellReplacements
 * @property {{}} scalingStats
 * @property {Object[]} rollTriggers
 * @property {{core: Object.<number, Object[]>, subclasses: Object.<string, Object[]}}} featuresData
 * @property {Object} optionsData
 */