import { gameSource, extractFunction, assert, near, done } from './harness.mjs';
const src = gameSource();
// build 327: spawn fall-through fix — terrainHeightAt must return the height of the ACTUAL triangulated
// floor (the physics trimesh), not a bilinear approximation that can sit below it.
const samp = new Function(extractFunction('_sampleHeightGrid') + '\nreturn _sampleHeightGrid;')();

// Saddle cell: h00=0 h10=1 h01=1 h11=0 (h[z*N+x], N=2). Bilinear at (.25,.25) gives 0.375;
// the triangle plane through (00,01,10) gives 0.5. The sampler must agree with the triangles.
const g = [0,1, 1,0];
near(samp(g,2,0.25,0.25), 0.5, 1e-9);   // lower-left triangle (tx+tz<1)
near(samp(g,2,0.75,0.75), 0.5, 1e-9);   // upper-right triangle (tx+tz>1)
near(samp(g,2,0.5,0.5),  1, 1e-9);      // on the shared diagonal both triangles give (h10+h01)/2 — continuous across the split
// corners still exact
near(samp(g,2,0,0), 0, 1e-9); near(samp(g,2,1,0), 1, 1e-9); near(samp(g,2,0,1), 1, 1e-9); near(samp(g,2,1,1), 0, 1e-9);
// asymmetric cell, off-diagonal points, checked against explicit barycentric planes
const g2 = [2,5, -1,4];   // h00=2 h10=5 h01=-1 h11=4
near(samp(g2,2,0.2,0.1), 2 + (5-2)*0.2 + (-1-2)*0.1, 1e-9);
near(samp(g2,2,0.9,0.8), 4 + (-1-4)*(1-0.9) + (5-4)*(1-0.8), 1e-9);

// moveKCC carries the hard-floor recovery: feet well below the sampled surface snap back on top,
// grounded, with downward velocity cleared — and it runs BEFORE the collider is left at the final pos.
const kcc = extractFunction('moveKCC');
const clampI = kcc.indexOf('terrainHeightAt(player.pos.x, player.pos.z)');
assert(clampI > 0, 'moveKCC samples the terrain under the player');
assert(/player\.pos\.y - EYE < _gh - 0\.75/.test(kcc), 'recovery threshold leaves slack for steep-slope foot dip');
assert(/player\.pos\.y = _gh \+ EYE; if\(player\.vel\.y < 0\) player\.vel\.y = 0; player\.onGround = true;/.test(kcc), 'recovery snaps on top, grounded, fall arrested');
const leaveI = kcc.lastIndexOf('leave the collider where we ended up');
assert(clampI < leaveI, 'recovery happens before the collider is parked at the final position');

// spawn still derives Y from terrainHeightAt, so the sampler fix governs where the player starts
assert(/player\.pos\.set\(playerSpawn\.x, terrainHeightAt\(playerSpawn\.x, playerSpawn\.z\)\+\(playerSpawn\.y\|\|0\)\+EYE, playerSpawn\.z\)/.test(src), 'spawn Y comes from terrainHeightAt');
done();
