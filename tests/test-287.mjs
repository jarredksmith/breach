import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 394: the held-gun grip POSITION (and all grip controls) gained an editable number box with NO
// ceiling, because character models arrive at wildly different scales — a fixed slider range was always
// eventually too small. The slider stays for quick dragging and auto-expands to include the typed value.

// each grip control now builds a slider + a number input
assert(/const rng=document\.createElement\('input'\); rng\.type='range';/.test(src), 'grip has a slider');
assert(/const num=document\.createElement\('input'\); num\.type='number';/.test(src), 'grip has an editable number box (no min/max -> unlimited)');
// the grip number box is created without a min/max attribute, so typed values are not clamped
assert(/const num=document\.createElement\('input'\); num\.type='number'; num\.step=String\(step\);/.test(src), 'grip number box has step but no min/max clamp');

// the slider track grows to include whatever value is set/typed (so big offsets stay reachable)
assert(/const fit=\(v\)=>\{ const lo=Math\.min\(softLo, v-step\), hi=Math\.max\(softHi, v\+step\); rng\.min=String\(lo\); rng\.max=String\(hi\); \};/.test(src), 'slider track auto-expands to fit the current value');

// typing in the box applies live with no clamp, persists, and refreshes all avatars
assert(/num\.oninput=\(\)=>\{ const v=parseFloat\(num\.value\); if\(!isNaN\(v\)\)\{ set\(v\); _saveTpGun\(\); refreshAvatarGunGrips\(\);/.test(src), 'typing a value applies live (unclamped) + persists + retunes');

// still 7 controls (X/Y/Z, yaw/pitch/roll, scale) and still live-applied
assert((src.match(/_grip\('/g)||[]).length === 7, 'all seven grip controls present');
assert(/_grip\('Pos X', \(\)=>tpGunGrip\(\)\.x, v=>tpGunGrip\(\)\.x=v, -8, 8, 0\.01, 'breach_tp_gun_x'\);/.test(src), 'Pos X reads the current weapon grip + keeps a comfortable default span (build 395)');
done();
