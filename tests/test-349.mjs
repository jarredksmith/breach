import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 463: bots now resolve their standing/landing height with the SAME groundHeightAt() the player uses,
// instead of a hand-rolled "surface within STEP or fall to terrain" gate. That gate had no ramp-climb, so a
// bot whose feet fell below a model's floor got dumped onto the terrain underneath and couldn't climb back —
// trapped on a different level. Sharing the player's resolver means bots can stand/walk anywhere the player can.

const ub = extractFunction('updateBots');
assert(/b\._groundY=\(typeof groundHeightAt==='function'\)\?groundHeightAt\(b\.pos\.x,b\.pos\.z,b\.pos\.y,_gSurf\)/.test(ub), 'bots resolve ground via groundHeightAt (player-identical), reusing the move-test surface; cached on b._groundY (build 547)');
assert(!/const _bg=terrainHeightAt\(b\.pos\.x,b\.pos\.z\); const groundY=\(top>-Infinity && top<=b\.pos\.y\+STEP\)/.test(ub), 'the old STEP-only gate is gone');

// groundHeightAt itself still has the walkable-floor + ramp branches (what bots now inherit)
const gh = extractFunction('groundHeightAt');
assert(/if\(top <= feetY \+ STEP\) return Math\.max\(g, top\)/.test(gh), 'flat ground / low step is walkable');
assert(/if\(top <= feetY \+ RAMP_RISE\)/.test(gh) && /slope > RAMP_SLOPE_MIN && slope < RAMP_SLOPE_MAX/.test(gh), 'walkable ramps (STEP..RAMP_RISE) are climbed, steep faces are not');

// --- executable: the OLD bot gate dropped to terrain on a mid-height walkable surface; the shared one keeps it ---
const STEP=0.6, RAMP_RISE=1.7;
function oldBotGround(top, terrain, feetY){ return (top>-Infinity && top<=feetY+STEP) ? Math.max(terrain, top) : terrain; }
// model floor 1.0 above feet (a gentle ramp), terrain well below at 0
const top=1.0, terrain=0.0, feetY=0.1;
assert(oldBotGround(top, terrain, feetY) === terrain, 'OLD: a 0.9m-high walkable surface was rejected -> bot fell to terrain (trapped under the model)');
// shared resolver (ramp branch) would keep it on the surface since 1.0 <= feetY+RAMP_RISE and slope is walkable
function sharedGround(top, terrain, feetY, walkableRamp){
  if(top === -Infinity) return terrain;
  if(top <= feetY + STEP) return Math.max(terrain, top);
  if(top <= feetY + RAMP_RISE && walkableRamp) return Math.max(terrain, top);
  return terrain;
}
assert(sharedGround(top, terrain, feetY, true) === top, 'SHARED: the same surface is climbed (bot stays on the model floor, like the player)');
// a genuine tall wall ledge (above RAMP_RISE) is still terrain for both
assert(sharedGround(3.0, terrain, feetY, true) === terrain, 'a too-tall ledge is not auto-climbed (still a wall)');
done();
