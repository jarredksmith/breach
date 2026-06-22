// (build 157) Explosion/flipbook optimization: each playFlipbook used to clone the sheet texture and set
// needsUpdate=true, forcing a full GPU re-upload of the sheet every explosion/muzzle flash (the freeze).
// Now one shared, pre-warmed texture per kind is reused, with the frame offset set per-draw in onBeforeRender.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

const lvt = extractFunction('loadVfxTexture');
assert(/t\.generateMipmaps=false;/.test(lvt), 'mipmap regen disabled on the sheet');
assert(/t\.repeat\.set\(1\/cfg\.cols, 1\/cfg\.rows\)/.test(lvt), 'sheet tiling set once at load');
assert(/renderer\.initTexture\(t\)/.test(lvt), 'texture pre-warmed (uploaded once) at load');

const pf = extractFunction('playFlipbook');
assert(!/entry\.tex\.clone\(\)/.test(pf), 'no per-call texture clone');
assert(!/tex\.needsUpdate=true/.test(pf), 'no per-call GPU re-upload');
assert(/const tex = entry\.tex;/.test(pf), 'reuses the one shared texture');
assert(/sp\.onBeforeRender = \(\)=>\{ tex\.offset\.set\(fb\.ox, fb\.oy\); tex\.updateMatrix\(\); \};/.test(pf), 'frame offset applied per-draw');

const uf = extractFunction('updateFlipbooks');
assert(!/f\.tex\.dispose\(\)/.test(uf), 'shared tex is not disposed on finish');
assert(/f\.ox = col\/cfg\.cols; f\.oy = 1 - \(row\+1\)\/cfg\.rows;/.test(uf), 'per-frame offset stashed for onBeforeRender');
done('vfx shared-texture optimization');
