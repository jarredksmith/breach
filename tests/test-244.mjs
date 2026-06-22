import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 345: signal counters ("needs N"), Win level action, and run-state reset at deploy.

// --- executable: counter + win semantics ---
const fn = new Function('propModels','xaToggle','broadcastXAnim','broadcastAnim','broadcastUnlock','playPropAnimationOnce','NET','gameWon',
  extractFunction('fireSignals') + '\nreturn fireSignals;');
const mk = (net) => {
  const calls = { xbc:[], won:0 };
  const props = [ { userData:{ tag:'vault', xa:{ on:true, dest:0 }, sigNeed:3 } } ];
  const f = fn(props, o=>{ o.userData.xa.dest = o.userData.xa.dest?0:1; }, i=>calls.xbc.push(i), ()=>{}, ()=>{}, ()=>{}, net||{ mode:'off' }, ()=>calls.won++);
  return { f, props, calls };
};
{ const { f, props, calls } = mk();
  const gen = { userData:{ signals:[{ when:'destroyed', do:'open', target:'vault' }] } };
  f(gen,'destroyed'); f(gen,'destroyed');
  assert(props[0].userData.xa.dest === 0 && calls.xbc.length === 0 && props[0].userData._sigCount === 2, 'two of three signals absorbed, door still shut');
  f(gen,'destroyed');
  assert(props[0].userData.xa.dest === 1 && calls.xbc.length === 1, 'third signal opens it'); }
{ const { f, calls } = mk();
  f({ userData:{ signals:[{ when:'interacted', do:'win' }] } }, 'interacted');
  assert(calls.won === 1, 'win fires with no target, solo'); }
{ const { f, calls } = mk({ mode:'client' });
  f({ userData:{ signals:[{ when:'interacted', do:'win' }] } }, 'interacted');
  assert(calls.won === 0, 'clients never end the level locally'); }

// --- run-state reset at deploy ---
assert(/for\(const o of propModels\)\{ if\(o && o\.userData\)\{ delete o\.userData\._sigCount; delete o\.userData\.unlocked; \} \}/.test(extractFunction('startGame')), 'counters and key-unlocks reset every deploy');

// --- editor + persistence + level check ---
assert(/\['win','Win level'\]/.test(src), 'Win level in the action dropdown');
assert(/nin\.type='number'; nin\.min='1'; nin\.max='20'; nin\.value=sel\.userData\.sigNeed\|\|1;/.test(src), 'Needs-N field on the prop');
assert(/nsp\.innerHTML='<b>Needs<\/b>'/.test(src), 'counter label bolded with a tooltip (build 347)');
assert(/if\(o\.userData\.sigNeed>1\) e\.snd=o\.userData\.sigNeed;/.test(extractFunction('propEntry')), 'sigNeed serialized only when >1');
assert(src.split('if(p.snd>1) obj.userData.sigNeed=+p.snd;').length - 1 === 3, 'restored at all three prop-load sites');
assert(/only Win level and Play cutscene work without one/.test(extractFunction('levelIssues')), 'Level check flags targetless signals (win + cutscene exempt, build 354)');
done();
