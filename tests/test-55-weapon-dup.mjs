// (build 78) Duplicate-viewmodel fix: showWeaponModel had no in-flight guard, so a second call before
// the first GLB finished loading added a second model to the gun group (the "black" duplicate rifle).
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();
assert(/const _gunLoading = \{\};/.test(src), 'in-flight load set is declared');

const fn = extractFunction('showWeaponModel');
assert(/if\(_gunLoading\[key\]\) return;/.test(fn), 'a second concurrent load for the same weapon is refused');
assert(/_gunLoading\[key\] = true;/.test(fn), 'the in-flight flag is set before loading');
assert(/_gunLoading\[key\] = false;/.test(fn), 'the flag is cleared when the load lands');
// defensive: even if two loads slip through, the old model is removed before the new one is added
assert(/if\(gunModelByWep\[key\]\)\{ try\{ gun\.remove\(gunModelByWep\[key\]\)/.test(fn), 'any prior model for the weapon is removed before adding');
assert(/\(err\)=>\{ _gunLoading\[key\]=false;/.test(fn), 'a failed load also clears the flag');

// every place that drops a cached model must clear the flag, or a swap could never reload
const drops = (src.match(/_gunLoading\[k(ey)?\]=false;/g) || []).length;
assert(drops >= 4, 'the in-flight flag is cleared at every cache-drop site (found '+drops+')');
done('duplicate weapon viewmodel guard');
