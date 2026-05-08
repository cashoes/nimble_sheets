# NIMBLE Tracker - Architecture Documentation

**Version**: 1.5.0  
**Date**: 2026-05-07  
**Status**: Production Ready ✅

---

## Executive Summary

The NIMBLE Tracker is a browser-based TTRPG character sheet system. It generates **self-contained HTML files** for 11 character classes, with all JavaScript and CSS embedded at build time.

**Key Metrics**:
- **Total Lines**: ~3,062 (JS only, down from ~6,039 - 49% reduction)
- **Classes Supported**: 11
- **Architecture**: Class-based with shared engine modules
- **Build System**: Browser-based concatenation (no build tools required)

---

## 1. High-Level Architecture

```
nimble/
├── index.html                    # Builder UI (266 lines)
├── README.md                    # User documentation
├── ARCHITECTURE.md             # This file
├── src/
│   ├── base_template.html       # HTML template for trackers (1,265 lines)
│   ├── engine/                 # Shared engine modules (1,375 lines)
│   │   ├── base_class.js       # Base class with spell config (204 lines)
│   │   ├── panel_builder.js    # MechanicPanel UI builder (133 lines)
│   │   ├── feature_gen.js      # Feature definition helpers (128 lines)
│   │   ├── resource_factory.js # Resource creation helpers (17 lines)
│   │   ├── rendering_engine.js # UI rendering logic (323 lines)
│   │   ├── logic.js           # Game logic & calculations (134 lines)
│   │   ├── state_manager.js    # State persistence (137 lines)
│   │   ├── ui_helpers.js       # UI utility functions (91 lines)
│   │   ├── feat_helpers.js     # Feature rendering helpers (106 lines)
│   │   ├── roll_engine.js      # Dice rolling engine (158 lines)
│   │   └── main.js            # Entry point (44 lines)
│   ├── data/                   # Class definitions (1,687 lines)
│   │   ├── class_berserker.js
│   │   ├── class_cheat.js
│   │   ├── class_commander.js
│   │   ├── class_hunter.js
│   │   ├── class_mage.js
│   │   ├── class_oathsworn.js
│   │   ├── class_shadowmancer.js
│   │   ├── class_shepherd.js
│   │   ├── class_songweaver.js
│   │   ├── class_stormshifter.js
│   │   └── class_zephyr.js
│   └── data/json/              # Game data
│       ├── ancestries.json
│       ├── backgrounds.json
│       ├── conditions.json
│       ├── items.json
│       └── spells.json
└── src/extensions/             # Browser extension (optional)
    ├── browser_bridge/
    └── obr_relay/
```

---

## 2. Core Design Principles

### 2.1 Self-Contained Output
- **Single HTML file**: Each tracker is a complete, standalone HTML file
- **No imports/exports**: All scripts are concatenated at build time by `index.html`
- **No external dependencies**: Pure vanilla JS + Google Fonts

### 2.2 Configuration Over Inheritance
Classes declare **what they are** (config), not **how to do things** (logic):

```javascript
class MageClass extends BaseClass {
    constructor() {
        super({
            name: "Mage",
            spellSchools: ["Fire", "Ice", "Lightning"],
            subclassSchools: {
                "Control": ["Necrotic"],
                "Chaos": ["Wind"]
            },
            includeUtilitySpells: createUtilityConfig(null, "selectedMastery"),
            // ... more config
        });
    }
}
```

### 2.3 Deduplication Strategy
Shared logic lives in engine modules:
- **BaseClass** (`base_class.js`): Spell progression, default methods
- **FeatureGen** (`feature_gen.js`): Standard feature generation
- **PanelBuilder** (`panel_builder.js`): UI panel construction
- **ResourceFactory** (`resource_factory.js`): Resource definitions

---

## 3. Engine Modules (Detailed)

### 3.1 BaseClass (`src/engine/base_class.js`)
**Purpose**: Base class for all 11 character classes

