// (build 60) iOS Safari has no Pointer Lock API — requestPointerLock/exitPointerLock are undefined.
// Every call must go through guarded wrappers so a missing API can't throw on mobile.
import { gameSource, extractFunction, done, assert, eq } from './harness.mjs';
const src = gameSource();

// wrappers exist and are guarded
const tpl = extractFunction('tryPointerLock'), sepl = extractFunction('safeExitPointerLock');
assert(/if\(isTouch\) return;/.test(tpl), 'tryPointerLock skips touch devices');
assert(/el && el\.requestPointerLock/.test(tpl), 'tryPointerLock feature-checks before calling');
assert(/document\.exitPointerLock/.test(sepl), 'safeExitPointerLock feature-checks');
assert(!/safeExitPointerLock\(/.test(sepl.replace(/function safeExitPointerLock/, '')), 'safeExitPointerLock is not recursive');

// no bare/unguarded call sites remain (the only real method call lives inside each wrapper)
eq((src.match(/renderer\.domElement\.requestPointerLock\(/g)||[]).length, 0, 'no direct requestPointerLock calls; all routed through tryPointerLock');
assert(/el\.requestPointerLock\(\)/.test(tpl), 'the wrapper calls the element method');
assert(!/document\.exitPointerLock\(\)/.test(src), 'no bare document.exitPointerLock() calls');
assert(/if\(!isTouch && gameOn && !locked && !shopOpen && !invOpen && !editorOpen && !paused\) tryPointerLock\(\)/.test(src), 'click handler uses the wrapper');

// --- runnable: wrappers never throw when the API is missing (iOS), and work when present (desktop) ---
const mk = new Function('isTouch','renderer','document', `
  ${tpl}
  ${sepl}
  return { tryPointerLock, safeExitPointerLock };
`);
// iOS: methods undefined, touch device
let api = mk(true, { domElement:{} }, {});
api.tryPointerLock();        // isTouch -> early return, no throw
api.safeExitPointerLock();   // no method -> guarded, no throw
// non-touch but unsupported (old browser): still must not throw
api = mk(false, { domElement:{} }, {});
api.tryPointerLock();
// desktop with support
let locked=false, exited=false;
api = mk(false, { domElement:{ requestPointerLock(){ locked=true; } } }, { exitPointerLock(){ exited=true; } });
api.tryPointerLock();      eq(locked, true, 'desktop acquires pointer lock');
api.safeExitPointerLock(); eq(exited, true, 'desktop releases pointer lock');
done('safe pointer-lock wrappers (iOS-safe, no throw)');
