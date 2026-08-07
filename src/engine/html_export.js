/**
 * @fileoverview SAVE-AS-HTML EXPORT SUPPORT MODULE
 * Pure, DOM-optional helpers backing app.js's saveAsHTML() and the live SolidJS mount path in
 * DOMContentLoaded. Extracted into their own module (rather than living inline in app.js) so
 * the injection-safety logic is unit-testable outside a browser — see issue #35:
 *
 * - Save-as-HTML used to serialize `document.documentElement.outerHTML` AFTER every SolidJS
 *   component had already mounted, with no clearing of the mount containers first. On reload,
 *   Solid.render() APPENDS into a non-empty container instead of replacing its contents, so
 *   every export/reopen cycle duplicated every widget (and the stale, event-handler-less first
 *   copy made the sheet read as frozen).
 * - The exported state was spliced into the page's single <script> block via raw string
 *   concatenation and a lazy regex, which let a crafted charName break out of the script (and
 *   execute), let a state string containing the literal "};" truncate a re-export into a
 *   SyntaxError (total data loss), and let charName's "$&"/"$1"/etc. sequences get expanded by
 *   String.replace()'s special replacement-pattern handling.
 *
 * Fix: state now lives in its own JSON-typed script island (id="nimble-state", see
 * src/base_template.html) instead of inline in the executable script, and every dynamic
 * value is substituted via the function form of .replace() so nothing in it is ever interpreted
 * as a replacement pattern.
 */

/**
 * IDs of every SolidJS mount container in the tracker template (src/base_template.html).
 * Shared by the live-mount path (app.js DOMContentLoaded) and the Save-as-HTML export path so
 * the two can never drift out of sync with each other or with the template.
 */
const SOLID_MOUNT_IDS = [
    'solid-action-log', 'solid-header', 'topBarContainer', 'solid-attributes',
    'solid-hp', 'solid-wounds', 'solid-proficiency', 'solid-inventory-section',
    'solid-skills', 'solid-conditions', 'combatControlsContainer',
    'solid-features-spells', 'classMechanicPanel'
];

/**
 * Read-only accessor for SOLID_MOUNT_IDS. `const` array literals don't attach themselves to a
 * vm-sandboxed global object the way `function` declarations do (see tests/harness.js), so
 * tests reach the list through this function rather than the bare identifier.
 * @returns {string[]} A copy of the known mount container IDs.
 */
function getSolidMountIds() {
    return SOLID_MOUNT_IDS.slice();
}

/**
 * Empties every known Solid mount container found under `rootEl`. Used both to defensively
 * clear stale markup before a live (re)mount, and against a cloned document before serializing
 * a Save-as-HTML export. Solid.render() APPENDS into a non-empty container rather than
 * replacing it, so a mount div left non-empty — whether from a previous live render or from a
 * reopened export's frozen snapshot — causes every widget to visibly duplicate (issue #35).
 *
 * `rootEl` only needs a `querySelector` method, so this works against the live `document` and
 * against a plain cloned `Element` (which, unlike `Document`, has no `getElementById`) alike.
 * @param {{querySelector: function(string): ({innerHTML: string}|null)}} rootEl
 * @returns {*} rootEl, for chaining.
 */
function clearSolidMountContainers(rootEl) {
    SOLID_MOUNT_IDS.forEach(id => {
        const el = rootEl.querySelector('#' + id);
        if (el) el.innerHTML = '';
    });
    return rootEl;
}

/**
 * Minimal HTML escaper for the handful of characters that matter when interpolating a
 * user-controlled string into HTML text content (here: the <title> element).
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Pure string transform: given a full HTML document string that already contains an empty (or
 * previously-embedded) JSON-typed state island (id="nimble-state") and a `<title>` element —
 * see src/base_template.html — returns a new HTML string with `state`
 * embedded into the island and the title updated to reflect `charName`/`className`. No DOM
 * access; safe to unit test directly (see tests/html_export_tests.js).
 *
 * Safety properties (issue #35):
 * - The state JSON has every `<` escaped to the `<` unicode escape before embedding, so it
 *   can never contain a literal `</script` sequence — the payload cannot break out of the
 *   island's <script> element no matter what text (charName, item notes, etc.) it contains.
 * - Because the payload is guaranteed `<`-free, the "find the next `</script>`" match used to
 *   locate the island's closing tag can never be fooled by a `};`-shaped (or any other)
 *   substring inside the state — including on a *second* export of an already-exported file.
 * - Both replacements use the function form of `.replace()`, so nothing in `state`/`charName`
 *   is ever interpreted as a `$&`/`$1`/`` $` ``/`$'` replacement pattern.
 * - `charName`/`className` are HTML-escaped before landing in `<title>`.
 *
 * @param {string} htmlString - Serialized HTML (e.g. a cloned, mount-cleared documentElement.outerHTML).
 * @param {Object} state - The character state to embed.
 * @param {string} [charName] - Character name, used only for the <title>.
 * @param {string} [className] - Class display name, used only for the <title>.
 * @returns {string} The final HTML string, ready to write out.
 */
function embedStateIntoHTML(htmlString, state, charName, className) {
    // JSON-in-HTML hardening: escaping every `<` neutralizes any `</script` sequence, however it
    // might be capitalized or spaced, without needing to special-case "</script" specifically.
    const json = JSON.stringify(state).replace(/</g, '\\u003c');

    let result = htmlString.replace(
        /(<script[^>]*\bid=["']nimble-state["'][^>]*>)[\s\S]*?(<\/script>)/i,
        (match, openTag, closeTag) => openTag + json + closeTag
    );

    const title = `NIMBLE — ${escapeHtml(charName || 'Hero')} (${escapeHtml(className || 'Unknown')})`;
    result = result.replace(
        /(<title[^>]*>)[\s\S]*?(<\/title>)/i,
        (match, openTag, closeTag) => openTag + title + closeTag
    );

    return result;
}
