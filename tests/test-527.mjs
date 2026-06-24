import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 680: importing a different model for a weapon (esp. the FISTS slot) now forgets the previous model's
// animation memory — the per-state clip picks AND the discovered clip-name list — so the new model auto-resolves
// cleanly instead of pointing at clips that no longer exist. The clip-slot dropdowns refresh once it loads.

const sg = extractFunction('swapGunModel');
assert(/if\(\(w\.model\|\|''\)!==\(url\|\|''\)\)\{ w\.view = null; w\.clips = undefined; _gunClipNames\[key\] = \[\]; \}/.test(sg),
  'a URL change wipes view + clips + discovered clip names');
// same URL re-applied keeps the picks (the guard only fires on a real change)
assert(/\(w\.model\|\|''\)!==\(url\|\|''\)/.test(sg), 'guarded on an actual URL change');

// the loader refreshes the editor once the new clip list is known
const sw = extractFunction('showWeaponModel');
assert(/_gunClipNames\[key\] = \(gltf\.animations\|\|\[\]\)\.map\(c=>c\.name\|\|''\);/.test(sw), 'the new model’s clip names are recorded');
assert(/if\(editorOpen && editorActive==='gun' && key===curWep && typeof renderEditorFields==='function'\) renderEditorFields\(\);/.test(sw),
  'the animation-slot dropdowns refresh after the new model loads');

done('build 680: weapon model swap clears stale animation memory (fists + guns)');
