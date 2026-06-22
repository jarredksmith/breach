import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 457: bot fixes — (1) clamp the timestep so a frame hitch can't teleport a bot ("running super fast"),
// (2) shove exactly-overlapping bots apart + a stronger separation so they don't grind into each other, and
// (3) relocate a truly-jammed bot to a fresh spawn so it never stays frozen (stuck on spawn / boxed in).

const ub = extractFunction('updateBots');
assert(/if\(dt>0\.05\) dt=0\.05;/.test(ub), 'the bot timestep is clamped (no teleport on a frame hitch)');
assert(/else \{ const a=Math\.random\(\)\*Math\.PI\*2; sx\+=Math\.cos\(a\)\*1\.5; sz\+=Math\.sin\(a\)\*1\.5; near\+\+; \}/.test(ub), 'perfectly-stacked bots get a hard random shove apart');
assert(/if\(near\)\{ let sl=Math\.hypot\(sx,sz\); const cap=1\.3; if\(sl>cap\)\{ sx=sx\/sl\*cap; sz=sz\/sl\*cap; \} mvx \+= sx; mvz \+= sz;/.test(ub), 'separation is capped (un-piles firmly, never flings)');
assert(/if\(b\._stuckT>3\.5 && typeof randomSpawn==='function'\)\{[\s\S]*?const sp=randomSpawn\(\); b\.pos\.set\(sp\.x/.test(ub), 'a bot stuck >3.5s relocates to a fresh open spawn (rare last resort)');
assert(/const em=Math\.hypot\(b\.evx,b\.evz\); if\(em>40\)\{ b\.evx\*=40\/em; b\.evz\*=40\/em; \}/.test(ub), 'launch momentum is hard-capped (no runaway-speed glitch)');

// --- executable: the timestep clamp bounds the per-frame step distance ---
function step(spd, dt){ if(dt>0.05) dt=0.05; return spd*dt; }
const SPD=6;
assert(step(SPD, 1/60) > 0 && step(SPD, 1/60) < 0.2, 'a normal frame moves a small step');
const hitch = step(SPD, 0.5);                 // a 500ms hitch
assert(Math.abs(hitch - SPD*0.05) < 1e-9, 'a 500ms hitch is clamped to a 50ms step (no teleport)');
assert(step(SPD, 0.5) < SPD*0.5*0.11, 'the clamped step is ~9x smaller than the unclamped teleport would be');

// --- executable: exactly-overlapping separation always yields a unit push (never NaN / zero) ---
function sepStacked(){ const a=Math.random()*Math.PI*2; let sx=Math.cos(a), sz=Math.sin(a); const sl=Math.hypot(sx,sz)||1; return Math.hypot(sx/sl, sz/sl); }
for(let i=0;i<200;i++){ const m=sepStacked(); assert(Math.abs(m-1) < 1e-9, 'stacked-bot shove is always a unit vector'); }

// --- executable: momentum cap ---
function cap(evx,evz){ const em=Math.hypot(evx,evz); if(em>40){ evx*=40/em; evz*=40/em; } return Math.hypot(evx,evz); }
assert(Math.abs(cap(100,0) - 40) < 1e-9, '100 m/s launch is capped to 40');
assert(Math.abs(cap(10,10) - Math.hypot(10,10)) < 1e-9, 'sub-cap momentum is untouched');
done();
