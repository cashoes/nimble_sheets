/**
 * Resource Factory
 * Standardizes resource definitions across classes.
 */

function createManaResource(stat = 'int', label = 'Mana Pool') {
    return {
        id: 'mana',
        label,
        manual: true,
        calcMax: (level, stats) => level >= 2 ? (stats[stat] * 3) + level : 0
    };
}

function createSimpleResource(id, label, calcMaxFn) {
    return { id, label, manual: true, calcMax: calcMaxFn };
}
