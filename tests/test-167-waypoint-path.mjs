import { gameSource, extractFunction, assert, eq, near, done } from './harness.mjs';
const src = gameSource();
// wiring
assert(/if\(a\.path && a\.path\.length>=2\)\{[\s\S]*?pointAlongPath\(a\.path, a\.ph, a\.mode==='loop'\)/.test(src), 'updater drives position along the path');
assert(/path:\(sx\.path&&sx\.path\.length>=2\)\?sx\.path\.map/.test(src), 'xaApply preserves the path');
assert(/if\(a\.path && a\.path\.length>=2\) e\.xa\.path = a\.path\.map/.test(src), 'path serialized with the prop');
assert(/Add waypoint \(current spot\)/.test(src), 'editor has waypoint authoring');
assert(/function refreshPathPreview\(\)/.test(src) && /_pathPreviewGroup/.test(src), 'editor path markers');
assert(/if\(xa\.path\.length===1 && xa\.mode==='loop'\) xa\.mode='pingpong'/.test(src), 'first waypoint defaults playback to ping-pong');
// pure path math
const fnSrc = extractFunction('pointAlongPath');
const fn = new Function(fnSrc + '\nreturn pointAlongPath;')();
const sq = [[0,0,0],[10,0,0],[10,0,10]];   // two equal 10u segments, total 20
eq(fn(sq,0,false).join(','), '0,0,0', 't=0 -> first point');
eq(fn(sq,1,false).join(','), '10,0,10', 't=1 -> last point (open)');
{ const m=fn(sq,0.5,false); near(m[0],10,1e-6); near(m[2],0,1e-6); }   // halfway = end of first segment = corner
{ const q=fn(sq,0.25,false); near(q[0],5,1e-6); near(q[2],0,1e-6); }   // quarter = middle of first segment
// closed loop adds the return segment (total 20 + 10*sqrt2)
{ const c=fn(sq,1,true); near(c[0],0,1e-4); near(c[2],0,1e-4); }       // t=1 closed wraps back toward start region... last seg ends at p0
assert((src.match(/scene\.remove\(_pathPreviewGroup\); _pathPreviewGroup=null;/g)||[]).length>=2, 'path markers cleared on editor exit (not shown during play)');
done('waypoint-path');
