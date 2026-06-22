// (build 91) On mobile the fire button doubles as a look surface: hold to fire and drag the same thumb
// to aim. It tracks its own pointer and feeds touchLookDX/DY, instead of the plain button binder.
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();
assert(!/hold\('tFire'/.test(src), 'fire is no longer a plain hold-only button');
const m = src.match(/const fire=document\.getElementById\('tFire'\);[\s\S]*?fireEnd\);/);
assert(m, 'fire button has a dedicated pointer handler');
const blk = m[0];
assert(/touchFiring=true/.test(blk), 'pressing fire starts firing');
assert(/touchLookDX\+=\(e\.clientX-fx\)[\s\S]*?touchLookDY\+=\(e\.clientY-fy\)/.test(blk), 'dragging the fire thumb aims the camera');
assert(/setPointerCapture/.test(blk), 'captures the pointer so the drag continues off the button');
assert(/touchFiring=false/.test(blk), 'releasing fire stops firing');
done('mobile fire + look at once');
