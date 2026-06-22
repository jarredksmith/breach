import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 395: the third-person held-gun grip is now PER-WEAPON. Before, one global grip applied to every gun,
// so tuning the SMG overwrote the rifle. Now each weapon stores its own { x,y,z, yaw,pitch,roll, scale }.

// per-weapon map + accessor + default
assert(/const TP_GUN_DEFAULT = \{ x:0\.28, y:1\.15, z:-0\.42, yaw:0, pitch:0, roll:0, scale:1 \};/.test(src), 'a default grip exists');
assert(/let tpGunGrips = \{\};/.test(src), 'grips are stored per weapon');
const acc = extractFunction('tpGunGrip');
assert(/const k = weaponKey \|\| \(typeof curWep!=='undefined'\?curWep:'rifle'\);/.test(acc), 'accessor defaults to the current weapon');
assert(/if\(!tpGunGrips\[k\]\) tpGunGrips\[k\] = Object\.assign\(\{\}, TP_GUN_DEFAULT\);/.test(acc), 'an untuned weapon starts from the default (not a shared object)');
assert(/return tpGunGrips\[k\];/.test(acc), 'accessor returns that weapon\'s own grip');

// the apply + retune paths read the weapon-specific grip
const ag = extractFunction('_applyGunGrip');
assert(/const gr = gripOverride \|\| tpGunGrip\(weaponKey\);/.test(ag), 'fixed-grip apply reads the grip (override or per-weapon)');
const agh = extractFunction('_applyGunGripToHand');
assert(/const gr = gripOverride \|\| tpGunGrip\(weaponKey\);/.test(agh), 'hand-grip apply reads the grip (override or per-weapon)');
const aag = extractFunction('attachAvatarGun');
assert(/_applyGunGripToHand\(gun, hand, weaponKey, g\.userData\.gripOverride\)/.test(aag) && /_applyGunGrip\(gun, weaponKey, g\.userData\.gripOverride\)/.test(aag), 'attach passes the weapon key + grip override through');
const refr = extractFunction('refreshAvatarGunGrips');
assert(/const wk=grp\.userData\.gunKey;/.test(refr) && /_applyGunGripToHand\(grp\.userData\.gun, grp\.userData\.gunBone, wk, ov\)/.test(refr), 'live retune uses each avatar\'s current weapon grip (+ override)');

// sliders bind to the CURRENT weapon's grip (so they rebind when you switch weapons)
assert(/_grip\('Pos X', \(\)=>tpGunGrip\(\)\.x, v=>tpGunGrip\(\)\.x=v/.test(src), 'sliders read/write the current weapon grip');
assert((src.match(/tpGunGrip\(\)\./g)||[]).length === 14, 'all 7 sliders get+set the per-weapon grip');

// a weapon picker in the grip section switches which weapon is being tuned + rebinds
assert(/per weapon/.test(src), 'grip header notes it is per-weapon');
assert(/wb\.onclick=\(\)=>\{ if\(wk!==curWep\)\{[\s\S]*?curWep=wk;[\s\S]*?renderEditorFields\(\); \}/.test(src), 'picking a weapon rebinds the grip sliders to it');

// old single-global-grip key is migrated into the rifle slot once
assert(/tpGunGrips\.rifle=Object\.assign\(\{\}, TP_GUN_DEFAULT, o\);/.test(src), 'the old single grip migrates into the rifle slot');
done();
