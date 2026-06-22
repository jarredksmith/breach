import { html, assert, done } from './harness.mjs';
// build 507: the minimap is now hittable on touch (above the z-index:40 touchUI layer) so the pointerdown
// map-open fires, and the kill feed moved off the left-side controls to the clear top-center zone.
assert(/body\.touch #minimap \{[^}]*pointer-events:auto; z-index:41; cursor:pointer;/.test(html), 'the touch minimap is hittable (sits above the touch UI layer)');
assert(/body\.touch #killFeed \{ top: calc\(76px \+ env\(safe-area-inset-top\)\); left:50%; transform:translateX\(-50%\); right:auto; bottom:auto; align-items:center;/.test(html), 'the kill feed sits top-center, clear of the left-side controls');
done();
