import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
assert(/let cineShowChar=true;/.test(src), 'cineShowChar flag missing');
const sync = extractFunction('_syncCineEditorAvatar');
// shows only in editor, not during an actual shot, gated by the toggle + a real cinematic
assert(/editorOpen && !_cineActive && cineShowChar && \(cineCfg\.on \|\| \(cineCfg\.path && cineCfg\.path\.length\)\)/.test(sync), 'editor avatar show condition wrong');
assert(/if\(!show\)\{ if\(_cineAvatar && _cineAvatar\.visible\) _hideCineAvatar\(\); return; \}/.test(sync), 'editor avatar not hidden when condition is false');
assert(/_showCineAvatar\(\)/.test(sync) && /_cineAvatar\.position\.set\(playerSpawn\.x,/.test(sync), 'editor avatar not built/repositioned at spawn');
// driven from refreshCinePreview before the path early-return
assert(/function refreshCinePreview\(\)\{\s*\n\s*try\{\s*\n\s*_syncCineEditorAvatar\(\);/.test(src), '_syncCineEditorAvatar not called at top of refreshCinePreview');
// per-frame safety hides it leaving the editor (but not during a real cutscene)
assert(/if\(_cineAvatar && _cineAvatar\.visible && !editorOpen && !_cineActive\)\{ _hideCineAvatar\(\); \}/.test(src), 'authoring body can leak into play');
// UI toggle present
assert(/Show character at the player start/.test(src), 'editor toggle missing');
assert(/c2\.onchange=\(\)=>\{ cineShowChar=c2\.checked;/.test(src), 'toggle does not set cineShowChar');
done();
