/**
 * MAIN ENTRY POINT MODULE
 */
const debouncedSaveAndRender = debounce(() => { saveState(); render(); }, 300);
function debounce(fn, ms) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn.apply(this, args), ms); }; }

function importCharacter(input) { const file = input.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const imported = JSON.parse(e.target.result); saveState(imported); loadState(); render(); alert("Character imported successfully!"); } catch (err) { alert("Error importing character: Invalid file format."); } }; reader.readAsText(file); }
function saveAsHTML() {
    let newHtml = document.documentElement.outerHTML.replace(/const EMBEDDED_STATE = (null|{.*?});/, `const EMBEDDED_STATE = ${JSON.stringify(state)};`);
    newHtml = newHtml.replace(/<title>(.*?)<\/title>/, `<title>NIMBLE — ${state.charName || 'Hero'} (${CLASS_CONFIG.name})</title>`);
    const blob = new Blob([newHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nimble_${state.charName || 'Hero'}_${CLASS_CONFIG.name}.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => { 
    loadState(); 
    render(); 
    document.querySelectorAll('input, select').forEach(el => { 
        // Instant update for Level, Dropdowns, and Checkboxes
        if (el.id === 'level' || el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') {
            const instantUpdate = () => { saveState(); render(); };
            el.addEventListener('input', instantUpdate);
            el.addEventListener('change', instantUpdate);
        } else {
            // Debounced update for text/number fields to prevent lag while typing
            el.addEventListener('change', () => { saveState(); render(); }); 
            el.addEventListener('input', debouncedSaveAndRender); 
        }
    }); 
});

window.addEventListener('wheel', (e) => { 
    if (e.target.type === 'number') { 
        e.preventDefault(); 
        let d = e.deltaY < 0 ? 1 : -1; 
        if (e.target.id === 'displayCurrentHP') adjHP(d, false); 
        else if (e.target.id === 'displayTempHP') adjTempHP(d, false); 
        else if (e.target.id === 'displayHD') adjHD(d, false); 
        else { 
            let val = parseInt(e.target.value || 0) + d; 
            let newVal = Math.min(e.target.hasAttribute('max')?parseInt(e.target.getAttribute('max')):Infinity, Math.max(e.target.hasAttribute('min')?parseInt(e.target.getAttribute('min')):-Infinity, val)); 
            e.target.value = newVal; e.target.dispatchEvent(new Event('change')); 
        } 
    } 
}, { passive: false });
