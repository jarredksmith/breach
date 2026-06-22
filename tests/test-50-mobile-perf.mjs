// (build 71) Mobile performance guards: a single IS_COARSE flag turns off the expensive paths on touch
// devices (MSAA, full-DPI supersampling, big soft shadows, and the DoF post-process).
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();
assert(/const IS_COARSE = !!\(window\.matchMedia && matchMedia\('\(pointer: coarse\)'\)\.matches\)/.test(src), 'coarse-pointer flag exists');
assert(/new THREE\.WebGLRenderer\(\{ antialias: true, powerPreference: 'high-performance' \}\)/.test(src), 'antialiasing on (smooth edges on touch too)');
assert(/const _prBase = Math\.min\(devicePixelRatio, IS_COARSE \? 2\.0 : 1\.5\);/.test(src) && /function _applyPixelRatio\(\)\{ renderer\.setPixelRatio\(_prBase \* _prScale\); \}/.test(src), 'touch pixel ratio capped at 2x (near-native, not 1x)');
assert(/shadowMap\.type = IS_COARSE \? THREE\.PCFShadowMap : THREE\.PCFSoftShadowMap/.test(src), 'cheaper shadow filter on touch');
assert(/mapSize\.set\(IS_COARSE \? 1024 : 2048/.test(src), 'half-size shadow map on touch');
assert(/dofEnabled  = \(worldCfg\.dof === true\) && !IS_COARSE/.test(src), 'depth-of-field forced off on touch');
done('mobile performance guards');
