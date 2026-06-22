// (build 64) Desktop launch-screen fullscreen toggle. Vendor-prefixed, hidden on touch / when unsupported,
// label tracks state. Runnable enter/exit + gating checks with a stubbed document.
import { gameSource, html, extractFunction, done, assert, eq } from './harness.mjs';
const src = gameSource();

assert(/<button id="fsBtn"[^>]*><\/button>/.test(html) && /UI_ICON\.fullscreen/.test(src), 'launch menu has a fullscreen button (icon set by JS, build 516)');
assert(/const fs=document\.getElementById\('fsBtn'\);/.test(src) && /fsSupported\(\)/.test(src) && /fs\.onclick=toggleFullscreen/.test(src), 'bindMenu wires + gates the button');
assert(/addEventListener\('fullscreenchange', syncFsBtn\)/.test(src) && /addEventListener\('webkitfullscreenchange', syncFsBtn\)/.test(src), 'label re-syncs on state change');

const mk = new Function('document','isTouch', `
  ${extractFunction('fsElement')}
  ${extractFunction('fsSupported')}
  ${extractFunction('toggleFullscreen')}
  return { fsElement, fsSupported, toggleFullscreen };
`);
let entered=false, exited=false, cur=null;
const el = { requestFullscreen(){ entered=true; cur=el; return { catch(){} }; } };
const doc = { documentElement: el, fullscreenEnabled:true, get fullscreenElement(){ return cur; }, exitFullscreen(){ exited=true; cur=null; } };

let api = mk(doc, false);
eq(api.fsSupported(), true, 'supported on desktop with the API present');
api.toggleFullscreen(); eq(entered, true, 'enters fullscreen on first toggle');
api.toggleFullscreen(); eq(exited, true, 'exits fullscreen on second toggle');

eq(mk(doc, true).fsSupported(), false, 'hidden on touch devices');
eq(mk({ documentElement:{}, fullscreenEnabled:true, fullscreenElement:null }, false).fsSupported(), false, 'hidden when the API is missing');
done('desktop fullscreen toggle (enter / exit / gating)');
