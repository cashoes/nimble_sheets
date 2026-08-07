/**
 * @fileoverview MAIN ENTRY POINT MODULE
 * Handles application initialization, DOM event delegation,
 * and high-level file operations (import/export).
 */

/**
 * Imports character data from a JSON file.
 * @param {HTMLInputElement} input - File input element.
 * @returns {void}
 */
const importCharacter = (input) => {
    const file = input.files?.[0];
    if (!file) {
        return; // No file selected
    }
    // Optional: validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        alert("Please select a JSON file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            dispatch({ type: 'IMPORT_STATE', payload: { newState: imported } });
            alert("Character imported successfully!");
        } catch (err) {
            console.error("Import error:", err);
            alert("Error importing character: Invalid or corrupted JSON file.");
        }
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
    };
    reader.readAsText(file);
};

/**
 * Exports the current character sheet as a standalone HTML file.
 * Injects the current state into the `#nimble-state` JSON island.
 * @returns {void}
 */
const saveAsHTML = () => {
    // Clone the live DOM (not the page itself) so exporting doesn't disturb what the user is
    // looking at, then empty every Solid mount container in the clone before serializing.
    // Solid.render() APPENDS into a non-empty container instead of replacing it, so if the
    // clone still carried the live, fully-mounted widgets, reopening the exported file would
    // render a second copy on top of that frozen (event-handler-less) snapshot — see issue #35.
    const clone = document.documentElement.cloneNode(true);
    clearSolidMountContainers(clone);

    const rawHtml = clone.outerHTML;

    // Embed the current state + an updated <title> via the pure, DOM-free embedStateIntoHTML
    // seam (src/engine/html_export.js) — no more regex-splicing raw JSON into the executable
    // <script> source, which used to (a) let a crafted charName break out of the script block,
    // (b) truncate on state text containing "};", and (c) let charName's "$&"/"$1"/etc. get
    // expanded as String.replace() replacement patterns.
    const finalHtml = embedStateIntoHTML(rawHtml, state, state.charName, CLASS_CONFIG?.name);

    // Trigger download
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nimble_${state.charName ?? 'Hero'}_${CLASS_CONFIG?.name ?? 'Unknown'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Full character reset (Safe Rest).
 */
const safeRest = () => {
    if (confirm("Perform a Safe Rest? This refills HP, Hit Dice, and all class resources.")) {
        dispatch({ type: 'REST_CHARACTER' });
    }
};

/**
 * Global Initialization on DOM Load.
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadState(CLASS_CONFIG);

        // Mount SolidJS Components
        if (window.NIMBLE_COMPONENTS) {
            const {
                Header, AttributesSection, HPTracker, WoundTracker,
                ProficiencyRow, DynamicResources, InventorySection, Skills, Conditions, CombatControls,
                FeaturesAndSpellsLayout, MechanicPanel, IdentityBar, LogFeed
            } = window.NIMBLE_COMPONENTS;

            // Defensively clear every mount container before mounting. A reopened Save-as-HTML
            // export can carry a stale, pre-rendered (event-handler-less) snapshot inside these
            // divs; Solid.render() APPENDS into a non-empty container rather than replacing it,
            // so without this every widget would visibly duplicate on every export/reopen cycle
            // (issue #35).
            clearSolidMountContainers(document);

            const mount = (id, Component) => {
                const el = document.getElementById(id);
                if (el) Solid.render(() => Solid.createComponent(Component, {}), el);
            };

            mount('solid-action-log', LogFeed);
            mount('solid-header', Header);
            mount('topBarContainer', IdentityBar);
            mount('solid-attributes', AttributesSection);
            mount('solid-hp', HPTracker);
            mount('solid-wounds', WoundTracker);
            mount('solid-proficiency', ProficiencyRow);
            mount('solid-inventory-section', InventorySection);
            mount('solid-skills', Skills);
            mount('solid-conditions', Conditions);
            mount('combatControlsContainer', CombatControls);
            mount('solid-features-spells', FeaturesAndSpellsLayout);
            mount('classMechanicPanel', MechanicPanel);
        }
    } catch (err) {
        console.error("Failed to initialize app:", err);
        alert("An error occurred while loading the character sheet. See console for details.");
    }
});

/**
 * Keyboard shortcuts for level adjustment.
 * PageUp to increase, PageDown to decrease.
 */
window.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input, textarea, or select
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (isTyping) return;

    if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        const delta = e.key === 'PageUp' ? 1 : -1;
        const currentLevel = state.level;
        const newLevel = Math.min(20, Math.max(1, currentLevel + delta));
        
        if (newLevel !== currentLevel) {
            dispatch({ type: 'SET_STATE_KEY', payload: { key: 'level', value: newLevel } });
        }
    }
});

/**
 * Mouse Wheel delegation for numeric inputs.
 * Allows rapid adjustment of HP, HD, and other number fields.
 */
window.addEventListener('wheel', (e) => {
    if (e.target.type === 'number') {
        if (e.target.disabled) return;

        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;

        // Specialized adjustment for core vitals
        if (e.target.id === 'displayCurrentHP') {
            adjHP(delta, false);
        } else if (e.target.id === 'displayTempHP') {
            adjTempHP(delta, false);
        } else if (e.target.id === 'displayHD') {
            adjHD(delta, false);
        } else {
            // General handling for standard numeric fields (Gold, Attributes, etc.)
            let val = parseInt(e.target.value || 0) + delta;
            const min = e.target.hasAttribute('min') ? parseInt(e.target.getAttribute('min')) : -Infinity;
            const max = e.target.hasAttribute('max') ? parseInt(e.target.getAttribute('max')) : Infinity;

            let newVal = Math.min(max, Math.max(min, val));
            e.target.value = newVal;
            e.target.dispatchEvent(new Event('input', { bubbles: true }));
            e.target.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}, { passive: false });
