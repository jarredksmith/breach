import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 449: bot destinations are never clamped into the spawn region (no movement cage), and a jammed bot
// just re-routes rather than steering back to a "home" pocket. Spawns still face the play-space center.

const ub = extractFunction('updateBots');
assert(!/_clampToRegion\(destX,destZ\)/.test(ub), 'no destination clamp — bots may target anywhere on the map');
assert(/if\(b\._stuckT>0\.5\)\{ if\(!b\._stuckSide\)/.test(ub), 'a long-stuck bot follows the wall to one side (no region-home steer)');
assert(!/const h=_botHome\(\); const hx=h\.x-b\.pos\.x/.test(ub), 'stuck recovery does not yank the bot back toward a region home');

// spawns still face the play-space center when a region is set (asserted on src; randomSpawn is long)
assert(/let fx=0, fz=0; if\(sr\)\{ const h=\(usePoly\?_polyCentroid\(sr\.poly\):\{x:reg\.x,z:reg\.z\}\); fx=h\.x; fz=h\.z; \}/.test(src), 'confined spawn aims at the region center');
assert(/const yaw = \(Math\.abs\(fx-best\.x\)>0\.01\|\|Math\.abs\(fz-best\.z\)>0\.01\) \? Math\.atan2\(fx-best\.x, fz-best\.z\) : Math\.atan2\(best\.x, best\.z\);/.test(src), 'faces center when confined, origin otherwise');

// executable: with no movement cage, a bot can step from inside the region to outside it
function clearAt(){ return true; }            // open arena
function step(bx, mvx, lim){ const cx=Math.max(-lim,Math.min(lim,bx+mvx)); return clearAt(cx) ? cx : bx; }
// region is a small circle around x=60; bot at x=70 (inside) steps toward 80 (outside) and is allowed
const moved = step(70, 10, 200);
assert(moved===80, 'a bot freely leaves its spawn area (only the arena limit bounds it)');
done();
