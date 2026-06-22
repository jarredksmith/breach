// (build 90) Minimap moved to the top-left so the boss bar (top-center) no longer covers it.
import { html, done, assert } from './harness.mjs';
assert(/#minimap \{\s*position: absolute; top: 18px; left: 18px;/.test(html), 'minimap anchored top-left');
assert(!/#minimap \{[^}]*left: 50%/.test(html), 'minimap is no longer centered');
// mobile: minimap sits in the corner and the stat panels shift right of it (no overlap)
assert(/body\.touch #minimap \{[^}]*left: calc\(8px/.test(html), 'mobile minimap in the top-left corner');
assert(/body\.touch #stats \{[^}]*left: calc\(82px/.test(html) && /body\.touch #ammoPanel \{[^}]*left: calc\(82px/.test(html), 'mobile stat panels clear the minimap');
done('minimap top-left');
