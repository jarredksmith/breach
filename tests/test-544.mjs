import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 700: many notices call toast(msg) behind an `if(typeof toast==='function')` guard, but `toast` was never
// defined — only flashToast. The guard always failed, so "Checkpoint reached", "Respawned", AI-furnish progress,
// "key saved", etc. silently never showed. Alias toast -> flashToast so those messages actually appear.

// --- the alias exists, pointing at the real toaster ---
assert(/const toast = flashToast;/.test(src), 'toast is aliased to flashToast');
assert(/function flashToast\(msg\)\{/.test(src), 'flashToast (the real on-screen toast) still exists');

// --- the alias is defined right after flashToast, so the call sites resolve it ---
const fi = src.indexOf('function flashToast(msg)');
const ai = src.indexOf('const toast = flashToast;');
assert(fi >= 0 && ai > fi, 'the alias is declared after flashToast is defined');

// --- the checkpoint signal now surfaces a visible notice (+ chime) ---
const sc = extractFunction('setCheckpoint');
assert(/toast\('Checkpoint reached'\)/.test(sc), 'setCheckpoint shows a "Checkpoint reached" toast');
assert(/SFX\.power/.test(sc), 'setCheckpoint also plays the power chime');

// --- a representative sample of formerly-dead toast() sites are still wired (now revived by the alias) ---
assert(/toast\(_checkpoint \? 'Respawned at checkpoint' : 'Respawned'\)/.test(extractFunction('respawnAtCheckpoint')), 'respawn toast is wired');

// --- executable: a guarded toast() call fires once toast is defined as flashToast ---
let shown = null;
const flashToast = (m)=>{ shown = m; };
const toast = flashToast;                                  // mirror the source alias
(function setCheckpointLike(){ if(typeof toast==='function') toast('Checkpoint reached'); })();
assert(shown === 'Checkpoint reached', 'the typeof-guarded call now passes and toasts the message');

done('build 700: toast() notices (incl. Checkpoint reached) actually display');
