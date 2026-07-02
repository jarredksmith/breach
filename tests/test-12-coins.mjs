// updateCoins: pickup within 1.6u credits once & removes; magnetism pulls coins within 6u toward the
// player; coins expire at life<=0. Runs the real extracted function against mocked scene/players.
import { extractFunction, evalDecl, done, assert, eq } from './harness.mjs';

function makeMesh(x, z) {
  return { position: { x, y: 0.9, z, set(){} }, rotation: { x:0, y:0, z:0 }, visible: true };
}
function run(scenario) {
  const coins = scenario.coins;
  const scene = { remove() {} };
  let credited = 0;
  const player = { pos: { x: 0, z: 0 }, credit(v){ credited += v; } };
  const allPlayers = () => [player];
  const updateCoins = evalDecl(
    'const coins=__coins; const scene=__scene; const allPlayers=__allPlayers; const _freeCoinMesh=(m)=>__scene.remove(m); ' + extractFunction('updateCoins'),   // build 812: removal routes through the coin pool
    'updateCoins', { __coins: coins, __scene: scene, __allPlayers: allPlayers });
  updateCoins(scenario.dt ?? 0.016);
  return { coins, credited };
}

// 1) coin sitting on the player -> credited once and removed
let coins = [{ id:1, mesh: makeMesh(0.5, 0), spin:0, life:25, value:10 }];
let r = run({ coins });
eq(r.credited, 10, 'coin within 1.6u credits its value');
eq(r.coins.length, 0, 'picked-up coin removed');

// 2) coin within attract radius (6u) but outside pickup -> moves closer, not yet collected
coins = [{ id:2, mesh: makeMesh(4, 0), spin:0, life:25, value:5 }];
const startX = coins[0].mesh.position.x;
r = run({ coins });
eq(r.credited, 0, 'coin at 4u not yet collected');
eq(r.coins.length, 1, 'coin still present');
assert(r.coins[0].mesh.position.x < startX, `coin magnetises toward player (${startX} -> ${r.coins[0].mesh.position.x.toFixed(3)})`);

// 3) coin past its life expires and is removed
coins = [{ id:3, mesh: makeMesh(40, 0), spin:0, life:0.01, value:5 }];
r = run({ coins, dt: 0.02 });
eq(r.coins.length, 0, 'expired coin removed');
eq(r.credited, 0, 'expired coin not credited');
done('coin magnetism + pickup + expiry');
