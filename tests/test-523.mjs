import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 675: fix — a custom imported viewmodel for the FISTS slot was ignored (showWeaponModel forced the
// procedural hands and returned early). Now a fists weapon only shows the procedural hands when it has NO model;
// once the creator imports one, it loads through the normal per-weapon viewmodel path.

const sw = extractFunction('showWeaponModel');
// the procedural-fists gate now requires the absence of a custom model
assert(/const isFists = !\(WEAPONS\[key\] && WEAPONS\[key\]\.model\) && \(key==='hands' \|\| \(WEAPONS\[key\] && WEAPONS\[key\]\.fists\)\);/.test(sw),
  'isFists is false when the weapon has an imported model');
// when not fists, the function falls through to the cached/loading viewmodel path (no early return)
assert(/if\(isFists\)\{[\s\S]*?return; \}\s*\n\s*for\(const k in gunModelByWep\)\{ if\(gunModelByWep\[k\]\) gunModelByWep\[k\]\.visible = \(k===key\); \}/.test(sw),
  'a fists weapon with a model continues into the normal model path');
// the model URL resolver already honours a per-weapon override (so hands loads its imported model)
assert(/function wepModelUrl\(key\)\{ const w=WEAPONS\[key\]; return \(w && w\.model\) \? w\.model : gunModelUrl; \}/.test(src),
  'wepModelUrl returns the weapon’s own model when set');
// setting a model for the active weapon refreshes the viewmodel live
assert(/if\(key === curWep\) showWeaponModel\(key\);/.test(src), 'assigning a model refreshes the live viewmodel');

done('build 675: imported model overrides the procedural fists');
