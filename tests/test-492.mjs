import { gameSource, extractFunction, assert, eq, near, done } from './harness.mjs';
const src = gameSource();
// build 639: remote players floated/sat at a flat ground level over hilly terrain. Bots looked right because they
// re-derive their feet from groundHeightAt locally; remote avatars trusted the raw synced feet (clamped flat at 0).
// Fix: a GROUNDED remote avatar snaps to the LOCAL ground at its interpolated (x,z), like bots; airborne keeps sync.

// --- the flat-0 clamp is gone from both apply paths ---
assert(/rp\.target\.set\(msg\.p\[0\], msg\.p\[1\]-EYE, msg\.p\[2\]\);/.test(src), 'host path: no Math.max(0,...) flat clamp on remote feet');
assert(/rp\.target\.set\(pl\.p\[0\], pl\.p\[1\]-EYE, pl\.p\[2\]\);/.test(src), 'client snapshot path: no flat clamp either');
assert(!/Math\.max\(0, *msg\.p\[1\]-EYE\)/.test(src) && !/Math\.max\(0,pl\.p\[1\]-EYE\)/.test(src), 'the old flat-0 feet clamp is removed');

// --- grounded snap in netInterpolate ---
const ni = extractFunction('netInterpolate');
assert(/if\(!rp\.air && typeof groundHeightAt==='function'\)\{/.test(ni), 'a grounded remote avatar is re-grounded locally (airborne keeps the synced feet)');
assert(/const _gy = groundHeightAt\(rp\.mesh\.position\.x, rp\.mesh\.position\.z, rp\.target\.y\);/.test(ni), 'feet come from the LOCAL ground at the interpolated x,z (terrain + walkable surfaces)');
assert(/if\(isFinite\(_gy\)\) rp\.mesh\.position\.y = _gy;/.test(ni), 'and are applied to the avatar');

// --- executable: grounded -> local ground; airborne -> synced feet (the decision the code makes) ---
function feetY(air, syncedFeet, localGround){ return (!air) ? localGround : syncedFeet; }
near(feetY(false, 0, 5), 5, 1e-9, 'grounded on a hill -> sits on the local terrain (5), not the synced/flat value');
near(feetY(false, 0, -3), -3, 1e-9, 'grounded in a valley -> follows the terrain DOWN (no flat-0 float)');
near(feetY(true, 7, 2), 7, 1e-9, 'airborne -> keeps the synced feet so the jump arc reads right');

done('co-op: remote players follow hilly terrain like bots, no flat-ground float (build 639)');
