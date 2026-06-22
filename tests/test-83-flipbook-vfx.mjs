// (build 119) Sprite-sheet (flipbook) VFX: explosions/smoke/fire/muzzle from hosted PNG sheets, billboard
// sprites whose texture offset steps through frames over their lifetime, with procedural fallback when a
// sheet is missing. Built on the existing THREE (no external particle lib).
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// config + loader
assert(/const VFX_BASE = 'vfx\/';/.test(src), 'configurable vfx base path');
assert(/explosion: \{ url:VFX_BASE\+'explosion\.png'/.test(src) && /smoke:/.test(src) && /fire:/.test(src) && /muzzle:/.test(src), 'four effect configs');
assert(/function loadVfxTexture/.test(src) && /function preloadVfx/.test(src), 'lazy loader + preloader');
const lv = extractFunction('loadVfxTexture');
assert(/_seedProcVfx\(kind\)/.test(lv), 'build 631: always seeds a procedural animated sheet (no missing-sheet fallback to a gradient ball)');
assert(/using the built-in procedural one/.test(lv), 'a missing hosted PNG just keeps the procedural sheet');

// flipbook player advances frames by texture offset
const pf = extractFunction('playFlipbook');
assert(/if\(!entry \|\| !entry\.tex\)\{ loadVfxTexture\(kind\); entry = _vfxTex\[kind\]; \}/.test(pf), 'build 631: seeds a procedural sheet synchronously so a flipbook always plays');
assert(/const tex = entry\.tex;/.test(pf), 'reuses one shared sheet texture');
assert(/blending: cfg\.blend==='add' \? THREE\.AdditiveBlending : THREE\.NormalBlending/.test(pf), 'additive vs normal blend per effect');
const uf = extractFunction('updateFlipbooks');
assert(/f\.ox = col\/cfg\.cols; f\.oy = 1 - \(row\+1\)\/cfg\.rows;/.test(uf), 'steps the sheet frame each update');
assert(/dur: cfg\.dur \* \(durMul\|\|1\)/.test(extractFunction('playFlipbook')) && /const prog=f\.t\/f\.dur/.test(uf), 'per-effect duration override');
assert(/f\.sp\.material\.dispose\(\)/.test(uf) && !/f\.tex\.dispose\(\)/.test(uf), 'disposes material but reuses shared tex');

// explosion uses the sheet with procedural fallback
const eg = extractFunction('explodeGrenade');
assert(/const usedSheet = playFlipbook\('explosion', pos/.test(eg), 'explosion tries the flipbook');
assert(/if\(usedSheet\)\{ playFlipbook\('smoke', pos/.test(eg), 'lingering smoke when the sheet plays');
assert(/else \{\n    blast = new THREE\.Mesh/.test(eg), 'procedural blast fallback retained');

// muzzle + loop + preload
assert(/if\(playFlipbook\('muzzle', pos, 0\.5\)\) return;/.test(extractFunction('muzzleFlashAt')), 'muzzle flash uses the sheet if hosted');
assert(/playFlipbook\('muzzle', new THREE\.Vector3\(0,0,-0\.05\), 0\.5, vmMuzzle\)/.test(extractFunction('shoot')), 'local gun plays the muzzle sheet in viewmodel space');
assert(/\(parent\|\|scene\)\.add\(sp\)/.test(extractFunction('playFlipbook')), 'flipbook can render in a given parent space');
assert(/if\(parent\)\{ mat\.depthTest=true; \}/.test(extractFunction('playFlipbook')), 'viewmodel flipbooks are occluded by the gun (sit behind it)');
assert(/updateFlipbooks\(dt\);/.test(src), 'flipbooks ticked in the loop');
assert(/if\(typeof preloadVfx==='function'\) preloadVfx\(\);/.test(src), 'sheets preloaded on run start');
done('flipbook vfx');
