import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 415: the prop sub-section folds (Animation/Lock/Signals/Mechanism/Physics) now use the SAME polished
// accordion structure + CSS classes as the top-level editor sections (World, Enemies, etc.) — edSection /
// edSecHead / edCaret / edSecBody — so every collapsible section looks and behaves identically.

const ef = extractFunction('edFold');
// same classes as the top-level sec() builder
assert(/sec\.className='edSection'\+\(collapsed\?' collapsed':''\)/.test(ef), 'fold root is .edSection (collapsed class toggles visibility)');
assert(/head\.className='edSecHead'/.test(ef), 'header is .edSecHead (letter-spaced tinted bar w/ hover)');
assert(/<span class="edCaret">/.test(ef), 'header has the rotating .edCaret');
assert(/body\.className='edSecBody'/.test(ef), 'body is .edSecBody (consistent padding)');
// collapse toggles the class (CSS hides .edSecBody + rotates caret) — identical to the top-level sections
assert(/sec\.classList\.toggle\('collapsed'\)/.test(ef), 'click toggles the collapsed class, like the World accordions');
// state persists per id
assert(/_edFolds\[id\]=sec\.classList\.contains\('collapsed'\); try\{ localStorage\.setItem\('breach_editor_folds'/.test(ef), 'collapsed state persists per section');
// subtitle still supported, now inside the body
assert(/if\(subtitle\)\{[\s\S]*?body\.appendChild\(sub\); \}/.test(ef), 'optional subtitle renders inside the body');
done();
