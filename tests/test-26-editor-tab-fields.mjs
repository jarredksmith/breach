// (build 42) Regression: clicking an editor tab whose target has no `fields` array (e.g. Player start)
// crashed renderEditorFields with "tgt.fields is not iterable". The transform loop must tolerate it,
// and every editor tab must be safe to select.
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();

// the transform-field loop is guarded
assert(/for\(const fld of \(tgt\.fields \|\| \[\]\)\)/.test(src), 'transform loop tolerates a target with no fields');
assert(!/for\(const fld of tgt\.fields\)\{/.test(src), 'the unguarded iteration is gone');

// the field-sync loop only runs over inputs that were actually created (so tgt.state is never touched
// for a state-less tab like Player start)
assert(/for\(const f of editorFieldInputs\)\{\s*const v = tgt\.state\[f\.k\]/.test(src), 'state is only read for fields that exist');

// Player start target intentionally has no fields/state but does have obj()+code(); reset recenters it
assert(/pstart: \{\s*label: 'Player start',\s*isPstart: true,\s*obj\(\)\{ return playerSpawnMarker; \},/.test(src), 'pstart target shape (no fields/state)');
assert(/key==='pstart'\)\{ playerSpawn\.x=0; playerSpawn\.z=0; playerSpawn\.y=0; playerSpawn\.yaw=0; refreshPlayerSpawnMarker\(\); \}/.test(src), 'reset recenters the player start');
done('editor tabs without fields no longer crash renderEditorFields');
