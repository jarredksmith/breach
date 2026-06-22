import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// helper exists and detects path / motion
assert(/function _xaMoves\(/.test(src), 'no _xaMoves');
const moves = new Function(src.match(/function _xaMoves\([^)]*\)\s*\{[\s\S]*?\}/)[0] + '\nreturn _xaMoves;')();
assert(moves({on:true, path:[[0,0,0],[1,0,0]]}) === true, 'path not detected as moving');
assert(moves({on:true, my:2}) === true, 'translate not detected as moving');
assert(moves({on:true}) === false, 'idle xa wrongly flagged moving');
assert(moves(null) === false, 'null xa wrongly flagged moving');
assert(moves({on:false, path:[[0,0,0],[1,0,0]]}) === false, 'disabled xa flagged moving');
// xaApply demotes an animated prop out of dynamic
const xa = extractFunction('xaApply');
assert(/_xaMoves\(o\.userData\.xa\)\s*&&\s*o\.userData\.phys/.test(xa) && /setPropDynamic\(o,\s*false\)/.test(xa), 'xaApply does not demote dynamic animated prop');
// setPropDynamic refuses to make an animated prop dynamic
const spd = extractFunction('setPropDynamic');
assert(/_xaMoves\(obj\.userData\.xa\)\)\s*return/.test(spd), 'setPropDynamic does not guard animated props');
done();
