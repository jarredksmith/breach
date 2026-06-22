import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 505: the tactical map's arena is now a flat solid fill instead of a grid pattern.
assert(/ctx\.fillStyle='#0d171d'; ctx\.fillRect\(a\[0\],a\[1\],b\[0\]-a\[0\],b\[1\]-a\[1\]\);/.test(src), 'the arena square is filled with a solid color');
assert(!/world grid every 10u/.test(src) && !/for\(let gx=Math\.ceil\(wl\/10\)\*10/.test(src), 'the world grid drawing is gone');
done();
