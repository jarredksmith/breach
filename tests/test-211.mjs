import { gameSource, html, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 301: live 3D model thumbnails on picker cards + readable name color
assert(/\.charName\{[^}]*color:#e6f4ee/.test(html), 'character name has a light color');
assert(/function _ensureThumbR\(\)/.test(src) && /new THREE\.WebGLRenderer\(\{ alpha:true, antialias:true, preserveDrawingBuffer:true \}\)/.test(src), 'shared offscreen thumbnail renderer');
const rt = extractFunction('_renderCharThumb');
assert(/loadGLTFCached\(cfg\.url/.test(rt), 'thumbnail loads the model via the cache');
assert(/toDataURL\('image\/png'\)/.test(rt) && /backgroundImage='url\(\"/.test(rt), 'renders to an image and sets it on the swatch');
assert(/_thumbCache\[k\]/.test(rt), 'thumbnails cached by model key');
const rg = extractFunction('renderCharGrid');
assert(/if\(cfg && cfg\.url\) _renderCharThumb\(cfg, sw\)/.test(rg), 'cards render a thumbnail when they have a model');
assert(/mk\(i, c\.name\|\|\('Character '\+\(i\+1\)\), 'linear-gradient\(135deg,#1f6f7a,#0f3038\)', c\)/.test(rg), 'roster cards pass their model cfg');
done();
