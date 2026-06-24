import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 349: Play anim can name a single clip from the target's GLB.

// --- executable: clip filtering in playPropAnimationOnce ---
const THREE = { LoopRepeat:2201, LoopOnce:2200, LoopPingPong:2202 };
const _propLoopMode = (play)=> play==='pingpong'?THREE.LoopPingPong:(play==='once'?THREE.LoopOnce:THREE.LoopRepeat);
const fn = new Function('SFX','THREE','_propLoopMode', extractFunction('playPropAnimationOnce') + '\nreturn playPropAnimationOnce;');
const act = (name) => { const a={ name, resets:0, plays:0, loop:0 }; a.getClip=()=>({ name }); a.reset=()=>{ a.resets++; return a; }; a.play=()=>{ a.plays++; }; return a; };
const mk = () => { const acts=[act('open'),act('close'),act('idle')]; return { acts, obj:{ userData:{ animActions:acts, animPlay:'once' } } }; };
const f = (obj, clip) => fn({}, THREE, _propLoopMode)(obj, clip);
{ const { acts, obj } = mk(); f(obj);            assert(acts.every(a=>a.plays===1), 'no clip name -> all clips (old behavior intact)'); }
{ const { acts, obj } = mk(); f(obj, 'open');    assert(acts[0].plays===1 && acts[1].plays===0 && acts[2].plays===0, 'named clip plays alone'); }
{ const { acts, obj } = mk(); f(obj, 'tpyo');    assert(acts.every(a=>a.plays===1), 'unknown name falls back to all clips, not silence'); }

// --- the clip rides the whole pipeline ---
assert(/playPropAnimationOnce\(t, s\.clip\); broadcastAnim\(i, s\.clip\);/.test(extractFunction('_applySignalAction')), 'signal anim action passes its clip');
assert(/function broadcastAnim\(i, clip\)\{/.test(src) && (src.match(/\{t:'anim', i, c:clip\|\|undefined\}/g)||[]).length === 2, 'clip in both broadcast paths');
assert((src.match(/playPropAnimationOnce\(o, msg\.c\)/g)||[]).length === 2, 'both net handlers honor the clip');
// editor: field only on anim rows, blank clears
assert(/if\(s\.do==='anim'\)\{/.test(src) && /'clip name \(blank = all clips\)'/.test(src), 'clip field under anim rows');
assert(/if\(v\) s\.clip=v; else delete s\.clip;/.test(src), 'blank input clears the clip');
done();
