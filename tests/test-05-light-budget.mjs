// updateLightBudget: <=MAX emitter lights all keep base intensity; >MAX keep nearest MAX at full,
// the next FADE ranks ease out (no hard pop), and the farthest are fully dark.
import * as THREE from 'three';
import { extractFunction, extractConst, evalDecl, done, assert, eq } from './harness.mjs';
const MAX = Number(evalDecl('return ' + extractConst('MAX_ACTIVE_LIGHTS') + ';', 'undefined') ?? 16);
const FADE = 5;
const src = extractFunction('updateLightBudget');
function build(emitterLights, camera) {
  return evalDecl('const MAX_ACTIVE_LIGHTS=' + MAX + '; const _lp=new THREE.Vector3(); ' + src,
    'updateLightBudget', { THREE, emitterLights, camera });
}
const cam = new THREE.PerspectiveCamera(); cam.position.set(0, 0, 0);
function mk(n) { const arr = [];
  for (let i = 0; i < n; i++) { const L = new THREE.PointLight(0xffffff, 2); L.position.set(i*10+5, 0, 0); arr.push({ light: L, baseIntensity: 2 }); }
  return arr;
}
// <= MAX: everyone at base
let e = mk(MAX); build(e, cam)();
assert(e.every(x => x.light.intensity === 2), `all ${MAX} lit when at budget`);
// > MAX: nearest MAX at full, a fade band in between, farthest fully dark
e = mk(MAX + FADE + 3); build(e, cam)();
eq(e.filter(x => x.light.intensity === 2).length, MAX, 'nearest MAX at full intensity');
assert(e.filter(x => x.light.intensity > 0 && x.light.intensity < 2).length > 0, 'a fade band eases out (no hard pop)');
const dark = e.filter(x => x.light.intensity === 0).map(x => x.light.position.x);
assert(dark.length > 0 && Math.min(...dark) > (5 + (MAX - 1 + FADE - 1) * 10) - 0.5, 'fully-dark lights are the farthest');
assert(MAX >= 16, 'budget raised to >=16 so typical rooms stay fully lit');
done('light budget: smooth fade beyond a raised cap');
