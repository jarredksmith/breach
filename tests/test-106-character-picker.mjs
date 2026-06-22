// (build 155) Pre-game character picker: a roster of colour characters, selectable from a modal on the
// multiplayer screen, persisted to localStorage, broadcast via the per-player char system, and shown as
// a model-safe coloured feet ring (plus capsule tint) on every avatar.
import { gameSource, html, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

assert(/const CHARACTERS = \[/.test(src) && (src.match(/\{ name:'[^']+', +color:0x[0-9a-fA-F]{6} \}/g)||[]).length>=6, 'roster of >=6 colour characters');
assert(/let myCharIdx = 0;/.test(src) && /localStorage\.getItem\('breach_char'\)/.test(src), 'selection persists to localStorage');
assert(/function addCharRing\(g, color\)\{/.test(src) && /g\.userData\.charRing=m;/.test(src), 'model-safe feet ring helper');

const bav = extractFunction('buildAvatarVisual');
assert(/if\(g\.userData\.charRing\)\{ g\.remove\(g\.userData\.charRing\); g\.userData\.charRing=null; \}/.test(bav), 'old ring cleared on rebuild');
assert(/const _tint = \(mc && mc\.tint!=null\) \? mc\.tint : null;/.test(bav) && /if\(_tint!=null\) addCharRing\(g, _tint\);/.test(bav), 'ring added from the character tint');
assert(/color:\(_tint!=null\?_tint:0x2f7fff\)/.test(bav), 'capsule body tinted to the character colour');

const mcc = extractFunction('myCharCfg');
assert(/tint:\(CHARACTERS\[myCharIdx\]\?CHARACTERS\[myCharIdx\]\.color:null\)/.test(mcc), 'character tint travels in the broadcast config');

assert(/function selectChar\(i\)/.test(src) && /localStorage\.setItem\('breach_char', String\(i\)\)/.test(src) && /if\(NET\.mode!=='off'\) broadcastMyChar\(\)/.test(src), 'selecting persists + rebroadcasts mid-game');
assert(/function renderCharGrid\(\)/.test(src) && /function openCharPicker\(\)/.test(src) && /function updateCharBtnLabel\(\)/.test(src), 'picker UI functions');
assert(/const cb=document\.getElementById\('charBtn'\); if\(cb\) cb\.onclick=openCharPicker;/.test(src), 'menu wires the character button');

// markup / css
assert(/<button id="charBtn"/.test(html), 'CHARACTER button in the multiplayer modal');
assert(/<div id="charPicker" class="modalBack hidden"/.test(html) && /<div id="charGrid"><\/div>/.test(html), 'picker overlay markup');
assert(/\.charCard\{/.test(html) && /\.charSwatch\{/.test(html), 'picker card styling');
done('character picker');
