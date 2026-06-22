import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 298: third-person polish
assert(/_ownPrevZ=0, _ownSpeed=0;/.test(src), '_ownSpeed state var added');
const eoa = extractFunction('ensureOwnAvatar');
assert(/_ownAvatar\.userData\.charRing\) _ownAvatar\.userData\.charRing\.visible=false/.test(eoa), 'own ring hidden in third person');
const uoa = extractFunction('updateOwnAvatar');
// slope clip fix: feet lifted to footprint terrain max when grounded, only ever lifting
assert(/if\(player\.onGround\)\{ const r=0\.4/.test(uoa) && /footY = Math\.max\(footY, terrainHeightAt/.test(uoa), 'feet lifted to clear uphill terrain');
assert(/a\.position\.set\(player\.pos\.x, footY, player\.pos\.z\)/.test(uoa), 'avatar placed at computed footY');
// hysteresis + smoothing on the run/walk decision
assert(/_ownSpeed = _ownSpeed\*0\.6 \+ md\*0\.4/.test(uoa), 'per-frame travel smoothed');
assert(/sm>0\.05 && \(cur==='run'\|\|cur==='sprint'\|\|cur\.indexOf\('run'\)===0\)/.test(uoa) && /\|\| sm>0\.11\) \? 'run' : 'walk'/.test(uoa), 'run/walk hysteresis band (directional, build 488)');
assert(!/md>0\.10 \? 'run' : \(md>0\.02 \? 'walk' : 'idle'\)/.test(uoa), 'old single-threshold flicker gone');
done();
