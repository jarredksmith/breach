import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 304: chase cam pivots on the model's real centre (no sliding, only rotation)
assert(/g\.userData\.centerLocal = \{ x:\(mc\.xoff\|\|0\), y:\(mc\.yoff\|\|0\) \+ h\*0\.5, z:\(mc\.zoff\|\|0\) \}/.test(src), 'model centre stored at build');
assert(/g\.userData\.centerLocal=\{ x:0, y:1\.0, z:0 \}/.test(src), 'capsule placeholder centre stored');
const uoa = extractFunction('updateOwnAvatar');
assert(/a\.userData\.footY = footY;/.test(uoa), 'foot height exposed to the chase cam');
const tcp = extractFunction('tpCameraPushback');
assert(/_ownAvatar\.userData\.centerLocal\)\{/.test(tcp), 'chase cam uses the model centre');
assert(/px=player\.pos\.x \+ cl\.x\*cy \+ cl\.z\*sy; pz=player\.pos\.z - cl\.x\*sy \+ cl\.z\*cy; py=fY \+ cl\.y;/.test(tcp), 'pivot rotates the local centre by yaw + sits at model-centre height');
assert(/const camx = px - fx\*dist \+ rx\*side, camy = py - fy\*dist \+ height, camz = pz - fz\*dist \+ rz\*side;/.test(tcp), 'chase cam pulls back with blended side/distance/height framing (build 373)');
done();
