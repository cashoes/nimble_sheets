const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

/**
 * Parse-checks (never executes) a block of JS destined for a tracker's inlined <script> tag.
 * That code references browser globals (window/document/localStorage/etc.) that don't exist in
 * this Node process, so only a parse — not a run — is safe here. `new vm.Script(code)` compiles
 * the source without invoking it, which is exactly a syntax check (issue #45).
 * Returns `{ ok: true }` or `{ ok: false, error }`.
 */
function isParseableScript(code) {
    try {
        new vm.Script(code);
        return { ok: true };
    } catch (error) {
        return { ok: false, error };
    }
}

/**
 * Throws a descriptive Error naming `className` if `scriptCode` fails to parse as JS. Thin
 * fail-fast wrapper over isParseableScript() for compileAll()'s per-class loop.
 */
function assertTrackerScriptParses(scriptCode, className) {
    const result = isParseableScript(scriptCode);
    if (!result.ok) {
        throw new Error(`Generated tracker script for "${className}" failed to parse: ${result.error.message}`);
    }
}

/**
 * Fails the build if `scriptCode` still contains a raw (unescaped) `</script` sequence after the
 * `</script` -> `<\/script` pass. A browser's HTML parser closes an inline <script> block at the
 * first `</script`, wherever it occurs — including inside a JS comment or string — truncating the
 * tracker's engine into an unterminated fragment that silently fails to mount (issue #69). This is
 * a static, browser-free tripwire so any future module reintroducing a literal `</script>` (e.g.
 * in a comment) fails `node build.js` instead of shipping a blank tracker.
 */
function assertNoUnescapedScriptClose(scriptCode, className) {
    if (/<\/script/i.test(scriptCode)) {
        throw new Error(`Generated tracker script for "${className}" contains an unescaped "</script" sequence, which would truncate the inline <script> block in a browser (issue #69).`);
    }
}

async function compileAll() {
    console.log(`🚀 Starting Node compilation for NIMBLE v${VERSION} trackers...`);

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
        'event_bus.js', 'state.js', 'bridge.js', 'html_export.js', 'app.js'
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

    // Inject components at index 11 (before app.js)
    engineParts.splice(11, 0, componentsContent);

    // Deconstruct engine parts
    const [solid, attributes, rolls, features, ui, corePart, baseClass, eventBus, state, bridge, htmlExport, components, app] = engineParts;

    // Compile every class into memory first — nothing is written to disk until ALL classes have
    // built and parse-checked cleanly, so a failure partway through (missing file, bad JSON, a
    // syntax error in one class's source) never leaves a mixed-generation set of stale and fresh
    // tracker files on disk (issue #45: this used to write each tracker immediately inside the
    // loop, so an error on class N left classes 1..N-1 freshly rebuilt and N..11 at their
    // previous build's output, all while the process still exited 0).
    const outputs = [];
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
        jsContent += `// --- Engine Logic ---\n${state}\n${bridge}\n${htmlExport}\n${components}\n${app}\n\n`;

        // Parse-check the assembled script before it ever reaches disk (issue #45 build-artifact
        // syntax check) — catches a class file (or any concatenated module) that produces
        // syntactically broken output that would otherwise only surface when a player opens the
        // tracker in a browser.
        assertTrackerScriptParses(jsContent, className);

        // Escape every `</script` (any case) so the browser's HTML parser can never close the
        // inline <script> block early. node's vm.Script above parses raw JS with no notion of
        // HTML tag boundaries, so a literal `</script>` buried in a comment (e.g. html_export.js)
        // parses fine here yet truncates the ~400KB program mid-file in a real browser, producing
        // a blank tracker (issue #69). `<\/script` is semantically identical JS (the backslash is
        // a no-op escape inside a string/regex, and inert inside a comment) but can't match the
        // browser's script-end token, so this is safe wherever it lands in the source.
        jsContent = jsContent.replace(/<\/script/gi, '<\\/script');
        assertNoUnescapedScriptClose(jsContent, className);

        const fullScript = `<script>\n${jsContent}<\/script>`;
        const parts = template.split('<!-- INJECT_SCRIPTS -->');
        if (parts.length < 2) {
            throw new Error("Template is missing injection placeholder.");
        }

        const finalHtml = parts[0] + fullScript + parts[1];
        const outputFilename = `nimble_tracker_${className}_v${VERSION}.html`;
        outputs.push({ outputFilename, finalHtml });
    }

    // Every class built and parsed clean — now write them all (all-or-nothing).
    for (const { outputFilename, finalHtml } of outputs) {
        fs.writeFileSync(path.join(WORKSPACE_DIR, outputFilename), finalHtml, 'utf8');
    }

    console.log(`✅ All ${outputs.length}/${CLASSES.length} trackers compiled successfully!`);
}

module.exports = { isParseableScript, assertTrackerScriptParses, compileAll };

// Only run the build when this file is executed directly (`node build.js`), not when required
// (e.g. by tests that just want isParseableScript/assertTrackerScriptParses).
if (require.main === module) {
    compileAll().catch((error) => {
        // Any failure — missing file, JSON parse error, a class build failure, a syntax-check
        // failure, or a write failure — must fail loudly and exit non-zero. Silently exiting 0
        // on a caught error is exactly issue #45's bug: nothing downstream (CI, `node build.js
        // && git commit`) could tell a partial/broken build from a clean one.
        console.error("❌ Build failed:", error && error.stack ? error.stack : error);
        process.exitCode = 1;
    });
}
