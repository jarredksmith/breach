// (build 114) Death killcam: while waiting to respawn in a PvP mode, the camera pans onto the killer
// and the overlay shows "Eliminated by <name> · respawning in N…" with a live countdown.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

assert(/let _kcInit=false; const _kcLook=new THREE\.Vector3\(\), _kcTarget=new THREE\.Vector3\(\);/.test(src), 'killcam state declared');

// loop hook
assert(/if\(duelDead && pvpMode\(\)\)\{\s*gun\.visible=false;/.test(src), 'killcam runs while dead in pvp + hides the gun');
assert(/const rp = \(lastDamagedBy!=null && lastDamagedBy!==NET\.myId\) \? NET\.players\[lastDamagedBy\] : null;/.test(src), 'targets the killer avatar');
assert(/_kcLook\.lerp\(_kcTarget, Math\.min\(1, dt\*5\)\);\s*camera\.lookAt\(_kcLook\);/.test(src), 'smoothly pans the camera to the killer');
assert(/updateRespawnOverlay\(\);/.test(src), 'updates the respawn overlay each frame');

// overlay
const uro = extractFunction('updateRespawnOverlay');
assert(/getElementById\('respawnSub'\)/.test(uro), 'reads the respawn sub element');
assert(/Eliminated by/.test(uro) && /Math\.ceil\(duelRespawnTimer\)/.test(uro), 'shows killer + live countdown');
assert(/id="respawnSub"/.test(src), 'overlay markup has the countdown element');

// reset on death so the pan restarts each time
assert(/duelDead = true; duelRespawnTimer = 2\.5; _kcInit=false;/.test(src), 'killcam pan resets on death');
done('death killcam');
