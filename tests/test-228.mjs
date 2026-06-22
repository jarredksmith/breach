import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 320: gunners fire rapid 4-round bursts like a real rifle
assert(/gunner:[^\n]*burst:4, burstGap:0\.09/.test(src), 'gunner has a 4-round burst');
assert(/gunner:[^\n]*projSpeed:38/.test(src), 'gunner bolts fly fast');
assert(/gunner:[^\n]*dmg:4,/.test(src), 'per-round damage rebalanced for the burst');
assert(/burst: ty\.burst\|\|1, burstGap: ty\.burstGap\|\|0\.09/.test(src), 'burst config carried onto live enemies');

// per-round spread
assert(/function fireEnemyShot\(en, target, spread\)/.test(src), 'fireEnemyShot takes spread');
assert(/if\(spread\)\{ dir\.x\+=\(Math\.random\(\)\*2-1\)\*spread/.test(src), 'spread perturbs the aim');

// burst pacing in the enemy update
assert(/if\(en\._burstN>0\)\{/.test(src), 'in-flight burst processed each frame');
assert(/en\._burstT -= dt/.test(src) && /en\._burstT = en\.burstGap/.test(src), 'rounds paced by burstGap');
assert(/fireEnemyShot\(en, tg, 0\.035\)/.test(src), 'follow-up rounds re-aim at the live target with spread');
assert(/segmentBlocked\(en\.mesh\.position\.x, en\.mesh\.position\.z, tg\.pos\.x, tg\.pos\.z,/.test(src), 'burst rounds still respect line of sight (surface-relative height, build 533)');
assert(/en\._burstN = Math\.max\(0,\(en\.burst\|\|1\)-1\)/.test(src), 'trigger starts the remaining rounds');
assert(/en\.shootCd = en\.fireCd; en\._attackT = nowMs \+ \(en\.burst>1 \? 450 \+ en\.burst\*en\.burstGap\*1000 : 450\)/.test(src), 'attack anim spans the burst; cooldown unchanged for single-fire types');
// boss unchanged (no burst field -> defaults to 1)
assert(!/boss:[^\n]*burst:/.test(src), 'boss keeps single fire');
done();
