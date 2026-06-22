import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/const N=Math\.max\(1, Math\.min\(5, Math\.round\(maxS\/4\)\)\)/.test(src), 'light count scales with the longest axis (1-5)');
assert(/obj\.userData\.emitLights/.test(src), 'emitter is now a set of lights');
assert(/const per = intensity\/Math\.sqrt\(N\)/.test(src), 'per-light flux split to avoid over-bright overlap');
assert(/l\.position\.set\(-0\.42\+t\*0\.84, 0\.5, 0\)/.test(src), 'lights spread along the long axis');
assert(/if\(o\.userData\.emit\) applyPropEmissive\(o, o\.userData\.emit\.c, o\.userData\.emit\.i\);/.test(src), 're-spreads on rescale');
assert(/for\(const l of obj\.userData\.emitLights\)\{ if\(typeof unregisterEmitterLight/.test(src), 'clear tears down the whole set');
done('emitter-distribute');
