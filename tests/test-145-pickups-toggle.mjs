import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/let pickupsOn = !\(savedLevel && savedLevel\.pickupsOn === false\)/.test(src), 'pickupsOn state (default on)');
assert(/if\(!pickupsOn\) return;\s*\/\/ pickups disabled for this level/.test(src), 'spawnPowerups skips everything (incl. fallback) when off');
assert(/if\(typeof pickupsOn!=='undefined' && !pickupsOn\) return;/.test(src), 'no editor markers when off');
assert(/pickupsOn: pickupsOn,/.test(src) && /pickupsOn = \(level\.pickupsOn !== false\)/.test(src), 'pickupsOn saved + loaded');
assert(/poSp\.textContent='Spawn pickups'/.test(src), 'Spawn pickups checkbox in the Pickups UI');
done('pickups-toggle');
