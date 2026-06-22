import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/function showPropLoader\(label\)/.test(src) && /function hidePropLoader\(\)/.test(src), 'centered prop loader helpers exist');
assert(/const async = !isPrimitive\(src\);/.test(src), 'overlay gated to async model loads (not primitives)');
assert(/if\(async\)\{ showPropLoader/.test(src), 'loader shown when adding a model prop');
assert(/const _finish = \(\)=>\{ if\(_done\) return; _done=true; if\(_to\) clearTimeout\(_to\);[\s\S]*?hidePropLoader\(\); \};/.test(src), 'loader hides on finish (success/error/timeout), after a minimum-visible floor');
assert(/_to=setTimeout\(_finish, 60000\)/.test(src), 'safety timeout so the overlay can never stick');
done('prop-loader');
