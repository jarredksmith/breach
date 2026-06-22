import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 427: spawn-area outline (and patrol-route) points landed in the wrong place on an ELEVATED arena prop,
// because groundPointUnderPointer projected the click ray onto a flat y=0 plane — parallax shifted the XZ off
// the visible surface. Now it raycasts the actual surfaces (props, colliders, terrain, floor) under the cursor.

const fn = extractFunction('groundPointUnderPointer');
// builds a target list from the real scene geometry
assert(/for\(const p of propModels\)\{ if\(p\) targets\.push\(p\); \}/.test(fn), 'placed props are pick targets');
assert(/for\(const o of dynamicProps\)\{ if\(o\) targets\.push\(o\); \}/.test(fn), 'dynamic props are pick targets');
assert(/for\(const c of colliders\)\{ if\(c\) targets\.push\(c\); \}/.test(fn), 'colliders (incl. arena walls/terrain) are pick targets');
assert(/if\(typeof floor!=='undefined' && floor\) targets\.push\(floor\);/.test(fn), 'the base floor is a pick target');
// returns the real hit point (true x,z), nearest first
assert(/const hits = raycaster\.intersectObjects\(targets, true\);\s*if\(hits\.length\) return hits\[0\]\.point\.clone\(\);/.test(fn), 'returns the nearest real surface hit (its true x,z)');
// still falls back to the flat plane when nothing solid is under the cursor (open sky/void)
assert(/raycaster\.ray\.intersectPlane\(_groundPlane, p\) \? p : null/.test(fn), 'falls back to the ground plane off any geometry');
// the surface raycast happens BEFORE the plane fallback
assert(fn.indexOf('intersectObjects(targets') < fn.indexOf('intersectPlane(_groundPlane'), 'real-surface pick takes priority over the plane');

// both callers (route waypoints + spawn polygon) use the corrected x,z
assert(/spawnRouteEdit\.userData\.mark\.route\.push\(\{ x:gp\.x, z:gp\.z \}\)/.test(src), 'patrol-route waypoints use the corrected point');
assert(/gameCfg\.spawnRegion\.poly\.push\(\{ x:\+gp\.x\.toFixed\(2\), z:\+gp\.z\.toFixed\(2\) \}\)/.test(src), 'spawn-area outline points use the corrected point');
done();
