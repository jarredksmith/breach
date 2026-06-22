import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 435: placed loot crates gained x/y/z transform + emission (glow) color & intensity controls.
assert(/glowColor:\(s\.glowColor!=null\?\+s\.glowColor:0xffd166\), glowI:\(s\.glowI!=null\?\+s\.glowI:8\)/.test(src), 'loot spots carry y + glow color/intensity');
assert(/loot: lootSpots\.map\(s=>\(\{ x:\+s\.x, y:\+\(s\.y\|\|0\), z:\+s\.z, items:\(s\.items\|\|\[\]\)\.slice\(\), glowColor:/.test(src), 'saved with the level');
const bcm = extractFunction('buildChestMesh');
assert(/mesh\.position\.set\(px, 0\.7 \+ \(\+o\.y\|\|0\), pz\)/.test(bcm), 'crate height offset applied');
assert(/new THREE\.PointLight\(\(o\.glowColor!=null\?\+o\.glowColor:0xffd166\), \(o\.glowI!=null\?\+o\.glowI:8\), 16\)/.test(bcm), 'beam uses the per-crate emission color + intensity');
assert(/buildChestMesh\(sp\.x, sp\.z, \{ y:sp\.y, glowColor:sp\.glowColor, glowI:sp\.glowI \}\)/.test(src), 'markers + spawn pass the crate options');
assert(/lootNum\('Pos X'/.test(src) && /lootNum\('Height'/.test(src) && /lootNum\('Pos Z'/.test(src), 'editor has x / height / z controls');
assert(/emS\.textContent='Emission'/.test(src) && /emC\.type='color'/.test(src) && /lootNum\('Intensity'/.test(src), 'editor has emission color + intensity');
done();
