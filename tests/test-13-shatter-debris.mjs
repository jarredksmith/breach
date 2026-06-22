// Shatter debris (build 29+): fragment size is capped so debris never reads bigger than the prop,
// shards are bounded faceted geometry, and shards are the default shape.
import * as THREE from 'three';
import { extractFunction, extractConst, gameSource, evalDecl, evalIn, done, assert, eq } from './harness.mjs';

const FRAC = Number(evalIn(extractConst('DEBRIS_SIZE_FRAC')));
eq(FRAC, 0.16, 'default debris size fraction is 0.16');

// --- fragmentBaseSize: floored at 0.05, never above maxDim*0.34 ---
const fragmentBaseSize = evalDecl(
  'const DEBRIS_SIZE_FRAC=' + FRAC + '; ' + extractFunction('fragmentBaseSize'),
  'fragmentBaseSize');
for (const maxDim of [0.2, 0.5, 1, 2, 5, 10]) {
  for (const sf of [0.06, 0.16, 0.30]) {
    const b = fragmentBaseSize(maxDim, sf);
    assert(b <= maxDim * 0.34 + 1e-9, `base size <= 34% of prop (maxDim ${maxDim}, sf ${sf} -> ${b.toFixed(3)})`);
    assert(b >= 0.05 - 1e-9, `base size floored at 0.05 (maxDim ${maxDim}, sf ${sf})`);
  }
}
assert(fragmentBaseSize(undefined === undefined ? 1 : 1) === fragmentBaseSize(1, FRAC), 'sizeFrac defaults to DEBRIS_SIZE_FRAC');

// --- makeShardGeometry: faceted, bounded, valid triangles ---
const makeShardGeometry = evalDecl(extractFunction('makeShardGeometry'), 'makeShardGeometry', { THREE });
let maxDiameter = 0;
for (let n = 0; n < 12; n++) {
  const g = makeShardGeometry();
  const pos = g.attributes.position;
  eq(pos.count, 60, 'shard is non-indexed 20-triangle solid (60 verts)');
  assert(g.attributes.normal && g.attributes.normal.count === 60, 'shard has per-vertex normals (faceted)');
  // every vertex within a bounded radius of the origin
  let rmax = 0, degenerate = 0;
  for (let i = 0; i < pos.count; i++) {
    rmax = Math.max(rmax, Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }
  assert(rmax > 0.3 && rmax < 0.7, `shard radius bounded (~0.5, got ${rmax.toFixed(3)})`);
  // no zero-area triangles
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t); b.fromBufferAttribute(pos, t + 1); c.fromBufferAttribute(pos, t + 2);
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5;
    if (area < 1e-5) degenerate++;
  }
  eq(degenerate, 0, 'no degenerate (zero-area) shard triangles');
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const sz = box.getSize(new THREE.Vector3());
  maxDiameter = Math.max(maxDiameter, sz.x, sz.y, sz.z);
}

// --- end-to-end: worst-case fragment extent stays under the prop's size ---
// extent = fragmentBaseSize * (max rand 1.2) * (max non-uniform 1.18) * shard diameter
const maxDim = 1;
const worst = fragmentBaseSize(maxDim, 0.30) * 1.2 * 1.18 * maxDiameter;
assert(worst < maxDim, `worst-case fragment (${worst.toFixed(3)}) smaller than the prop (${maxDim})`);

// --- shards is the default shape; only 'cubes' is persisted ---
const src = gameSource();
assert(/debrisShape==='cubes'\)\s*\?\s*'cubes'\s*:\s*'shards'/.test(src), "shatter defaults to shards unless explicitly cubes");
assert(/debrisShape==='cubes'\)\s*e\.dsh='cubes'/.test(src), "serializer stores shape only when cubes (shards is default)");
done('shatter debris sizing + shard geometry');
