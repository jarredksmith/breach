// (build 93) Aim button doubles as a look surface (toggle ADS + drag-to-aim); mobile HUD tidied to
// tight rounded panels with the keyboard-only throw hint hidden.
import { html, gameSource, done, assert } from './harness.mjs';
const src = gameSource();
// aim button drag-to-look
const m = src.match(/const aim=document\.getElementById\('tAim'\);[\s\S]*?aimEnd\);/);
assert(m, 'aim has a dedicated pointer handler');
assert(/touchAds=!touchAds/.test(m[0]), 'pressing aim toggles ADS');
assert(/touchLookDX\+=\(e\.clientX-ax\)/.test(m[0]) && /setPointerCapture/.test(m[0]), 'dragging the aim thumb aims the camera');
// mobile HUD cleanup
assert(/body\.touch \.panel \{[^}]*clip-path:none/.test(html), 'mobile panels drop the angled clip');
assert(/body\.touch #nadeKbd \{ display:none/.test(html), 'keyboard throw hint hidden on mobile');
assert(/<span id="nadeKbd">/.test(html) && /<span id="nades">/.test(html), 'grenade count stays, only the [G] hint is wrapped');
done('mobile aim-look + HUD tidy');
