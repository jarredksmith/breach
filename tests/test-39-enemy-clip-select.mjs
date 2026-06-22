// (build 59) Per-type animation clip selection. A model with multiple baked clips (idle/walk/run...)
// can have one chosen per enemy type; blank = auto-pick. Clip names are discovered on load + listed in the editor.
import { gameSource, extractFunction, done, assert, eq } from './harness.mjs';
const src = gameSource();

// config carries a clip name + a discovered-clips map
assert(/clip:''/.test(/const ENEMY_MODEL0 = [^\n]+/.exec(src)[0]), 'per-type config has a clip field (auto by default)');
assert(/const enemyModelClips = \{\}/.test(src), 'discovered-clips map exists');
assert(/clip: src\.clip\|\|''/.test(src), 'applyEnemyModelData carries the clip');
assert(/clip:m\.clip/.test(src), 'serializeLevel persists the clip');

// buildEnemyVisual records the model clips on load + drives the state machine (legacy clip -> idle)
const bev = extractFunction('buildEnemyVisual');
assert(/enemyModelClips\[body\.userData\.enemyType\] = \(gltf\.animations\|\|\[\]\)\.map\(a=>a\.name\|\|''\)/.test(bev), 'records clip names when a model loads');
assert(/playEnemyStates\(model, gltf, _clipMap\)/.test(bev), 'plays via the state machine');
assert(/if\(mc\.clip && !_clipMap\.idle\) _clipMap\.idle = mc\.clip/.test(bev), 'legacy single clip maps to idle');
assert(/body===previewEnemy && typeof refreshEnemyClipOptions==='function'/.test(bev), 'repopulates the editor list once preview clips are known');

// editor: per-state dropdowns (idle/walk/run/attack) bound to the selected type
assert(/'edEnemyClip_'\+stKey/.test(src), 'editor has per-state clip dropdowns');
assert(/mc\.clips\[stKey\]=sel\.value/.test(src), 'choosing a clip sets that state + re-skins the type');

// --- runnable: playEnemyClip selection (explicit name wins, else idle>walk>run>first) ---
function makeGltf(names){ return { animations: names.map(n=>({ name:n })) }; }
// minimal mixer/action/THREE stand-ins so the real function body runs
const THREEStub = { AnimationMixer: function(){ return { clipAction:(c)=>({ loop:0, play(){ THREEStub._played = c && c.name; } }) }; }, LoopRepeat: 2 };
const run = new Function('THREE','mixers','gltf','clipName', `
  ${extractFunction('playEnemyClip')}
  THREE._played = null; playEnemyClip({userData:{}}, gltf, clipName); return THREE._played;
`);
const go = (names, pick)=> run(THREEStub, [], makeGltf(names), pick);

eq(go(['Idle','Walk','Run'], 'Run'), 'Run', 'explicit pick is honored');
eq(go(['Idle','Walk','Run'], 'Sprint'), 'Idle', 'missing pick falls back to idle');
eq(go(['Walk','Run'], ''), 'Walk', 'no pick + no idle -> walk');
eq(go(['Attack','Run'], ''), 'Run', 'no pick + no idle/walk -> run');
eq(go(['Foo','Bar'], ''), 'Foo', 'no pick + no idle/walk/run -> first clip');
eq(go(['Idle','Walk'], 'Walk'), 'Walk', 'explicit pick of a non-first clip');
done('per-type enemy animation clip selection');
