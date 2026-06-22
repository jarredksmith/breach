// (build 174) Mobile render quality: antialiasing is on everywhere (was off on touch -> jagged edges) and the
// touch pixel-ratio cap is raised from 1.0x to 2.0x (was rendering far below a phone's native res -> low-res look).
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();
assert(/new THREE\.WebGLRenderer\(\{ antialias: true, powerPreference: 'high-performance' \}\)/.test(src), 'antialiasing enabled on all devices');
assert(/const _prBase = Math\.min\(devicePixelRatio, IS_COARSE \? 2\.0 : 1\.5\);/.test(src) && /function _applyPixelRatio\(\)\{ renderer\.setPixelRatio\(_prBase \* _prScale\); \}/.test(src), 'touch pixel ratio raised to 2.0x');
done('mobile resolution + AA');
