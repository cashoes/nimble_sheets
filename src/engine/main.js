/**
 * MAIN ENTRY POINT MODULE
 * Handles application initialization, DOM event delegation,
 * and high-level file operations (import/export).
 */

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce.
 * @param {number} ms - Delay in milliseconds.
 */
function debounce(fn, ms) { 
    let timeout; 
    return (...args) => { 
        clearTimeout(timeout); 
        timeout = setTimeout(() => fn.apply(this, args), ms); 
    }; 
}

const debouncedSaveAndRender = debounce(() => { 
    saveState(); 
    render(); 
}, 300);

/**
 * Imports character data from a JSON file.
 * @param {HTMLInputElement} input - File input element.
 */
function importCharacter(input) { 
    const file = input.files[0]; 
    if (!file) return; 
    
    const reader = new FileReader(); 
    reader.onload = (e) => { 
        try { 
            const imported = JSON.parse(e.target.result); 
            saveState(imported); 
            loadState(); 
            render(); 
            alert("Character imported successfully!"); 
        } catch (err) { 
            alert("Error importing character: Invalid file format."); 
        } 
    }; 
    reader.readAsText(file); 
}

/**
 * Exports the current character sheet as a standalone HTML file.
 * Injects the current state into the EMBEDDED_STATE variable.
 */
function saveAsHTML() {
    let newHtml = document.documentElement.outerHTML;
    
    // Inject current state into the template placeholder
    newHtml = newHtml.replace(
        /const EMBEDDED_STATE = (null|{.*?});/, 
        `const EMBEDDED_STATE = ${JSON.stringify(state)};`
    );
    
    // Update document title for the exported file
    newHtml = newHtml.replace(
        /<title>(.*?)<\/title>/, 
        `<title>NIMBLE — ${state.charName || 'Hero'} (${CLASS_CONFIG.name})</title>`
    );
    
    // Trigger download
    const blob = new Blob([newHtml], { type: 'text/html' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    
    a.href = url; 
    a.download = `nimble_${state.charName || 'Hero'}_${CLASS_CONFIG.name}.html`; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
}

/**
 * Global Initialization on DOM Load.
 */
document.addEventListener('DOMContentLoaded', () => { 
    loadState(); 
    render(); 
    
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
