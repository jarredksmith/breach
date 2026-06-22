import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 297: fx + tracer load from the saved level at boot (page reload persists them)
assert(/let fxCfg = _sanitizeFx\(savedLevel && savedLevel\.fx\);/.test(src), 'fxCfg initialized from savedLevel');
assert(/let tracerCfg = _sanitizeTracer\(savedLevel && savedLevel\.tracer\);/.test(src), 'tracerCfg initialized from savedLevel');
// Test buttons spawn relative to the camera so they show in the editor free-fly view
const rip = extractFunction('renderImpactFxPanel');
assert(/const pt=camera\.position\.clone\(\)\.addScaledVector\(d, 3\); spark\(pt/.test(rip), 'impact test spawns at the camera');
const rtp = extractFunction('renderTracerFxPanel');
assert(/crossVectors\(d, new THREE\.Vector3\(0,1,0\)\)\.normalize\(\)/.test(rtp) && /tracer\(mid\.clone\(\)\.addScaledVector\(right,-3\), mid\.clone\(\)\.addScaledVector\(right,3\), true\)/.test(rtp), 'streak test fires broadside across the view, forced');
assert(!/copy\(player\.pos\)\.addScaledVector\(d, 3\)/.test(src), 'old player.pos impact test gone');
done();
