/**
 * @fileoverview SOLIDJS COMPONENTS - HELPERS
 * Shared helper utilities for the UI rendering layer.
 */

const {
    html,
    createComponent: createComp
} = Solid;

/**
 * Helper to handle textarea auto-resize without inline dots.
 */
function handleAutoResize(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

/**
 * Wraps key mechanical terms in a highlighting span for better visibility.
 */
function highlightMechanicalTerms(text) {
    if (!text) return "";
    let processed = text;
    
    // 1. Highlight standard properties (Term: Value OR Value Term)
    // Supports Reach, Range, Line, DC, Armor, Damage, Actions, Targets, Allies, Area, Temp HP, HP, Advantage, Minutes, Rounds, Turns, Spaces, Feet
    const terms = "Reach|Range|Line|DC|Armor|Damage|Actions?|Targets?|Allies?|Area|Temp\\s+HP|HP|Advantage|Minutes?|Rounds?|Turns?|Spaces?|Feet";
    
    // Strict greedy value pattern (Dice w/ modifiers, Table rolls, Math, Stat tokens, Placeholders, Keywords)
    // Now explicitly includes kh/kl/dh/dl/! and table roll prefixes to avoid splitting
    const valPattern = `(?:(?:\\d+d\\d+|t\\d+)(?:kh\\d*|kl\\d*|dh\\d*|dl\\d*|!|\\s*[\\+\\-]\\s*(?:\\d+|STR|DEX|INT|WIL|KEY|LVL))*|(?:\\d+|STR|DEX|INT|WIL|KEY|LVL)(?:\\s*[\\+\\-]\\s*(?:\\d+|STR|DEX|INT|WIL|KEY|LVL))+|{.*?}|(?:Cone|Line|AoE)\\s*[\\d{}x\\+]+|AoE|Self|Single|[+-]?\\d+(?:\\.\\d+)?|[\\d+x/]+)`;
    
    // Pattern A: Term: Value (Preserving separator)
    const regA = new RegExp(`\\b(${terms})\\b(:?\\s*)(${valPattern})`, 'gi');
    processed = processed.replace(regA, (match, p1, p2, p3) => `<span class="prop-hl">${p1}${p2}${p3}</span>`);

    // Pattern B: Value [Adjective] Term
    const regB = new RegExp(`(${valPattern})\\s+(?:[\\w-]+\\s+)?\\b(${terms})\\b`, 'gi');
    processed = processed.replace(regB, (match, p1, p2) => {
        if (match.includes('class="prop-hl"')) return match;
        return `<span class="prop-hl">${match}</span>`;
    });

    return processed;
}
