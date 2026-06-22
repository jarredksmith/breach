// refreshPropCollider: per-mesh boxes are built from each mesh's OWN vertices (no setFromObject
// fusion), invisible meshes skipped, climbable=true, overall box covers everything.
import * as THREE from 'three';
import { extractFunction, evalDecl, done, assert, eq } from './harness.mjs';
const src = extractFunction('refreshPropCollider');
const refresh = evalDecl('const _pcV=new THREE.Vector3(); function isModelSrc(x){return typeof x==="string"&&/^(https?:|blob:|data:|sketchfab:)/i.test(x);} function buildModelGridBoxes(){return null;} ' + src, 'refreshPropCollider', { THREE });

// A group with two well-separated child meshes + one invisible mesh.
const g = new THREE.Group();
const a = new THREE.Mesh(new THREE.BoxGeometry(1,1,1)); a.position.set(0,0.5,0);
const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1)); b.position.set(10,0.5,0);
const hidden = new THREE.Mesh(new THREE.BoxGeometry(1,1,1)); hidden.position.set(100,0.5,0); hidden.visible=false;
g.add(a, b, hidden);
refresh(g);

const boxes = g.userData.boxes;
eq(boxes.length, 2, 'two boxes (invisible mesh skipped)');
assert(g.userData.climbable === true, 'climbable flag set');
// CRITICAL regression: neither per-mesh box may span the gap between a and b.
for (const box of boxes) {
  const w = box.max.x - box.min.x;
  assert(w < 2, `per-mesh box stays tight (width ${w.toFixed(2)}, not fused across the 10u gap)`);
}
// overall box must cover both visible meshes (a at x~0, b at x~10)
assert(g.userData.box.min.x < 0.6 && g.userData.box.max.x > 9.4, 'overall box spans both meshes');
done('prop collider per-mesh boxing (no fusion)');
