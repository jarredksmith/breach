// (build 100) The Poly Pizza search (already on Props) now also drives gun/enemy/loot/grenade/station/
// player model slots, with an "Animated only" filter.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

const rms = extractFunction('renderModelSearchPP');   // Poly Pizza body (renderModelSearch is now the source-switch wrapper)
assert(/ppSearch\(term/.test(rms), 'reusable search hits ppSearch');
assert(/onPick\(m, status\)/.test(rms), 'a clicked result calls onPick');
assert(/anim\.checked \? raw\.filter\(m=>m\.animated===true\)/.test(rms), 'Animated only filter');

// parser exposes an animated flag
assert(/animated: !!\(m\.Animated \|\| m\.animated/.test(src), 'ppParseModel captures an animated flag');

// attached to the single-slot urlField targets (gun/station/grenade/player)
assert(/if\(tgt\.urlField && !tgt\.addable\)\{[^]*renderModelSearch\(psHost/.test(src), 'search on single-slot model targets');
assert(/if\(tgt\.setUrl\) tgt\.setUrl\(m\.glb\)/.test(src), 'picking sets that slot\'s model url');

// enemy + loot get their own search
assert(/renderModelSearch\(enPsHost, \(m, st\)=>\{ eUrl\.value=m\.glb; pushUndoSnapshot\(\); swapEnemyModel\(m\.glb, editorEnemyType\)/.test(src), 'enemy section search');
assert(/renderModelSearch\(ltPsHost, \(m, st\)=>\{ url\.value=m\.glb; pushUndoSnapshot\(\); swapChestModel\(m\.glb\)/.test(src), 'loot section search');

// pagination: page param on ppSearch + Show more in both renderers
assert(/function ppSearch\(query, cb, errcb, page\)/.test(src) && /\?Limit=24'/.test(src), 'ppSearch paginates (Limit + Page)');
assert((src.match(/mb\.textContent='Show more'/g)||[]).length>=2 || /_bmore/.test(src), 'Poly Pizza renderers have a Show more');

done('poly pizza search across model slots');
