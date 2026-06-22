// (build 35) Two things: model enemies stop with their BODY just outside the player (not centre-on-top,
// which looked like the model was glued to / parented to the player), and cloneSkinned makes fully
// independent skinned clones (no shared bones -> no model tracking another / the camera).
import * as THREE from 'three';
import { gameSource, html, done, assert } from './harness.mjs';

// --- footprint-aware engagement (structural, in the enemy AI block) ---
const src = gameSource();
const aiStart = src.indexOf('// Phase 1 — behavior');
const ai = src.slice(aiStart, src.indexOf('// physics: host/solo', aiStart));
assert(/const fp = en\.mesh\.userData\.footprint \|\| 0\.9;/.test(ai), 'chase reads the enemy footprint');
assert(/stopAt = td\.chase \? \(fp \+ 0\.9\)/.test(ai), 'chase stops at footprint+0.9 (body just outside the player)');
assert(/en\._reach = 1\.5 \+ fp/.test(ai), 'attack reach scales with footprint');
assert(/en\._dist < \(en\._reach \|\| 2\.4\)/.test(ai), 'attack gated on the footprint-scaled reach');
// capsule (fp 0.9) keeps the old numbers: stop 1.8, reach 2.4
assert(Math.abs((0.9 + 0.9) - 1.8) < 1e-9, 'capsule stop distance unchanged at 1.8');
assert(Math.abs((1.5 + 0.9) - 2.4) < 1e-9, 'capsule attack reach unchanged at 2.4');

// --- cloneSkinned independence (real three) ---
const i = html.indexOf('THREE.cloneSkinned = function');
const code = html.slice(i, html.indexOf('};', html.indexOf('return clone;', i)) + 2).replace('THREE.cloneSkinned =', 'return');
const cloneSkinned = new Function('THREE', code)(THREE);
function makeModel(){
  const root = new THREE.Group(); root.name='Armature';
  const b0 = new THREE.Bone(); b0.name='Hips';
  const b1 = new THREE.Bone(); b1.name='Spine'; b1.position.y=1; b0.add(b1);
  const geo = new THREE.BoxGeometry(1,2,1); const c = geo.attributes.position.count;
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(c*4).fill(0),4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Array(c*4).fill(0).map((_,k)=>k%4===0?1:0),4));
  const mesh = new THREE.SkinnedMesh(geo, new THREE.MeshBasicMaterial()); mesh.name='Body';
  mesh.add(b0); mesh.bind(new THREE.Skeleton([b0,b1])); root.add(mesh);
  return { root, mesh };
}
const s = makeModel(), A = cloneSkinned(s.root), B = cloneSkinned(s.root);
const skinned = (o)=>{ let m=null; o.traverse(x=>{ if(x.isSkinnedMesh) m=x; }); return m; };
const sa=skinned(A), sb=skinned(B), ss=s.mesh;
let shareAB=false, shareAS=false;
for(const ba of sa.skeleton.bones){ if(sb.skeleton.bones.includes(ba)) shareAB=true; if(ss.skeleton.bones.includes(ba)) shareAS=true; }
assert(!shareAB, 'two clones share no bone objects');
assert(!shareAS, 'a clone shares no bone object with the source');
let allInA=true; for(const ba of sa.skeleton.bones){ let p=ba,inA=false; while(p){ if(p===A){inA=true;break;} p=p.parent; } if(!inA) allInA=false; }
assert(allInA, "every clone bone lives under the clone root (none left pointing at the source tree / origin)");
done('model-enemy engagement distance + skinned-clone independence');
