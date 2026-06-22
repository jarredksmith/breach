// (build 66) Tracers must emanate from the weapon. The gun draws in the viewmodel overlay, so the tracer
// start is found by projecting the barrel anchor (via the viewmodel camera) and mapping that screen point
// to a world point ahead of the main camera. Verify the wiring + the alignment property with real three.
import * as THREE from 'three';
import { gameSource, done, assert, near } from './harness.mjs';
const src = gameSource();

assert(/const vmMuzzle = new THREE\.Object3D\(\)/.test(src), 'barrel anchor exists');
assert(/gun\.add\(vmMuzzle\)/.test(src), 'anchor rides with the gun (sway/recoil/ADS)');
assert(/vmMuzzle\.getWorldPosition\(muzzleWorld\); muzzleWorld\.project\(vmCam\)/.test(src), 'tracer reads the barrel as drawn');
assert(/raycaster\.setFromCamera\(_muzNdc, camera\)/.test(src) && /raycaster\.ray\.at\(2\.2, muzzleWorld\)/.test(src), 'maps the barrel screen-point to a world point ahead');

// --- runnable: the computed world start projects back to the barrel's screen position ---
const vmCam = new THREE.PerspectiveCamera(75, 2.2, 0.01, 12);
vmCam.updateMatrixWorld(true); vmCam.updateProjectionMatrix();
const cam = new THREE.PerspectiveCamera(75, 2.2, 0.1, 400);
cam.position.set(5, 1.7, -3); cam.rotation.set(0.12, 1.2, 0, 'YXZ');
cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
const ray = new THREE.Raycaster();

function tracerStart(localMuzzle){               // mirrors the in-game computation
  const mw = localMuzzle.clone();                // anchor in the viewmodel scene (vmCam at origin)
  mw.project(vmCam);
  const ndc = new THREE.Vector2(mw.x, mw.y);
  ray.setFromCamera(ndc, cam);
  ray.ray.at(2.2, mw);
  return { world: mw, ndc };
}
for(const local of [ new THREE.Vector3(0.26,-0.30,-1.25), new THREE.Vector3(0,0,-1), new THREE.Vector3(0.4,-0.4,-0.9) ]){
  const { world, ndc } = tracerStart(local);
  const back = world.clone().project(cam);       // where the world start lands on the main camera
  near(back.x, ndc.x, 1e-5, 'start projects to barrel screen-x ('+local.x+')');
  near(back.y, ndc.y, 1e-5, 'start projects to barrel screen-y ('+local.y+')');
  assert(world.distanceTo(cam.position) > 1 && world.distanceTo(cam.position) < 4, 'start sits a couple metres ahead, not at the world origin');
}
done('tracer origin aligns with the drawn weapon barrel');
