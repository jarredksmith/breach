import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// reflections coupled to metalness
assert(/o\.material\.envMapIntensity = m;/.test(src), 'prop reflection tracks metalness');
assert(/floorMat\.envMapIntensity = floorMat\.metalness \* worldCfg\.skyBright;/.test(src), 'floor reflection tracks metal slider, scaled by sky brightness');
assert(/wallMat\.envMapIntensity = wallMat\.metalness \* worldCfg\.skyBright;/.test(src), 'wall reflection tracks metal slider, scaled by sky brightness');
// station light
assert(/function applyStationLight\(\)/.test(src) && /station\.light\.color\.setHex/.test(src), 'station light apply helper');
assert(/applyStationLight\(\); \}/.test(src), 'station transform apply also applies the light');
assert(/<b>Station light<\/b>/.test(src) && /mkSL\('Intensity','lightInt'/.test(src) && /mkSL\('Distance','lightDist'/.test(src), 'station light controls (color/intensity/distance)');
done('reflections-station-light');
