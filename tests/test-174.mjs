import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// props placed on terrain, serialize subtracts the same lift (round-trip)
const fp = extractFunction('finalizeProp');
assert(/obj\.position\.y = t\[1\] \+ _maxTerrainOver\(t\[0\], t\[2\], obj\.userData\.footR\)/.test(fp), 'finalizeProp does not lift props onto terrain');
assert(/function propTuple\(o\)\{ return \[o\.position\.x, o\.position\.y - _maxTerrainOver\(o\.position\.x, o\.position\.z, o\.userData\.footR\|\|0\), o\.position\.z/.test(src), 'propTuple does not subtract the terrain lift');
// station + pickups lifted onto terrain
assert(/const _sty=s\.py \+ terrainHeightAt\(s\.px,s\.pz\)/.test(src), 'station not lifted onto terrain');
assert(/_applyPickupXform\(g, sp\)/.test(src), 'pickup markers routed through the transform helper');
assert(/_applyPickupXform\(mesh, spot\)/.test(src), 'in-play pickups routed through the transform helper');
assert(/obj\.position\.set\(sp\.x, _maxTerrainOver\(sp\.x,sp\.z,1\.2\)\+\(\+sp\.y\|\|0\), sp\.z\)/.test(extractFunction('_applyPickupXform')), 'transform helper seats pickups on terrain + Y offset');

// round-trip math: place(authoredY) then serialize() recovers authoredY for any terrain height
function place(y, h){ return y + h; }            // finalizeProp
function ser(worldY, h){ return worldY - h; }     // propTuple
for(const y of [0, 1.5, 10]) for(const h of [0, -3, 4.2]) assert(Math.abs(ser(place(y,h), h) - y) < 1e-9, 'lift does not round-trip');
done();