**Key Properties**:
- `spellSchools`: Array of default spell schools (e.g., `["Fire", "Ice"]`)
- `subclassSchools`: Object mapping subclass → additional schools
- `spellProgression`: Custom progression array (optional)
- `spellReplacements`: For Oathbreaker-style replacements
- `includeUtilitySpells`: Boolean or config object
- `resources`: Array of resource definitions
- `customHeaderStats`: Custom header displays (e.g., Aura range)

**Key Methods**:
- `getAvailableSpells()`: Default spell progression (override only for special cases)
- `getDerivedStats()`: Calculate speed, wound max, etc.
- `getStatOverrides()`: Modify armor, init, etc.
- `getMechanicPanelHTML()`: Build class-specific UI (uses PanelBuilder)
- `renderFeature()`: Custom feature rendering (optional override)

### 3.2 PanelBuilder (`src/engine/panel_builder.js`)
**Purpose**: Fluent API for building mechanic panels

**Methods**:
- `addResource(id, label, value, max)`: Mana, LoH, etc.
- `addRollDisplay(notation, label, display, subtext, context)`: Surge, Spirit damage
- `addDicePool(dice, label, faces, rollFn, clearFn, toggleFn)`: Fury, Judgment
- `addCustom(html)`: For class-specific UI that doesn't fit other methods
- `build(minHeight)`: Generate final HTML

**Usage Example**:
```javascript
getMechanicPanelHTML(level, subclass, state, derived) {
    const builder = new PanelBuilder();
    builder.addResource('mana', 'Mana Pool', state.resourceValues.mana, derived.resourceMaxes.mana);
    builder.addRollDisplay('1d4+INT', 'Sneak Attack', '+1d4', 'On Crit');
    return builder.build();
}
```

### 3.3 FeatureGen (`src/engine/feature_gen.js`)
**Purpose**: Simplify level-up feature definitions

**Key Functions**:
- `generateStandardFeatures(keyStats, secStats, isCaster, customProgression)`: Generate core 1-20 features
- `createKeyStatFeature()`, `createSecondaryStatFeature()`: Stat increases
- `createTierFeature()`, `createCantripFeature()`: Spell progression
- `createEpicBoonFeature()`, `createSubclassFeature()`: Special features

**Usage Example**:
```javascript
static get FEATURES() {
    const { core, subclasses } = FeatureGen.generateStandardFeatures(
        'STR or DEX', 'WIL or INT', false
    );
    core[1] = [{ id: "rage", name: "Rage", desc: "..." }];
    return { core, subclasses };
}
```

### 3.4 ResourceFactory (`src/engine/resource_factory.js`)
**Purpose**: Standardize resource definitions

**Functions**:
- `createManaResource(stat, label)`: Mana pools (INT or WIL based)
- `createSimpleResource(id, label, calcMaxFn)`: Custom resources (LoH, Bursts, etc.)

**Usage Example**:
```javascript
resources: [
    createManaResource('int'),
    createSimpleResource('loh', 'Lay on Hands', (level) => 5 * level)
]
```

### 3.5 Other Engine Modules
- **rendering_engine.js**: UI rendering (header, attributes, resources, inventory, spells)
- **logic.js**: Game logic (level-up, HP, stats, spells)
- **state_manager.js**: State persistence (localStorage, import/export)
- **ui_helpers.js**: UI utilities (notifications, roll history)
- **feat_helpers.js**: Feature rendering helpers
- **roll_engine.js**: Dice rolling engine
- **main.js**: Entry point (initialization)

---

## 4. Class Structure

### 4.1 File Organization
Each class file (`class_*.js`) follows this structure:

