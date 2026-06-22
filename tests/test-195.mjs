import { gameSource, html, extractFunction, assert, done } from './harness.mjs';
// build 285: a joining player must be able to reach the character picker from the lobby,
// with the host's roster models actually available there.
assert(/id="lobbyCharBtn"/.test(html), 'lobby modal needs a character button');
const src = gameSource();
// the lobby button opens the picker
assert(/getElementById\('lobbyCharBtn'\);\s*if\(lcb\)\s*lcb\.onclick=openCharPicker/.test(src), 'lobbyCharBtn must open the picker');
// the client populates the roster from the pending level before showing the lobby
const scl = extractFunction('showClientLobby');
assert(/NET\.pendingLevel\.roster\.map\(_sanitizeCharCfg\)/.test(scl), 'client lobby must load host roster from pendingLevel');
// the label reflects a picked roster model and updates both buttons
const ucl = extractFunction('updateCharBtnLabel');
assert(/myRosterIdx>=0 && charRoster\[myRosterIdx\]/.test(ucl), 'label should show the picked roster model');
assert(/\['charBtn','lobbyCharBtn'\]/.test(ucl), 'label should update both the menu and lobby buttons');
// picking a roster model keeps the label in sync
const srs = extractFunction('selectRosterChar');
assert(/updateCharBtnLabel\(\)/.test(srs), 'selectRosterChar should refresh the button label');
done();
