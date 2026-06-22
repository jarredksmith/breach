import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// Enemies must resolve obstacles against the per-column grid (boxes), not the single overall box,
// so openings in imported models (doorways/archways) are passable.
assert(/const bs = c\.userData\.boxes \|\| \(b0 \? \[b0\] : null\); if\(!bs\) continue;\s*\n\s*for\(const b of bs\)\{/.test(src), 'enemy push-out iterates the per-column grid');
assert(/if\(b\.max\.y < eFeetY \|\| b\.min\.y > eHeadY\) continue;/.test(src), 'enemy only resolves boxes it vertically overlaps (door gap / lintel passable)');
assert(/coarse reject: nowhere near this model/.test(src), 'coarse AABB reject keeps the grid loop cheap');
done('enemy-doorways');
