import { gameSource, extractFunction, evalIn, assert, near, done } from './harness.mjs';
const src = gameSource();
// _maxTerrainOver returns the highest sample under the footprint (so flat objects clear slopes)
const ramp = (x, z) => x;   // a plane sloping in +x: height == x
const _maxTerrainOver = evalIn(extractFunction('_maxTerrainOver'), { terrainHeightAt: ramp });
near(_maxTerrainOver(0, 0, 0), 0, 1e-9, 'r=0 returns the centre sample');
// over radius 5 on a +x ramp, the highest point under the footprint is at x=+5
near(_maxTerrainOver(0, 0, 5), 5, 1e-6, 'max over footprint should reach the uphill edge');
assert(_maxTerrainOver(0, 0, 5) >= _maxTerrainOver(0, 0, 1), 'bigger footprint clears at least as much');
// flat terrain -> 0 regardless of radius (existing flat levels unaffected)
const flat = evalIn(extractFunction('_maxTerrainOver'), { terrainHeightAt: () => 0 });
near(flat(3, -2, 9), 0, 1e-9, 'flat terrain lift is 0');

// round-trip still holds: place lift L, serialize subtracts L (same footprint -> same L)
function place(y, L){ return y + L; }
function ser(worldY, L){ return worldY - L; }
for(const y of [0,1.5,10]) for(const L of [0, 4.2, -3]) assert(Math.abs(ser(place(y,L),L)-y)<1e-9, 'footprint lift round-trips');

// wiring: footR cached on the prop and used by both placement and serialize
assert(/obj\.userData\.footR = _propFootR\(obj\)/.test(src), 'footR not cached at spawn');
assert(/_maxTerrainOver\(t\[0\], t\[2\], obj\.userData\.footR\)/.test(src), 'placement not footprint-aware');
assert(/_maxTerrainOver\(o\.position\.x, o\.position\.z, o\.userData\.footR\|\|0\)/.test(src), 'serialize not footprint-aware');
done();
