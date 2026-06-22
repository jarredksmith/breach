import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 428: the MP spawn region now renders as a TALL volume (like the extraction pillar) so it's easy to see
// and place — a cylinder wall for circle mode, extruded walls for the polygon outline. The spawn RULE is
// unchanged: it's still a footprint ("inside the area = you spawn there, on the surface"); the height is visual.

const rf = extractFunction('refreshSpawnRegionMarker');
assert(/const WALL_H = 8;/.test(rf), 'a visual wall height is defined');
// circle: a pillar wall + a top ring (matches extraction beacon styling)
assert(/new THREE\.CylinderGeometry\(r, r, WALL_H, 48, 1, true\)/.test(rf), 'circle mode draws a tall pillar wall');
assert(/topRing[\s\S]*?position\.set\(cx, by\+WALL_H, cz\)/.test(rf), 'circle mode has a top ring at the volume ceiling');
// poly: extruded vertical walls from each edge + a top outline
assert(/tall walls extruded up from each edge/.test(rf), 'poly mode extrudes walls up from each edge');
assert(/a\.x,ay\+WALL_H,a\.z[\s\S]*?b\.x,by\+WALL_H,b\.z/.test(rf), 'poly walls rise to the wall height per edge');
assert(/top outline so the ceiling/.test(rf), 'poly mode draws the ceiling outline');
// volume sits on the terrain surface at the region
assert(/const r=Math\.max\(1,\+sr\.r\|\|30\); const cx=\+sr\.x\|\|0, cz=\+sr\.z\|\|0, by=_maxTerrainOver\(cx,cz,r\);/.test(rf), 'circle volume rests on the surface');

// the spawn RULE is still a 2D footprint (height is purely visual) — randomSpawn uses point-in-poly / disc, not height
const rs = extractFunction('randomSpawn');
assert(/_pointInPoly\(x,z,sr\.poly\)/.test(rs) && !/WALL_H/.test(rs), 'spawn confinement is still the footprint (no height test) — you spawn on the surface inside the area');
done();
