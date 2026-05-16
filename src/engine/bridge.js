/**
 * @fileoverview SOLIDJS STATE BRIDGE
 * Bridges the legacy event-based state with SolidJS reactive primitives.
 */

// Create the reactive stores
// Note: Initial signal state is the raw defaults; loadState will immediately trigger STATE_LOADED to refresh this.
const [charState, setCharState] = Solid.createSignal(state, { equals: false });

// Computed derived stats that react to state changes
const charDerived = Solid.createMemo(() => {
    return computeDerived(charState());
});

// Subscribe to state changes to trigger reactivity
if (window.eventBus) {
    window.eventBus.subscribe('STATE_CHANGED', (data) => {
        setCharState(data.state);
    });

    window.eventBus.subscribe('STATE_LOADED', (data) => {
        setCharState(data.state);
    });
}

// Global accessor for components
window.charState = charState;
window.charDerived = charDerived;

// 4. Debug: OBR Roll Results
const [lastRollResult, setLastRollResult] = Solid.createSignal(null);
window.lastRollResult = lastRollResult;

window.addEventListener("NIMBLE_ROLL_RESULT_RECEIVED", (event) => {
    setLastRollResult(event.detail);
});

// Reactive Effects
Solid.createEffect(() => {
    const s = charState();
    const d = charDerived();
    const config = CLASS_CONFIG;

    // 1. Apply Class Theme
    if (config.theme) {
        const root = document.documentElement;
        if (config.theme.accent) root.style.setProperty('--class-accent', config.theme.accent);
        if (config.theme.accentDim) root.style.setProperty('--class-accent-dim', config.theme.accentDim);
        if (config.theme.bodyBg) root.style.setProperty('--class-body-bg', config.theme.bodyBg);
        if (config.theme.containerBg) root.style.setProperty('--class-container-bg', config.theme.containerBg);
        if (config.theme.panelBg) root.style.setProperty('--class-panel-bg', config.theme.panelBg);
        if (config.theme.border) root.style.setProperty('--class-border', config.theme.border);
    }

    // 2. Subclass Accent
    const subConfig = config.subclasses.find(sc => sc.value === s.subclass);
    document.documentElement.style.setProperty('--subclass-accent', (subConfig && subConfig.accent) ? subConfig.accent : 'var(--class-accent)');

    // 3. Document Title
    document.title = `NIMBLE — ${s.charName || 'Hero'} (${config.name})`;
});
