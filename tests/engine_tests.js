const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const WORKSPACE_DIR = path.resolve(__dirname, '..');

// Helper to load engine files and data into a mock browser sandboxed context
function createSandbox(className) {
    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        Date: { now: () => 1700000000000 },
        // Browser & UI Mocks
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        },
        document: {
            addEventListener: () => {},
            getElementById: () => null,
            documentElement: {
                className: '',
                classList: {
                    add: (c) => { 
                        if (!sandbox.document.documentElement.className.includes(c)) {
                            sandbox.document.documentElement.className += ' ' + c; 
                        }
                    },
                    remove: (c) => { 
                        sandbox.document.documentElement.className = sandbox.document.documentElement.className.replace(c, '').trim(); 
                    }
                },
                style: {
                    setProperty: () => {}
                }
            }
        },
        window: {
            addEventListener: () => {},
            dispatchEvent: () => {},
            location: {
                pathname: '/nimble_tracker_hunter_v3.0.0.html'
            }
        },
        CustomEvent: class {},
        // UI Action Handlers (to be bound by core.js / state.js)
        dispatch: null,
        charState: null,
        charDerived: null,
        CLASS_CONFIG: null,
        ITEM_TEMPLATES: {},
        SKILL_LIST: []
    };

    vm.createContext(sandbox);

    // 1. Load Data JSONs
    const itemsJson = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', 'json', 'items.json'), 'utf8');
    const skillsJson = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', 'json', 'skills.json'), 'utf8');
    const conditionsJson = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', 'json', 'conditions.json'), 'utf8');
    const ancestriesJson = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', 'json', 'ancestries.json'), 'utf8');
    const backgroundsJson = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', 'json', 'backgrounds.json'), 'utf8');
    const spellsJson = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', 'json', 'spells.json'), 'utf8');

    const ancestries = JSON.parse(ancestriesJson);
    const backgrounds = JSON.parse(backgroundsJson);
    const spells = JSON.parse(spellsJson);

    vm.runInContext(`ITEM_TEMPLATES = ${itemsJson};`, sandbox);
    vm.runInContext(`SKILL_LIST = ${skillsJson};`, sandbox);
    vm.runInContext(`const CONDITIONS_LIST = ${conditionsJson};`, sandbox);
    vm.runInContext(`const ANCESTRIES = ${JSON.stringify(ancestries.categories)};`, sandbox);
    vm.runInContext(`const ANCESTRY_FEATURES = ${JSON.stringify(ancestries.features)};`, sandbox);
    vm.runInContext(`const BACKGROUNDS = ${JSON.stringify(backgrounds.categories)};`, sandbox);
    vm.runInContext(`const BACKGROUND_FEATURES = ${JSON.stringify(backgrounds.features)};`, sandbox);
    vm.runInContext(`const UTILITY_SPELLS = ${JSON.stringify(spells.utility)};`, sandbox);
    vm.runInContext(`const SPELL_REGISTRY = ${JSON.stringify(spells.registry)};`, sandbox);

    // 2. Load Core Engine Files
    const engineModules = [
        'solid.js', 'attributes.js', 'rolls.js', 'features.js', 'ui.js', 'core.js', 'base_class.js', 
        'event_bus.js'
    ];
    engineModules.forEach(m => {
        const code = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'engine', m), 'utf8');
        vm.runInContext(code, sandbox, { filename: m });
    });

    // 3. Load Target Class Configuration
    let classCode = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'data', `class_${className}.js`), 'utf8');
    classCode += `
        window.CLASS_CONFIG = CLASS_CONFIG;
        this.CLASS_CONFIG = CLASS_CONFIG;
    `;
    vm.runInContext(classCode, sandbox, { filename: `class_${className}.js` });

    // 4. Load Engine Logic and Bridge
    const remainingModules = ['state.js', 'bridge.js'];
    remainingModules.forEach(m => {
        const code = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'engine', m), 'utf8');
        vm.runInContext(code, sandbox, { filename: m });
    });

    // Run loadState to initialize starting health, resource pools, and validations
    sandbox.loadState(sandbox.CLASS_CONFIG);

    // Expose window getters directly on the sandbox root for convenient destructuring
    sandbox.charState = sandbox.window.charState;
    sandbox.charDerived = sandbox.window.charDerived;

    return sandbox;
}

