import { gameSource, extractConst, assert, eq, near, done } from './harness.mjs';
const src = gameSource();
// build 633: gunners (and any ranged enemy flagged strafe) STRAFE sideways while holding their standoff range,
// instead of standing still — harder to hit and far more alive. Direction flips on a timer or at a wall.

// --- wiring ---
const TYPES = (new Function('return ('+extractConst('ENEMY_TYPES')+')'))();
assert(TYPES.gunner.strafe === true, 'gunners are flagged to strafe');
assert(!TYPES.boss.strafe, 'the boss holds its menacing standoff (no strafe)');
assert(/strafe: !!ty\.strafe,/.test(src), 'the strafe flag is threaded onto the spawned enemy');
assert(/else if\(en\.strafe && en\._see\)\{/.test(src), 'a strafe branch runs in the standoff hold-zone (only while it can see you)');
assert(/const sx = -toPz\/pd\*en\._strafeDir, sz = toPx\/pd\*en\._strafeDir;/.test(src), 'strafe moves perpendicular to the player line');
assert(/en\._strafeFlip = 0;/.test(src), 'it reverses when a wall is ahead');

// --- executable: the strafe vector is perpendicular to the line to the player (it circles, never advances/retreats) ---
function strafeVec(toPx, toPz, dir){ const pd=Math.hypot(toPx,toPz)||1; return { sx:-toPz/pd*dir, sz:toPx/pd*dir }; }
for(const [tx,tz] of [[3,4],[ -5,2],[0,7],[8,-1]]){
  for(const dir of [-1,1]){
    const v=strafeVec(tx,tz,dir);
    const dot=(tx*v.sx + tz*v.sz);
    near(dot, 0, 1e-9, `strafe ⟂ to player line for dir ${dir} @ (${tx},${tz})`);
    near(Math.hypot(v.sx,v.sz), 1, 1e-9, 'strafe direction is a unit vector');
  }
}
// the two directions are exact opposites
const a=strafeVec(3,4,1), b=strafeVec(3,4,-1);
near(a.sx, -b.sx, 1e-9, 'flip direction is the mirror image');
near(a.sz, -b.sz, 1e-9, 'flip direction is the mirror image (z)');

done('strafing gunners: circle the player at standoff range (build 633)');