```javascript
class XClass extends BaseClass {
    constructor() {
        super({
            // 1. Identity
            name: "ClassName",
            subtitle: "...",
            
            // 2. Core Stats
            keyStats: ['str', 'dex'],
            saves: { adv: 'str', dis: 'dex' },
            proficiencies: { armor: "...", weapons: "..." },
            baseHp: 10,
            hpPerLevel: 5,
            hitDie: 6,
            
            // 3. Theme
            theme: { accent: "#...", bodyBg: "...", ... },
            
            // 4. Initial Stats
            initialStats: { baseStr: 0, baseDex: 0, ... },
            
            // 5. Subclasses
            subclasses: [{ value: "None", label: "None (Lvl 3)" }, ...],
            
            // 6. Spell Configuration (if caster)
            spellSchools: ["Fire", "Ice"],
            subclassSchools: { "Subclass": ["Necrotic"] },
            spellProgression: [0, 2, 4, 6, ...],
            includeUtilitySpells: createUtilityConfig(...),
            spellReplacements: [createSpellReplacement(...)],
            
            // 7. Resources
            resources: [createManaResource('int'), ...],
            
            // 8. Custom Header Stats (optional)
            customHeaderStats: [{ id: 'aura', ... }],
            
            // 9. Data References
            featuresData: XClass.FEATURES,
            optionsData: XClass.OPTIONS
        });
    }
    
    // Static data (defined outside constructor)
    static get OPTIONS() { return { ... }; }
    static get FEATURES() { return FeatureGen.generateStandardFeatures(...); }
    
    // Optional overrides (only if needed)
    getDerivedStats(level, subclass, state) { ... }
    getStatOverrides(level, subclass, state, statsMap) { ... }
    getMechanicPanelHTML(level, subclass, state, derived) { ... }
    getAvailableSpells(level, subclass, state, derived) { ... } // Only if special case
}

const CLASS_CONFIG = new XClass();
```

### 4.2 Caster vs. Non-Caster Classes

| Type | Classes | Spell Config |
|------|----------|--------------|
| **Full Caster** | Mage, Oathsworn, Shadowmancer, Shepherd, Songweaver, Stormshifter | `spellSchools`, `includeUtilitySpells` |
| **Half Caster** | Commander (Spellblade) | `spellProgression: [0, 3, 7, 11, 15]` |
| **Non-Caster** | Berserker, Cheat, Hunter, Zephyr | No spell config |

### 4.3 Custom `getAvailableSpells()` Overrides

Only 3 classes need custom overrides (legitimate reasons):

| Class | Reason |
|-------|--------|
| **Shepherd** | Paired Radiant + Necrotic utility selection (Level 3+) |
| **Songweaver** | Windbag utility selection (select 1 per school) |
| **Stormshifter** | Stormcaller utility selection (select 1 per school) |

All other casters (8 classes) use the **BaseClass default** via config.

---

## 5. Build Process

### 5.1 Builder UI (`index.html`)
The builder is a simple HTML page that:
1. Lets users select a class
2. Fetches all required files via `fetch()`
3. Concatenates them into a single JS blob
4. Injects into `base_template.html` at `<!-- INJECT_SCRIPTS -->`
5. Downloads as self-contained HTML

### 5.2 File Concatenation Order
```javascript
const engineModules = [
    'roll_engine.js',
    'feat_helpers.js',
    'panel_builder.js',
    'feature_gen.js',
    'resource_factory.js',
    'base_class.js',
    'rendering_engine.js',
    'logic.js',
    'ui_helpers.js',
    'state_manager.js',
    'main.js'
];

// Concatenation:
jsContent = coreData;       // Items, skills, conditions, etc.
jsContent += engineHelpers;  // Roll engine, feat helpers, etc.
jsContent += classData;      // Selected class file
jsContent += engineLogic;    // Rendering, logic, UI, state, main
```

### 5.3 Placeholder in Template
`base_template.html` contains:
```html
<!-- INJECT_SCRIPTS -->
```
This is replaced by the concatenated JS in `index.html`.

---

## 6. Data Flow

### 6.1 Character State (`state` object)
```javascript
state = {
    level: 1,
    ancestry: "human",
    background: "acolyte",
    subclass: "None",
    baseStr: 0, baseDex: 0, baseInt: 0, baseWil: 0,
    addStr: 0, addDex: 0, addInt: 0, addWil: 0,
    wounds: 0,
    inventory: [...],
    resourceValues: { mana: 0, loh: 0, ... },
    // Class-specific (examples):
    furyDice: [],
    judgmentDice: [],
    selectedMastery: [],
    selectedDecrees: [],
    // ...
}
```

