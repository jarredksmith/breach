// (build 191) Single-player enemies (the hovering co-op/solo enemy type) gained launch parity with bots:
// a trebuchet flings them and explosions knock them back. They hover at y=1.4, so the launch is a vertical
// pop (launchY) that arcs under gravity and settles back, plus horizontal momentum (evx/evz). A shared
// _blastLaunch helper drives blast knockback for both enemies and bots.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// trebuchet launch helper for enemies
const ce = extractFunction('_xaCarryEnemy');
assert(/if\(sp > XA_LAUNCH\)/.test(ce), '_xaCarryEnemy flings the enemy on a fast surface');
assert(/en\.vy=\(vy>=0\)\?Math\.max\(en\.vy\|\|0, vy, 4\)/.test(ce) && /en\.evx=.*LP; en\.evz=.*LP/.test(ce), '_xaCarryEnemy sets vertical + horizontal launch');

// updateXAnim drives enemies too
const xa = extractFunction('updateXAnim');
assert(/if\(enemies && enemies\.length\)\{ for\(const _en of enemies\)\{ if\(_en\.grounded!==false\) _xaCarryEnemy/.test(xa), 'updateXAnim launches grounded enemies off animated props');

// shared blast helper handles both actor shapes (enemy mesh.position, bot pos)
const bl = extractFunction('_blastLaunch');
assert(/actor\.pos \? actor\.pos\.x : actor\.mesh\.position\.x/.test(bl), '_blastLaunch reads either a bot pos or an enemy mesh');
assert(/actor\.vy=Math\.max\(actor\.vy\|\|0,\(5\+R\*0\.6\)\*f\*LP\); actor\.grounded=false;/.test(bl), '_blastLaunch pops the actor up + airborne');

// both explosion paths launch enemies
assert(/_blastLaunch\(en, g\.mesh\.position\.x, g\.mesh\.position\.y, g\.mesh\.position\.z, R, f\)/.test(src), 'grenade blast launches enemies');
assert(/_blastLaunch\(en, pos\.x,pos\.y,pos\.z, R, f\)/.test(src), 'prop explosion launches enemies');

// enemies carry the launch state + airborne integration; hover height includes the launch pop
const src2 = src;
assert(/vy:0, evx:0, evz:0, grounded:true, launchY:0,/.test(src2), 'spawned enemies carry launch state');
assert(/en\.mesh\.position\.y = \(en\._groundY!=null\?en\._groundY:0\) \+ 1\.4 \+ \(en\.launchY\|\|0\);/.test(src2), 'grounded height adds the launch pop (no bob; surface via groundHeightAt, build 529)');
assert(/en\.vy=\(en\.vy\|\|0\)-GRAV\*dt; en\.launchY=\(en\.launchY\|\|0\)\+en\.vy\*dt;/.test(src2), 'launch pop integrates under gravity');

done();
