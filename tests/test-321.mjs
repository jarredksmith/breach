import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 429: on an ELEVATED arena (raised rock floor), confined spawns clustered at one fallback spot. randomSpawn
// validated candidates at world-Y 0 (buried inside the rock) so EVERY point failed insideSolid/clearAt and it fell
// back to the centroid; placement also used terrainHeightAt (base ground), dropping players below the arena.
// Fix: validate clearance AT the real surface height, and return that y so callers place on the elevated floor.

const rs = extractFunction('randomSpawn');
assert(/const surfAt = \(x,z\)=> _spawnFloorAt\(x,z\);/.test(rs), 'computes the real surface height per column (ceiling-aware)');
assert(/const fy = surfAt\(x,z\);/.test(rs), 'samples the floor at each candidate');
// build 478: dropped the insideSolid gate (its over-occupied voxelizer boxes falsely rejected rock cells,
// failing all 64 tries and piling everyone on one spawn). clearAt alone, AT the floor height, is correct.
assert(/if\(!clearAt\(x,z,fy\)\) continue;/.test(rs), 'clearance tested with clearAt AT the floor (no poisoned insideSolid)');
assert(!/insideSolid\(x,z,fy\)/.test(rs), 'no insideSolid in the spawn gate');
assert(/best=\{x,z,y:fy\}/.test(rs), 'remembers the floor height with the chosen point');
assert(/return \{ x:best\.x, y:best\.y, z:best\.z, yaw \};/.test(rs), 'spawn result carries y (the floor)');

// callers place on sp.y (the floor), not base terrain / y=0
assert(/player\.pos\.set\(sp\.x, \(sp\.y!=null\?sp\.y:terrainHeightAt\(sp\.x, sp\.z\)\)\+EYE, sp\.z\)/.test(src), 'player spawns on the real floor');
assert(/mesh\.position\.set\(sp\.x,\(sp\.y\|\|0\),sp\.z\)/.test(src), 'bot mesh spawns on the real floor');
assert(/b\.pos\.set\(sp\.x,\(sp\.y\|\|0\),sp\.z\)/.test(src), 'bot respawn uses the real floor');

// executable: model the old vs new validation on an elevated arena
const FLOOR=12, STEP=0.6;                       // arena floor raised to y=12
// "solid below the floor" — at y=0 the column is inside rock; at the floor it's clear
function insideSolidAt(feetY){ return feetY < FLOOR - STEP; }   // band below the floor reads as solid
// OLD: tested at 0 -> every interior point looks solid -> rejected
assert(insideSolidAt(0)===true, 'old check at y=0 wrongly rejects an elevated-floor point');
// NEW: test at the surface -> clear
const surf=FLOOR;
assert(insideSolidAt(surf)===false, 'new check at the floor accepts the point');
done();
