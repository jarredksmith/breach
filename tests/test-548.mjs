import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 705: a "journal / note" inventory item can now carry a world model too (previously the Model URL / scale /
// search were only shown for "3D object" items). The model is its pickup-pad / placed-drop look; reading it still
// shows the text page.

const fn = extractFunction('renderInvItems');

// --- the journal text + the model block are no longer mutually exclusive (no `} else {`) ---
assert(/const _isJournal = \(it\.type\|\|'object'\)==='journal';/.test(fn), 'item type is captured once for reuse');
assert(/if\(_isJournal\)\{[^]*field\('Journal text \(the page contents\)', jT\);\s*\}/.test(fn), 'journal text shows for journal items');
assert(!/field\('Journal text \(the page contents\)', jT\);\s*\} else \{/.test(fn), 'the model block is NOT gated behind an else (so it shows for journals too)');

// --- the model URL / scale / search controls are present (now for both types) ---
assert(/field\('Model URL', urlRow\);/.test(fn), 'Model URL field present');
assert(/field\('Model scale', scI\);/.test(fn), 'Model scale field present');
assert(/psTog\.textContent='\\ud83d\\udd0d Search models'|psTog\.textContent='🔍 Search models'/.test(fn), 'model search toggle present');

// --- the hint is type-aware (explains the model is the note's world look) ---
assert(/hint\(form, _isJournal \? 'How this note looks as a world pickup/.test(fn), 'journal gets a tailored model hint');

// --- a journal item with a model is actually used by its pickup pad (buildPowerupMesh reads it.model) ---
const bp = extractFunction('buildPowerupMesh');
assert(/if\(it && it\.model && typeof loadGLTFCached==='function'\)/.test(bp), 'an item pickup loads the item’s own model regardless of type');

done('build 705: journal / note items can carry a world model');
