import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/const RAMP_SLOPE_MIN = 0\.2;/.test(src) && /const RAMP_SLOPE_MAX = 1\.5;/.test(src) && /const RAMP_RISE = 1\.7;/.test(src), 'walkable-ramp constants defined');
// groundHeightAt follows a walkable slope above STEP
assert(/if\(top <= feetY \+ RAMP_RISE\)\{[\s\S]*?slope > RAMP_SLOPE_MIN && slope < RAMP_SLOPE_MAX\) return Math\.max\(g, top\)/.test(src), 'groundHeightAt walks up ramp slopes');
// clearAt treats a walkable ramp edge as passable, not a wall
assert(/if\(es <= feetY \+ RAMP_RISE\)\{[\s\S]*?slope > RAMP_SLOPE_MIN && slope < RAMP_SLOPE_MAX\) continue;/.test(src), 'clearAt lets the player onto a ramp instead of walling it');
// uses a gradient magnitude (hypot) for slope so diagonal ramps are handled
assert(/Math\.hypot\(\(hx > -Infinity \? hx - top : 0\), \(hz > -Infinity \? hz - top : 0\)\) \/ e/.test(src), 'slope from surface gradient');
done('ramp-walk');
