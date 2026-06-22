import * as THREE from 'three';
import { gameSource, extractFunction, assert, near, done } from './harness.mjs';
const src = gameSource();
// build 353: per-waypoint look targets — authored aim interpolates during playback.

// --- executable: _normCineShot builds the look path, filling gaps from the base mode ---
const mkNorm = new Function('terrainHeightAt','playerSpawn','EYE', extractFunction('_normCineShot') + '\nreturn _normCineShot;');
const norm = mkNorm(()=>0, { x:0, z:-50 }, 1.7);
{ const s = norm({ path:[[0,5,0],[0,5,20,9,9,9],[0,5,40]], dur:4, look:'spawn' });
  assert(Array.isArray(s.lookPts) && s.lookPts.length===3, 'any authored look builds a full look path');
  assert(s.lookPts[1].join()==='9,9,9', 'authored target kept verbatim');
  assert(s.lookPts[0].join()==='0,1.7,-50' && s.lookPts[2].join()==='0,1.7,-50', 'unset waypoints fall back to the spawn aim'); }
{ const s = norm({ path:[[0,5,0],[0,5,20,9,9,9],[0,5,40]], dur:4, look:'path' });
  assert(s.lookPts[0].join()==='0,5,20', 'path-mode gap aims at the next waypoint');
  assert(s.lookPts[2].join()==='0,5,60', 'last gap extrapolates the incoming heading'); }
{ const s = norm({ path:[[0,5,0],[0,5,40]], dur:4, look:'path' });
  assert(!s.lookPts, 'no authored looks -> no look path (old behavior untouched)'); }

// --- executable: playback interpolates the authored looks ---
const deps = `
  const camera={ position:{ copy(v){ this.x=v.x; this.y=v.y; this.z=v.z; } }, fov:60, updateProjectionMatrix(){}, lookAt(v){ camera._looked=v.clone(); } };
  const _cineV0=new THREE.Vector3(), _cineTgt=new THREE.Vector3();
  const playerSpawn={ x:0, z:-50 }; const EYE=1.7, IS_COARSE=true; let dofEnabled=false, dofFocus=8;
  const terrainHeightAt=()=>0; const lensToFov=()=>60; const endCinematic=()=>{};
  const _cineAvatar=null; let _cineShots=null, _cineShotIdx=0;
  let _cineT=0.999;   // dead center of a 2s shot after easing (te=0.5 -> halfway)
  let _cineData={ path:[[0,5,0],[0,5,40]], lookPts:[[100,5,0],[100,5,40]], dur:2, lensFrom:35, lensTo:35, focusOn:false, focusFrom:8, focusTo:8, look:'spawn' };
`;
const run = new Function('THREE', deps + extractFunction('pointAlongPath') + extractFunction('_cineEase') + extractFunction('updateCinematic') +
  '\nupdateCinematic(0.001);\nreturn camera._looked;');
const looked = run(THREE);
near(looked.x, 100, 0.5); near(looked.z, 20, 1.5);   // halfway along the authored look path, not at spawn

// --- persistence: the 6-element waypoint survives a load round-trip ---
const ap = new Function('cineCfg','lc', extractFunction('_resShot') + '\n' + extractFunction('_applyCine').replace('function _applyCine(lc){','') .replace(/\}\s*$/,'') );   // _applyCine leans on _resShot since 356
const cfg = {}; ap(cfg, { on:true, path:[[1,2,3,4,5,6],[7,8,9]], shots2:[{ path:[[1,1,1,2,2,2]], dur:3 }] });
assert(cfg.path[0].length===6 && cfg.path[0][5]===6, 'flat path keeps the look triplet');
assert(cfg.path[1].length===3, 'plain waypoints stay plain');
assert(cfg.shots2[0].path[0].length===6, 'extra shots keep look triplets too');

// --- editor wiring ---
assert(/function _cineAimPoint\(\)/.test(src) && /rc\.setFromCamera\(new THREE\.Vector2\(0,0\), camera\)/.test(src), 'aim capture raycasts the view center');
assert(/camera\.getWorldDirection\(d\); return camera\.position\.clone\(\)\.addScaledVector\(d, 30\)/.test(src), 'open-sky fallback 30m out');
assert(/q\[3\]=\+t\.x\.toFixed\(3\); q\[4\]=\+t\.y\.toFixed\(3\); q\[5\]=\+t\.z\.toFixed\(3\);/.test(src), 'eye button writes the look triplet in place');
assert(/CS\.path\[i\]\.length=3;/.test(src), 'clear truncates back to a plain waypoint');
done();
