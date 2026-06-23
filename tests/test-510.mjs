import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 660: two pop-out polish items —
//  1) the quick-add (+) button STAYS in the main window when the editor is popped out (it adds to the 3D
//     scene, which lives in the main window), just re-anchored to the top-right corner;
//  2) Shift+A opens the quick-add menu from the keyboard.

// --- (1) the + stays put, placeFab is popped-aware + exposed ---
assert(/if\(ed\._popWin\)\{ fab\.style\.left=''; fab\.style\.right='14px'; addMenu\.style\.left=''; addMenu\.style\.right='0'; return; \}/.test(src), 'placeFab anchors the + to the main window top-right while popped');
assert(/fab\._place = placeFab;/.test(src), 'placeFab is exposed so the pop-out/re-dock handlers can re-run it');
assert(!/w\.document\.body\.appendChild\(fb\)/.test(src), 'the + is NOT moved into the popup anymore');
assert(/const fb=document\.getElementById\('edAddFab'\); if\(fb && fb\._place\) fb\._place\(\);   \/\/ back beside the docked panel/.test(src), 're-dock restores the +’s normal position');

// --- (2) Shift+A opens the quick-add menu ---
assert(/fab\._openMenu = toggleAddMenu;/.test(src), 'the menu toggler is exposed as fab._openMenu');
assert(/if\(editorOpen && e\.shiftKey && e\.code==='KeyA' && !e\.repeat && !e\.ctrlKey && !e\.metaKey && !e\.altKey\)\{/.test(src), 'Shift+A is handled only while editing (no modifier-combo clashes)');
assert(/const fb=document\.getElementById\('edAddFab'\); if\(fb && fb\._openMenu\) fb\._openMenu\(\);/.test(src), 'Shift+A opens the quick-add menu');
assert(/const tag = \(e\.target && e\.target\.tagName\) \|\| '';\s*\n\s*if\(tag!=='INPUT' && tag!=='TEXTAREA'\)\{[\s\S]*?fb\._openMenu\(\)/.test(src), 'guarded against typing A in a text field');
assert(/fb && fb\._openMenu\) fb\._openMenu\(\);\s*\n\s*keys\['KeyA'\]=false;/.test(src), 'the held A is consumed so it does not also strafe in fly mode');

// --- discoverability ---
assert(/<b>Shift\+A<\/b> add/.test(src), 'the hint line advertises Shift+A');
assert(/id="edAdd" title="Add an object to the level  \(Shift\+A\)"/.test(src), 'the + button tooltip advertises the shortcut');

done('build 660: + stays in main window when popped; Shift+A opens quick-add');
