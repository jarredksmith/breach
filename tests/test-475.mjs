import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 622: pre-warm the flipbook Sprite shader program so the first rocket/explosion doesn't freeze the frame.
// The sprite program is only compiled by the GPU on first render of such a sprite; the load-time compile pass
// ran before any flipbook sprite existed, so it never warmed it. warmFlipbookShaders() compiles it up-front.

assert(/function warmFlipbookShaders\(\)/.test(src), 'shader warm-up helper exists');
const fn = extractFunction('warmFlipbookShaders');
// idempotent + guarded against a missing renderer
assert(/if\(_vfxWarmed\) return;/.test(fn), 'warms at most once');
assert(/let _vfxWarmed = false;/.test(src), 'warm-once flag declared');
assert(/!renderer\.compile/.test(fn), 'no-ops without a renderer that can compile');
// it needs a real loaded VFX texture so the USE_MAP program variant matches the live effect
assert(/for\(const k in _vfxTex\)\{ const e=_vfxTex\[k\]; if\(e && e\.tex\)\{ tex=e\.tex; break; \} \}/.test(fn), 'uses a loaded VFX texture');
assert(/if\(!tex\) return;/.test(fn), 'retries later if no sheet is ready yet');
// compiles BOTH the world scene and the viewmodel scene (explosions + muzzle flash)
assert(/renderer\.compile\(scene,/.test(fn), 'compiles the world scene');
assert(/renderer\.compile\(vmScene, vmCam\)/.test(fn), 'compiles the viewmodel scene');
assert(/drop\(scene, THREE\.AdditiveBlending/.test(fn) && /drop\(scene, THREE\.NormalBlending/.test(fn), 'warms both additive (explosion) and normal (smoke) sprites');
// the throwaway warm sprites are removed + disposed afterwards (no leak, nothing visible)
assert(/for\(const sp of made\)\{ sp\.removeFromParent\(\); sp\.material\.dispose\(\); \}/.test(fn), 'cleans up the warm sprites');
// wired into the texture load so it runs as soon as a sheet is GPU-ready
assert(/_vfxTex\[kind\]=\{tex:t\}; console\.info\('\[VFX\] loaded '\+kind\+' ✓ '\+cfg\.url\); warmFlipbookShaders\(\);/.test(src), 'warm-up fires on VFX texture load');

done('flipbook shader pre-warm: first explosion no longer freezes the frame (build 622)');
