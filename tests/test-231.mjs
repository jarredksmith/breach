import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 325: the prop-add loader survives browser-cached (near-instant) loads via a minimum visible duration
const fn = extractFunction('addSceneProp');
assert(/let _done=false, _to=null, _shownAt=0;/.test(fn), 'tracks when the loader was shown');
assert(/_shownAt=performance\.now\(\);/.test(fn), 'records show time when the overlay appears');
assert(/const wait=Math\.max\(0, 220-\(performance\.now\(\)-_shownAt\)\)/.test(fn), 'computes remaining minimum-visible time');
assert(/if\(wait>0\)\{ setTimeout\(hidePropLoader, wait\); return; \}/.test(fn), 'defers the hide until the floor elapses');
assert(/const async = !isPrimitive\(src\)/.test(fn), 'still skips the overlay for primitives');
done();
