import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 355: the intro waits for late-starting asset loads even when no loading screen is up.

// --- executable: drive the settle gate with a fake clock + captured rAF ---
const mkGate = (scenario) => {
  let now=0; const frames=[];
  const env = { started:0, pending:scenario.pending, editorOpen:false, gameOn:true, cineActive:false };
  const fn = new Function('performance','requestAnimationFrame','editorOpen','gameOn','_cineActive','_levelAssetsPending','maybeStartIntroCine',
    extractFunction('_startIntroWhenSettled') + '\nreturn _startIntroWhenSettled;');
  const gate = fn({ now:()=>now }, cb=>frames.push(cb), env.editorOpen, env.gameOn, env.cineActive,
    ()=>env.pending, ()=>{ env.started++; });
  gate();
  const step=(ms)=>{ now+=ms; const cb=frames.shift(); if(cb) cb(); };
  return { env, step, framesLeft:()=>frames.length };
};
{ const g = mkGate({ pending:false });           // nothing ever pending: starts after the quiet window
  g.step(16); g.step(300);
  assert(g.env.started===1, 'quiet counters -> intro starts after ~300ms'); }
{ const g = mkGate({ pending:true });            // a late load appears, then clears
  g.step(16); g.step(200); assert(g.env.started===0, 'holds while anything is pending');
  g.env.pending=false; g.step(16); g.step(100); assert(g.env.started===0, 'quiet window restarts after a load');
  g.step(300); assert(g.env.started===1, 'starts once the window completes'); }
{ const g = mkGate({ pending:true });            // never settles: the 15s ceiling fires
  for(let i=0;i<10;i++) g.step(1600);
  assert(g.env.started===1, 'safety ceiling still plays the intro'); }

// --- wiring: the no-loader path routes through the gate; the loader path is untouched ---
const sg = extractFunction('startGame');
assert(/if\(_levelLoaderActive\) _cineIntroPending = true;/.test(sg), 'loader path still defers to reveal');
assert(/else _startIntroWhenSettled\(\);/.test(sg), 'no-loader path waits for the counters to go quiet');
assert(!/else maybeStartIntroCine\(\);/.test(sg), 'no path starts the intro instantly anymore');
assert(/if\(editorOpen \|\| !gameOn \|\| _cineActive\) return;/.test(extractFunction('_startIntroWhenSettled')), 'gate stands down on editor entry / run end / running cine');
done();
