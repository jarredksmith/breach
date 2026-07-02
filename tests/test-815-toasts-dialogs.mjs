// (build 815) Toast queue + themed dialogs.
//  - flashToast queued: bursty messages ("Checkpoint reached" then "BOSS DOWN") no longer clobber each other. Queued
//    messages show shorter (1.5s) so the backlog flows; identical consecutive messages dedupe; backlog capped at 4.
//  - The 2 native confirm() + 2 alert() dialogs are replaced with themed in-game modals (uiConfirm / uiNotice) — the
//    native popups yanked the player out of fullscreen and ignored the theme.
import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();

// --- the queue ---
assert(/const _toastQ = \[\];/.test(src) && /let _toastBusy = false;/.test(src), 'toast queue state exists');
const ft = extractFunction('flashToast');
assert(/if\(_toastBusy\)\{ if\(_toastQ\[_toastQ\.length-1\]!==msg\)\{ _toastQ\.push\(msg\); if\(_toastQ\.length>4\) _toastQ\.shift\(\); \} return; \}/.test(ft), 'busy toasts queue (deduped, capped at 4) instead of overwriting');
const st = extractFunction('_showToast');
assert(/const next=_toastQ\.shift\(\); if\(next!=null\) setTimeout\(\(\)=>_showToast\(next\), 180\);/.test(st), 'the queue drains with a small gap between messages');
assert(/\}, _toastQ\.length \? 1500 : 2600\);/.test(st), 'queued messages display shorter so the backlog flows');
// executable: the queue behavior
{
  const Q=[]; let busy=true; const push=(m)=>{ if(busy){ if(Q[Q.length-1]!==m){ Q.push(m); if(Q.length>4) Q.shift(); } return; } };
  push('a'); push('a'); push('b'); push('c'); push('d'); push('e');
  eq(Q.length, 4, 'cap holds'); eq(Q.indexOf('a'), -1, 'oldest dropped past the cap'); eq(Q.join(''), 'bcde', 'dedupe + FIFO order');
}

// --- themed dialogs ---
assert(/function uiConfirm\(msg, onYes, yesLabel\)\{ _uiDialog\(msg, \[ \{ label:'Cancel' \}, \{ label:yesLabel\|\|'Confirm', primary:true, fn:onYes \} \]\); \}/.test(src), 'uiConfirm builds a Cancel/Confirm modal');
assert(/function uiNotice\(msg\)\{ _uiDialog\(msg, \[ \{ label:'OK', primary:true \} \]\); \}/.test(src), 'uiNotice builds an OK modal');
const dlg = extractFunction('_uiDialog');
assert(/rgba\(var\(--accent-rgb\),0\.45\)/.test(dlg), 'the dialog uses the theme tokens');
assert(/if\(e\.key==='Escape'\)/.test(dlg) && /if\(e\.target===back\) close\(/.test(dlg), 'Escape + backdrop click dismiss');

// --- no native dialogs remain in executable code ---
{
  const code = src.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
  const natives = code.match(/(?<![\w.])(?:confirm|alert)\(/g) || [];
  // the only survivors must be inside comments or the ui* wrappers themselves
  eq(natives.filter(m=>true).length, 0, 'no native confirm()/alert() calls remain');
}
assert(/uiConfirm\('Replace your current campaign/.test(src), 'campaign import uses the themed confirm');
assert(/uiConfirm\('Delete item "'/.test(src), 'inventory item delete uses the themed confirm');
assert((src.match(/uiNotice\('Could not open a separate window/g)||[]).length===2, 'both popup-blocked alerts use the themed notice');

done('build 815: toasts queue; native dialogs replaced with themed modals');
