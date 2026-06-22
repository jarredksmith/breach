import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 360: prop/GLB animations keep playing during a cutscene (the loop used to freeze mixers
// because the cinematic branch returned before the mixer-update line).

const loop = extractFunction('loop');
const cineHook = "if(_cineActive){ updateCinematic(rawDt); if(mixers.length){ for(const m of mixers) m.update(rawDt); } if(typeof updateXAnim==='function') updateXAnim(rawDt); renderScene(scene,camera); return; }";
assert(loop.includes(cineHook), 'cutscene branch updates mixers before its return');

// raw (unscaled) time: cutscenes ignore hitstop, so prop anims play at true speed
const hookI = loop.indexOf('if(_cineActive){');
const hookLine = loop.slice(hookI, loop.indexOf('}', loop.indexOf('return;', hookI)));
assert(/m\.update\(rawDt\)/.test(hookLine) && !/m\.update\(dt\)/.test(hookLine), 'mixers use rawDt inside the cutscene (no hitstop scaling)');

// the gameplay mixer update still exists for normal play, and still sits AFTER the cine return
const gameplayMixer = 'if(mixers.length){ updateMixersLOD(dt); }';
assert(loop.includes(gameplayMixer), 'normal-play mixer update (distance-LOD) still present');
assert(loop.indexOf(gameplayMixer) > loop.indexOf('return; }'), 'gameplay mixer update remains after the cinematic early-return (cutscene path does not double-update)');

// loader-freeze still precedes the cinematic branch (assets-loading guard intact)
assert(loop.indexOf('_levelLoaderActive') < hookI, 'loader freeze still evaluated before the cinematic branch');
// build 368: mechanism/waypoint motion (NOT mixer-driven — it's updateXAnim) also ticks in the cutscene branch
assert(/if\(typeof updateXAnim==='function'\) updateXAnim\(rawDt\);/.test(cineHook), 'doors/platforms/elevators + waypoint paths animate during a cutscene');
const xi = cineHook.indexOf('updateXAnim(rawDt)'), ri = cineHook.indexOf('renderScene');
assert(xi > 0 && xi < ri, 'mechanisms update before the cutscene frame is drawn');
// updateXAnim self-guards, so calling it here is safe (it no-ops outside live play)
assert(/function updateXAnim\(dt\)\{\s*if\(!gameOn \|\| editorOpen \|\| paused\) return;/.test(src), 'updateXAnim guards on game state, safe to call from the cine branch');
done();
