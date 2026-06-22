import { bootGame } from './boot-harness.mjs';
import { assert, done } from './harness.mjs';

// Full-file smoke test: define the game, run GAME_START() (real init order) + the first loop() tick under a
// permissive browser/THREE/Rapier stub. Catches TDZ / use-before-init / first-frame throws that per-function
// tests structurally cannot see. (It does NOT check correctness — see boot-harness.mjs header for limits.)
const r = bootGame();
if (!r.ok) {
  const e = r.error;
  console.error('BOOT FAILED:\n' + ((e && e.stack) ? e.stack.split('\n').slice(0, 6).join('\n') : String(e)));
}
assert(r.ok, 'game must boot (GAME_START + first loop tick) with no thrown error');
done();
