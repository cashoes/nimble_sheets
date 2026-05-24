const fs = require('fs');
const path = require('path');

const VERSION = '3.0.0';
const WORKSPACE_DIR = __dirname;

// Paths
const srcDir = path.join(WORKSPACE_DIR, 'src');
const dataDir = path.join(srcDir, 'data');
const jsonDir = path.join(dataDir, 'json');
const engineDir = path.join(srcDir, 'engine');
const componentsDir = path.join(engineDir, 'components');

const CLASSES = [
    'berserker', 'cheat', 'commander', 'hunter', 'mage',
    'oathsworn', 'shadowmancer', 'shepherd', 'songweaver',
    'stormshifter', 'zephyr'
];

async function compileAll() {
    console.log(`🚀 Starting Node compilation for NIMBLE v${VERSION} trackers...`);

    try {
        // Read raw JSON data
        const itemsJson = fs.readFileSync(path.join(jsonDir, 'items.json'), 'utf8');
        const skillsJson = fs.readFileSync(path.join(jsonDir, 'skills.json'), 'utf8');
        const conditionsJson = fs.readFileSync(path.join(jsonDir, 'conditions.json'), 'utf8');
        const ancestriesJson = fs.readFileSync(path.join(jsonDir, 'ancestries.json'), 'utf8');
        const backgroundsJson = fs.readFileSync(path.join(jsonDir, 'backgrounds.json'), 'utf8');
        const spellsJson = fs.readFileSync(path.join(jsonDir, 'spells.json'), 'utf8');

        const ancestries = JSON.parse(ancestriesJson);
        const backgrounds = JSON.parse(backgroundsJson);
        const spells = JSON.parse(spellsJson);

        // Read Template HTML
        const template = fs.readFileSync(path.join(srcDir, 'base_template.html'), 'utf8');

        // Read Engine modules in correct order
        const engineModules = [
            'solid.js', 'attributes.js', 'rolls.js', 'features.js', 'ui.js', 'core.js', 'base_class.js', 
            'event_bus.js', 'state.js', 'bridge.js', 'app.js'
        ];
        const engineParts = engineModules.map(m => fs.readFileSync(path.join(engineDir, m), 'utf8'));

        // Read Component modules in correct order
        const componentModules = [
            'helpers.js', 'number_spinner.js', 'action_pip.js', 'die.js', 'header.js', 'attribute_card.js',
            'hp_tracker.js', 'wound_tracker.js', 'combat_controls.js', 'inventory.js', 'skills.js',
            'conditions.js', 'spell_card.js', 'features.js', 'identity_bar.js', 'mechanic_panel.js',
            'log_feed.js', 'exports.js'
        ];
        const componentParts = componentModules.map(m => fs.readFileSync(path.join(componentsDir, m), 'utf8'));
        const componentsContent = componentParts.join('\n\n');

        // Inject components at index 10 (before app.js)
        engineParts.splice(10, 0, componentsContent);

        // Deconstruct engine parts
        const [solid, attributes, rolls, features, ui, corePart, baseClass, eventBus, state, bridge, components, app] = engineParts;

        // Compile each class
        for (const className of CLASSES) {
            console.log(`  Building ${className}...`);
            const classData = fs.readFileSync(path.join(dataDir, `class_${className}.js`), 'utf8');

            let jsContent = `// --- Generated Core Data ---\n`;
            jsContent += `const ITEM_TEMPLATES = ${itemsJson};\n`;
            jsContent += `const SKILL_LIST = ${skillsJson};\n`;
            jsContent += `const CONDITIONS_LIST = ${conditionsJson};\n`;
            jsContent += `const ANCESTRIES = ${JSON.stringify(ancestries.categories)};\n`;
            jsContent += `const ANCESTRY_FEATURES = ${JSON.stringify(ancestries.features)};\n`;
            jsContent += `const BACKGROUNDS = ${JSON.stringify(backgrounds.categories)};\n`;
            jsContent += `const BACKGROUND_FEATURES = ${JSON.stringify(backgrounds.features)};\n`;
            jsContent += `const UTILITY_SPELLS = ${JSON.stringify(spells.utility)};\n`;
            jsContent += `const SPELL_REGISTRY = ${JSON.stringify(spells.registry)};\n\n`;

            jsContent += `// --- SolidJS Runtime ---\n${solid}\n\n`;
            jsContent += `// --- Engine Helpers & Base ---\n${attributes}\n${rolls}\n${features}\n${ui}\n${corePart}\n${baseClass}\n${eventBus}\n\n`;
            jsContent += `// --- Source: src/data/class_${className}.js ---\n${classData}\n\n`;
            jsContent += `// --- Engine Logic ---\n${state}\n${bridge}\n${components}\n${app}\n\n`;

            const fullScript = `<script>\n${jsContent}<\/script>`;
            const parts = template.split('<!-- INJECT_SCRIPTS -->');
            if (parts.length < 2) {
                throw new Error("Template is missing injection placeholder.");
            }

            const finalHtml = parts[0] + fullScript + parts[1];
            const outputFilename = `nimble_tracker_${className}_v${VERSION}.html`;
            fs.writeFileSync(path.join(WORKSPACE_DIR, outputFilename), finalHtml, 'utf8');
        }

        console.log(`✅ All ${CLASSES.length} trackers compiled successfully!`);
    } catch (error) {
        console.error("❌ Build error:", error);
    }
}

compileAll();
