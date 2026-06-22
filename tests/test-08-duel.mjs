// DUEL_SPAWNS / duelSpawnFor: modulo wrap, distinct points, positive kill credits.
import { extractConst, extractFunction, evalIn, evalDecl, done, assert, eq } from './harness.mjs';
const deep=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const DUEL_SPAWNS = evalIn(extractConst('DUEL_SPAWNS'));
const CREDITS = Number(evalDecl('return ' + extractConst('DUEL_KILL_CREDITS') + ';', 'undefined'));
const duelSpawnFor = evalDecl(
  'const DUEL_SPAWNS=' + JSON.stringify(DUEL_SPAWNS) + '; ' + extractFunction('duelSpawnFor'),
  'duelSpawnFor');
assert(DUEL_SPAWNS.length >= 2, 'at least 2 spawns');
for (const s of DUEL_SPAWNS) assert('x' in s && 'z' in s && 'yaw' in s, 'spawn has x/z/yaw');
assert(deep(duelSpawnFor(0), DUEL_SPAWNS[0]), 'id 0 -> spawn 0');
assert(deep(duelSpawnFor(DUEL_SPAWNS.length), DUEL_SPAWNS[0]), 'wraps via modulo');
assert(deep(duelSpawnFor(DUEL_SPAWNS.length + 1), DUEL_SPAWNS[1]), 'wraps +1');
const uniq = new Set(DUEL_SPAWNS.map(s => `${s.x},${s.z}`));
eq(uniq.size, DUEL_SPAWNS.length, 'spawn points are distinct');
assert(CREDITS > 0, 'duel kill credits positive');
done('duel spawns + scoring constants');
