import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 303: Player tab shows a live third-person preview framed like the chase cam
assert(/let _charPrevDist = 4\.6, _charPrevInit = false;/.test(src), 'preview orbit state vars');
assert(/editorOpen && editorActive==='player' && previewAvatar\)\{/.test(src), 'Player-tab preview camera branch exists');
assert(/const cl=previewAvatar\.userData\.centerLocal \|\| \{x:0,y:\(EYE-0\.3\),z:0\};/.test(src), 'preview centres on the model, matching the chase cam');
assert(/camera\.position\.set\(pvx - fx\*d, pvy - fy\*d, pvz - fz\*d\)/.test(src), 'camera pulled straight back along view axis (model centre on crosshair)');
assert(/_charPrevDist = Math\.max\(1\.8, Math\.min\(12, _charPrevDist \+ e\.deltaY\*0\.01\)\)/.test(src), 'wheel zooms the preview');
assert(/if\(!\(editorOpen && editorActive==='player'\)\) _charPrevInit=false;/.test(src), 'seed resets when off the Player tab');
// must sit AFTER the free-fly branch so Fly mode still overrides on the Player tab
const fly = src.indexOf("editorOpen && editorFreeFly)");
const prev = src.indexOf("editorActive==='player' && previewAvatar)");
assert(fly>0 && prev>fly, 'free-fly still overrides the preview cam');
done();
