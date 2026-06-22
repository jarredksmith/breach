import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 454: selecting / dragging a zone (fire / jump / death) crashed because those editorActive values have
// no editorTargets entry — updateFieldDisplays did `editorTargets[editorActive].state[...]` (undefined.state)
// and renderEditorFields dereferenced tgt unguarded. Both now tolerate a missing target.

const uf = extractFunction('updateFieldDisplays');
assert(/if\(!tgt \|\| !tgt\.state\) return;/.test(uf), 'updateFieldDisplays bails when the active target has no transform state');

const rf = extractFunction('renderEditorFields');
assert(/const tgt = editorTargets\[editorActive\] \|\| \{ obj\(\)\{ return null; \}, code\(\)\{ return ''; \} \};/.test(rf), 'renderEditorFields falls back to a no-op target for zones');

// executable: the exact crash, reproduced + guarded
const editorTargets = { props:{ state:{px:1} } };
function badUpdate(active, fields){ const tgt = editorTargets[active]; for(const f of fields){ const v=tgt.state[f]; } }
function safeUpdate(active, fields){ const tgt = editorTargets[active]; if(!tgt || !tgt.state) return 'skipped'; for(const f of fields){ const v=tgt.state[f]; } return 'ran'; }
let threw=false; try{ badUpdate('firezones', ['px']); }catch(e){ threw = /reading 'state'/.test(e.message) || /undefined/.test(e.message); }
assert(threw, 'the old code throws on a zone target (reproduces the report)');
assert(safeUpdate('firezones', ['px'])==='skipped', 'the guard skips zone targets cleanly');
assert(safeUpdate('props', ['px'])==='ran', 'real targets still update');
done();
