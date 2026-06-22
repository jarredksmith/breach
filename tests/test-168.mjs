import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// throttle state + pump must exist
assert(/_glbQueue\s*=\s*\[\]/.test(src), 'no _glbQueue');
assert(/GLB_MAX_CONCURRENT\s*=\s*\d+/.test(src), 'no GLB_MAX_CONCURRENT');
assert(/function _glbPump\(\)/.test(src), 'no _glbPump');
const m = src.match(/GLB_MAX_CONCURRENT\s*=\s*(\d+)/);
assert(m && +m[1] >= 1 && +m[1] <= 6, 'concurrency out of sane range');
// loader enqueues + retries
const fn = extractFunction('loadGLTFCached');
assert(/_glbQueue\.push\(start\)/.test(fn), 'loader does not enqueue');
assert(/_tries/.test(fn) && /setTimeout/.test(fn), 'loader has no retry/backoff');
assert(/_release/.test(fn), 'loader does not release a queue slot');
done();
