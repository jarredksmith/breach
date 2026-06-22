import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// all three placement sites lift the beacon visual onto the terrain via the footprint-aware helper
assert(/extractZone\.position\.set\(p\.x, _maxTerrainOver\(p\.x, p\.z, R\), p\.z\)/.test(src), 'refreshExtractMarker beacon not on terrain');
assert(/extractZone\.position\.set\(O\.ex\[0\], _maxTerrainOver\(O\.ex\[0\],O\.ex\[1\], gameCfg\.extractRadius\|\|3\.5\), O\.ex\[1\]\)/.test(src), 'net beacon not on terrain');
assert(/extractZone\.position\.set\(x, _maxTerrainOver\(x, z, gameCfg\.extractRadius\|\|3\.5\), z\)/.test(src), 'editor-placed beacon not on terrain');
// extractPos (the hold-detection center) stays flat so the 2D in-zone test is untouched
assert(/extractPos\.set\(p\.x, 0, p\.z\)/.test(src), 'extractPos should remain flat (refresh)');
assert(/extractPos\.set\(O\.ex\[0\],0,O\.ex\[1\]\)/.test(src), 'extractPos should remain flat (net)');
assert(/extractPos\.set\(x,0,z\)/.test(src), 'extractPos should remain flat (editor)');
// the in-zone test is still the 2D radius check
assert(/dx\*dx \+ dz\*dz <= R\*R/.test(src), 'in-zone radius test changed unexpectedly');
done();
