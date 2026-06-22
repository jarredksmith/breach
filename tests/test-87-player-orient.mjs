// (build 128) Player avatar model can be fully oriented (pitch + roll, not just yaw/facing), matching
// the level of control over enemy models.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();
assert(/const PLAYER_MODEL0 = \{ url:'', scale:1, face:0, rx:0, rz:0,/.test(src), 'player model config has pitch + roll');
const bav = extractFunction('buildAvatarVisual');
assert(/model\.rotation\.x = \(mc\.rx\|\|0\); model\.rotation\.z = \(mc\.rz\|\|0\); model\.rotation\.y \+= \(mc\.face\|\|0\)/.test(bav), 'avatar applies pitch/roll/facing');
assert(/\{ k:'rx',   label:'Pitch/.test(src) && /\{ k:'rz',   label:'Roll/.test(src), 'editor exposes Pitch + Roll');
assert(/playerModelCfg\.rx=\(s\.rx\|\|0\)\*RAD; playerModelCfg\.rz=\(s\.rz\|\|0\)\*RAD;/.test(src), 'apply writes pitch/roll');
done('player orient');
