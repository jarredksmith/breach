import { gameSource, assert, done } from './harness.mjs';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../breach.html', import.meta.url),'utf8');
const src = gameSource();
// RGBELoader is inlined + attached to global THREE and invoked at load
assert(/window\.__ATTACH_RGBE_LOADER = function\(\)\{/.test(html), 'RGBELoader attach function inlined');
assert(/THREE\.RGBELoader = RGBELoader;/.test(html), 'RGBELoader registered on THREE');
assert(/class RGBELoader extends DataTextureLoader/.test(html), 'official RGBELoader class present');
assert(/__ATTACH_RGBE_LOADER && window\.__ATTACH_RGBE_LOADER\(\)/.test(html), 'attach invoked after THREE loads');
// applySkyHdri now decodes .hdr instead of rejecting it
assert(/const _isHdr = \/\\\.hdr\(\\\?\|#\|\$\)\/i\.test\(url\)/.test(src), 'applySkyHdri detects .hdr');
assert(/const loader = _isHdr \? new THREE\.RGBELoader\(\) : new THREE\.TextureLoader\(\)/.test(src), 'uses RGBELoader for .hdr');
assert(/if\(!_isHdr\)\{ if\('colorSpace' in tex\)/.test(src), 'HDR kept linear (no sRGB tag)');
assert(/\.exr isn/.test(src), '.exr still rejected (no decoder)');
done('hdr-sky');
