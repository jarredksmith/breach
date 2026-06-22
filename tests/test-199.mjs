import { gameSource, extractFunction, assert, done } from './harness.mjs';
// build 289: picker section labels must span the grid row (not sit in a single cell),
// and starting a match must close any menu modal left open over the game.
const src = gameSource();
const rcg = extractFunction('renderCharGrid');
assert(/grid-column:1\/-1;/.test(rcg), 'section labels must span the full grid row');
assert(!/flex-basis:100%;width:100%;/.test(rcg), 'old flex label sizing must be gone');
const sg = extractFunction('startGame');
assert(/closeModal\('charPicker'\)/.test(sg), 'startGame must close the character picker');
assert(/closeModal\('lobby'\)/.test(sg), 'startGame must close the lobby');
done();
