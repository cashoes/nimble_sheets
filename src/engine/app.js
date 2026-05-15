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
 * Injects the current state into the EMBEDDED_STATE variable.
 * @returns {void}
 */
const saveAsHTML = () => {
    const newHtml = document.documentElement.outerHTML;
    
    // Inject current state into the template placeholder
    const updatedHtml = newHtml.replace(
        /const EMBEDDED_STATE = (null|{.*?});/, 
        `const EMBEDDED_STATE = ${JSON.stringify(state)};`
    );
    
    // Update document title for the exported file
    const titledHtml = updatedHtml.replace(
        /<title>(.*?)<\/title>/, 
        `<title>NIMBLE — ${state.charName ?? 'Hero'} (${CLASS_CONFIG?.name ?? 'Unknown'})</title>`
    );
    
    // Trigger download
    const blob = new Blob([titledHtml], { type: 'text/html' });
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
                FeaturesAndSpellsLayout, MechanicPanel, IdentityBar
            } = window.NIMBLE_COMPONENTS;

            const headerMount = document.getElementById('solid-header');
            if (headerMount) Solid.render(() => Solid.createComponent(Header, {}), headerMount);

            const identityMount = document.getElementById('topBarContainer');
            if (identityMount) Solid.render(() => Solid.createComponent(IdentityBar, {}), identityMount);

            const attrMount = document.getElementById('solid-attributes');
            if (attrMount) Solid.render(() => Solid.createComponent(AttributesSection, {}), attrMount);

            Solid.render(() => Solid.createComponent(HPTracker, {}), document.getElementById('solid-hp'));
            Solid.render(() => Solid.createComponent(WoundTracker, {}), document.getElementById('solid-wounds'));
            Solid.render(() => Solid.createComponent(ProficiencyRow, {}), document.getElementById('solid-proficiency'));
            Solid.render(() => Solid.createComponent(DynamicResources, {}), document.getElementById('solid-resources'));
            Solid.render(() => Solid.createComponent(InventorySection, {}), document.getElementById('solid-inventory-section'));
            Solid.render(() => Solid.createComponent(Skills, {}), document.getElementById('solid-skills'));
            Solid.render(() => Solid.createComponent(Conditions, {}), document.getElementById('solid-conditions'));
            Solid.render(() => Solid.createComponent(CombatControls, {}), document.getElementById('combatControlsContainer'));
            Solid.render(() => Solid.createComponent(FeaturesAndSpellsLayout, {}), document.getElementById('solid-features-spells'));
            Solid.render(() => Solid.createComponent(MechanicPanel, {}), document.getElementById('classMechanicPanel'));
        }
    } catch (err) {
        console.error("Failed to initialize app:", err);
        alert("An error occurred while loading the character sheet. See console for details.");
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
