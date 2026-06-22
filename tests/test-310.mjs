import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 417: crash fix. build 414/415 put the animation controls in a fold whose body `aHost` was declared
// inside `if(sel && animActions.length){...}`. The `else if(sel){...}` no-animations branch still referenced
// `aHost` -> ReferenceError ("aHost is not defined") whenever a prop with NO animation clips was selected.
// The else branch now appends its note to the always-in-scope `animHost`.

// the no-anim branch must NOT reference the if-scoped fold body
const elseAt = src.indexOf('else if(sel){\n        // selected prop has no detected GLB animations');
assert(elseAt>0, 'the no-animations branch exists');
const elseBlock = src.slice(elseAt, elseAt+900);
assert(!/aHost/.test(elseBlock), 'the no-animations branch does NOT reference the if-scoped aHost (the crash)');
assert(/animHost\.appendChild\(ni\);/.test(elseBlock), 'it appends its note to the always-in-scope animHost');

// aHost is only used inside its own block (between its declaration and the else)
const decl = src.indexOf("const aHost = edFold(animHost, 'anim'");
assert(decl>0 && decl<elseAt, 'aHost is declared in the animations branch, before the else');
const before = src.slice(0, decl);
assert(!/\baHost\b/.test(before), 'no aHost reference appears before its declaration');
const after = src.slice(elseAt);
assert(!/\baHost\b/.test(after), 'no aHost reference appears after the else branch begins');
done();
