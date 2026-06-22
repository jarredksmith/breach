// (build 122) PvP fix: dying with a loot crate open no longer soft-locks. The shop is closed on death,
// the loop never freezes while waiting to respawn, and crates can't be opened while dead.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

const dd = extractFunction('duelDie');
assert(/if\(shopOpen\) closeShop\(\);/.test(dd), 'death closes an open shop');
assert(/choosingUpgrade = false;/.test(dd), 'death clears upgrade picker');

assert(/if\(\(shopOpen \|\| choosingUpgrade \|\| \(paused && NET\.mode==='off'\) \|\| \(mapOpen && NET\.mode==='off'\) \|\| \(invOpen && NET\.mode==='off'\)\) && !\(duelDead && pvpMode\(\)\)\)/.test(src), 'loop never freezes while waiting to respawn');
assert(/if\(duelDead\) return;\s*\/\/ no shopping while waiting to respawn/.test(extractFunction('openShop')), 'cannot open a crate while dead');
done('respawn shop fix');
