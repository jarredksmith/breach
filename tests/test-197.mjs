import { html, assert, done } from './harness.mjs';
// build 287: the character picker is opened on top of another modal (lobby / mp setup),
// so it must stack ABOVE the base .modalBack z-index (20) or it renders behind and can't be clicked.
const m = html.match(/<div id="charPicker"[^>]*>/);
assert(m, 'charPicker div present');
const z = m[0].match(/z-index:\s*(\d+)/);
assert(z && parseInt(z[1],10) > 20, 'charPicker must have a z-index above the base modal (20)');
done();
