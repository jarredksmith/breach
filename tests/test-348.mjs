import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 462: a separation profile that is FIRM at overlap range (un-piles a packed spawn) but capped so it
// can't fling bots into the surrounding walls.
// build 472: the old spawn "exit-dispersal" band-aid (every fresh bot walked to a shared _botHome point first)
// was REMOVED — once bots path with A*, they all converged efficiently on that identical point and piled up.
// Bots now path straight to their real target on spawn; separation handles the un-piling.

const ub = extractFunction('updateBots');
// (1) the exit-dispersal band-aid is gone
assert(!/_exitInit/.test(ub) && !/_exitT/.test(ub), 'exit-dispersal band-aid fully removed (no _exitT/_exitInit)');
assert(/b\.aiState==='engage' && tgt && hasLOS && dist<Math\.max\(9,b\.prefRange\+3\)/.test(ub) && !/!\(b\._exitT>0\) && b\.aiState==='engage'/.test(ub), 'engage orbit no longer gated on an exit window');
// (2) separation shape + cap
assert(/w=\(d<1\.2\)\?\(1\.5\*\(1\.2-d\)\+0\.2\):\(0\.18\*\(2\.0-d\)\)/.test(ub), 'firm push under 1.2m, gentle 1.2-2m');
assert(/const cap=1\.3; if\(sl>cap\)/.test(ub), 'total separation is capped at 1.3');

// --- executable: the separation profile is strong when overlapping, weak when spaced ---
function w(d){ return (d<1.2) ? (1.5*(1.2-d)+0.2) : (0.18*(2.0-d)); }
assert(w(0.3) > 1.5, 'heavy overlap (0.3m) pushes hard');
assert(w(0.3) > w(1.0), 'closer => stronger');
assert(w(1.0) > w(1.8), 'monotonic falloff through the close band');
assert(w(1.8) < 0.1, 'a bot ~1.8m away barely pushes (no jitter at spacing)');

// --- executable: a pile of overlapping bots gets pushed apart (net outward force is large) ---
function sepForce(neighbours){ // bot at origin
  let sx=0, sz=0, near=0;
  for(const n of neighbours){ const d2=n.x*n.x+n.z*n.z; if(d2<4.0 && d2>1e-4){ const d=Math.sqrt(d2); const ww=w(d); sx+=(-n.x/d)*ww; sz+=(-n.z/d)*ww; near++; } }
  let sl=Math.hypot(sx,sz); const cap=1.3; if(sl>cap){ sx=sx/sl*cap; sz=sz/sl*cap; }
  return Math.hypot(sx,sz);
}
// 3 bots piled right on top (within 0.4m) -> near-cap outward force
const piled = sepForce([{x:0.3,z:0.1},{x:-0.2,z:0.25},{x:0.1,z:-0.3}]);
assert(piled > 1.0, 'a tight pile produces a strong un-pile force');
// bots spaced ~1.7m apart -> almost no force (they hold formation, no flinging)
const spaced = sepForce([{x:1.7,z:0},{x:-1.7,z:0.1}]);
assert(spaced < 0.2, 'well-spaced bots are left alone');
done();
