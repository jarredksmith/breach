import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 330: (1) the intro cutscene (and its audio) no longer starts behind the level loading screen,
//            (2) the local character GLB is prewarmed in solo so the loader waits for it — no pink
//                placeholder capsule during the opening shot.

// --- deferral wiring ---
assert(/_cinePreviewGroup=null, _cineIntroPending=false, _cineShots=null, _cineShotIdx=0;/.test(src), '_cineIntroPending declared with the cine state (+shot cursor, build 350)');
const sg = extractFunction('startGame');
assert(/if\(_levelLoaderActive\) _cineIntroPending = true;/.test(sg), 'loader up -> intro deferred, not started');
assert(/else _startIntroWhenSettled\(\);/.test(sg), 'no loader -> intro waits for late-starting loads to settle (build 355)');
// startCinematic still starts audio at shot start — the fix is WHEN the shot starts, not gutting audio
assert(/_showCineAvatar\(\);\n  _startCineAudio\(\);/.test(extractFunction('startCinematic')), 'cutscene audio still fires with the shot');

// build 554: reveal() STARTS the pending intro (which frames + paints its first cinematic frame) and THEN
// drops the loader, so the loader fades onto the cinematic instead of a stale gameplay frame.
const wr = extractFunction('waitAssetsThenReveal');
assert(/if\(_cineIntroPending\)\{ _cineIntroPending=false; try\{ maybeStartIntroCine\(\); \}catch\(e\)\{\} \} hideLevelLoader\(\);/.test(wr), 'deferred intro starts at reveal, before the loader hides');
// the 15s safety reveal goes through the same reveal(), so a stuck loader still gets its cutscene
assert(/now-t0>=15000\)\{ reveal\(\); return; \}/.test(wr), 'safety-cap reveal path unchanged');

// --- solo prewarm ---
const pw = extractFunction('_prewarmMatchModels');
assert(!/if\(NET\.mode!=='host' && NET\.mode!=='client'\) return;/.test(pw), 'solo no longer skips prewarming entirely');
const localI = pw.indexOf("myCharCfg==='function')?myCharCfg():null");
const netGateI = pw.indexOf("(NET.mode==='host'||NET.mode==='client') && NET.charById");
assert(localI > 0, 'local character GLB is always queued');
assert(netGateI > localI, 'remote characters still gated to multiplayer modes');
assert(/urls\.forEach\(u=>\{ try\{ loadGLTFCached\(u, \(\)=>\{\}, \(\)=>\{\}\); \}catch\(e\)\{\} \}\);/.test(pw), 'prewarm goes through loadGLTFCached so _glbPending gates the loader');
done();
