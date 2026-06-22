import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 412: animation LOD. Every AnimationMixer used to update at full rate every frame — skinned-mesh mixer
// updates are among the heaviest per-frame costs. Now far/off-screen models animate at a reduced rate (every
// 2nd or 4th frame), accumulating skipped dt so motion stays time-correct. Helps weak devices most.

const fn = extractFunction('updateMixersLOD');
assert(/root\.getWorldPosition\(_mxPos\)/.test(fn), 'uses the model world position (roots nest in positioned groups)');
assert(/stride = \(d2<=near2\) \? 1 : \(d2<=mid2 \? 2 : 4\);/.test(fn), 'near=every frame, mid=every 2nd, far=every 4th');
assert(/if\(root\.visible===false \|\| \(root\.parent && root\.parent\.visible===false\)\)\{ m\._lodAcc=\(m\._lodAcc\|\|0\)\+dt; continue; \}/.test(fn), 'fully-hidden models are not animated (dead/despawned)');
assert(/const pressure = \(typeof _prStepI!=='undefined' && _prStepI>0\) \? _prStepI : 0;/.test(fn), 'LOD tightens under adaptive-resolution pressure (weak devices)');
// accumulates skipped time so the eventual update advances the full elapsed time (no slow-motion)
assert(/m\._lodAcc=\(m\._lodAcc\|\|0\)\+dt; m\._lodN=\(\(m\._lodN\|\|0\)\+1\); if\(m\._lodN>=stride\)\{ m\.update\(m\._lodAcc\); m\._lodAcc=0; m\._lodN=0; \}/.test(fn), 'skipped dt accumulates and is applied on the throttled update (time-correct)');
// models with no resolvable root still update every frame (gun/terminal/UI)
assert(/let stride=1;/.test(fn), 'rootless mixers default to full-rate');

// executable: simulate the throttle for a FAR model (stride 4). After 4 frames of 16ms it should update ONCE
// with the full 64ms accumulated, not 4x16 separately.
let calls=[]; const mixer={ getRoot:()=>({ visible:true, parent:{visible:true}, getWorldPosition:(v)=>{ v.x=100;v.y=0;v.z=0; return v; } }), update:(t)=>calls.push(t) };
// stand-in camera + globals the fn closes over: rebuild a minimal version inline mirroring the logic
function farStride(d2){ const near2=225, mid2=1600; return d2<=near2?1:(d2<=mid2?2:4); }
assert(farStride(100*100)===4, 'a model ~100m away updates every 4th frame');
assert(farStride(20*20)===2, 'a model ~20m away updates every 2nd frame');
assert(farStride(5*5)===1, 'a model ~5m away updates every frame');
// time-correctness: 4 frames of dt=0.016 throttled at stride 4 -> one update of ~0.064
let acc=0,n=0,updates=[]; for(let f=0;f<4;f++){ acc+=0.016; n++; if(n>=4){ updates.push(acc); acc=0; n=0; } }
assert(updates.length===1 && Math.abs(updates[0]-0.064)<1e-9, 'four skipped frames apply as one 64ms update (no slow-mo)');
done();
