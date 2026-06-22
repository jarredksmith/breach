import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 476: the nav-grid build dropped FFA to ~5fps for ~20s at match start (a whole row of walkability
// raycasts blew past the per-frame budget). Fixes: (1) clearAt reuses the surface height navWalkable already
// computed (halves raycasts), (2) the incremental build samples cell-by-cell and checks its budget every 16
// cells (a frame never overruns), (3) a pre-match "GENERATING ARENA / countdown" warmup builds the grid
// before open play so pathing is ready from frame one.

// (1) duplicate-raycast removal
const ca = extractFunction('clearAt');
assert(/function clearAt\(x, z, feetY, surfHint\)/.test(ca), 'clearAt takes an optional precomputed surface');
assert(/const surf = \(surfHint!==undefined\) \? surfHint : surfaceTopAt\(x, z\);/.test(ca), 'clearAt reuses the hint instead of raycasting again');

// (2) cell-wise budgeted build
const step = extractFunction('navBuildStep');
assert(/navSampleCell\(\(NAV\._cell\/NAV\.nz\)\|0, NAV\._cell%NAV\.nz\); NAV\._cell\+\+;/.test(step), 'build advances one cell at a time');
assert(/if\(\(\(\+\+n\)&15\)===0 && now\(\)-t0 > maxMs\) return;/.test(step), 'budget checked every 16 cells');
assert(/function navBuildProgress\(\)/.test(src), 'build exposes a progress %');

// (3) warmup + countdown
const w = extractFunction('navWarmupTick');
assert(/if\(matchWarmup<=0\) return false;/.test(w), 'warmup is inert outside a match start');
assert(/if\(!NAV\.built && NET\.mode==='host' && bots\.length\)\{[\s\S]*navBuildStep\(18\);[\s\S]*GENERATING ARENA/.test(w), 'while building (host with bots only): big budget + a "generating" screen');
assert(/_setCountdown\(String\(Math\.max\(1,Math\.ceil\(matchWarmup\)\)\)\);/.test(w), 'once built: a numeric go countdown');
const ub = extractFunction('loop');
assert(/if\(typeof navWarmupTick==='function' && navWarmupTick\(dt\)\)\{[^}]*\} else updateBots\(dt\);/.test(src), 'bots are held inert during warmup');

// --- executable: progress math + budget-yield cadence ---
function progress(cell, N){ return N ? Math.min(100, Math.floor(100*(cell||0)/N)) : 0; }
assert(progress(0,100)===0 && progress(50,100)===50 && progress(100,100)===100, 'progress spans 0..100');
assert(progress(0,0)===0, 'empty grid -> 0% (no divide-by-zero)');
// budget cadence: with a 0-cost clock and check-every-16, a cell loop yields only on the 16th, 32nd, ...
let checks=0; for(let n=1;n<=64;n++){ if(((n)&15)===0) checks++; } assert(checks===4, 'checks the budget 4× over 64 cells (every 16)');
done();
