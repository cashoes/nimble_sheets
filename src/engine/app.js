/**
 * @fileoverview MAIN ENTRY POINT MODULE
 * Handles application initialization, DOM event delegation,
 * and high-level file operations (import/export).
 */

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
const debounce = (fn, ms) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), ms);
    };
};

const debouncedSaveAndRender = debounce(() => {
    saveState();
    render();
}, 300);

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
            saveState(imported);
            loadState();
            render();
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
        loadState();
        render();
    } catch (err) {
        console.error("Failed to initialize app:", err);
        alert("An error occurred while loading the character sheet. See console for details.");
    }

    // Bind change listeners to all sheet inputs
    document.querySelectorAll('input, select').forEach(el => {
        // 1. Instant update for discrete choices (Level, Dropdowns, Toggles)
        if (el.id === 'level' || el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') {
            const instantUpdate = () => {
                saveState();
                render();
            };
            el.addEventListener('input', instantUpdate);
            el.addEventListener('change', instantUpdate);
        } else {
            // 2. Debounced update for text fields to maintain performance while typing
            el.addEventListener('change', () => {
                saveState();
                render();
            });
            el.addEventListener('input', debouncedSaveAndRender);
        }
    });
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
            e.target.dispatchEvent(new Event('change')); 
        } 
    } 
}, { passive: false });
