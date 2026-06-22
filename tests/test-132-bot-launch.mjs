// (build 189) Enemies (bots) gained vertical physics so a trap can launch them. Previously bots were
// ground-locked (pos.y hardwired to 0, no gravity), so an animated prop / trebuchet couldn't fling them.
// Now bots have vy + horizontal launch velocity (evx/evz) + gravity + ground/prop-top landing, and
// _xaCarryBot gives them the same ride/launch a fast-moving prop gives the player.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// the bot carry/launch helper exists and flings on a fast surface
const cb = extractFunction('_xaCarryBot');
assert(/if\(sp > XA_LAUNCH\)/.test(cb), '_xaCarryBot flings the bot when the surface moves fast');
assert(/bot\.vy=\(vy>=0\)\?Math\.max\(bot\.vy\|\|0, vy, 4\)/.test(cb), '_xaCarryBot sets an upward launch velocity');
assert(/bot\.evx=.*LP; bot\.evz=.*LP/.test(cb), '_xaCarryBot sets horizontal launch momentum');

// updateXAnim carries grounded bots off the prop, same as the player
const xa = extractFunction('updateXAnim');
assert(/if\(bots && bots\.length\)\{ for\(const _bt of bots\)\{ if\(!_bt\.dead && _bt\.grounded!==false\) _xaCarryBot/.test(xa), 'updateXAnim launches grounded bots off animated props');

// bots integrate gravity + land, and only walk when grounded
const ub = extractFunction('updateBots');
assert(/b\.vy=\(b\.vy\|\|0\)-GRAV\*dt; b\.pos\.y\+=b\.vy\*dt;/.test(ub), 'bots fall under gravity');
assert(/if\(b\.grounded!==false\)\{/.test(ub), 'bots only walk when grounded (airborne = flung)');
assert(/b\.mesh\.position\.set\(b\.pos\.x,b\.pos\.y,b\.pos\.z\)/.test(ub), 'bot mesh follows its vertical position');

// spawn + respawn seed the vertical state
assert(/vy:0, evx:0, evz:0, grounded:true,/.test(src), 'spawned bots carry vertical state');
assert(/b\.vy=0; b\.evx=0; b\.evz=0; b\.grounded=true;/.test(ub), 'respawn resets vertical state');

done();
