import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/function buildModelGridBoxes\(obj, overall\)/.test(src), 'grid-box builder exists');
assert(/function isModelSrc\(src\)/.test(src) && /sketchfab:/.test(src), 'isModelSrc classifies imported models');
assert(/if\(isModelSrc\(obj\.userData\.src\)\)\{ const grid = buildModelGridBoxes/.test(src), 'refreshPropCollider uses grid boxes for imported models');
// vertical run-splitting: a column emits one box per contiguous solid run (archway opening stays open between threshold + crown)
assert(/const occ=new Uint8Array\(N\*K\)/.test(src), 'per-column vertical occupancy slots');
assert(/let run=sl; while\(run<K && occ\[base\+run\]\) run\+\+/.test(src), 'emits one box per contiguous vertical run');
done('model-grid-collision');
