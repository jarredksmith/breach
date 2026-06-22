import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 484 + 487: cloned GLB bots/avatars SHARE material instances by default (loadGLTFCached returns one
// gltf; cloneSkinned shares materials), so the death-fade (which sets material opacity) faded every bot
// using that material, then they popped back on respawn. Each visual now clones its own material. The fix
// must live in BOTH builders: buildEnemyVisual (editor enemies, build 484) AND buildAvatarVisual (PvP bots
// + remote players, build 487 — this is the path that actually fades/respawns, so it was the visible bug).
const CLONE = /o\.material = Array\.isArray\(o\.material\) \? o\.material\.map\(m=>m\.clone\(\)\) : o\.material\.clone\(\);/;
const enemyBody  = src.slice(src.indexOf('function buildEnemyVisual'),  src.indexOf('function buildEnemyVisual')+4000);
const avatarBody = src.slice(src.indexOf('function buildAvatarVisual'), src.indexOf('function rebuildAvatars'));
assert(CLONE.test(enemyBody),  'buildEnemyVisual clones each enemy material (build 484)');
assert(CLONE.test(avatarBody), 'buildAvatarVisual clones each bot/avatar material (build 487)');
// the death-fade still mutates opacity (now safely, on the per-bot material)
assert(/m\.transparent=true; m\.opacity=k;/.test(src), 'death fade animates opacity');
assert(/b\.mesh\.traverse\(o=>\{ if\(o\.isMesh && o\.material\)\{ const ms=Array\.isArray\(o\.material\)\?o\.material:\[o\.material\]; ms\.forEach\(m=>\{ m\.opacity=1; \}\); \} \}\);/.test(src), 'respawn restores opacity to 1');

// --- executable: per-instance materials isolate opacity; shared materials do not ---
function fadeOne(mats, k){ mats.forEach(m=>{ m.opacity=k; }); }   // fade one bot's material set
// SHARED (the bug): two bots reference the same material object
const shared={opacity:1}; const botA_shared=[shared], botB_shared=[shared];
fadeOne(botA_shared, 0.2);
assert(botB_shared[0].opacity===0.2, 'shared material: fading bot A also faded bot B (the bug)');
// CLONED (the fix): each bot has its own material object
function clone(m){ return Object.assign({}, m); }
const srcMat={opacity:1};
const botA=[clone(srcMat)], botB=[clone(srcMat)];
fadeOne(botA, 0.2);
assert(botA[0].opacity===0.2 && botB[0].opacity===1, 'cloned materials: fading bot A leaves bot B fully visible');
done();
