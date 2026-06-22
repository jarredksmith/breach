import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
// wiring
assert(/skyRot:0,/.test(src), 'skyRot default present');
assert(/function applySkyRotation\(\)/.test(src) && /setTimeout\(\(\)=>\{ _skyRotTimer = null; _applyOrientedSky\(null\)/.test(src), 'rotation re-applies debounced');
assert(/slider\(b,'Sky rotation\\u00b0','skyRot',0,360,5\)/.test(src), 'rotation slider in Sky panel');
assert(/_skyOrigTex = tex; _skyOrigKind = _isHdr \? 'hdr' : 'ldr';/.test(src), 'original panorama cached for re-orientation');
// pure shift math
const fnSrc = extractFunction('_shiftEquirectColumns');
const fn = new Function(fnSrc + '\nreturn _shiftEquirectColumns;')();
eq(Array.from(fn(Float32Array.from([0,1,2,3]),4,1,1,1)).join(','), '3,0,1,2', 'shift by 1 wraps');
eq(Array.from(fn(Float32Array.from([0,1,2,3]),4,1,1,0)).join(','), '0,1,2,3', 'shift 0 = identity');
eq(Array.from(fn(Float32Array.from([0,1,2,3]),4,1,1,4)).join(','), '0,1,2,3', 'full-width shift = identity (wrap)');
eq(Array.from(fn(Float32Array.from([10,11,20,21]),2,1,2,1)).join(','), '20,21,10,11', 'respects component stride (RGBA)');
done('sky-rotation');
