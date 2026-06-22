import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// player-start tab must be reachable from Build mode (was dropped in the menu reorg)
assert(/build:\s*\[[^\]]*'pstart'[^\]]*\]/.test(src), 'pstart (player start) is in MODE_TARGETS.build');
assert(/pstart:\s*\{[\s\S]*?isPstart: true/.test(src), 'pstart target still defined');
done('pstart-tab');
