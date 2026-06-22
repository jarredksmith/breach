import * as THREE from 'three';
import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 382: a held (LoopOnce + clamp) state could not REPLAY after being left and re-entered — e.g. aim,
// release, aim again would stay frozen at the last frame. setEnemyAnimState now reset()s the action before
// playing, which clears the finished/paused/clamped state so it rewinds.

const sa = extractFunction('setEnemyAnimState');
assert(/next\.reset\(\); next\.enabled = true; next\.setEffectiveTimeScale\(_spd\); next\.setEffectiveWeight\(1\); next\.time = 0; next\.play\(\);/.test(sa), 'next action is reset() before play so a finished hold-clip replays');
// reset must come BEFORE play (order matters)
const ri = sa.indexOf('next.reset()'), pi = sa.indexOf('next.play()');
assert(ri > 0 && ri < pi, 'reset precedes play');
// loop/clamp is still set per hold flag
assert(/if\(_hold\)\{ next\.loop = THREE\.LoopOnce; next\.clampWhenFinished = true; \}/.test(sa), 'hold still clamps the last frame');

// executable: a finished LoopOnce action, after reset()+play(), advances from 0 again (does not stay clamped)
const root = new THREE.Object3D();
const clip = new THREE.AnimationClip('s', 1, [new THREE.NumberKeyframeTrack('.position[x]',[0,1],[0,5])]);
const mixer = new THREE.AnimationMixer(root);
const a = mixer.clipAction(clip); a.loop = THREE.LoopOnce; a.clampWhenFinished = true; a.play();
mixer.update(2);                       // finish + clamp
assert(a.paused === true && a.time > 0.99, 'precondition: action finished + clamped');
a.reset(); a.enabled = true; a.time = 0; a.play();   // the build-382 re-entry path
mixer.update(0.4);
assert(a.time > 0.2 && a.time < 0.99, 'after reset+play the held clip replays (time advances from 0), not stuck at the end');
done();
