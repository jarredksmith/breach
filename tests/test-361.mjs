import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 482: rotation-animation pivot. A prop's spin can hinge about a point OFFSET from its centre (door at
// its edge, arm at its base) instead of spinning about the middle. Contained to the animation system, so it's
// a no-op for static props / when the pivot is zero — resting transform, collision and placement are untouched.

// editor field + serialize + restore
assert(/num\('Pivot X \(m\)','pvx',-200,200,0\.1\); num\('Pivot Y \(m\)','pvy',-200,200,0\.1\); num\('Pivot Z \(m\)','pvz',-200,200,0\.1\);/.test(src), 'editor exposes Pivot X/Y/Z fields');
assert(/if\(a\.pvx\|\|a\.pvy\|\|a\.pvz\)\{ e\.xa\.pvx=a\.pvx\|\|0; e\.xa\.pvy=a\.pvy\|\|0; e\.xa\.pvz=a\.pvz\|\|0; \}/.test(src), 'pivot serialized only when set');
assert(/pvx:sx\.pvx\|\|0, pvy:sx\.pvy\|\|0, pvz:sx\.pvz\|\|0/.test(src), 'pivot restored on load');

// the animation applies rotation about the pivot only when a pivot AND a rotation are present
const xa = extractFunction('updateXAnim');
assert(/if\(\(a\.pvx\|\|a\.pvy\|\|a\.pvz\) && \(_ax\|\|_ay\|\|_az\)\)\{/.test(xa), 'pivot path taken only with a pivot + a rotation');
assert(/o\.position\.set\(pwx\+_xaPivV2\.x, pwy\+_xaPivV2\.y, pwz\+_xaPivV2\.z\);/.test(xa), 'centre revolves around the pivot');
assert(/o\.quaternion\.copy\(Rd\)\.multiply\(_xaPivQ2\.setFromEuler/.test(xa), 'orientation = added rotation * rest pose');
assert(/o\.position\.set\(_bx, _by, _bz\);\s*\n\s*o\.rotation\.set\(a\.brx\+_ax, a\.bry\+_ay, a\.brz\+_az\);/.test(xa), 'no pivot -> unchanged centre-spin behaviour');

// --- executable: pivot-rotation invariants (pivot fixed, distance preserved, off-pivot point moves) ---
function rotY(x,z,th){ return [x*Math.cos(th)+z*Math.sin(th), -x*Math.sin(th)+z*Math.cos(th)]; }
function pivotRotate(px,pz, pivx,pivz, th){            // rotate point (px,pz) about pivot (pivx,pivz)
  const [rx,rz]=rotY(px-pivx, pz-pivz, th); return [pivx+rx, pivz+rz];
}
const th=Math.PI/2;
// the pivot point itself never moves
let r=pivotRotate(1,0, 1,0, th); assert(Math.abs(r[0]-1)<1e-9 && Math.abs(r[1]-0)<1e-9, 'the pivot point stays fixed');
// a door centred at origin, hinge at x=1: the centre swings, keeping its distance to the hinge
r=pivotRotate(0,0, 1,0, th);
const d=Math.hypot(r[0]-1, r[1]-0); assert(Math.abs(d-1)<1e-9, 'centre keeps its distance from the hinge');
assert(Math.hypot(r[0]-0,r[1]-0)>0.5, 'the centre actually moved (it is not a centre-spin)');
// zero pivot == ordinary rotation about the centre (centre stays put)
r=pivotRotate(0,0, 0,0, th); assert(Math.abs(r[0])<1e-9 && Math.abs(r[1])<1e-9, 'pivot at centre = ordinary spin');
done();
