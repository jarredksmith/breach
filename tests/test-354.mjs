import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 469: the connectivity coloring showed the arena fragmenting into islands — ledges cut off from the
// floor — because the climb-up limit (1.8m) ignored that bots can JUMP. NAV_UP is now derived from the bot's
// jump (apex rise * 0.85 for a reliable landing), connecting cells a hop apart.

assert(/let NAV_UP = 2\.4; const NAV_DOWN = 8\.0;/.test(src), 'NAV_UP is tunable, NAV_DOWN fixed');
assert(/NAV_UP = \(typeof JUMP!=='undefined' && typeof GRAV!=='undefined' && GRAV>0\) \? Math\.max\(0\.6, \(JUMP\*JUMP\/\(2\*GRAV\)\)\*0\.85\) : 2\.4;/.test(src), 'NAV_UP computed from the jump each build');

// --- executable: jump apex + the 0.85 reliable-landing factor ---
function climbHeight(JUMP, GRAV){ return (GRAV>0) ? Math.max(0.6, (JUMP*JUMP/(2*GRAV))*0.85) : 2.4; }
const apex = (J,G)=> J*J/(2*G);
assert(Math.abs(apex(13,30) - 2.817) < 0.01, 'default jump apex is ~2.82m');
const def = climbHeight(13,30);
assert(def > 2.3 && def < 2.5, 'default climbable height ~2.4m (a bit under apex)');
assert(def < apex(13,30), 'climbable height stays below the raw apex (need to land, not just graze)');
// scales with a bigger jump
assert(climbHeight(18,30) > climbHeight(13,30), 'a higher jump connects taller ledges');
// degenerate gravity guarded
assert(climbHeight(13,0) === 2.4, 'zero gravity falls back to the default');
assert(climbHeight(1,30) === 0.6, 'a tiny jump still allows at least a 0.6m step');
done();
