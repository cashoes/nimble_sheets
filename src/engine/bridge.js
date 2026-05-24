/**
 * @fileoverview SOLIDJS STATE BRIDGE
 * Bridges the legacy event-based state with SolidJS reactive primitives.
 */

// Create the reactive stores via our custom fine-grained Proxy Store engine
function createStore(initialValue) {
    const signals = new Map(); // path -> { get, set }
    const raw = JSON.parse(JSON.stringify(initialValue));

    function getSignal(path) {
        if (!signals.has(path)) {
            // Keep equals: false to ensure any modification triggers dependencies
            const [get, set] = Solid.createSignal(undefined, { equals: false });
            signals.set(path, { get, set });
        }
        return signals.get(path);
    }

    function wrap(obj, pathPrefix = "") {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        return new Proxy(obj, {
            get(target, prop) {
                if (prop === '_raw') return target;
                if (typeof prop === 'symbol') return target[prop];

                const propPath = pathPrefix ? `${pathPrefix}.${prop}` : prop;
                
                // Track dependency inside Solid's active tracking scope
                const sig = getSignal(propPath);
                sig.get();

                const value = target[prop];
                if (typeof value === 'object' && value !== null) {
                    return wrap(value, propPath);
                }
                return value;
            },
            set(target, prop, value) {
                const propPath = pathPrefix ? `${pathPrefix}.${prop}` : prop;
                const oldValue = target[prop];
                
                if (oldValue !== value) {
                    target[prop] = value;
                    const sig = getSignal(propPath);
                    sig.set(value);
                }

                // Array special rule: Setting elements or length should trigger parent and length signals
                if (Array.isArray(target)) {
                    if (pathPrefix) {
                        const parentSig = getSignal(pathPrefix);
                        parentSig.set(target);
                    }
                    const lengthSig = getSignal(pathPrefix ? `${pathPrefix}.length` : 'length');
                    lengthSig.set(target.length);
                }
                return true;
            },
            deleteProperty(target, prop) {
                const propPath = pathPrefix ? `${pathPrefix}.${prop}` : prop;
                if (prop in target) {
                    delete target[prop];
                    const sig = getSignal(propPath);
                    sig.set(undefined);
                }

                // Array special rule: Deleting elements should trigger parent and length signals
                if (Array.isArray(target)) {
                    if (pathPrefix) {
                        const parentSig = getSignal(pathPrefix);
                        parentSig.set(target);
                    }
                    const lengthSig = getSignal(pathPrefix ? `${pathPrefix}.length` : 'length');
                    lengthSig.set(target.length);
                }
                return true;
            }
        });
    }

    const storeProxy = wrap(raw);

    function updateStore(fn) {
        if (typeof fn === 'function') {
            fn(storeProxy);
        }
    }

    return [storeProxy, updateStore];
}

// In-place deep diff reconciliation engine
function reconcile(src) {
    return (target) => {
        function merge(t, s, path = "") {
            // Handle arrays explicitly
            if (Array.isArray(s) && Array.isArray(t)) {
                // 1. Reconcile matching indices
                const minLen = Math.min(s.length, t.length);
                for (let i = 0; i < minLen; i++) {
                    const subPath = path ? `${path}.${i}` : `${i}`;
                    if (typeof s[i] === 'object' && s[i] !== null) {
                        merge(t[i], s[i], subPath);
                    } else if (t[i] !== s[i]) {
                        t[i] = s[i];
                    }
                }
                
                // 2. Add extra items from source
                if (s.length > t.length) {
                    for (let i = t.length; i < s.length; i++) {
                        t.push(s[i]); // Triggers Proxy setters properly
                    }
                }
                
                // 3. Remove trailing items if source is shorter
                if (t.length > s.length) {
                    t.splice(s.length); // Splice triggers Proxy deletes and updates length perfectly
                }
                return;
            }

            if (typeof s === 'object' && s !== null && typeof t === 'object' && t !== null) {
                const sKeys = Object.keys(s);
                const tKeys = Object.keys(t);

                // Update or add keys from source
                for (const key of sKeys) {
                    const subPath = path ? `${path}.${key}` : key;
                    if (!(key in t)) {
                        t[key] = s[key]; // Triggers Proxy set
                    } else if (typeof s[key] === 'object' && s[key] !== null) {
                        merge(t[key], s[key], subPath);
                    } else if (t[key] !== s[key]) {
                        t[key] = s[key]; // Triggers Proxy set
                    }
                }

                // Delete keys not in source
                for (const key of tKeys) {
                    if (!(key in s)) {
                        delete t[key]; // Triggers Proxy deleteProperty
                    }
                }
            }
        }
        merge(target, src);
        return target;
    };
}

// Initialize Custom Store and State Getter
const [store, setStore] = createStore(state);
const charState = () => store; // 100% backward compatible signal-like getter

// Computed derived stats that react to state changes
const charDerived = Solid.createMemo(() => {
    return computeDerived(charState());
});

// Subscribe to state changes to trigger surgical in-place reconciliation
if (window.eventBus) {
    window.eventBus.subscribe('STATE_CHANGED', (data) => {
        setStore(reconcile(data.state));
    });

    window.eventBus.subscribe('STATE_LOADED', (data) => {
        setStore(reconcile(data.state));
    });
}

// Global accessor for components
window.charState = charState;
window.charDerived = charDerived;

// 4. Debug: OBR Roll Results
const [lastRollResult, setLastRollResult] = Solid.createSignal(null);
window.lastRollResult = lastRollResult;

window.addEventListener("NIMBLE_ROLL_RESULT_RECEIVED", (event) => {
    handleRollResult(event.detail);
});

// Reactive Effects
Solid.createEffect(() => {
    const s = charState();
    const d = charDerived();
    const config = CLASS_CONFIG;

    // 1. Apply Class Theme
    const root = document.documentElement;
    const activeTheme = `theme-${config.name.toLowerCase().replace(/the\s+/g, '').trim()}`;
    
    // Clean up old theme classes
    Array.from(root.classList).forEach(cls => {
        if (cls.startsWith('theme-')) root.classList.remove(cls);
    });
    root.classList.add(activeTheme);

    // 2. Subclass Accent (Hybrid Approach)
    const subConfig = config.subclasses.find(sc => sc.value === s.subclass);
    if (subConfig && subConfig.accent) {
        root.style.setProperty('--subclass-accent', subConfig.accent);
    } else {
        root.style.setProperty('--subclass-accent', 'var(--class-accent)');
    }

    // 3. Document Title
    document.title = `NIMBLE — ${s.charName || 'Hero'} (${config.name})`;
});
