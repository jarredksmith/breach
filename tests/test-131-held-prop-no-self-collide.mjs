// (build 188) The object you're carrying must not act as ground/obstacle for you. surfaceTopAt (which
// feeds groundHeightAt + the wall band in clearAt) raycasts dynamic props; it now drops heldProp from
// that list, so running fast no longer makes the player collide vertically with their own carried prop
// and bump it past HOLD_BREAK (the drop threshold). resolvePlayerProps already skips heldProp horizontally.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

const st = extractFunction('surfaceTopAt');
assert(/heldProp \? dynamicProps\.filter\(o=>o!==heldProp\) : dynamicProps/.test(st), 'surfaceTopAt excludes the carried prop from its dynamic-prop raycast');
assert(/_downRay\.intersectObjects\(list, true\)/.test(st), 'surfaceTopAt raycasts the filtered list');

// the horizontal player-vs-prop resolver still skips the carried prop too
const rp = extractFunction('resolvePlayerProps');
assert(/if\(obj===heldProp\) continue;/.test(rp), 'resolvePlayerProps skips the carried prop');

done();