### 6.2 Rendering Pipeline
1. **User Action** (e.g., level up, equip item)
2. **State Update** (`state_manager.js`)
3. **Recalculate** (`logic.js`):
   - `getStatsMap()`: Calculate STR, DEX, INT, WIL
   - `getDerivedStats()`: Speed, wound max, etc.
   - `getStatOverrides()`: Armor, init, etc.
4. **Render** (`rendering_engine.js`):
   - Header (armor, speed, init)
   - Attributes (STR, DEX, INT, WIL)
   - Resources (mana, LoH, etc.)
   - Mechanic Panel (`CLASS_CONFIG.getMechanicPanelHTML()`)
   - Features (`CLASS_CONFIG.getFeaturesHTML()`)
   - Spells (`CLASS_CONFIG.getAvailableSpells()`)

---

## 7. Key Design Decisions

### 7.1 Why No Build Tools?
- **Simplicity**: No npm, webpack, etc. required
- **Portability**: Works on any static file server
- **Browser-Based**: Users can run the builder directly from the file system

### 7.2 Why Configuration Over Inheritance?
- **Less Code**: 49% reduction (6,039 → 3,062 lines)
- **Maintainability**: Change once in BaseClass, affects all 11 classes
- **Consistency**: All classes follow the same patterns

### 7.3 Why `<!-- INJECT_SCRIPTS -->` Placeholder?
- **Simplicity**: No complex templating engine
- **Reliability**: Simple string replace, easy to debug
- **Flexibility**: Can inject any JS content

---

## 8. Code Health Summary

### 8.1 What's Good ✅
- **Deduplication**: No repeated spell logic across 11 classes
- **Consistency**: All classes use FeatureGen, PanelBuilder, ResourceFactory
- **Modularity**: Clear separation of engine vs. class data
- **Documentation**: This file + inline code comments

### 8.2 Remaining `addCustom()` Usage
9 files use `addCustom()` for class-specific UI (10 total calls):

| Class | Count | Purpose |
|-------|-------|---------|
| Berserker | 1 | Total Damage display |
| Cheat | 2 | Opportunist + Cunning displays |
| Commander | 1 | Tactical DC display |
| Hunter | 1 | Gain Charge info |
| Mage | 2 | Chaos/Control toggles |
| Oathsworn | 1 | Radiant DMG display |
| Stormshifter | 1 | Form selector |
| Zephyr | 1 | Iron Defense (conditional) |

**Optional**: Add `addSummaryDisplay()` and `addStatDisplay()` to PanelBuilder to eliminate these.

---

## 9. Migration Guide (For New Classes)

To add a new class:

1. **Create class file** (`class_newclass.js`):
   ```javascript
   class NewClass extends BaseClass {
       constructor() {
           super({
               name: "NewClass",
               keyStats: ['str', 'dex'],
               // ... see Section 4.1 for full config
           });
       }
       
       static get OPTIONS() { return { ... }; }
       static get FEATURES() { 
           return FeatureGen.generateStandardFeatures('STR or DEX', 'INT or WIL', false);
       }
       
       getDerivedStats(level, subclass, state) {
           return { speed: 6, woundMax: 6 };
       }
       
       getMechanicPanelHTML(level, subclass, state, derived) {
           const builder = new PanelBuilder();
           // Add resources, rolls, etc.
           return builder.build();
       }
   }
   
   const CLASS_CONFIG = new NewClass();
   ```

2. **Add to builder** (`index.html`):
   ```html
   <select id="classSelect">
       <option value="newclass">NewClass</option>
   </select>
   ```

3. **Test**: Open `index.html`, select class, download tracker.

---

## 10. References

- **Spell Data**: `src/data/json/spells.json` (SPELL_REGISTRY, UTILITY_SPELLS)
- **Item Data**: `src/data/json/items.json` (ITEM_TEMPLATES)
- **Game Data**: `src/data/json/` (ancestries, backgrounds, conditions, skills)
- **Template**: `src/base_template.html` (HTML structure + CSS)
- **Builder**: `index.html` (build + download logic)

---

**End of Architecture Documentation**
