import { extractFunction, gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 389: shooting an enemy (or hitting it with a blast) now ALERTS it — even a Hold/Patrol enemy that
// never saw you. It becomes aware and hunts toward where the threat came from, so sniping from cover draws
// a response instead of the enemy obliviously soaking hits.

// the alert helper exists and sets awareness + last-known position toward the threat
const alertEnemy = new Function('performance',
  '"use strict"; ' + extractFunction('alertEnemy') + '; return alertEnemy;')({ now:()=>1000 });
const en = { dead:false, aware:false, lostAt:5, lkp:null };
alertEnemy(en, 42, -17);
assert(en.aware === true, 'alert wakes the enemy');
assert(en.lkp && en.lkp.x === 42 && en.lkp.z === -17, 'alert points the last-known position at the threat source');
assert(en.lostAt === 0, 'alert resets the lost-sight timer (fresh pursuit)');
// dead enemies ignore alerts
const dead = { dead:true, aware:false }; alertEnemy(dead, 0, 0); assert(dead.aware === false, 'a dead enemy is not alerted');

// wired into the player's direct fire hit
assert(/alertEnemy\(en, player\.pos\.x, player\.pos\.z\);[\s\S]*?const _ek = enemyHurt\(en, dealt/.test(src), 'shooting an enemy alerts it toward the player');
// wired into grenade + explosion splash
assert(/alertEnemy\(en, g\.mesh\.position\.x, g\.mesh\.position\.z\);[\s\S]*?enemyHurt\(en, GRENADE\.damage \* f/.test(src), 'grenade blast alerts enemies');
assert(/alertEnemy\(en, pos\.x, pos\.z\);[\s\S]*?enemyHurt\(en, dmg\*f/.test(src), 'explosion blast alerts enemies');

// an alerted enemy gets a longer investigate window than a normal lost-sight
const fn = extractFunction('enemyDesiredTarget');
assert(/const giveUp = \(en\._alertedT && \(now - en\._alertedT\) < 8000\) \? 8000 : 3500;/.test(fn), 'fresh alert extends the give-up window to investigate');

// executable: an out-of-range Hold enemy, once alerted, chases toward the threat (last-known position)
const enemyDesiredTarget = new Function('Math','performance','segmentBlocked',
  '"use strict"; ' + extractFunction('enemyDesiredTarget') + '; return enemyDesiredTarget;')(Math, { now:()=>2000 }, null);
const hold = { mode:'hold', detectR:14, home:{x:0,z:0}, mesh:{ position:{x:0,z:0,y:1.4} }, aware:true, lostAt:0, lkp:{x:42,z:-17}, _alertedT:1999 };
const r = enemyDesiredTarget(hold, 42, -17, 45, 2000);   // player 45u away (well beyond detect 14) but enemy was alerted
assert(r.chase === true && r.tx === 42 && r.tz === -17, 'an alerted Hold enemy investigates the threat even from beyond detect range');
done();
