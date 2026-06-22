import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 419: characters/enemies "jumped" direction because facing was set instantly (bots: b.mesh.rotation.set
// to the target yaw; enemies: mesh.lookAt). Now they ease toward the target yaw at a capped rate via turnToward,
// so you see them pivot. (Remote PLAYERS already eased — left as-is.)

const tt = extractFunction('turnToward');
assert(/while\(d >  Math\.PI\) d -= 2\*Math\.PI;/.test(tt) && /while\(d < -Math\.PI\) d \+= 2\*Math\.PI;/.test(tt), 'wraps to the shortest path around the circle');
assert(/if\(d >  step\) d =  step;/.test(tt) && /if\(d < -step\) d = -step;/.test(tt), 'caps the per-frame step at the max turn rate');

// applied to bots (both tumbling + grounded) and to solo + networked enemies
assert((src.match(/b\._dispYaw=turnToward\(/g)||[]).length===2, 'both bot rotation paths ease the displayed yaw');
assert(/turnToward\(en\.mesh\.rotation\.y, _tYaw, dt, en\.shielded \? TURN_RATE\*0\.45 : TURN_RATE\)/.test(src), 'campaign enemies ease toward facing (Shieldbearer slower)');
assert(/turnToward\(em\.mesh\.rotation\.y, _ey, dt, TURN_RATE\)/.test(src), 'networked enemies ease toward facing');
assert(!/\.mesh\.lookAt\(/.test(src) || !/en\.mesh\.lookAt/.test(src), 'the instant enemy lookAt snap is gone');

// executable: the easing math behaves
const fn = new Function(extractFunction('turnToward') + '\nreturn turnToward;')();
// 1) rate cap: from 0 toward PI with rate 9 over dt=1/60 -> moves exactly 0.15 rad, not PI
const a = fn(0, Math.PI, 1/60, 9);
assert(Math.abs(a - 0.15) < 1e-9, 'one frame turns at most rate*dt, not the whole way (no snap)');
// 2) shortest path: target just across the -PI/PI seam should turn the SHORT way (negative), not the long way
const b = fn(3.0, -3.0, 1/60, 9);   // 3.0 -> -3.0 is +0.283 the short way (across PI), not -6 the long way
assert(b > 3.0, 'crossing the angle seam turns the short way');
// 3) convergence: never overshoots — stepping repeatedly lands on target and stays
let cur = 0; for(let i=0;i<200;i++) cur = fn(cur, 1.2, 1/60, 9);
assert(Math.abs(cur - 1.2) < 1e-6, 'eventually settles exactly on the target (no jitter/overshoot)');
// 4) already facing -> no movement
assert(fn(1.0, 1.0, 1/60, 9) === 1.0, 'no change when already aligned');
done();
