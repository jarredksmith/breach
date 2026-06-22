// (build 136) editorOpen must be declared BEFORE any code that reads it (handlers, switchWeapon, init),
// otherwise a stray read during init throws "Cannot access 'editorOpen' before initialization" (TDZ).
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();
const decl = src.indexOf('let editorOpen = false;');
assert(decl >= 0, 'editorOpen is declared with let exactly once');
assert(src.indexOf('let editorOpen = false;', decl+1) === -1, 'no duplicate editorOpen declaration');
const firstRead = src.indexOf("if(editorOpen");
assert(firstRead >= 0 && decl < firstRead, 'editorOpen is declared before the first place it is read');
assert(src.indexOf('let editorOpen', decl) < src.indexOf('let _editorOpenFlag'), 'editorOpen declared alongside the early TDZ-safe mirror');
done('editorOpen TDZ');
