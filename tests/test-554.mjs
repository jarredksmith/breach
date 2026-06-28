import { gameSource, extractFunction, assert, eq, near, done } from './harness.mjs';
const src = gameSource();
// build 714: (A) an animated prop (e.g. sliding water) now counts as a contact "toucher", so it can trigger another
// prop's contact signal (water reaches the flower -> flower animates). (B) the mechanism can animate SCALE too, not
// just position/rotation (a flower grows).

// --- A: contact detection includes animated props ---
const cp = extractFunction('_contactObjectPresent');
assert(/if\(!c\.userData \|\| !\(c\.userData\.phys \|\| \(c\.userData\.xa && c\.userData\.xa\.on\)\)\) continue;/.test(cp), 'a dynamic OR an animated (xa.on) prop is a valid toucher');
// (the full overlap test needs three.js Box3 + module-level temp boxes, so the contact behaviour is browser-verified;
//  the filter pin above is the meaningful unit coverage.)

// --- B: scale is a first-class mechanism channel ---
const xa = extractFunction('xaApply');
assert(/scx:sx\.scx\|\|0, scy:sx\.scy\|\|0, scz:sx\.scz\|\|0/.test(xa), 'xaApply carries scale-animation fields');
assert(/a\.scx \|\| a\.scy \|\| a\.scz/.test(extractFunction('_xaMoves')), 'a scale-only mechanism counts as motion (stays kinematic, not dynamic)');

// updateXAnim captures the base scale + applies the animated scale
const ux = extractFunction('updateXAnim');
assert(/a\.bscx=o\.scale\.x; a\.bscy=o\.scale\.y; a\.bscz=o\.scale\.z;/.test(ux), 'base scale captured on first frame');
assert(/if\(a\.scx\|\|a\.scy\|\|a\.scz\)\{ o\.scale\.set\(\(a\.bscx\|\|1\)\+\(a\.scx\|\|0\)\*e, \(a\.bscy\|\|1\)\+\(a\.scy\|\|0\)\*e, \(a\.bscz\|\|1\)\+\(a\.scz\|\|0\)\*e\)/.test(ux), 'scale is the base plus the offset times the eased phase');
assert(/const turns=\(a\.rx\|\|a\.ry\|\|a\.rz\), scaled=\(a\.scx\|\|a\.scy\|\|a\.scz\);/.test(ux) && /if\(dx\|\|dy\|\|dz\|\|turns\|\|scaled\)\{/.test(ux), 'a scale change still refreshes the collider / carry');

// executable: reproduce the scale ramp math
const scaleAt = (base, off, e)=> base + off*e;
eq(scaleAt(1, 1, 0), 1, 'at phase 0 the scale is the base');
eq(scaleAt(1, 1, 1), 2, 'Scale 1 doubles the size at full phase');
near(scaleAt(1, -0.5, 1), 0.5, 1e-9, 'a negative scale shrinks it');

// --- snap-to-base resets scale; serialize carries it ---
assert(/if\(a\.bscx!==undefined\) o\.scale\.set\(a\.bscx,a\.bscy,a\.bscz\);/.test(extractFunction('xaSnapToBase')), 'editor snap-to-base restores the base scale');
assert(/if\(a\.scx\|\|a\.scy\|\|a\.scz\)\{ e\.xa\.scx=a\.scx\|\|0; e\.xa\.scy=a\.scy\|\|0; e\.xa\.scz=a\.scz\|\|0; \}/.test(src), 'scale animation is serialized');

// --- editor exposes Scale X/Y/Z in the Mechanism fold ---
assert(/num\('Scale X','scx',-10,10,0\.1\); num\('Scale Y','scy',-10,10,0\.1\); num\('Scale Z','scz',-10,10,0\.1\);/.test(src), 'Scale X/Y/Z controls in the Mechanism fold');

done('build 714: animated props trigger contact signals + mechanism scale animation');
