// (build 790) Airborne car feel — ramping off something should ARC, not belly-flop. Three changes in driveUpdate:
//  1. bigger launch off a ramp (banked climb speed capped at 15, up from 7),
//  2. while airborne the target pitch follows the flight arc (atan2 of vertical vs forward speed) instead of snapping flat,
//  3. a landing squat + camera jolt (and a thud on a hard landing) when you touch down from a real fall.
import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
const du = extractFunction('driveUpdate');

// 1. launch is banked from the ramp climb, bigger cap, scaled by the vehicle Launch multiplier, still rejects a wall-ram spike (>22)
assert(/const _launch=\(_climb>0\.8 && _climb<22\)\?Math\.min\(_climb\*1\.15,15\)\*_lm:0;/.test(du), 'ramp launch scales with climb (cap 15) x Launch multiplier, wall-ram spikes still excluded');

// 2. airborne, the nose follows the arc: nose up while rising (+_vy), nosing over as it falls (−_vy)
assert(/let _tp=_grounded\?Math\.atan2\(gF-gB, 2\*_hd\):Math\.atan2\(_vy, Math\.max\(4,Math\.abs\(r\.speed\)\)\)/.test(du), 'airborne pitch target follows the flight arc');
// the sign is right: rising => positive (nose up), falling => negative (nose down)
{
  const arc = (vy, sp) => Math.atan2(vy, Math.max(4, Math.abs(sp)));
  assert(arc(12, 25) > 0.1, 'rising off a ramp -> nose up');
  assert(arc(-12, 25) < -0.1, 'descending -> nose over (down)');
  assert(Math.abs(arc(0.1, 40)) < 0.02, 'a tiny bump at speed barely tilts (no jitter)');
}

// 3. landing feedback — capture the contact speed, detect the air->ground transition, and squat + jolt on a real drop
assert(/const _impVy=_vy;/.test(du), 'the descent speed at contact is captured for landing feedback');
assert(/const _wasAir=o\.userData\._carGrounded===false;/.test(du), 'last frame\'s airborne state is remembered');
assert(/if\(_grounded && _wasAir && _impVy < -6\)\{/.test(du), 'a landing fires only on a real touchdown from a fall');
assert(/o\.userData\.leanPitch=\(o\.userData\.leanPitch\|\|0\) - 0\.11\*_fall;/.test(du), 'the suspension dips (nose) on contact, scaled by the fall speed');
assert(/o\.userData\.hitShake=Math\.max\(o\.userData\.hitShake\|\|0, 0\.03 \+ _fall\*0\.10\);/.test(du), 'a camera jolt scaled by the impact');
assert(/if\(_fall>0\.35 && typeof playSample==='function'\) playSample\(curSounds\(\)\.carBrake\);/.test(du), 'a heavy landing plays a thud');

done('build 790: airborne car physics — bigger air, arc-following pitch, weighty landing');
