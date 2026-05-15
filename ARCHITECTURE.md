# NIMBLE Tracker - Architecture Documentation

**Version**: 2.2.4  
**Date**: 2026-05-13  
**Status**: Production Ready (SolidJS Refactor) ✅

---

## Executive Summary

The NIMBLE Tracker is a browser-based TTRPG character sheet system. It generates **self-contained HTML files** for 11 character classes, with all JavaScript and CSS embedded at build time. 

The system utilizes **SolidJS** for high-performance, fine-grained reactive UI rendering without a Virtual DOM, ensuring the trackers remain lightweight and highly portable.

---

## 1. High-Level Architecture

```
nimble/
├── index.html                    # Builder UI
├── README.md                    # User documentation
├── ARCHITECTURE.md             # This file
├── src/
│   ├── base_template.html       # HTML template for trackers
│   ├── engine/                 # Shared engine modules
│   │   ├── app.js              # Entry point & mounting logic
│   │   ├── bridge.js           # SolidJS reactive state bridge
│   │   ├── components.js       # Core UI components (SolidJS + HTM)
│   │   ├── core.js             # BaseClass with spell config
│   │   ├── eventBus.js         # Pub-sub system for decoupling
│   │   ├── typedefs.js         # Type definitions (CharacterState, etc.)
│   │   ├── features.js         # Feature definition & rendering
│   │   ├── ui.js               # MechanicPanel structured builder
│   │   ├── view.js             # Legacy rendering (deprecated shim)
│   │   ├── rolls.js            # Dice rolling engine
│   │   ├── solid.js            # SolidJS + HTM Runtime (bundled)
│   │   └── state.js            # State persistence & logic
│   ├── data/                   # Class definitions
│   │   ├── class_berserker.js
│   │   ├── ...
│   └── data/json/              # Game data
│       ├── ancestries.json
│       ├── backgrounds.json
│       ├── conditions.json
│       ├── items.json
│       ├── skills.json
│       └── spells.json
└── src/extensions/             # Browser extension (optional)
```

---

## 2. Core Design Principles

### 2.1 Self-Contained Output
- **Single HTML file**: Each tracker is a complete, standalone HTML file.
- **No external dependencies**: Pure vanilla JS + bundled SolidJS runtime + Google Fonts.

### 2.2 Unidirectional & Reactive Data Flow
The system follows a predictable state management pattern:
1. **User Action**: Triggered via DOM event or component method.
2. **Dispatch**: Action sent to `dispatch({ type, payload })`.
3. **Reducer**: `characterReducer` in `state.js` produces a new state.
4. **Publish**: `eventBus` notifies subscribers (e.g., `STATE_CHANGED`).
5. **Bridge**: `bridge.js` updates Solid signals (`charState`).
6. **Reactive Render**: Solid components in `components.js` automatically re-render changed nodes.

### 2.3 Configuration Over Inheritance
Classes declare **what they are** (config), not **how to do things** (logic).

---

## 3. Engine Modules (Detailed)

### 3.1 State Bridge (`src/engine/bridge.js`)
**Purpose**: Connects the legacy event-driven state to SolidJS reactivity.
- Creates `charState` signal and `charDerived` memo.
- Subscribes to `eventBus` to synchronize signals with global state.
- Handles global effects like theme application and subclass availability.

### 3.2 UI Components (`src/engine/components.js`)
**Purpose**: Reactive UI library using SolidJS and HTM (Hyperscript Tagged Markup).
- **Core**: `<Header />`, `<AttributesSection />`, `<HPTracker />`, etc.
- **Dynamic**: `<MechanicPanel />` renders structured data from the builder.
- **Lists**: `<Inventory />`, `<Skills />`, `<FeaturesAndSpellsLayout />`.

### 3.3 Mechanic Builder (`src/engine/ui.js`)
**Purpose**: Structured API for class-specific UI.
- Methods (`addResource`, `addDicePool`, etc.) now return **structured data objects** instead of HTML strings.
- Allows classes to remain 100% config-driven while benefiting from component-based rendering.

### 3.4 State Manager (`src/engine/state.js`)
**Purpose**: The source of truth and game logic.
- `characterReducer`: The only place where state is mutated.
- `computeDerived`: Mathematical engine converting state into `DerivedStats`.
- `ensureValidState` & `validateAndCorrectState`: Automated data integrity and rule enforcement.

---

## 4. Character State Flow

1. **Load**: `loadState()` fetches from `localStorage` or `EMBEDDED_STATE`.
2. **Init**: `eventBus.publish('STATE_LOADED')` triggers initial sync.
3. **Loop**:
   - `input` event -> `dispatch({ type: 'UPDATE_DOM_VALUES' })`.
   - `characterReducer` calculates new state.
   - `saveState()` persists to `localStorage`.
   - `eventBus.publish('STATE_CHANGED')` -> `bridge.js` updates Solid signals -> UI re-renders.

---

## 5. Key Design Decisions

### 5.1 Why SolidJS?
- **Performance**: Fine-grained reactivity means no Virtual DOM overhead.
- **Size**: Small footprint (bundled with HTM at ~30kb).
- **Portability**: Compiles directly to DOM operations, perfect for single-file trackers.

### 5.2 Why HTM (Hyperscript Tagged Markup)?
- **No Build Step**: Allows writing JSX-like syntax directly in vanilla JS strings.
- **Readability**: Keeps component code declarative and visual.

---

## 6. References

- **Spell Data**: `src/data/json/spells.json`
- **Item Data**: `src/data/json/items.json`
- **Template**: `src/base_template.html`
- **Builder**: `index.html`

---

**End of Architecture Documentation**
