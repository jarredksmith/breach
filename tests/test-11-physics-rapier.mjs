// Real Rapier (the engine props actually use). Mirror the game's world: gravity y=-GRAV (default 30),
// timestep 1/60. A dynamic box dropped above a static floor must fall, then come to rest on it.
import RAPIER from '@dimforge/rapier3d-compat';
import { extractConst, gameSource, done, assert, near } from './harness.mjs';
await RAPIER.init();

const GRAV = (() => {
  const D = Function('return (' + extractConst('DEFAULT_WORLD') + ');')();
  return D.grav;
})();
const PHYS_DT = (() => {
  const m = gameSource().match(/const\s+PHYS_DT\s*=\s*1\s*\/\s*(\d+)/);
  return 1 / Number(m[1]);
})();

const world = new RAPIER.World({ x: 0, y: -GRAV, z: 0 });
world.timestep = PHYS_DT;

// static floor at y=0 (half-extents: wide thin slab, top surface at y=0)
const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
world.createCollider(RAPIER.ColliderDesc.cuboid(50, 0.5, 50), ground);

// dynamic 1m cube starting at y=10 (half-extent 0.5 => rests with center at y=0.5)
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 10, 0));
world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0), body);

const y0 = body.translation().y;
for (let i = 0; i < 6; i++) world.step();           // ~0.1s
const yFalling = body.translation().y;
assert(yFalling < y0 - 0.04, `box accelerates downward (y ${y0} -> ${yFalling.toFixed(3)})`);

for (let i = 0; i < 300; i++) world.step();           // ~5s: settle
const yRest = body.translation().y;
near(yRest, 0.5, 0.06, `box rests on floor top (y=${yRest.toFixed(3)}, expect ~0.5)`);
assert(GRAV > 0, 'gravity is positive magnitude');

world.free();
done('rapier dynamic-prop fall + rest (real engine)');
