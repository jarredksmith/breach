import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 491: drive the turn-in-place + stand<->crouch transition slots that the taxonomy already mapped but
// nothing ever fired. _turnInPlaceSlot turns a stationary body-yaw change into a turnL / turnR / turn180
// footwork step; the crouch toggle edge fires standToCrouch / crouchToStand. Both ride the existing one-shot
// channel (playOwnAnim) so they win over locomotion but sit below the death/event priority already in place.

// ---- wiring in updateOwnAvatar ----
const uoa = extractFunction('updateOwnAvatar');
assert(/_turnInPlaceSlot\(a\.userData\._turn/.test(uoa), 'turn-in-place resolved from a per-avatar scratch store');
assert(/playOwnAnim\(_ts, _ts==='turn180' \? 420 : 340\)/.test(uoa), 'turn step plays as a one-shot (180 held longer)');
assert(/crouching && !_ownPrevCrouch\) playOwnAnim\('standToCrouch', 300\)/.test(uoa), 'crouch press -> standToCrouch');
assert(/!crouching && _ownPrevCrouch\) playOwnAnim\('crouchToStand', 300\)/.test(uoa), 'crouch release -> crouchToStand');
assert(/_ownPrevCrouch = crouching;/.test(uoa), 'crouch edge advances each frame');
assert(/_ownPrevX=player\.pos\.x; _ownPrevZ=player\.pos\.z; _ownPrevYaw=player\.yaw;/.test(uoa), 'previous yaw tracked each frame for the turn delta');

// gate: turn-in-place fires ONLY when standing still, grounded and not already in another action — otherwise
// every camera turn while moving / aiming would spuriously trigger footwork.
assert(/!dead && player\.onGround && !_evtBusy && !crouching && !sliding && !reloading && !\(ads\|\|padAds\|\|touchAds\) && \(performance\.now\(\)-lastShot>=250\) && _ownSpeed<0\.012/.test(uoa),
  'turn-in-place gated to the idle-stand state');

// respawn clears the edge state so a spawn yaw jump / held crouch can't fire a spurious step into the next life
assert(/_ownPrevYaw=null; _ownPrevCrouch=false;/.test(src), 'respawn resets the turn/crouch edge state');

// ---- executable: _turnInPlaceSlot direction, thresholds, cadence ----
const _turnInPlaceSlot = new Function('return ('+extractFunction('_turnInPlaceSlot')+')')();
const dt = 0.016;

// a small look nudge (below the rate threshold) is NOT a turn-in-place
let s = {};
assert(_turnInPlaceSlot(s, 0.5*dt, dt) === null, 'slow nudge -> no turn step');

// a brisk turn fires on the first frame, with the side from the yaw sign (+yaw is left, avatars face -Z)
s = {};
assert(_turnInPlaceSlot(s, 2.0*dt, dt) === 'turnL', 'brisk +yaw -> turnL');
s = {};
assert(_turnInPlaceSlot(s, -2.0*dt, dt) === 'turnR', 'brisk -yaw -> turnR');

// holding the same direction does NOT re-fire within the cadence window, then re-steps after it
s = {};
assert(_turnInPlaceSlot(s, 2.0*dt, dt) === 'turnL', 'first frame of a sustained turn fires');
let reFires = 0;
for(let t = 0; t < 0.49; t += dt){ if(_turnInPlaceSlot(s, 2.0*dt, dt)) reFires++; }
assert(reFires === 0, 'no re-fire within the ~0.5s step cadence');
assert(_turnInPlaceSlot(s, 2.0*dt, dt) === 'turnL', 'sustained same-direction turn re-steps after the cadence');

// a direction flip re-fires immediately as the opposite step
s = {}; _turnInPlaceSlot(s, 2.0*dt, dt);
assert(_turnInPlaceSlot(s, -2.0*dt, dt) === 'turnR', 'direction flip -> immediate opposite step');

// a fast wide swing accumulates into an about-face
s = {}; let got180 = false;
for(let k = 0; k < 60; k++){ if(_turnInPlaceSlot(s, 3.0*dt, dt) === 'turn180'){ got180 = true; break; } }
assert(got180, 'fast wide swing accumulates into turn180');

// dropping below the rate threshold disarms the burst (so it re-arms cleanly next time)
s = {}; _turnInPlaceSlot(s, 3.0*dt, dt);
_turnInPlaceSlot(s, 0.1*dt, dt);
assert(s.accum === 0 && s.turning === false, 'falling below threshold resets the burst');

// turn-in-place steps are one-shots that fall back to idle on models without the clip (taxonomy invariant)
assert(/turnL:'idle', turnR:'idle', turn180:'idle'/.test(src), 'turn slots fall back to idle');
// crouch transitions fall back to crouch / idle so models without the clip still settle correctly
assert(/standToCrouch:'crouch'.*crouchToStand:'idle'/.test(src), 'crouch transitions fall back to crouch / idle');

done();
