// (build 106) The level editor is disabled in 1v1 (duel) so a player can't open it mid-match to change
// settings / cheat. The P key is gated and toggleEditor refuses to OPEN in a duel (closing still works).
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

assert(/if\(e\.code==='KeyP' && gameOn && NET\.gameMode!=='duel'\)\{ toggleEditor\(\); return; \}/.test(src), 'P keybind disabled in duel');
const te = extractFunction('toggleEditor');
assert(/if\(!editorOpen && pvpMode\(\)\)\{[^}]*return; \}/.test(te), 'toggleEditor refuses to open in a pvp match');
// it only blocks OPENING — closing (editorOpen true) is still allowed
assert(/!editorOpen && pvpMode\(\)/.test(te), 'guard is open-only (closing still works)');
done('editor disabled in 1v1');
