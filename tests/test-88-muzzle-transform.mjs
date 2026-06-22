// (build 129) Per-weapon muzzle transform: the Gun tab gains Muzzle X/Y/Z, stored per weapon and
// applied to vmMuzzle (the origin of tracers + the muzzle flash). Loads on weapon switch + startup.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();
assert(/const MUZZLE_DEFAULT = \{ x:GUN_OFFSET\.x, y:GUN_OFFSET\.y \+ 0\.04, z:GUN_OFFSET\.z - 1\.02 \}/.test(src), 'muzzle default');
const aw = extractFunction('applyWeaponMuzzle');
assert(/vmMuzzle\.position\.set\(v\.mzx!=null\?v\.mzx:MUZZLE_DEFAULT\.x/.test(aw), 'applier sets vmMuzzle from the weapon view');
assert(/applyWeaponMuzzle\(key\); \/\/ load this weapon's saved muzzle position/.test(extractFunction('switchWeapon')), 'switching loads the muzzle');
assert(/mzx:GUN_OFFSET\.x, mzy:GUN_OFFSET\.y\+0\.04, mzz:GUN_OFFSET\.z-1\.02/.test(extractFunction('wepView')), 'wepView default has muzzle offset');
assert(/\{ k:'mzx', label:'Muzzle X'/.test(src) && /\{ k:'mzz', label:'Muzzle Z'/.test(src), 'editor exposes Muzzle X/Y/Z');
assert(/vmMuzzle\.position\.set\(s\.mzx, s\.mzy, s\.mzz\);/.test(src), 'apply moves the muzzle point');
assert(/s:s\.s, mzx:s\.mzx, mzy:s\.mzy, mzz:s\.mzz \}/.test(src), 'muzzle persisted into the weapon view');
done('muzzle transform');
