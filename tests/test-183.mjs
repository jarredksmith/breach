import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// loadLevelFromNet (campaign + co-op load path) must restore the per-level extraction spot
const lln = extractFunction('loadLevelFromNet');
assert(/extractSpot = level\.extract \? \{ x:level\.extract\.x\|\|0, z:level\.extract\.z\|\|0 \} : null;/.test(lln), 'loadLevelFromNet does not restore extractSpot');
assert(/refreshExtractMarker\(\)/.test(lln), 'loadLevelFromNet does not refresh the extraction marker');
// serialize still writes it and restoreLevel still reads it (regression guard)
assert(/extract: extractSpot \? \{ x: \+extractSpot\.x\.toFixed\(3\), z: \+extractSpot\.z\.toFixed\(3\) \} : null/.test(src), 'serializeLevel no longer saves the extract spot');
const rl = extractFunction('restoreLevel');
assert(/extractSpot = level\.extract \?/.test(rl), 'restoreLevel no longer restores the extract spot');
done();
