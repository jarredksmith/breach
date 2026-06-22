// Reload transfer conserves rounds and never overfills/underflows.
// Mirrors reload(): need = magSize-mag; take = min(need, reserve); mag+=take; reserve-=take.
import { done, assert, eq } from './harness.mjs';
function reloadStep(mag, magSize, reserve) {
  const need = magSize - mag;
  const take = Math.min(need, reserve);
  return { mag: mag + take, reserve: reserve - take };
}
const cases = [
  [10, 30, 90], [0, 6, 24], [29, 30, 1], [5, 40, 0], [40, 40, 360], [3, 30, 2],
];
for (const [mag, magSize, reserve] of cases) {
  const before = mag + reserve;
  const r = reloadStep(mag, magSize, reserve);
  eq(r.mag + r.reserve, before, `rounds conserved (${mag}/${magSize}, res ${reserve})`);
  assert(r.mag <= magSize, `mag never exceeds magSize (${mag}/${magSize})`);
  assert(r.reserve >= 0, `reserve never negative (res ${reserve})`);
  assert(r.mag >= mag, `mag never decreases`);
}
done('reload transfer math');
