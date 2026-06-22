// (build 44) Per-weapon viewmodel framing must stay independent. Bug: switching the edited weapon ran
// showWeaponModel -> editorTargets.gun.apply(), which wrote the PREVIOUS weapon's (stale) editor state
// into the NEWLY selected weapon's view before syncFromWeapon loaded the right values — so editing one
// gun stamped its transform onto every gun you switched to. Fix: showWeaponModel applies the weapon's
// OWN saved view (applyWepView) and never persists the editor state.
import { gameSource, extractFunction, done, assert, near } from './harness.mjs';

// model the exact semantics of wepView / apply / syncFromWeapon
const DEFAULT = { px:0, py:-0.3, pz:-0.6, rx:0, ry:180, rz:0, s:0.5 };
const WEAPONS = { rifle:{view:null}, smg:{view:null}, shotgun:{view:null} };
const wepView = k => WEAPONS[k].view ? WEAPONS[k].view : { ...DEFAULT };
const state = { ...DEFAULT };
const syncFromWeapon = k => Object.assign(state, wepView(k));
const apply = curWep => { WEAPONS[curWep].view = { ...state }; };           // writes editor state -> weapon (edit path)
const applyWepView = (k) => { /* reads weapon view onto the model only; no write */ void wepView(k); };

// FIXED switch order: set weapon -> show its own view (no write) -> sync editor from it
function switchFixed(toKey){ /* curWep = toKey */ applyWepView(toKey); syncFromWeapon(toKey); }

// 1) edit rifle
let curWep='rifle'; syncFromWeapon('rifle'); state.px=0.5; apply('rifle');
near(WEAPONS.rifle.view.px, 0.5, 1e-9, 'rifle keeps its edit');

// 2) switch to smg (fixed) — must NOT stamp rifle's value onto smg, must NOT touch rifle
curWep='smg'; switchFixed('smg');
assert(WEAPONS.smg.view === null, 'switching does not write into the new weapon');
near(WEAPONS.rifle.view.px, 0.5, 1e-9, 'rifle still 0.5 after switching away');
near(state.px, DEFAULT.px, 1e-9, 'editor now shows smg defaults, not rifle');

// 3) edit smg, switch back to rifle — each retains its own
state.px=0.9; apply('smg'); near(WEAPONS.smg.view.px, 0.9, 1e-9, 'smg keeps its own edit');
curWep='rifle'; switchFixed('rifle');
near(state.px, 0.5, 1e-9, 'rifle framing preserved on return');
near(WEAPONS.smg.view.px, 0.9, 1e-9, 'smg framing untouched');

// 4) prove the OLD order bled (apply on switch with stale state)
const W2={ rifle:{view:null}, smg:{view:null} }; const st2={ ...DEFAULT };
const sync2=k=>Object.assign(st2, W2[k].view?W2[k].view:{ ...DEFAULT });
const apply2=cw=>{ W2[cw].view={ ...st2 }; };
sync2('rifle'); st2.px=0.5; apply2('rifle');
apply2('smg'); sync2('smg');           // OLD: showWeaponModel called apply() before sync -> bleed
near(W2.smg.view.px, 0.5, 1e-9, 'OLD order bled rifle 0.5 onto smg (the bug)');

// --- wiring: the fix is in the real source ---
const swm = extractFunction('showWeaponModel');
assert(/applyWepView\(existing, key\)/.test(swm), 'existing-model branch applies the weapon own view');
assert(/if\(model\.visible\) applyWepView\(model, key\)/.test(swm), 'fresh-load branch reasserts the weapon own view');
assert(!/editorTargets\.gun\.apply\(\)/.test(swm), 'showWeaponModel no longer writes the editor state into a weapon');
done('per-weapon viewmodel framing stays independent across switches');
