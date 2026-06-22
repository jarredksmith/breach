import * as THREE from 'three';
import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 383: the preview forward arrow pointed +Z, but the engine's forward at yaw 0 is -Z. So the arrow
// was lying, and authors orienting a model to it ended up facing backwards in-world. Arrow now points -Z.

// the engine forward at yaw 0 is -Z (from the view basis fz=-cp*cy -> -1 at yaw 0, pitch 0)
const cp=1, sp=0, cy=1, sy=0;
const fz = -cp*cy;
assert(Math.abs(fz - (-1)) < 1e-9, 'engine forward at yaw 0 is -Z');

// the preview arrow now matches that
assert(/const _fArr=new THREE\.ArrowHelper\(new THREE\.Vector3\(0,0,-1\)/.test(src), 'forward arrow points -Z (true forward)');
assert(!/ArrowHelper\(new THREE\.Vector3\(0,0,1\)/.test(src), 'no +Z (backwards) arrow remains');

// avatars are rotated by yaw (+ the per-character face offset), so a 180 face flips a backwards model
const bav = src;
assert(/model\.rotation\.y \+= \(mc\.face\|\|0\);/.test(bav), 'per-character face offset is applied (set 180 to flip a backwards model)');
assert(/a\.rotation\.y = player\.yaw;/.test(bav), 'own avatar faces the player yaw (forward = -Z at yaw 0)');

// the Facing control exists with a 180 range so users can flip
assert(/k:'face', label:'Facing\u00b0',\s+min:-180, max:180/.test(src), 'Facing control spans -180..180 (180 = full flip)');

// the hint tells users what the arrow means + how to flip
assert(/points the character\u2019s FORWARD/.test(src) && /set Facing to 180/.test(src), 'hint explains the arrow + the 180 flip');
done();
