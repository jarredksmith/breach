import { gameSource, extractFunction, assert, done } from './harness.mjs';
// build 290a: a client must step its physics world so the player character controller stays grounded.
const src = gameSource();
assert(/function stepClientPlayerPhys\(dt\)\{/.test(src), 'stepClientPlayerPhys must exist');
const sc = extractFunction('stepClientPlayerPhys');
assert(/physWorld\.step\(\)/.test(sc), 'client step must call physWorld.step()');
assert(/setTranslation\(\{x:o\.position\.x/.test(sc), 'client step pins prop bodies to host-synced poses');
// the loop must invoke it on the client branch when player physics is on
assert(/else if\(playerPhysMode && playerBody && physWorld\)\{ stepClientPlayerPhys\(dt\); \}/.test(src),
  'loop must step client player physics when in physics mode');
done();
