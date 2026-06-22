import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 404: (1) death FX (ring + particles) spawned at y=0 instead of the player's real height, so on hilly
// terrain it floated/sank. Now it uses the actual death Y. (2) Bots play their death animation and fade out
// over the respawn window instead of vanishing instantly.

// --- death FX height ---
assert(/netDeath\(player\.pos\.x, player\.pos\.y, player\.pos\.z\)/.test(src), 'local death FX uses the player\'s real Y (not 0)');
assert(/netDeath\(b\.pos\.x,b\.pos\.y\|\|0,b\.pos\.z\)/.test(src), 'bot death FX uses the bot\'s real Y');
// the FX still offsets the particles up from the feet position it is given
const fx = extractFunction('playerDeathFx');
assert(/p\.position\.set\(x, y\+0\.9, z\)/.test(fx), 'particles rise from the given feet height');

// --- bot death animation + fade ---
const bd = extractFunction('botDie');
assert(/setEnemyAnimState\(b\.mesh, dieSlot\); b\._dying=true;/.test(bd), 'a bot with a die clip plays it on death');
assert(/else if\(b\.mesh\)\{ b\.mesh\.visible=false; b\._dying=false; \}/.test(bd), 'a bot with no die clip just hides (FX still plays)');
assert(!/b\.respawnT=2\.5; if\(b\.mesh\) b\.mesh\.visible=false;/.test(bd), 'death no longer hides the mesh instantly');

// the dead-branch fades the body out then hides it, and respawn restores opacity + idle
const ub = extractFunction('updateBots');
assert(/if\(b\._dying && b\.mesh\)\{/.test(ub), 'dead bots run a dying sequence');
assert(/const k=Math\.max\(0,1-\(b\._dieT-fadeStart\)\/0\.7\);/.test(ub), 'body fades over the last ~0.7s');
assert(/if\(b\._dieT >= 2\.5\)\{ b\.mesh\.visible=false; b\._dying=false; \}/.test(ub), 'hidden only after the death sequence completes');
assert(/m\.opacity=1;/.test(ub) && /setEnemyAnimState\(b\.mesh,'idle'\)/.test(ub), 'respawn restores full opacity + idle pose');

// remote players already hold a die pose while dead (regression guard)
assert(/if\(rp\.hp!=null && rp\.hp<=0\) _st = \(rp\._hitDir===0\?'dieBack'/.test(src), 'remote dead peers hold a directional death pose (build 497)');
done();
