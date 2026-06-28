import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 443: Crushing props — a moving prop (falling box, swinging crusher, animated mover) that overlaps an
// actor deals damage scaled by the prop's speed. Editor-toggleable; player + enemies/bots; off by default.

// config + serialize
assert(/crushDamage:\s*\{[\s\S]*?on:\s*!!\(savedLevel && savedLevel\.game && savedLevel\.game\.crushDamage && savedLevel\.game\.crushDamage\.on\)/.test(src), 'crushDamage config loads from the saved level (off by default)');
assert(/crushDamage: \{ on: !!gameCfg\.crushDamage\.on, player: gameCfg\.crushDamage\.player!==false, ai: gameCfg\.crushDamage\.ai!==false, minSpeed: \+gameCfg\.crushDamage\.minSpeed, perUnit: \+gameCfg\.crushDamage\.perUnit \}/.test(src), 'crushDamage saved with the level');

// formula
const fn = extractFunction('_crushDamageFor');
assert(/if\(!cd \|\| !cd\.on\) return 0;/.test(fn) && /over > 0 \? over \* \(\+cd\.perUnit\|\|0\) : 0/.test(fn), 'damage = (speed - minSpeed) * perUnit, 0 if off/below');

// overlap test
const hit = extractFunction('_propBoxHitsActor');
assert(/ax >= box\.min\.x - r && ax <= box\.max\.x \+ r/.test(hit) && /box\.min\.y <= fy \+ h && box\.max\.y >= fy/.test(hit), 'actor cylinder vs prop AABB (XZ footprint + vertical band)');

// the once-per-frame pass over all props (uniform across dynamic/kinematic/animated)
const cp = extractFunction('crushPass');
assert(/if\(!cd \|\| !cd\.on \|\| !gameOn \|\| \(typeof editorOpen!=='undefined' && editorOpen\) \|\| !\(dt>0\)\) return;/.test(cp), 'crush pass gated to live gameplay');
assert(/const sp = Math\.hypot\(o\.position\.x-pp\.x, o\.position\.y-pp\.y, o\.position\.z-pp\.z\) \/ dt;/.test(cp), 'prop speed derived from world-position delta (covers all prop types)');
assert(/o === \(typeof heldProp!=='undefined' \? heldProp : null\)\) continue;/.test(cp), 'a prop you are carrying does not crush');

// applies to all three actors + cooldown
const ap = extractFunction('_applyCrushFromProp');
assert(/cd\.player && obj!==drivingCar && gameOn && \(player\.hp==null \|\| player\.hp>0\) && _propBoxHitsActor\([\s\S]*?applyEnemyDamageToSelf\(dmg\)/.test(ap), 'crushes the player (but not the car they are driving, build 719)');
assert(/for\(const b of bots\)\{[\s\S]*?botHurt\(b, dmg, null, null\)/.test(ap), 'crushes bots');
assert(/for\(const en of enemies\)\{[\s\S]*?enemyHurt\(en, dmg, null, null\)/.test(ap), 'crushes wave enemies');
assert(/if\(hit\) obj\.userData\._crushT = 0\.5;/.test(ap), 'one slam = one hit (0.5s per-prop cooldown)');

// wired into the loop + editor UI
assert(/updatePhysics\(dt\); updateThrownDamage\(dt\); crushPass\(dt\);/.test(src), 'crush pass runs after physics each frame (host/solo)');
assert(/Enable crush damage/.test(src) && /Crushing props/.test(src) && /cdNum\('Min speed'/.test(src) && /cdNum\('Damage'/.test(src), 'editor exposes crush toggles + tuning');

// executable: a box falling onto a standing player
function inBox(box, ax, fy, az, h, r){ return ax>=box.min.x-r&&ax<=box.max.x+r&&az>=box.min.z-r&&az<=box.max.z+r&&box.min.y<=fy+h&&box.max.y>=fy; }
const player = { x:0, feet:0, z:0, h:1.7, r:0.4 };
const boxFalling = { min:{x:-0.5,y:1.4,z:-0.5}, max:{x:0.5,y:2.4,z:0.5} };   // box overlapping the player's head/torso
assert(inBox(boxFalling, player.x, player.feet, player.z, player.h, player.r)===true, 'a box on the player overlaps');
const boxBeside = { min:{x:3,y:0,z:3}, max:{x:4,y:1,z:4} };
assert(inBox(boxBeside, player.x, player.feet, player.z, player.h, player.r)===false, 'a box across the room does not');
function crush(speed, cfg){ if(!cfg.on) return 0; const o=speed-cfg.minSpeed; return o>0?o*cfg.perUnit:0; }
const cfg={on:true,minSpeed:7,perUnit:2.2};
assert(crush(4,cfg)===0, 'a slow nudge does no damage');
assert(Math.abs(crush(17,cfg)-22)<1e-9, 'a fast slam scales with speed');
done();
