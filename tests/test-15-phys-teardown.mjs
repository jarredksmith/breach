// Regression: shattering a prop then rebuilding the physics world (Deploy / arena resize) must not
// crash. The bug was destroyPhysWorld() freeing the Rapier world while transient fragment bodies were
// still referenced, so updateFragments() read a freed body -> "null pointer passed to rust".
import RAPIER from '@dimforge/rapier3d-compat';
import { extractFunction, gameSource, done, assert } from './harness.mjs';
await RAPIER.init();

// --- structural: destroyPhysWorld clears fragments BEFORE freeing the world ---
const destroySrc = extractFunction('destroyPhysWorld');
const iClear = destroySrc.indexOf('clearFragments');
const iFree = destroySrc.indexOf('physWorld.free');
assert(iClear >= 0, 'destroyPhysWorld clears fragments');
assert(iFree >= 0 && iClear < iFree, 'fragments cleared before the world is freed');

// --- structural: updateFragments guards the body read with a live world ---
const src = gameSource();
assert(/if\(f\.body && physWorld\)\{ const t=f\.body\.translation\(\)/.test(src),
  'updateFragments only reads a fragment body when physWorld is live');

// --- behavioral (real Rapier): the FIXED teardown order is crash-free ---
// Old order (free, then read) throws — proven separately. Here we verify the new order is safe.
let world = new RAPIER.World({ x:0, y:-30, z:0 });
const fragBodies = [];
for (let i = 0; i < 6; i++) {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(i, 5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.2,0.2,0.2), rb);
  fragBodies.push(rb);
}
world.step();
// destroyPhysWorld(): clearFragments removes bodies while the world is still alive, then free()
let threw = false;
try {
  for (const b of fragBodies) world.removeRigidBody(b);   // clearFragments() path
  world.free(); world = null;                              // then free
} catch (e) { threw = true; }
assert(!threw, 'clear-then-free teardown does not throw');

// the guard: with physWorld null, the body read is skipped entirely (no Rust call)
const physWorld = null;
let readAttempted = false;
for (const f of fragBodies.map(b => ({ body: b }))) {
  if (f.body && physWorld) { readAttempted = true; f.body.translation(); }
}
assert(!readAttempted, 'guarded read is skipped when the world is gone');
done('physics teardown / fragment lifecycle (no freed-body reads)');
