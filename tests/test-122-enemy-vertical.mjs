// (build 173) Enemies no longer attack across floors. Chase/pathing stays horizontal (they walk the floor),
// but both the melee hit and the ranged shot now require the target to be at roughly the enemy's own height
// (|player feet - enemy y| < 2.6), so an enemy on the first floor can't damage a player on the second.
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();

assert(/Math\.abs\(\(near\.pos\.y - EYE\) - en\.mesh\.position\.y\) < 2\.6 && en\.cooldown<=0/.test(src), 'melee attack gated by vertical distance');
assert(/Math\.abs\(\(near\.pos\.y - EYE\) - en\.mesh\.position\.y\) < 2\.6\s*\/\/ roughly the same level/.test(src), 'ranged shot gated by vertical distance');
// the gate count: both attack paths
const gates = (src.match(/Math\.abs\(\(near\.pos\.y - EYE\) - en\.mesh\.position\.y\) < 2\.6/g)||[]).length;
assert(gates>=2, 'both melee and ranged gated ('+gates+')');
done('enemy attacks respect height');
