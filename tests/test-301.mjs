import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 408: the player start gained a Y (height) offset so you can spawn on a second story / platform top,
// instead of always snapping to the ground.

// spawn object carries y
assert(/y:   \(savedLevel && savedLevel\.pstart && savedLevel\.pstart\.y  !=null\) \? savedLevel\.pstart\.y   : 0,/.test(src), 'playerSpawn has a y field');

// spawn position adds the y offset above terrain, and the player is airborne when elevated
assert(/player\.pos\.set\(playerSpawn\.x, terrainHeightAt\(playerSpawn\.x, playerSpawn\.z\)\+\(playerSpawn\.y\|\|0\)\+EYE, playerSpawn\.z\)/.test(src), 'spawn Y = terrain + offset + eye');
assert(/player\.onGround=\(playerSpawn\.y\|\|0\)<=0;/.test(src), 'elevated spawns start airborne so the player drops onto the platform');

// the marker visibly rises to the elevated start
assert(/\+\(playerSpawn\.y\|\|0\), playerSpawn\.z\)/.test(src) && /const gx=playerSpawn\.x, gz=playerSpawn\.z, gy=[\s\S]*?\+\(playerSpawn\.y\|\|0\)/.test(src), 'spawn marker (build + refresh) sits at the elevated height');

// serialized + restored
assert(/pstart:  \{ x: playerSpawn\.x, y: playerSpawn\.y\|\|0, z: playerSpawn\.z, yaw: playerSpawn\.yaw \}/.test(src), 'y saved with the level');
assert((src.match(/playerSpawn\.y=level\.pstart\.y\|\|0;/g)||[]).length === 2, 'y restored on both load paths');

// editor has a height field (slider + number) that updates the marker
assert(/ysp\.textContent='Height ↑';/.test(src), 'editor shows a Height control');
assert(/const apY=\(v\)=>\{ let n=parseFloat\(v\); if\(!isFinite\(n\)\) n=0; if\(n<0\) n=0; playerSpawn\.y=n;/.test(src), 'height field clamps to >=0 and updates the spawn');
assert(/refreshPlayerSpawnMarker\(\); pr\.textContent='Position:  X '/.test(src), 'changing height refreshes the marker + readout');

// reset clears y too
assert(/playerSpawn\.x=0; playerSpawn\.z=0; playerSpawn\.y=0; playerSpawn\.yaw=0;/.test(src), 'reset clears the height');
done();