// Main Runner
function runTests() {
    console.log("🚀 Starting NIMBLE Sheets engine tests...");

    // Test across a sample class (e.g. Hunter)
    const ctx = createSandbox('hunter');
    const { dispatch, charState, charDerived } = ctx;

    // Set high level so we can test larger skill budgets
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: 20 } });

    // --- TEST 1: HP Reduction & Wounds Transition ---
    console.log("  [HP & Wounds] Testing HP reduction to 0 and Wounds award...");
    const maxHP = charDerived().maxHP;
    assert.strictEqual(charState().hpCurrent, maxHP, "Starting HP should be at max");
    assert.strictEqual(charState().wounds, 0, "Starting wounds should be 0");

    // Take partial damage
    dispatch({ type: 'ADJ_HP', payload: { amount: -5, isAbsolute: false } });
    assert.strictEqual(charState().hpCurrent, maxHP - 5, "HP should decrease by 5");
    assert.strictEqual(charState().wounds, 0, "Wounds should still be 0");

    // Take lethal damage (drops to 0)
    dispatch({ type: 'ADJ_HP', payload: { amount: -maxHP, isAbsolute: false } });
    assert.strictEqual(charState().hpCurrent, 0, "HP should be exactly 0");
    assert.strictEqual(charState().wounds, 2, "Transitioning HP to 0 should award exactly 2 wounds");
    const isDying = (charState().hpCurrent ?? charDerived().maxHP) === 0;
    assert.ok(isDying, "Should be in dying condition");

    // Heal character back
    dispatch({ type: 'ADJ_HP', payload: { amount: maxHP, isAbsolute: true } });
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'wounds', value: 0 } });
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'activeConditions', value: [] } });

    // --- TEST 2: Skill Point Budget Clamping ---
    console.log("  [Skill Budgets] Testing skill point limit budget clamping...");
    // A level 20 character has a budget of 4 + (20 - 1) = 23 skill points.
    // Resetting skills to 0
    ctx.SKILL_LIST.forEach(s => {
        dispatch({ type: 'UPDATE_SKILL', payload: { id: s.id, val: 0 } });
    });
    // Add 12 to Might (max for a single skill)
    dispatch({ type: 'UPDATE_SKILL', payload: { id: 'might', val: 12 } });
    assert.strictEqual(charState().skills['might'], 12, "Might should be set to 12");

    // Add 12 to Arcana (which should clamp to remaining budget of 11: 23 total budget - 12 spent)
    dispatch({ type: 'UPDATE_SKILL', payload: { id: 'arcana', val: 12 } });
    assert.strictEqual(charState().skills['arcana'], 11, "Arcana should be clamped to 11 to respect total skill budget");

    // --- TEST 3: Armor Proficiency Checking ---
    console.log("  [Armor Proficiency] Testing equipped armor proficiency warnings...");
    dispatch({
        type: 'ADD_ITEM', payload: {
            item: {
                id: 999,
                name: 'Heavy Plate Custom',
                type: 'armor',
                category: 'Plate',
                equipped: true,
                isCustom: true
            }
        }
    });
    // Hunter is not proficient in heavy plate; assert warning triggers
    assert.strictEqual(charDerived().hasNonProficientEquipped, true, "Heavy Plate should trigger non-proficient check");

    // Remove heavy plate
    dispatch({ type: 'DELETE_ITEM', payload: { id: 999 } });

    // Test Oathsworn proficiency for Plate & Shields
    const oathCtx = createSandbox('oathsworn');
    oathCtx.dispatch({
        type: 'ADD_ITEM', payload: {
            item: {
                id: 888,
                name: 'Plate Armor',
                type: 'armor',
                category: 'Plate',
                equipped: true
            }
        }
    });
    oathCtx.dispatch({
        type: 'ADD_ITEM', payload: {
            item: {
                id: 777,
                name: 'Shield',
                type: 'shield',
                category: 'Shields',
                equipped: true
            }
        }
    });
    assert.strictEqual(oathCtx.charDerived().hasNonProficientEquipped, false, "Oathsworn should be proficient in Plate and Shields");


    // --- TEST 4: Dynamic Level Resources & Safe Rest ---
    console.log("  [Dynamic Resources] Testing level scaling and Safe Rest resets...");
    // Load Mage class to test dynamic Mana resource pool
    const mageCtx = createSandbox('mage');
    mageCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: 20 } }); // high level to gain maximum Mana
    const maxMana = mageCtx.charDerived().resourceMaxes['mana'];
    assert.ok(maxMana > 0, "Mage should have positive maximum Mana at level 20");
    
    // Spend Mana
    mageCtx.dispatch({ type: 'ADJ_RES', payload: { id: 'mana', amount: -maxMana, isAbsolute: true } }); // Set to 0
    mageCtx.dispatch({ type: 'ADJ_RES', payload: { id: 'mana', amount: 2, isAbsolute: false } }); // Set to 2
    assert.strictEqual(mageCtx.charState().resourceValues['mana'], 2, "Current Mana should drop to 2");

    // Safe Rest should refill Mana completely
    mageCtx.dispatch({ type: 'REST_CHARACTER', payload: {} });
    assert.strictEqual(mageCtx.charState().resourceValues['mana'], maxMana, "Safe Rest should refill Mana to full");

    // --- TEST 5: Active Conditions Derived State Math ---
    console.log("  [Active Conditions] Testing speed and action derived modifiers...");
    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'activeConditions', value: ['slowed'] } });
    assert.strictEqual(charDerived().speed, 3, "Speed of 6 should be halved (3) by Slowed condition");

    dispatch({ type: 'SET_STATE_KEY', payload: { key: 'activeConditions', value: ['dazed'] } });
    assert.strictEqual(charDerived().maxActions, 2, "Max Actions should be reduced from 3 to 2 by Dazed condition");

    // --- TEST 6: Exploding Dice Roller Engine ---
    console.log("  [Explodes Engine] Testing custom exploding dice rolls...");
    // In NIMBLE, _rollDie is a recursive function. Let's mock Math.random inside the VM context to return:
    // First call: 0.999 (results in 6 on a d6, triggering explode)
    // Second call: 0.5 (results in 3 on a d6, stopping explode)
    vm.runInContext(`
        const originalRandom = Math.random;
        let randomCount = 0;
        Math.random = () => {
            randomCount++;
            return randomCount === 1 ? 0.999 : 0.5;
        };
        this.__rollResult = _rollDie(6, true, 1);
        Math.random = originalRandom;
    `, ctx);

    const rollResult = ctx.__rollResult;
    assert.strictEqual(rollResult.total, 10, "Die should explode to a total of 6 + 4 = 10");
    assert.strictEqual(rollResult.detail, "6!! + 4", "Die detail should accurately record recursion sequence");

    // --- TEST 7: BaseClass allowlist wires onSafeRest/onTogglePip/onRollResult/protectedPips/getUpcastBonus ---
    console.log("  [BaseClass] Testing config hooks aren't silently dropped by the constructor allowlist...");
    vm.runInContext(`
        const __probe = new BaseClass({
            name: 'Probe', onSafeRest: () => 'safeRest', onTogglePip: () => 'togglePip',
            onRollResult: () => 'rollResult', protectedPips: ['uProbe'], getUpcastBonus: () => 1
        });
        this.__probeResult = {
            hasOnSafeRest: typeof __probe.onSafeRest === 'function',
            hasOnTogglePip: typeof __probe.onTogglePip === 'function',
            hasOnRollResult: typeof __probe.onRollResult === 'function',
            protectedPips: __probe.protectedPips,
            hasGetUpcastBonus: typeof __probe.getUpcastBonus === 'function'
        };
    `, ctx);
    const probeResult = ctx.__probeResult;
    assert.strictEqual(probeResult.hasOnSafeRest, true, "onSafeRest must survive the BaseClass constructor allowlist, not be silently dropped to undefined");
    assert.strictEqual(probeResult.hasOnTogglePip, true, "onTogglePip must survive the BaseClass constructor allowlist");
    assert.strictEqual(probeResult.hasOnRollResult, true, "onRollResult must survive the BaseClass constructor allowlist");
    assert.deepStrictEqual(Array.from(probeResult.protectedPips), ['uProbe'], "protectedPips must survive the BaseClass constructor allowlist");
    assert.strictEqual(probeResult.hasGetUpcastBonus, true, "getUpcastBonus must survive the BaseClass constructor allowlist");

    // --- TEST 8: Oathsworn's Radiant Aura decree pips are protected from encounter-start refill ---
    console.log("  [Oathsworn] Testing uRadiant decree pips stay drained on START_COMBAT...");
    const oathswornCtx = createSandbox('oathsworn');
    oathswornCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'uRadiant', value: [0, 0] } });
    oathswornCtx.dispatch({ type: 'START_COMBAT', payload: {} });
    assert.deepStrictEqual(Array.from(oathswornCtx.charState().uRadiant), [0, 0], "uRadiant (Radiant Aura, Safe-Rest-only) must stay drained through START_COMBAT, not silently refill like a per-encounter power");

    // --- TEST 9: Shadowmancer's Abyssal Depths uGlacial is protected from encounter-start refill ---
    console.log("  [Shadowmancer] Testing uGlacial (Glacial Resilience, 1/Safe Rest) stays drained on START_COMBAT...");
    const smGlacialCtx = createSandbox('shadowmancer');
    smGlacialCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'uGlacial', value: 0 } });
    smGlacialCtx.dispatch({ type: 'START_COMBAT', payload: {} });
    assert.strictEqual(smGlacialCtx.charState().uGlacial, 0, "uGlacial (Glacial Resilience, Safe-Rest-only) must stay drained through START_COMBAT, not silently refill like a per-encounter power");

    // --- TEST 10: protectedPips coverage gaps (Stormshifter class pip, Dragonborn ancestry pip) ---
    console.log("  [protectedPips] Testing Stormshifter uShift and Dragonborn uDraconic stay drained on START_COMBAT...");
    const stormCtx = createSandbox('stormshifter');
    stormCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'uShift', value: 0 } });
    stormCtx.dispatch({ type: 'START_COMBAT', payload: {} });
    assert.strictEqual(stormCtx.charState().uShift, 0, "Stormshifter's uShift (Safe-Rest-only) must stay drained through START_COMBAT");

    const dragonbornCtx = createSandbox('hunter');
    dragonbornCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'ancestry', value: 'Dragonborn' } });
    dragonbornCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'uDraconic', value: 0 } });
    dragonbornCtx.dispatch({ type: 'START_COMBAT', payload: {} });
    assert.strictEqual(dragonbornCtx.charState().uDraconic, 0, "Dragonborn's ancestry-owned uDraconic (recharges on Safe Rest/Wound, never encounter start) must stay drained through START_COMBAT");

    // --- TEST 11: A Level edit no longer drains attribute allocations to fit the new budget ---
    console.log("  [Level Edit] Testing a level-down does not destroy over-budget attribute allocations...");
    const berserkerCtx = createSandbox('berserker');
    berserkerCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: 20 } });
    berserkerCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'addStr', value: 3 } });
    berserkerCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'addDex', value: 2 } });
    berserkerCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'addWil', value: 2 } });
    // Single level-down dispatch (the same action the Level field commits on change/blur).
    berserkerCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: 12 } });
    assert.strictEqual(berserkerCtx.charState().addStr, 3, "addStr must not be drained by a level-down, even if now over budget");
    assert.strictEqual(berserkerCtx.charState().addDex, 2, "addDex must not be drained by a level-down, even if now over budget");
    assert.strictEqual(berserkerCtx.charState().addWil, 2, "addWil must not be drained by a level-down, even if not itself over budget");

    // --- TEST 12: A marked import preserves a wounded character's real vitals ---
    console.log("  [Import] Testing an already-initialized import is not full-healed on load...");
    const importCtx = createSandbox('hunter');
    importCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: 8 } });
    const importedState = { ...importCtx.charState(), level: 8, hpCurrent: 13, vitalsInitialized: true };
    importCtx.dispatch({ type: 'IMPORT_STATE', payload: { newState: importedState } });
    assert.strictEqual(importCtx.charState().hpCurrent, 13, "an already-marked-initialized import's real (wounded) hpCurrent must be preserved verbatim, not silently corrected to full HP");

    // --- TEST 13: bridge.js reconcile() replaces a null array slot with a refilled object ---
    console.log("  [Bridge] Testing reconcile() replaces a null pool-die slot instead of no-op'ing...");
    vm.runInContext(`
        const __t = { pool: [null, { active: 1 }] };
        const __s = { pool: [{ active: 1 }, { active: 1 }] };
        reconcile(__s)(__t);
        this.__reconcileResult = __t.pool[0];
    `, ctx);
    assert.ok(ctx.__reconcileResult && ctx.__reconcileResult.active === 1, "a null array slot (e.g. a spent dice-pool die) must be replaced by the refilled source object, not silently left null");

    // --- TEST 14: A self-referential "replaces" no longer deletes its own feature ---
    console.log("  [Features] Testing a feature whose replaces list names its own id still renders...");
    vm.runInContext(`
        const __featuresRef = { core: { 1: [{ id: 'quick_read', replaces: ['quick_read'], name: 'Quick Read' }] }, subclasses: {} };
        const __html = defaultGetFeaturesHTML(1, 'None', {}, {}, (title) => title, (t) => t, (t) => t, (t) => t, __featuresRef, {}, {});
        this.__selfReplaceResult = __html;
    `, ctx);
    assert.ok(ctx.__selfReplaceResult.includes('Quick Read'), "a feature whose own replaces list names its own id must still render, not be silently deleted alongside every other feature sharing that id");

    // --- TEST 15: ADD_QUICK_ITEM keeps the library item's own category ---
    console.log("  [Inventory] Testing ADD_QUICK_ITEM prefers the library item's own category...");
    const quickItemCtx = createSandbox('hunter');
    quickItemCtx.dispatch({
        type: 'ADD_QUICK_ITEM',
        payload: { itemData: { name: 'Dagger', type: 'melee', category: 'DEX 1H', cost: 0 }, category: 'melee' }
    });
    const addedItem = quickItemCtx.charState().inventory.find(i => i.name === 'Dagger');
    assert.strictEqual(addedItem.category, 'DEX 1H', "ADD_QUICK_ITEM must keep the library item's own category (DEX 1H), not fall back to the caller's guessed/generic category (melee)");

    // --- TEST 16: A localStorage write failure does not freeze dispatch ---
    console.log("  [Storage] Testing a failed localStorage write does not throw / freeze dispatch...");
    const storageCtx = createSandbox('hunter');
    const originalSetItem = storageCtx.localStorage.setItem;
    storageCtx.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    let dispatchThrew = false;
    try {
        storageCtx.dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: 5 } });
    } catch (e) {
        dispatchThrew = true;
    }
    assert.strictEqual(dispatchThrew, false, "a localStorage write failure must not escape as an uncaught exception and freeze dispatch");
    assert.strictEqual(storageCtx.charState().level, 5, "the in-memory state must still update even when the storage write behind it fails");
    storageCtx.localStorage.setItem = originalSetItem;

    console.log("✅ All NIMBLE Sheets engine unit tests passed successfully!");
}

runTests();
