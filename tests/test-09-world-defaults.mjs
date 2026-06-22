// DEFAULT_WORLD has the full expected key set with sane values; arena matches the ARENA default.
import { extractConst, evalIn, html, done, assert, eq } from './harness.mjs';
const D = evalIn(extractConst('DEFAULT_WORLD'));
const expect = ['walk','run','jump','grav','crouch','sun','sunColor','sky','ambient','arena',
  'floorColor','floorTex','floorTile','wallColor','wallTex','wallTile','sky_hdri','fov','viewDist',
  'fogDensity','fogColor','grid','dof','dofFocus','dofRange','dofStrength'];
for (const k of expect) assert(k in D, `DEFAULT_WORLD has ${k}`);
assert(D.run > D.walk, 'run faster than walk');
assert(D.grav > 0 && D.jump > 0, 'positive gravity + jump');
assert(D.fov >= 60 && D.fov <= 120, `fov sane (${D.fov})`);
assert(D.viewDist > D.arena, 'view distance exceeds arena');
assert(D.crouch < D.walk, 'crouch slower than walk');
// ARENA initial value should agree with the world default.
const arenaInit = Number((html.match(/let\s+ARENA\s*=\s*(\d+)/) || [])[1]);
eq(arenaInit, D.arena, 'ARENA init matches DEFAULT_WORLD.arena');
done('DEFAULT_WORLD schema + sanity');
