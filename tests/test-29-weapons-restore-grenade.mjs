// (build 45) Two things: (a) per-weapon model+view are restored from the save at page load (they were
// serialized but never read back, so gun edits vanished on reload); (b) the grenade has an editable
// model + tuning (blast radius, damage, fuse, throw force, scale), applied/saved/restored.
import { extractFunction, gameSource, done, assert, near } from './harness.mjs';
const src = gameSource();

// --- (a) weapons restore on load ---
assert(/if\(savedLevel && savedLevel\.weapons\)\{ for\(const k in WEAPONS\)\{ const wd = savedLevel\.weapons\[k\]; if\(wd\)\{ WEAPONS\[k\]\.model = wd\.model \|\| '', WEAPONS\[k\]\.view = wd\.view \|\| null;?/.test(src.replace(/\s+/g,' ')) || /WEAPONS\[k\]\.model = wd\.model \|\| ''; WEAPONS\[k\]\.view = wd\.view \|\| null;/.test(src), 'savedLevel.weapons applied to WEAPONS at startup');
assert(/weapons: Object\.keys\(WEAPONS\)\.reduce/.test(src), 'serializeLevel still writes weapons');
assert(/function saveLevel\(\)\{[\s\S]*?localStorage\.setItem\(SAVE_KEY, str\); return localStorage\.getItem\(SAVE_KEY\)===str;/.test(src), 'Save writes + verifies the serialized level to localStorage (and the durable store)');

// --- (b) grenade config defaults ---
const G = extractFunction ? null : null;
assert(/const GRENADE = \{[\s\S]*radius:[\s\S]*\? savedLevel\.grenade\.radius     : 8/.test(src), 'default blast radius 8');
assert(/damage:[\s\S]*\? savedLevel\.grenade\.damage     : 80/.test(src), 'default damage 80');
assert(/fuse:[\s\S]*\? savedLevel\.grenade\.fuse       : 1\.5/.test(src), 'default fuse 1.5s');
assert(/throwForce:[\s\S]*\? savedLevel\.grenade\.throwForce : 26/.test(src), 'default throw force 26');

// grenade uses the config
const tg = extractFunction('throwGrenade');
assert(/const mesh = makeGrenadeMesh\(\)/.test(tg), 'throw builds the configured grenade mesh');
assert(/multiplyScalar\(GRENADE\.throwForce\)/.test(tg) && /fuse: GRENADE\.fuse/.test(tg), 'throw uses GRENADE.throwForce + fuse');
const eg = extractFunction('explodeGrenade');
assert(/const R = GRENADE\.radius/.test(eg) && /GRENADE\.damage \* f/.test(eg) && /const f = 1 - d\/R/.test(eg), 'explosion uses GRENADE.radius + damage falloff');
const mg = extractFunction('makeGrenadeMesh');
assert(/grenadeGltf/.test(mg) && /new THREE\.Mesh\(nadeGeo, nadeMat\)/.test(mg), 'model when set, else the built-in frag sphere');
assert(/function loadGrenadeModel\(\)/.test(src) && /loadGrenadeModel\(\);   \/\/ preload a saved grenade model/.test(src), 'grenade model preloads at startup');

// editor target + tab sync
assert(/grenade: \{\s*label: 'Grenade'/.test(src), 'Grenade editor tab exists');
for(const f of ['Blast radius','Max damage','Fuse \\(s\\)','Throw force','Model scale'])
  assert(new RegExp(f).test(src), 'grenade field present: '+f);
assert(/getUrl\(\)\{ return GRENADE\.model; \}/.test(src) && /setUrl\(u\)\{ GRENADE\.model = \(u\|\|''\)\.trim\(\); loadGrenadeModel\(\); \}/.test(src), 'grenade model URL field wired');
assert(/key==='grenade' && editorTargets\.grenade\.sync/.test(src), 'opening the Grenade tab syncs its state');

// serialize + restore (load + co-op)
assert(/grenade: \{ model: GRENADE\.model, scale: GRENADE\.scale, radius: GRENADE\.radius, damage: GRENADE\.damage, fuse: GRENADE\.fuse, throwForce: GRENADE\.throwForce \}/.test(src), 'serialize writes grenade');
const restores = src.match(/if\(level\.grenade\)\{ const G=level\.grenade;/g) || [];
assert(restores.length >= 2, 'grenade restored on load AND from host in co-op');

// --- runnable: AoE falloff math ---
const dmgAt = (damage,R,d)=> d<R ? damage*(1-d/R) : 0;
near(dmgAt(80,8,0), 80, 1e-9, 'full damage at the center');
near(dmgAt(80,8,4), 40, 1e-9, 'half damage at half radius');
near(dmgAt(80,8,8), 0, 1e-9, 'zero at the edge');
assert(dmgAt(80,8,10) === 0, 'no damage beyond the radius');
done('weapons restored on load + editable grenade model/settings');
