import * as THREE from 'three';
import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 492: third-person gunfire origin now starts at the REAL gun barrel. _resolveGunMuzzle finds the tip
// from the loaded model (a node named like a muzzle, else the longest axis of the gun's local bounding box);
// _gunMuzzleWorld pushes that gun-local tip (+ a per-weapon nudge) through gun.matrixWorld, picking the end
// that points downrange. Because it rides the gun, one origin is correct in hip AND aim. tpMuzzleWorld tries
// this first and falls back to the old eye-relative offset only when no gun model is loaded.

// ---- wiring ----
assert(/let tpGunMuz = \{\};/.test(src), 'per-weapon barrel-tip nudge store exists');
assert(/localStorage\.getItem\('breach_tp_gun_muz'\)/.test(src) && /localStorage\.setItem\('breach_tp_gun_muz'/.test(src), 'nudge persists');
assert(/const _MUZ_NODE_RE = \/muzzle\|barrel\|nozzle\|muz\|flash\|tip\/i/.test(src), 'named-muzzle node patterns defined');
assert(/function _resolveGunMuzzle\(gun\)/.test(src), 'auto barrel resolver exists');

const tmw = extractFunction('tpMuzzleWorld');
assert(/_gunMuzzleWorld\(_gun, \(typeof curWep!=='undefined'\?curWep:'rifle'\), out\)/.test(tmw), 'tpMuzzleWorld tries the real gun barrel first');
assert(/out\.set\(player\.pos\.x \+ _rx\*_mS \+ _fx\*_mF/.test(tmw), 'eye-relative path retained as the fallback (build 489 behaviour for capsule bodies)');
assert(/tpMuzSide \+ \(tpMuzAimSide - tpMuzSide\)\*_mb/.test(tmw), 'fallback still blends hip->aim');

const gmw = extractFunction('_gunMuzzleWorld');
assert(/_gunMuzNudge\(weaponKey\); lx\+=nz\.x/.test(gmw), 'per-weapon nudge added in gun-local space before the world transform');
assert(/out\.set\(lx,ly,lz\)\.applyMatrix4\(gun\.matrixWorld\)/.test(gmw), 'gun-local tip pushed to world via the gun matrix (rides the hand animation)');

// ---- executable: _resolveGunMuzzle against real three.js ----
const _resolveGunMuzzle = new Function('THREE','_MUZ_NODE_RE','_muzInv','_muzM','_muzP',
  'return (' + extractFunction('_resolveGunMuzzle') + ')')(THREE, /muzzle|barrel|nozzle|muz|flash|tip/i,
  new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Vector3());

// geometry path: a box longest along local X -> barrel axis = X, two ends split on X only
{
  const gun = new THREE.Group();
  gun.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.2)));
  gun.updateWorldMatrix(true, true);
  const m = _resolveGunMuzzle(gun);
  assert(m && m.mode === 'geom', 'no named node -> geometry path');
  assert(Array.isArray(m.ends) && m.ends.length === 2, 'geometry path yields two barrel ends');
  assert(Math.abs(m.ends[0].x - m.ends[1].x) > 1.5, 'the two ends are split along the longest (barrel) axis');
  assert(Math.abs(m.ends[0].y - m.ends[1].y) < 1e-6 && Math.abs(m.ends[0].z - m.ends[1].z) < 1e-6, 'ends agree on the non-barrel axes');
  assert(gun.userData._muz === m, 'result is cached on the gun');
}
// named-node path wins over geometry
{
  const gun = new THREE.Group();
  const flash = new THREE.Object3D(); flash.name = 'Muzzle_Flash'; flash.position.set(0.1, 0.2, 0.9); gun.add(flash);
  gun.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.2)));
  gun.updateWorldMatrix(true, true);
  const m = _resolveGunMuzzle(gun);
  assert(m && m.mode === 'node' && m.node === flash, 'a node named like a muzzle is used directly');
}

// ---- executable: per-weapon nudge defaults + per-weapon storage ----
const store = {};
const _gunMuzNudge = new Function('tpGunMuz', 'curWep',
  'return (' + extractFunction('_gunMuzNudge') + ')')(store, 'rifle');
{
  const n = _gunMuzNudge('pistol');
  assert(n.x === 0 && n.y === 0 && n.z === 0, 'nudge defaults to zero');
  assert(store.pistol === n, 'nudge is stored per weapon');
  n.z = 0.5;
  assert(_gunMuzNudge('pistol').z === 0.5, 'nudge persists across lookups');
  assert(_gunMuzNudge('rifle').z === 0, 'a different weapon keeps its own nudge');
}

// ---- executable: downrange-end selection (mirror of _gunMuzzleWorld's pick) ----
function pickEnd(eA, eB, yaw, pitch){
  const cp = Math.cos(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const fx = -cp*sy, fy = Math.sin(pitch), fz = -cp*cy;   // view forward
  return (eA.x*fx + eA.y*fy + eA.z*fz) >= (eB.x*fx + eB.y*fy + eB.z*fz) ? eA : eB;
}
const endNegZ = { x:0, y:0, z:-1 }, endPosZ = { x:0, y:0, z:1 };
assert(pickEnd(endNegZ, endPosZ, 0, 0) === endNegZ, 'facing -Z -> the -Z barrel end is downrange');
assert(pickEnd(endNegZ, endPosZ, Math.PI, 0) === endPosZ, 'turned 180 -> the +Z end is downrange');

done();
