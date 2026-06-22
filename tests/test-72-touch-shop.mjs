// (build 104) Touch-friendly loot/shop: items are tappable, a ✕ button closes it, it renders above the
// HUD, and the instructions adapt to touch. Plus the touch HUD panels are shrunk a little more.
import { html, gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// shop sits above the HUD panels and has a close button
assert(/#shop \{[^}]*z-index:72/.test(html), 'shop renders above the HUD');
assert(/<button id="shopClose"/.test(html), 'shop has a close button');
assert(/#shopClose \{/.test(html), 'close button styled');
assert(/\.shopItem \{[^}]*cursor:pointer/.test(html), 'shop items look tappable');

// items are tappable + close wired + adaptive copy
const rs = extractFunction('renderShopItems');
assert(/querySelectorAll\('\.shopItem'\)\.forEach\(\(el\)=>\{ el\.addEventListener\('click', \(\)=> buyFromShop\(\+el\.dataset\.idx\)\); \}\)/.test(rs), 'tap an item to buy');
const os = extractFunction('openShop');
assert(/sc\.onclick = \(\)=> closeShop\(\)/.test(os), 'close button calls closeShop');
assert(/isTouch \? 'tap an item to buy' : 'press a number to buy'/.test(os), 'instruction text adapts to touch');

// touch HUD shrunk
assert(/body\.touch #minimap \{ width:66px; height:66px;/.test(html), 'minimap shrunk on touch');
assert(/body\.touch \.panel \{ padding:3px 8px;/.test(html), 'panels tighter on touch');
assert(/body\.touch #stats \.big, body\.touch #ammoPanel \.big \{ font-size:15px; \}/.test(html), 'stat numbers smaller on touch');
done('touch shop + smaller HUD');
