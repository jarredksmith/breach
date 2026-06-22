// (build 170) Animated-prop placement fix retained: leaving the editor re-captures each animated prop's
// base from its current placement, so adjusting an animated prop's position after testing actually sticks.
// (The build-169 "Solid" per-prop collision toggle was reverted — removing a prop from the player-collision
// list also dropped its Rapier static trimesh, which broke physics props rolling through a model's opening.)
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();

// xa re-base on leaving the editor is still in place
assert(/buildPhysWorld\(\);[^\n]*\n\s*if\(typeof xaCapture==='function'\) xaCapture\(\);/.test(src), 'leaving the editor recaptures animated prop bases');

// the reverted collision toggle is gone
assert(!/noCollide/.test(src), 'Solid/no-collision toggle removed');
assert(!/e\.nc=true/.test(src), 'no-collision serialization removed');
done('animated-prop re-base retained; solid toggle reverted');
