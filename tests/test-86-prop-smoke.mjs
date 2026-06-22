// (build 126) Smoke now also puffs from destroyed props (it previously only showed on grenade blasts).
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const sp = extractFunction('shatterProp');
assert(/playFlipbook\('smoke', _shCtr, Math\.max\(0\.5, Math\.max\(_shSize\.x,_shSize\.y,_shSize\.z\)\*0\.35\)\)/.test(sp), 'destroyed props puff smoke');
done('prop smoke');
