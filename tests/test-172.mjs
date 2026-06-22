import { gameSource, extractFunction, assert, near, done } from './harness.mjs';
const src = gameSource();

// lens -> vertical FOV is a pure, testable conversion (full-frame 24mm sensor height)
const lensToFov = new Function(extractFunction('lensToFov') + '\nreturn lensToFov;')();
near(lensToFov(35), 37.849, 0.2, '35mm FF vertical FOV');
near(lensToFov(50), 2*Math.atan(12/50)*180/Math.PI, 1e-6, '50mm matches formula');
assert(lensToFov(85) < lensToFov(35), 'longer lens = narrower FOV');
assert(lensToFov(18) > lensToFov(50), 'wider lens = wider FOV');

// state + engine present
assert(/let cineCfg = \{ on:false, path:\[\], lensFrom:35, lensTo:35, focusOn:false, focusFrom:8, focusTo:8, dur:6, look:'spawn', audio:'', shots2:\[\] \}/.test(src), 'cineCfg default present (incl. audio + extra shots, build 350)');
const uc = extractFunction('updateCinematic');
assert(/pointAlongPath\(poly, te, false\)/.test(uc), 'cine path not driven by pointAlongPath');
assert(/const te=_cineEase\(t, d\.ease\)/.test(uc), 'cine uses the per-shot ease curve');
assert(/camera\.lookAt\(_cineTgt\)/.test(uc) && /playerSpawn\.x, terrainHeightAt\(playerSpawn\.x,playerSpawn\.z\)\+EYE, playerSpawn\.z/.test(uc), 'cine framing/look-at missing');
assert(/const lens = d\.lensFrom \+ \(d\.lensTo - d\.lensFrom\)\*te/.test(uc), 'cine lens is not a ramp (zoom keyframe)');
assert(/camera\.fov=lensToFov\(lens\)/.test(uc), 'cine does not apply the ramped lens');
assert(/d\.focusOn && !IS_COARSE\)\{ dofEnabled=true; dofFocus = d\.focusFrom \+ \(d\.focusTo - d\.focusFrom\)\*te/.test(uc), 'cine has no rack-focus ramp');
// editor-only dotted path preview, cleared in play
assert(/function refreshCinePreview\(/.test(src), 'no refreshCinePreview');
assert(/if\(!editorOpen \|\| !\(cineAllShots\(\)\[Math\.min\(_cineShotSel, cineAllShots\(\)\.length-1\)\]\.path\)/.test(src), 'preview gated to editor, drawing the selected shot (build 350)');
assert(/_dashPts\(/.test(src) && /LineSegments/.test(src), 'preview path is not built from dashed LineSegments');
assert(!/LineDashedMaterial/.test(src), 'LineDashedMaterial is not in this Three build; must not be used');
const dash = new Function(extractFunction('_dashPts') + '\nreturn _dashPts;')();
const V = (x,y,z)=>({ x,y,z, distanceTo(o){ return Math.hypot(o.x-x,o.y-y,o.z-z); }, clone(){ return V(x,y,z); }, sub(o){ return V(x-o.x,y-o.y,z-o.z); }, multiplyScalar(s){ return V(x*s,y*s,z*s); }, addScaledVector(d,s){ return V(x+d.x*s,y+d.y*s,z+d.z*s); } });
const out = dash([V(0,0,0), V(10,0,0)], 1, 1);
assert(out.length % 2 === 0 && out.length >= 8, 'dash helper should emit several segment pairs');
assert(Math.abs(out[0].x) < 1e-9, 'first dash starts at the polyline start');
assert(/if\(_cinePreviewGroup && !editorOpen\)\{ scene\.remove\(_cinePreviewGroup\)/.test(src), 'preview not cleared when leaving the editor');

// loop freezes the sim and hands the camera to the cinematic
const loopSrc = extractFunction('loop');   // build 358 grew the loop preamble; extract the whole body
assert(/if\(_cineActive\)\{ updateCinematic\(rawDt\); if\(mixers\.length\)\{ for\(const m of mixers\) m\.update\(rawDt\); \} if\(typeof updateXAnim==='function'\) updateXAnim\(rawDt\); renderScene\(scene,camera\); return; \}/.test(loopSrc), 'cinematic hook: GLB clips + mechanism/waypoint motion both tick during the cutscene (build 368)');

// deploy kicks it off; level (de)serializes it; any key skips
assert(/if\(_levelLoaderActive\) _cineIntroPending = true;[\s\S]*?else _startIntroWhenSettled\(\);/.test(extractFunction('startGame')), 'intro: loader path defers to reveal; no-loader path waits for asset counters to settle (build 355)');
assert(/cine:\s*\{ on: cineCfg\.on, path: cineCfg\.path\.map/.test(extractFunction('serializeLevel')), 'serializeLevel missing cine');
assert(/_applyCine\(level\.cine\);/.test(extractFunction('restoreLevel')), 'restoreLevel adopts cine via the shared helper');
assert(/if\(_cineActive\)\{ endCinematic\(\); return; \}/.test(src), 'keydown does not skip the cinematic');

// disabled / empty path => no-op
const ms = extractFunction('maybeStartIntroCine');
assert(/if\(cineCfg\.on && _ccHasData\(cineCfg\)\) startCinematic\(\{ shots: cineShotsOf\(cineCfg\), audio: cineCfg\.audio \}, false\); \}/.test(src), 'intro gated on enabled + cutscene #1 has-path (named cutscenes, build 356)');
done();
