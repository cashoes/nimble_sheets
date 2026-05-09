/**
 * @fileoverview Resource Factory
 * Standardizes resource definitions (like Mana or Focus pools) across different classes.
 */

/**
 * Creates a standard mana-style resource definition.
 * @param {string} [stat='int'] - The attribute that scales the resource.
 * @param {string} [label='Mana Pool'] - The display name for the resource.
 * @returns {Object} Resource definition object.
 */
function createManaResource(stat = 'int', label = 'Mana Pool') {
    return {
        id: 'mana',
        label,
        manual: true,
        calcMax: (level, stats) => {
            return level >= 2 ? (stats[stat] * 3) + level : 0;
        }
    };
}

/**
 * Creates a simple manual resource definition.
 * @param {string} id - Unique identifier for the resource.
 * @param {string} label - Display name for the resource.
 * @param {Function} calcMaxFn - Function to calculate the maximum value (level, stats, state) => number.
 * @returns {Object} Resource definition object.
 */
function createSimpleResource(id, label, calcMaxFn) {
    return {
        id,
        label,
        manual: true,
        calcMax: calcMaxFn
    };
}
