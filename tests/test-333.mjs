import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 442: editor Fall Damage controls — hurt the player and/or AI (enemies + bots) on a hard landing.

// config + serialization (off by default)
assert(/fallDamage:\s*\{[\s\S]*?on:\s*!!\(savedLevel && savedLevel\.game && savedLevel\.game\.fallDamage && savedLevel\.game\.fallDamage\.on\)/.test(src), 'fallDamage config loads from the saved level (off by default)');
assert(/fallDamage: \{ on: !!gameCfg\.fallDamage\.on, player: gameCfg\.fallDamage\.player!==false, ai: gameCfg\.fallDamage\.ai!==false, minSpeed: \+gameCfg\.fallDamage\.minSpeed, perUnit: \+gameCfg\.fallDamage\.perUnit \}/.test(src), 'fallDamage saved with the level');

// the formula
const fn = extractFunction('_fallDamageFor');
assert(/if\(!fd \|\| !fd\.on\) return 0;/.test(fn), 'disabled or absent -> no damage');
assert(/const over = impactSpeed - \(\+fd\.minSpeed\|\|0\);/.test(fn) && /return over > 0 \? over \* \(\+fd\.perUnit\|\|0\) : 0;/.test(fn), 'damage = (impact - safe) * perUnit, clamped at 0');

// landing hooks for all three
assert(/_playerWasAir && gameCfg\.fallDamage && gameCfg\.fallDamage\.on && gameCfg\.fallDamage\.player && gameOn && \(player\.hp==null \|\| player\.hp>0\)/.test(src), 'player takes fall damage on the air->ground transition');
assert(/_playerWasAir = !playerCtrl\.computedGrounded\(\);/.test(src), 'player airborne state is tracked across frames');
assert(/gameCfg\.fallDamage\.ai && !b\.dead\)\{ const dmg=_fallDamageFor\(_imp\); if\(dmg>0\.5\)\{ botHurt\(b, dmg, null, null\); \}/.test(src), 'bots take fall damage on landing');
assert(/gameCfg\.fallDamage\.ai && en\.hp>0\)\{ const dmg=_fallDamageFor\(_imp\); if\(dmg>0\.5\)\{ enemyHurt\(en, dmg, null, null\); \}/.test(src), 'wave enemies take fall damage on landing');

// editor UI
assert(/Enable fall damage/.test(src) && /Affects the player/.test(src) && /Affects enemies \/ bots/.test(src), 'editor exposes enable + per-target toggles');
assert(/fdNum\('Safe speed'/.test(src) && /fdNum\('Damage'/.test(src), 'editor exposes safe-speed + damage tuning');

// executable: the damage curve
function fall(impact, cfg){ if(!cfg || !cfg.on) return 0; const over = impact - (+cfg.minSpeed||0); return over>0 ? over*(+cfg.perUnit||0) : 0; }
const cfg = { on:true, minSpeed:24, perUnit:1.4 };
assert(fall(10, cfg)===0, 'a gentle landing (below safe speed) does nothing');
assert(fall(24, cfg)===0, 'exactly the safe speed does nothing');
assert(Math.abs(fall(44, cfg) - 28) < 1e-9, 'a hard landing scales linearly past the threshold');
assert(fall(60, {on:false,minSpeed:24,perUnit:1.4})===0, 'disabled -> never any damage');
done();
