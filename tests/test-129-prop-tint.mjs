// (build 184) A textured prop multiplies the image by the prop's color (like floor/walls), so the color
// picker tints the texture instead of being ignored. No tint set = white = true image colors.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

const apt = extractFunction('applyPropTexture');
assert(/o\.material\.color\.setHex\(obj\.userData\.col != null \? obj\.userData\.col : 0xffffff\)/.test(apt), 'texture tinted by prop color (white default)');
assert(!/o\.material\.color\.setHex\(0xffffff\);          \/\/ let the image/.test(src), 'no longer force-whites textured props');

const apc = extractFunction('applyPropColor');
assert(/eachPrimMesh\(obj, o=>\{ o\.material\.color\.setHex\(hex\);/.test(apc), 'color applies even when textured');
assert(!/if\(!obj\.userData\.tex\) o\.material\.color\.setHex\(hex\)/.test(apc), 'texture no longer blocks the color');
done('prop color tints its texture');
