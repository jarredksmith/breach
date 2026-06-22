// (build 147) Thrown props deal damage. A prop you throw is "armed" briefly; while moving fast it damages
// the first thing it hits (co-op enemies, or PvP bots/players), scaled by impact speed * mass, with kill
// credit to the thrower and no friendly fire. One hit per throw; disarms after a moment or once it slows.
import { gameSource, extractFunction, html, done, assert } from './harness.mjs';
const src = gameSource();

assert(/const THROW_DMG_MIN_SPEED=6, THROW_DMG_K=2\.0, THROW_DMG_MAX=60, THROW_ARM_MS=1500;/.test(src), 'damage tuning consts');
assert(/function updateThrownDamage\(dt\)/.test(src), 'thrown-damage system exists');

const ut = extractFunction('updateThrownDamage');
assert(/if\(NET\.mode==='client' \|\| !physWorld\) return;/.test(ut), 'host/solo authoritative');
assert(/if\(!ud\._thrownT \|\| ud\._thrownT<now\) continue;/.test(ut), 'only armed (recently thrown) props hurt');
assert(/const speed=Math\.hypot\(lv\.x,lv\.y,lv\.z\);/.test(ut) && /if\(speed<THROW_DMG_MIN_SPEED\)/.test(ut), 'needs real impact speed');
assert(/const dmg=Math\.min\(THROW_DMG_MAX, speed\*THROW_DMG_K\*\(ud\.mass\|\|1\)\);/.test(ut), 'damage scales with speed * mass, capped');
assert(/spark\(c,0xffd166\); enemyHurt\(en, dmg, t\.x, t\.z\);/.test(ut), 'co-op: damages + can kill enemies');
assert(/if\(botHurt\(bt, dmg, t\.x, t\.z\)\) registerDuelKill\(by,bt\.id\);/.test(ut), 'PvP: damages bots + credits the thrower');
assert(/by!==NET\.myId && !duelDead && !sameTeam\(by,NET\.myId\)/.test(ut), 'a thrown prop can hit the host (no self/friendly hits)');
assert(/sendToPlayer\(\+id,\{t:'pvpHit',d:dmg,from:by\}\)/.test(ut), 'PvP: damages remote players, crediting the thrower');
assert(/sameTeam\(by,bt\.id\)/.test(ut), 'no friendly fire on teammates');
assert(/if\(hit\)\{ ud\._thrownT=0;/.test(ut), 'one hit per throw (disarms on contact)');

assert(/b\.applyImpulse\(_impJ, true\); obj\.userData\._thrownT=performance\.now\(\)\+THROW_ARM_MS; obj\.userData\._thrownBy=NET\.myId;/.test(src), 'host throw arms the prop');
assert(/o\.userData\._thrownT=performance\.now\(\)\+THROW_ARM_MS; o\.userData\._thrownBy=id;/.test(src), 'a client throw arms the prop with the client as thrower');
assert(/\{ updatePhysics\(dt\); updateThrownDamage\(dt\); crushPass\(dt\); \}/.test(src), 'loop ticks thrown damage + crush pass after the physics step');
done('thrown-prop damage');
