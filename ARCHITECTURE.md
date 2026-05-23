# NIMBLE Tracker - Architecture Documentation

**Version**: 3.0.0  
**Date**: 2026-05-23  
**Status**: Production Ready (Modular SolidJS + Dynamic Decoupling) ✅

---

## Executive Summary

The NIMBLE Tracker is a browser-based TTRPG character sheet system. It generates **self-contained HTML files** for 11 character classes, with all JavaScript and CSS embedded at build time. 

The system utilizes **SolidJS** for high-performance, fine-grained reactive UI rendering without a Virtual DOM, ensuring the trackers remain lightweight and highly portable.

---

## 1. High-Level Architecture

```
nimble/
├── index.html                    # Builder UI & Dynamic Compiler
├── README.md                    # User documentation
├── ARCHITECTURE.md             # This file
├── src/
│   ├── base_template.html       # HTML template for trackers
│   ├── engine/                 # Shared engine modules (standard snake_case)
│   │   ├── app.js              # Entry point & mounting logic
│   │   ├── attributes.js       # Base attributes schema & visual utilities
│   │   ├── base_class.js       # BaseClass definition with spell & features configs
│   │   ├── bridge.js           # SolidJS reactive state bridge
│   │   ├── core.js             # Core rules calculations
│   │   ├── event_bus.js        # Pub-sub system for decoupled event triggers
│   │   ├── features.js         # Feature card formatting & rendering logic
│   │   ├── rolls.js            # Extensible dice rolling engine & hooks
│   │   ├── solid.js            # SolidJS + HTM Runtime (bundled)
│   │   ├── state.js            # State persistence, budgets, & reducer logic
│   │   ├── typedefs.js         # Type definitions (CharacterState, etc.)
│   │   ├── ui.js               # MechanicPanel structured builder & triggers
│   │   └── components/         # 18 Modular Single-Responsibility SolidJS Components
│   │       ├── action_pip.js
│   │       ├── attribute_card.js
│   │       ├── combat_controls.js
│   │       ├── conditions.js
│   │       ├── die.js
│   │       ├── exports.js
│   │       ├── features.js
│   │       ├── header.js
│   │       ├── helpers.js
│   │       ├── hp_tracker.js
│   │       ├── identity_bar.js
│   │       ├── inventory.js
│   │       ├── log_feed.js
│   │       ├── mechanic_panel.js
│   │       ├── number_spinner.js
│   │       ├── skills.js
│   │       ├── spell_card.js
│   │       └── wound_tracker.js
│   ├── data/                   # Dynamic Class Configuration Files
│   │   ├── class_berserker.js
│   │   ├── ...
│   └── data/json/              # Relational Game Data Databases
│       ├── ancestries.json
│       ├── backgrounds.json
│       ├── conditions.json
│       ├── items.json
│       ├── skills.json
│       └── spells.json
```

---

## 2. Core Design Principles

### 2.1 Self-Contained Output
- **Single HTML file**: Each tracker compiles into a completely standalone HTML file.
- **No external dependencies**: Bundles the SolidJS runtime and local assets, requiring only standard browser support.

### 2.2 Unidirectional & Reactive Data Flow
The system follows a strict unidirectional state management pattern:
1. **User Action**: Triggered via DOM event or component method.
2. **Dispatch**: Action dispatched globally via `dispatch({ type, payload })`.
3. **Reducer**: `characterReducer` in `state.js` produces a new immutable state.
4. **Publish**: eventBus notifies subscribers (e.g. `STATE_CHANGED`).
5. **Bridge**: `bridge.js` updates SolidJS reactive signals (`charState`).
6. **Reactive Render**: Modular components under `components/` automatically re-render target nodes.

### 2.3 Configuration Over Inheritance (Decoupling)
Classes declare **what they are** (declarative configs, subclass overrides, resources, and custom hooks) rather than overriding engine code. The core engine exposes generic hooks (`onTogglePip`, `onSafeRest`, `getUpcastBonus`, `poolOverrides.allowExplode`) which classes hook into to execute custom rules dynamically.

---

## 3. Engine Modules (Detailed)

### 3.1 State Bridge (`src/engine/bridge.js`)
**Purpose**: Connects the legacy event-driven state to SolidJS reactivity.
- Maintains global reactive signals: `charState` (the active character state) and `charDerived` (calculated memos).
- Automatically publishes state updates on global transitions.

### 3.2 UI Component Folder (`src/engine/components/`)
**Purpose**: De-monolhed SolidJS + HTM component library.
- Completely deleted legacy monolithic `components.js` and split UI elements into 18 highly cohesive, single-responsibility files under `src/engine/components/`.
- Flat features are dynamically split and balanced using a **predictive max-potential weight-balancing algorithm** that guarantees 100% stable spatial positioning for players with visual column symmetry.

### 3.3 State Manager (`src/engine/state.js`)
**Purpose**: The central mathematical engine and rule coordinator.
- **Proactive Budget Guard**: Under `SET_STATE_KEY`, the reducer intercepts all attribute point allocations and clamps increments to the remaining level budget, preventing point-stealing side-effects in the UI.
- `computeDerived`: Evaluates level-dependent derived statistics dynamically.
- `validateAndCorrectState`: Fallback state correction and level-down/import budget integrity coordinator.

---

## 4. Key Design Decisions

### 4.1 Why SolidJS?
- **Performance**: High-performance fine-grained updates without Virtual DOM overhead.
- **Size**: Extremely lightweight footprint (~30kb).
- **Portability**: Perfect fit for generating single-file self-contained character trackers.

### 4.2 Why HTM (Hyperscript Tagged Markup)?
- **No Build Step**: Native ES template strings compile to real DOM operations at runtime, enabling standard browsers to execute UI builds without node bundlers.

---

**End of Architecture Documentation**
