// (build 172) (1) The "E" activate prompt now measures 3D distance to the prop's mesh box (clamped in Y too),
// so a door one floor up no longer prompts from directly below it. (2) Moving/rotating platforms carry the
// player via the prop's full transform delta (so a pure-rotation trebuchet arm moves the player), and a fast
// surface (> XA_LAUNCH) flings the player off (extVel horizontally + an upward pop) — a working launcher.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// 1) proximity includes Y
const cp = extractFunction('checkProximity');
assert(/const cy = Math\.max\(b\.min\.y, Math\.min\(player\.pos\.y, b\.max\.y\)\);/.test(cp), 'anim proximity clamps Y to the box');
assert(/d = Math\.hypot\(player\.pos\.x-cx, player\.pos\.y-cy, player\.pos\.z-cz\)/.test(cp), 'anim proximity is 3D');
assert(/cy=Math\.max\(b\.min\.y,Math\.min\(player\.pos\.y,b\.max\.y\)\)/.test(cp), 'xanim proximity clamps Y');

// 2) carry/launch
assert(/const XA_LAUNCH=9;/.test(src), 'launch speed threshold');
const xc = extractFunction('_xaCarry');
assert(/function _xaCarry\(o, b, prevP, prevQ, dt, peakSp\)/.test(src), 'carry takes the support box as a param (gates on where the player stood)');
assert(/_xaDelta\.multiplyMatrices\(_xaCur, _xaPrevM\.invert\(\)\)/.test(xc), 'carry uses the prop full-transform delta (handles rotation)');
assert(/if\(sp > XA_LAUNCH\)\{/.test(xc) && /player\.extVel\.x = \(_xaUp\.x\*sp \+ mvx\/dt\) \* LP;/.test(xc), 'fast surface flings forward along the tilting face normal');
assert(/\{ const kd = Math\.max\(0, 1 - \(player\.onGround \? 6 : 0\.6\)\*dt\)/.test(src), 'launch momentum carries through the air (slow airborne decay)');
assert(/player\.pos\.x\+=mvx; player\.pos\.y\+=mvy; player\.pos\.z\+=mvz;/.test(xc), 'slow surface carries (rides)');
// updateXAnim calls carry on rotation too
const ux = extractFunction('updateXAnim');
assert(/const turns=\(a\.rx\|\|a\.ry\|\|a\.rz\);/.test(ux) && /if\(dx\|\|dy\|\|dz\|\|turns\)\{/.test(ux), 'rotation-only props still drive the carry');
assert(/_xaCarry\(o, _xaOldBox, _xaPrevP, _xaPrevQ, dt, _peakSp\)/.test(ux), 'carry gets the pre-rotation box + prev transform + dt');
done('proximity-Y + platform carry/launch');
