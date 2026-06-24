import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 678: the FISTS weapon animates on its own clip set — idle / punch R / punch L / grab — instead of the gun
// idle/shoot/reload. Imported hands models map clips to these slots; the built-in forward "punch thrust" is removed
// for fists so the animation (imported, or the procedural rotational nod) drives the motion.

// --- fist state set + a dedicated state machine ---
assert(/const _FIST_STATES = \['idle','punchR','punchL','grab'\];/.test(src), 'the four fist animation slots');
assert(/function playFistStates\(root, gltf, clips\)\{/.test(src), 'a fist state machine exists');
const pf = extractFunction('playFistStates');
assert(/if\(!pl && pr\) pl=pr;/.test(pf) && /if\(!pr && pl\) pr=pl;/.test(pf), 'a single punch clip covers both sides');
assert(/acts\.idle\.loop=THREE\.LoopRepeat/.test(pf), 'idle loops');
assert(/a\.loop=THREE\.LoopOnce/.test(pf), 'punch/grab are one-shots that return to idle');
assert(/\['punchR',pr\],\['punchL',pl\],\['grab',gb\]/.test(pf), 'punchR / punchL / grab actions built');

// --- the loader routes fists to playFistStates, guns to playGunStates ---
assert(/function _playWepStates\(key, model, gltf\)\{ return _isFistsWep\(key\) \? playFistStates\(model, gltf, WEAPONS\[key\]\.clips\) : playGunStates\(model, gltf, WEAPONS\[key\]\.clips\); \}/.test(src), 'the weapon-state router picks the right set');
assert(/if\(!_playWepStates\(key, model, gltf\)\)/.test(src), 'the model loader uses the router');

// --- triggers: alternating punch on melee, grab on G ---
const ma = extractFunction('meleeAttack');
assert(/triggerFistAnim\(_fistSide<0 \? 'punchL' : 'punchR'\)/.test(ma), 'melee plays the alternating punch clip');
assert(/function grabAction\(\)\{[\s\S]*?triggerFistAnim\('grab'\)/.test(src), 'grab plays the grab clip');
const tf = extractFunction('triggerFistAnim');
assert(/const acts=model && model\.userData && model\.userData\.gunStates/.test(tf) && /a\.reset\(\)\.play\(\)/.test(tf), 'triggerFistAnim fires a one-shot on the active model');

// --- the built-in forward punch thrust is suppressed for fists ---
assert(/const _mp = _isFistsWep\(curWep\) \? 0 : \(1 - Math\.min\(1, \(performance\.now\(\)-_meleeT\)\/250\)\);/.test(src), 'no built-in forward thrust on a fists weapon');
// --- and the procedural fists no longer slide forward (rotational jab only) ---
const af = extractFunction('_animFists');
assert(!/position\.z=-0\.6 - k\*0\.5/.test(af), 'the forward-lunge translation is gone');
assert(/f\.rotation\.x=-0\.18 - k\*1\.15/.test(af), 'replaced by a rotational jab');

// --- editor exposes the fist slots ---
const panel = extractFunction('renderEditorFields');
assert(/const isFists = _isFistsWep\(curWep\);/.test(panel), 'the clip picker detects a fists weapon');
assert(/const STATES = isFists \? _FIST_STATES : \['idle','shoot','reload'\];/.test(panel), 'fists get punch/grab slots, guns keep shoot/reload');
assert(/WEAPONS\[curWep\]\.clips=_wepClipBlank\(curWep\)/.test(panel), 'new clip maps default to the right slot set');

done('build 678: fists animation slots (idle / punch R / punch L / grab) + no built-in forward thrust');
