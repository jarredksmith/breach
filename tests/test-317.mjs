import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 425: spawn region can now be a clicked OUTLINE (polygon) for odd-shaped arenas, not just a circle.
// Top view -> Draw -> click around the arena edge -> MP/bot spawns are confined inside that polygon.

// cfg gained shape + poly
assert(/shape: \(savedLevel && savedLevel\.game && savedLevel\.game\.spawnRegion && savedLevel\.game\.spawnRegion\.shape\) \|\| 'circle'/.test(src), 'spawnRegion has a shape');
assert(/poly: \(savedLevel[\s\S]*?Array\.isArray\(savedLevel\.game\.spawnRegion\.poly\)\)/.test(src), 'spawnRegion has a poly point list');

// point-in-polygon helper + randomSpawn poly branch
const pip = extractFunction('_pointInPoly');
assert(/\(\(zi>pz\)!==\(zj>pz\)\) && \(px < \(xj-xi\)\*\(pz-zi\)\/\(\(zj-zi\)\|\|1e-9\)\+xi\)/.test(pip), 'ray-cast point-in-polygon test');
const rs = extractFunction('randomSpawn');
assert(/const usePoly = sr && sr\.shape==='poly' && sr\.poly && sr\.poly\.length>=3;/.test(rs), 'poly mode needs 3+ points');
assert(/if\(usePoly\)\{ x = pb\.minx[\s\S]*?if\(!_pointInPoly\(x,z,sr\.poly\)\) continue; \}/.test(rs), 'samples the bounding box + rejects points outside the outline');

// click-to-place drawing
assert(/let spawnPolyEdit = false;/.test(src), 'a draw-mode flag exists');
assert(/if\(spawnPolyEdit\)\{[\s\S]*?groundPointUnderPointer\(e\)[\s\S]*?gameCfg\.spawnRegion\.poly\.push\(\{ x:\+gp\.x\.toFixed\(2\), z:\+gp\.z\.toFixed\(2\) \}\)/.test(src), 'clicking the ground in draw mode adds an outline point');
assert(/spawnPolyEdit=false;/.test(src), 'draw mode turns off on play');

// editor controls + marker outline
assert(/⬡ Outline|Draw outline/.test(src), 'editor has the outline shape + draw controls');
const rm = extractFunction('refreshSpawnRegionMarker');
assert(/if\(sr\.shape==='poly'\)\{/.test(rm), 'marker draws the polygon when in poly mode');
assert(/new THREE\.Line\(lg/.test(rm), 'outline rendered as a line loop');

// executable: containment — a concave-ish L-shaped arena
const poly=[{x:0,z:0},{x:10,z:0},{x:10,z:4},{x:4,z:4},{x:4,z:10},{x:0,z:10}];   // L-shape
function pip2(px,pz){ let inside=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const xi=poly[i].x,zi=poly[i].z,xj=poly[j].x,zj=poly[j].z; if(((zi>pz)!==(zj>pz)) && (px<(xj-xi)*(pz-zi)/((zj-zi)||1e-9)+xi)) inside=!inside; } return inside; }
assert(pip2(2,2)===true, 'point in the main arm is inside');
assert(pip2(2,8)===true, 'point in the other arm is inside');
assert(pip2(8,8)===false, 'point in the cut-out corner is OUTSIDE (concave handled)');
assert(pip2(12,2)===false, 'point beyond the edge is outside');
done();
