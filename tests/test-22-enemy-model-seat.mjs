// (build 38) Enemy model seating must be body-LOCAL. The old code measured a world-space box and used it
// to set the model's local position, which yanked async-loaded models to the world origin (the
// "stuck on the player" bug). Verify the fixed math keeps the model on its body anywhere in the arena.
import * as THREE from 'three';
import { gameSource, done, assert } from './harness.mjs';

function makeModelMesh(){
  const model = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,2,1));   // 2 tall, sits 0..2 above its own origin, off-center
  mesh.position.set(0.5, 1, 0.3);
  model.add(mesh);
  return model;
}
function worldCenterXZ(o){ const b=new THREE.Box3().setFromObject(o); return { x:(b.min.x+b.max.x)/2, z:(b.min.z+b.max.z)/2, minY:b.min.y }; }

// body parked far from the origin (as it is for an async model load mid-arena)
const body = new THREE.Group(); body.position.set(30, 1.4, -20);

// --- FIXED: body-local box ---
const mFix = makeModelMesh(); body.add(mFix);
body.updateMatrixWorld(true); mFix.updateMatrixWorld(true);
const wbox = new THREE.Box3().setFromObject(mFix);
const inv = new THREE.Matrix4().copy(body.matrixWorld).invert();
const lbox = wbox.clone().applyMatrix4(inv);
const cx=(lbox.min.x+lbox.max.x)/2, cz=(lbox.min.z+lbox.max.z)/2;
mFix.position.set(mFix.position.x - cx, mFix.position.y - lbox.min.y - 1.4, mFix.position.z - cz);
body.updateMatrixWorld(true);
const fix = worldCenterXZ(mFix);
assert(Math.abs(fix.x - 30) < 0.05, `fixed: model centered on body X (got ${fix.x.toFixed(2)}, want 30)`);
assert(Math.abs(fix.z + 20) < 0.05, `fixed: model centered on body Z (got ${fix.z.toFixed(2)}, want -20)`);
assert(Math.abs(fix.minY - 0) < 0.05, `fixed: feet seated at the floor (world y=${fix.minY.toFixed(2)})`);

// --- OLD (buggy): world box used as if local -> yanks toward origin ---
const body2 = new THREE.Group(); body2.position.set(30, 1.4, -20);
const mOld = makeModelMesh(); body2.add(mOld);
body2.updateMatrixWorld(true); mOld.updateMatrixWorld(true);
const wb = new THREE.Box3().setFromObject(mOld);
const ocx=(wb.min.x+wb.max.x)/2, ocz=(wb.min.z+wb.max.z)/2;
mOld.position.set(mOld.position.x - ocx, mOld.position.y - wb.min.y - 1.4, mOld.position.z - ocz);
body2.updateMatrixWorld(true);
const old = worldCenterXZ(mOld);
assert(Math.hypot(old.x, old.z) < 2, `old math collapses the model toward world origin (got ${old.x.toFixed(1)},${old.z.toFixed(1)}) — the bug`);

// --- wiring ---
const src = gameSource();
assert(/applyMatrix4\(_seatInv\.copy\(body\.matrixWorld\)\.invert\(\)\)/.test(src), 'buildEnemyVisual measures in body-local space');
assert(/function playEnemyClip\(root, gltf, clipName\)/.test(src), 'enemies use a dedicated single-clip player');
const pec = gameSource().slice(gameSource().indexOf('function playEnemyClip'));
assert(/find\(\/idle\/i\) \|\| find\(\/walk\/i\) \|\| find\(\/run\/i\) \|\| gltf\.animations\[0\]/.test(pec), 'picks one clip (idle/walk/run/first)');
assert(/playEnemyStates\(model, gltf, _clipMap\)/.test(src), "buildEnemyVisual uses the state machine");
assert(/v\.userData\.seat; if\(s\)\{ v\.position\.copy\(s\.p\); v\.quaternion\.copy\(s\.q\); v\.scale\.copy\(s\.s\)/.test(src), 'enemy model root re-pinned each frame (kills root-motion drift / scale-to-zero)');
assert(/function buildPreviewEnemy/.test(src) && /function autoFitEnemyScale/.test(src) && /previewCollider/.test(src), 'editor preview + collider viz + auto-fit present');
assert(/xoff:m\.xoff, zoff:m\.zoff/.test(src), 'pivot offsets X/Z are serialized');
done('enemy model body-local seating + single-clip + root-lock + preview');
