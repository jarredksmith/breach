import { gameSource, extractFunction, assert, done } from './harness.mjs';
// build 286: projectiles and held props must reference the terrain surface, not a flat y~0 plane,
// so they don't float over a dip (or punch through a rise).
const gr = extractFunction('updateGrenades');
assert(/terrainHeightAt\(g\.mesh\.position\.x, g\.mesh\.position\.z\)/.test(gr), 'grenades bounce on terrain');
assert(!/position\.y < 0\.22/.test(gr), 'grenades must not use the flat 0.22 floor');

const rk = extractFunction('updateRockets');
assert(/p\.y <= terrainHeightAt\(p\.x,p\.z\)\+0\.18/.test(rk), 'rockets detonate on terrain');
assert(!/p\.y<=0\.18/.test(rk), 'rockets must not use the flat 0.18 floor');

const lh = extractFunction('_localHoldTarget');
assert(/terrainHeightAt\(_holdTarget\.x,_holdTarget\.z\)\+0\.6/.test(lh), 'held prop hold point floors to terrain');

const dah = extractFunction('driveAllHeld');
assert(/terrainHeightAt\(_holdTarget\.x,_holdTarget\.z\)\+0\.6/.test(dah), 'remote held prop floors to terrain');

const src = gameSource();
assert(/p\.y < terrainHeightAt\(p\.x,p\.z\)\+0\.1/.test(src), 'enemy bolts expire at terrain surface');
done();
