import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 519: fix the walk+shoot stutter on networked bots/players. Three causes:
//  (a) remoteFire forced 'attack' every shot, then netInterpolate overrode it the same frame (double restart),
//  (b) the fire-hold window was shorter than the gap between shots (flicker between move+fire and plain loco),
//  (c) the client speed tier came from raw interpolation deltas (walk<->run chatter).

// (a) remoteFire no longer drives the animation state directly — netInterpolate owns it
const rf = extractFunction('remoteFire');
assert(/rp\._fireT = performance\.now\(\)\+480;/.test(rf), 'remoteFire holds the fire pose longer (bridges shot gaps)');
assert(!/setEnemyAnimState\(rp\.mesh,'attack'\)/.test(rf), 'remoteFire no longer forces a competing attack pose each shot');

// (b) the host bot fire-hold is lengthened too
assert(/remoteFire\(b\.id, o, d\); b\._fireAnimT=performance\.now\(\)\+480;/.test(src), 'host bot fire-hold lengthened to steady the burst');

// (c) the client tier is low-passed with hysteresis
assert(/rp\._aspd = \(rp\._aspd\|\|0\)\*0\.7 \+ md\*0\.3;/.test(src), 'client speed is low-passed');
assert(/const tier = rp\._aspd > \(rp\._wasRun\?0\.06:0\.105\) \? 'run' : \(rp\._aspd>0\.02 \? 'walk' : 'idle'\); rp\._wasRun=\(tier==='run'\);/.test(src),
  'tier uses run-enter/hold hysteresis to stop walk<->run chatter');

done();
