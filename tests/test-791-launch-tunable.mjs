// (build 791) Per-vehicle "Launch" tunable — how hard a ramp throws the car into the air. Defaults to 1 (the build-790
// feel), 0 = it never leaves the ground (kart), >1 = big-air buggy. Sanitized in vehicleApply, multiplied into the ramp
// launch in driveUpdate, serialized when non-default, and exposed as an editor slider + hint.
import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
const du = extractFunction('driveUpdate');

// --- vehicleApply sanitizes launch to [0,3], default 1 ---
const va = extractFunction('vehicleApply');
assert(/launch:\(v\.launch==null\?1:Math\.max\(0, Math\.min\(3, \+v\.launch\|\|0\)\)\),/.test(va), 'vehicleApply clamps launch to [0,3] with default 1');

// --- driveUpdate reads the multiplier and applies it to the ramp launch ---
assert(/const _lm=\(cfg\.launch==null\?1:cfg\.launch\);/.test(du), 'driveUpdate resolves the Launch multiplier (default 1 for old vehicles)');
assert(/Math\.min\(_climb\*1\.15,15\)\*_lm/.test(du), 'the launch velocity is scaled by the multiplier');
// behaviour: 0 => no launch, 2 => double
{
  const launch = (climb, lm) => (climb>0.8 && climb<22) ? Math.min(climb*1.15,15)*lm : 0;
  eq(launch(10, 0), 0, 'Launch 0 => the car never leaves the ground');
  eq(launch(10, 1) > 0, true, 'Launch 1 => normal air');
  eq(launch(10, 2), launch(10, 1)*2, 'Launch 2 => double the pop');
  eq(launch(30, 1), 0, 'a wall-ram spike (climb 30 > 22) still never launches, any multiplier');
}

// --- serialized only when non-default ---
assert(/if\(V\.launch!=null && V\.launch!==1\) e\.veh\.launch=V\.launch;/.test(src), 'launch is written to the level only when it differs from the default');

// --- editor: a Launch slider + explanatory hint ---
const src2 = src;
assert(/row\('Launch','launch', 0, 3, 0\.05, 1\);/.test(src2), 'the editor has a Launch slider (0..3)');
assert(/<b>Launch<\/b> — how hard a ramp throws the car into the air/.test(src2), 'the Launch slider has a hint explaining it');

done('build 791: per-vehicle Launch tunable (ramp air), wired app->drive->serialize->editor');
