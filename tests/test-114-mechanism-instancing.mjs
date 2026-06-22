// (build 163) Bugfix: animated mechanisms made from primitive shapes were getting baked into an
// InstancedMesh during play (static matrix), so their motion was invisible. Exclude xa props from instancing.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const e = extractFunction('instanceEligible');
assert(/!\(o\.userData\.xa && o\.userData\.xa\.on\)/.test(e), 'animated mechanisms are excluded from instancing');
done('mechanism instancing fix');
