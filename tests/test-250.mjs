import * as THREE from 'three';
import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 352: cinematic facing is legible and correct — per-waypoint facing arrows in the preview,
//            and a path-look shot no longer flips toward spawn at its final frame.

// --- executable: end-of-shot look target keeps the travel heading ---
const deps = `
  const camera={ position:{ copy(v){ this.x=v.x; this.y=v.y; this.z=v.z; } }, fov:60, updateProjectionMatrix(){}, lookAt(v){ camera._looked=v.clone(); } };
  const _cineV0=new THREE.Vector3(), _cineTgt=new THREE.Vector3();
  const playerSpawn={ x:0, z:-50 };                       // spawn BEHIND the travel direction (path runs +z)
  const EYE=1.7, IS_COARSE=true; let dofEnabled=false, dofFocus=8;
  const terrainHeightAt=()=>0; const lensToFov=()=>60; const endCinematic=()=>{ camera._ended=true; };
  const _cineAvatar=null; let _cineShots=null, _cineShotIdx=0;
  let _cineT=1.94;                                        // one frame from the end of a 2s shot
  let _cineData={ path:[[0,5,0],[0,5,40]], dur:2, lensFrom:35, lensTo:35, focusOn:false, focusFrom:8, focusTo:8, look:'path' };
`;
const run = new Function('THREE', deps + extractFunction('pointAlongPath') + extractFunction('_cineEase') + extractFunction('updateCinematic') +
  '\nupdateCinematic(0.05);\nreturn { looked:camera._looked, pos:new THREE.Vector3(_cineV0.x,_cineV0.y,_cineV0.z) };');
const r = run(THREE);
assert(r.looked, 'final frame still aims the camera');
const heading = r.looked.clone().sub(r.pos);
assert(heading.z > 0.5, 'look target stays ahead along +z travel (was: snap to spawn at -z, a 180\u00b0 flip)');
assert(Math.abs(heading.x) < 1.0, 'no sideways veer in the extrapolated heading');

// --- the fix shape: extrapolate from behind; spawn only for a degenerate single-point path ---
const uc = extractFunction('updateCinematic');
assert(/const b=pointAlongPath\(poly, Math\.max\(0,te-0\.02\), false\);/.test(uc), 'behind-sample extrapolation present');
assert(/_cineTgt\.set\(_cineV0\.x\*2-b\[0\], _cineV0\.y\*2-b\[1\], _cineV0\.z\*2-b\[2\]\);/.test(uc), 'heading mirrored forward through the camera');

// --- preview: a facing arrow per waypoint, matching playback rules ---
const pv = src.slice(src.indexOf('function refreshCinePreview'), src.indexOf('\nfunction', src.indexOf('function refreshCinePreview')+10));
assert(/new THREE\.ArrowHelper\(dir, p, 2\.6, custom\?0xffcf6b:0x7dd4ff, 0\.9, 0\.45\)/.test(pv), 'ArrowHelper at each waypoint (gold = authored look, build 353)');
assert(/if\(shot\.look==='path' && sp\.length>=2\)/.test(pv) && /dir = new THREE\.Vector3\(playerSpawn\.x, terrainHeightAt\(playerSpawn\.x,playerSpawn\.z\)\+EYE, playerSpawn\.z\)\.sub\(p\);/.test(pv), 'arrows follow the shot look mode (path vs spawn)');
assert(/if\(i === sp\.length-1\) dir\.negate\(\);/.test(pv), "last waypoint's arrow keeps the incoming heading, matching the playback fix");
assert(/ar\.line\.material\.depthTest=false; ar\.cone\.material\.depthTest=false;/.test(pv), 'arrows draw through geometry like the rest of the preview');
done();
