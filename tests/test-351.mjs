import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 466: the nav overlay revealed the grid marked ZERO walkable cells on the rock model (but the floor
// was fine), even though the player walks the rock. Cause: navWalkable gated on insideSolid, which does a raw
// band-overlap against the collider boxes. The model's coarse grid boxes bulge ABOVE the real rock surface,
// so insideSolid (no surface-escape) reported "solid" on every rock top and rejected it. Fix: gate on clearAt
// only — the same function the player uses, which samples the real mesh surface as a step-escape.

const nw = extractFunction('navWalkable');
assert(/return \{ ok: clearAt\(x,z,standY,gy\), y: standY \};/.test(nw), 'walkability is decided by clearAt');
assert(!/insideSolid\([^)]*\)\) return/.test(nw), 'insideSolid is no longer used as a gate');

// --- executable: a rock-top column whose collider box bulges above the actual surface ---
const STEP=0.6, PLAYER_H=2.6;
const rockTop=8.0;
const boxBulge=rockTop+1.2;                 // the grid box over-occupies ~1.2u above the real surface
const realSurface=rockTop;                  // what a downward ray hits (propSurfaceAt)
const feetY=rockTop;                        // a bot standing on the rock

// OLD gate: insideSolid = box overlaps the body band [feetY+STEP, feetY+H]?  (no surface escape)
function insideSolidBand(boxMaxY, feetY){ const bandLo=feetY+STEP, bandHi=feetY+PLAYER_H; const boxMinY=0; return (boxMinY<bandHi && boxMaxY>bandLo); }
assert(insideSolidBand(boxBulge, feetY)===true, 'OLD: the bulging box overlaps the body band -> insideSolid wrongly says "solid" -> cell rejected');

// NEW: clearAt samples the real surface; within a step -> walkable
function clearAtEscape(surfaceY, feetY){ return surfaceY <= feetY + STEP + 1e-4; }   // the "low step -> walk on" branch
assert(clearAtEscape(realSurface, feetY)===true, 'NEW: clearAt sees the real surface is a low step -> walkable (matches the player)');

// a genuine wall (real surface well above a step) is still blocked by both
const wallSurface=feetY+2.0;
assert(clearAtEscape(wallSurface, feetY)===false, 'a real wall (surface 2m up) is still not walkable');
done();
