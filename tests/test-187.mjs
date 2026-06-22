import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 276: the level-loader freeze must be evaluated BEFORE the cinematic update in loop(),
// so the intro cutscene's timer can't advance while assets are still loading behind the overlay.
const loaderIdx = src.indexOf('if(_levelLoaderActive){ pollGamepad(dt); renderScene(scene,camera); renderViewmodel(); return; }');
const cineIdx = src.indexOf("if(_cineActive){ updateCinematic(rawDt); if(mixers.length){ for(const m of mixers) m.update(rawDt); } if(typeof updateXAnim==='function') updateXAnim(rawDt); renderScene(scene,camera); return; }");   // build 360: prop mixers tick inside the cutscene branch
assert(loaderIdx !== -1, 'loader-freeze line missing from loop');
assert(cineIdx !== -1, 'cinematic line missing from loop');
assert(loaderIdx < cineIdx, 'loader-freeze must come before the cinematic update (else the cutscene plays while loading)');
done();
