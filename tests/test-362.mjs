import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 483: surfaceTopAt only raycasts colliders whose XZ footprint contains the query point. A vertical ray
// can't hit any other collider, so this is a provably-safe cull that turns a raycast-against-all-rocks into a
// test of the 1-2 underfoot — the dominant per-bot per-frame cost.

assert(/function _surfCull\(x, z\)/.test(src), 'collider cull helper exists');
const cull = extractFunction('_surfCull');
assert(/if\(!bs\)\{ out\.push\(c\); continue; \}/.test(cull), 'colliders with no box info are kept (cannot be culled safely)');
assert(/if\(x>=b\.min\.x-M && x<=b\.max\.x\+M && z>=b\.min\.z-M && z<=b\.max\.z\+M\)\{ out\.push\(c\); break; \}/.test(cull), 'kept when the point is inside a box footprint (+ margin)');
assert(/const hits = _downRay\.intersectObjects\(_surfCull\(x,z\), true\);/.test(src), 'surfaceTopAt raycasts the culled subset');

// --- executable: the cull keeps exactly the right colliders, never drops a real hit ---
const M=0.3;
function inBox(x,z,b){ return x>=b.min.x-M && x<=b.max.x+M && z>=b.min.z-M && z<=b.max.z+M; }
function cullList(cols, x, z){
  const out=[];
  for(const c of cols){ const bs=c.boxes; if(!bs){ out.push(c); continue; }
    for(const b of bs){ if(inBox(x,z,b)){ out.push(c); break; } } }
  return out;
}
const floor={ name:'floor', boxes:[{min:{x:-50,z:-50},max:{x:50,z:50}}] };
const rockA={ name:'rockA', boxes:[{min:{x:5,z:5},max:{x:9,z:9}}] };
const rockB={ name:'rockB', boxes:[{min:{x:-9,z:-9},max:{x:-5,z:-5}}] };
const noBox={ name:'noBox' };   // always kept
const cols=[floor,rockA,rockB,noBox];
// over open floor far from rocks: only floor + the un-cullable one
let r=cullList(cols, 0,0).map(c=>c.name);
assert(r.includes('floor') && r.includes('noBox') && !r.includes('rockA') && !r.includes('rockB'), 'open floor -> floor + un-cullable only, rocks skipped');
// standing on rockA: floor + rockA + noBox (not rockB)
r=cullList(cols, 7,7).map(c=>c.name);
assert(r.includes('floor') && r.includes('rockA') && !r.includes('rockB'), 'on a rock -> that rock is kept, the far one skipped');
// a collider with no boxes is never dropped (safety)
assert(cullList([noBox], 999,999).length===1, 'box-less collider is always raycast');
done();
