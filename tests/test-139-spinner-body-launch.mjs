// (build 196) Launch now fires when a moving prop's box vertically overlaps the actor's BODY column, not
// only when the feet rest on the top. This makes a spinning bar that sweeps into you at chest height fling
// you — previously only the trebuchet "stand on top" case worked. Enemies also got a wider launch reach so
// their own wall-avoidance can't park them just outside it. Ride (slow platform) still only when on top.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

for(const [fn, H] of [['_xaCarry','1.85'],['_xaCarryBot','1.8']]){
  const f = extractFunction(fn);
  assert(new RegExp('const bodyHit = !\\(b\\.max\\.y\\+lift < feet \\|\\| b\\.min\\.y-lift > feet\\+'+H+'\\);').test(f), fn+' flings on body-column overlap');
  assert(/if\(!onTop && !bodyHit\) return;/.test(f), fn+' eligibility = on-top OR body hit');
  assert(/\} else if\(onTop\)\{/.test(f), fn+' rides only when standing on top');
}

const en = extractFunction('_xaCarryEnemy');
assert(/if\(b\.max\.y\+lift < feet \|\| b\.min\.y-lift > feet\+2\.0\) return;/.test(en), 'enemy flings on body-column overlap');
assert(/const R=\(en\.mesh\.userData\.footprint\|\|0\.6\)\+0\.5/.test(en), 'enemy launch reach scales past its avoidance footprint');

// slow contact sweeps the character along its motion instead of being a wall
assert(/\} else if\(bodyHit\)\{\s*\n\s*player\.pos\.x\+=mvx; player\.pos\.z\+=mvz;/.test(src), 'player swept along by a slow mover');
assert(/\} else if\(bodyHit\)\{\s*\n\s*bot\.pos\.x\+=mvx; bot\.pos\.z\+=mvz;/.test(src), 'bot swept along by a slow mover');
assert(/\} else \{\s*\n\s*en\.mesh\.position\.x\+=mvx; en\.mesh\.position\.z\+=mvz;/.test(src), 'enemy swept along by a slow mover');

// a spinner launches uniformly: the launch borrows the prop's PEAK surface speed so the pivot/centre flings too
assert(/function _xaPeakSpeed\(o, prevP, prevQ, b, dt\)/.test(src), 'peak-speed helper exists');
assert(/const _peakSp = _xaPeakSpeed\(o, _xaPrevP, _xaPrevQ, _xaOldBox, dt\);/.test(src), 'updateXAnim computes peak speed per prop');
assert((src.match(/sp=Math\.max\(localSp, \(peakSp\|\|0\)\*0\.7\)/g)||[]).length===3, 'all three actors borrow peak speed for the launch');

done();
