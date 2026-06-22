// Player body constants and their relationships.
import { extractConst, gameSource, html, done, assert, eq, near } from './harness.mjs';
const src = gameSource();
const EYE = Number((src.match(/const\s+EYE\s*=\s*([\d.]+)/) || [])[1]);
const STEP = Number((src.match(/const\s+STEP\s*=\s*([\d.]+)/) || [])[1]);
const playerBlock = (src.match(/const player = \{[\s\S]*?\};/) || [''])[0];
const radius = Number((playerBlock.match(/radius:\s*([\d.]+)/) || [])[1]);
const phMatch = src.match(/const\s+PLAYER_HEIGHT\s*=\s*EYE\s*\+\s*([\d.]+)/);
assert(!!phMatch, 'PLAYER_HEIGHT defined as EYE + delta');
const PLAYER_HEIGHT = EYE + Number(phMatch[1]);
near(EYE, 1.7, 1e-9, 'eye height 1.7');
assert(radius > 0 && radius < 2, `player radius sane (${radius})`);
assert(STEP > 0 && STEP < PLAYER_HEIGHT, `step height below body height (STEP ${STEP} < ${PLAYER_HEIGHT})`);
assert(PLAYER_HEIGHT > EYE, 'body taller than eye line');
done('player movement constants');
