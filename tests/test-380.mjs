import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 504: replicate the local body's turn-in-place footwork (491) to remote players and bots. Both read a
// SMOOTHED mesh yaw (rp.mesh.rotation.y / b._dispYaw) rather than the raw networked yaw, so snapshot
// discretization can't spike the turn-rate detector. Enemies are intentionally skipped (they face-track the
// player with a faceOff offset). No-op for any model lacking turnL/turnR/turn180 clips (taxonomy -> idle).

// ---- both resolvers detect from the smoothed yaw + reuse _turnInPlaceSlot ----
assert(/const _cy=\(b\._dispYaw==null\?b\.yaw:b\._dispYaw\);[\s\S]*?_turnInPlaceSlot\(b\._turnSt\|\|\(b\._turnSt=\{\}\), _dyaw, dt\); if\(_ts\) b\._evt=\{ slot:_ts/.test(src),
  'bots detect turn-in-place from the smoothed display yaw and fire via the _evt one-shot');
assert(/const _cy=rp\.mesh\.rotation\.y;[\s\S]*?if\(_st==='idle'\)\{ const _ts=_turnInPlaceSlot\(rp\._turnSt\|\|\(rp\._turnSt=\{\}\), _dyaw, dt\|\|0\.016\)/.test(src),
  'remote players detect turn-in-place from the smoothed mesh yaw, only while idle');
assert(/if\(_st==='idle' && rp\._turnT && performance\.now\(\)<rp\._turnT\) _st=rp\._turnSlot;/.test(src),
  'the remote turn-step one-shot overrides idle for its duration');
assert(/_dyaw=Math\.atan2\(Math\.sin\(_dyaw\),Math\.cos\(_dyaw\)\);/.test(src), 'the yaw delta is wrapped to [-pi,pi] (network-safe)');

// ---- executable: the shared _turnInPlaceSlot behaves ----
const T = new Function('return (' + extractFunction('_turnInPlaceSlot') + ')')();
assert(T({}, 0.01, 0.016) === null, 'a tiny yaw change (standing still) does not fire a turn');
assert(T({}, 0.03, 0.016) === 'turnL', 'a left yaw burst fires turnL (+yaw = left)');
assert(T({}, -0.03, 0.016) === 'turnR', 'a right yaw burst fires turnR');
assert(T({}, 2.5, 0.016) === 'turn180', 'a fast, wide burst fires an about-face');
{
  const s = {};
  assert(T(s, 0.03, 0.016) === 'turnL', 'first frame of a left turn fires');
  assert(T(s, 0.03, 0.016) === null, 'a sustained same-direction turn does not re-fire every frame (cadence gate)');
  assert(T(s, -0.03, 0.016) === 'turnR', 'a direction flip re-fires immediately');
}

done();
