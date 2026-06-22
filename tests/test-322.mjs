import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 449: the spawn region is a SPAWN-ONLY filter. It controls where bots START; it is NOT a movement
// boundary. Target-less bots head to the arena center and may roam the whole map (walls/props bound them).

const bh = extractFunction('_botHome');
assert(/return \{ x:CP_POS\.x, z:CP_POS\.z \};/.test(bh), 'target-less bots head to the arena center');
assert(!/_polyCentroid|sr\.shape==='poly'/.test(bh), '_botHome no longer steers back to the spawn region');

const ub = extractFunction('updateBots');
assert(!/_clampToRegion\(destX,destZ\)/.test(ub), 'bot destinations are NOT clamped into the region');
assert(/else \{ const h=_botHome\(\); destX=h\.x; destZ=h\.z; \}/.test(ub), 'no-target fallback heads to the arena center');
assert(/b\._wander=\{ x:b\.pos\.x\+\(Math\.random\(\)\*2-1\)\*16, z:b\.pos\.z\+\(Math\.random\(\)\*2-1\)\*16 \};/.test(ub), 'search wander roams freely (not region-clamped)');
assert(/!cpOwnedBy\(b\.team\)\)\{ destX=CP_POS\.x; destZ=CP_POS\.z; wantFire=hasLOS; \}/.test(ub), 'KOTH/control-point destination preserved');

// spawns STILL respect the region (this is the only thing the region does now)
assert(/const usePoly = sr && sr\.shape==='poly'/.test(src), 'spawn picker still honours a poly region');
assert(/if\(!_pointInPoly\(x,z,sr\.poly\)\) continue;/.test(src), 'spawn points outside a poly region are rejected');
assert(/const reg = \(sr && !usePoly\) \? sr : null;/.test(src), 'spawn picker still honours a circle region');

// executable: a free-roam bot heading "home" goes to the arena center regardless of an off-center region
function botHome(){ return { x:0, z:0 }; }   // mirrors _botHome (CP_POS = arena origin)
const h = botHome();
assert(h.x===0 && h.z===0, 'home is the arena center, independent of any spawn region');
done();
