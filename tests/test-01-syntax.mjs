// All <script> blocks parse; exactly one BUILD_VERSION; no obviously-broken structure.
import vm from 'vm';
import { scriptBlocks, html, done, assert } from './harness.mjs';
for (const [i, b] of scriptBlocks().entries()) {
  try {
    if (b.module) new vm.SourceTextModule(b.body);
    else new Function(b.body);
    assert(true);
  } catch (e) { assert(false, `script block ${i} syntax: ${e.message}`); }
}
const bv = html.match(/const\s+BUILD_VERSION\s*=/g) || [];
assert(bv.length === 1, `exactly one BUILD_VERSION decl (found ${bv.length})`);
done('syntax + script blocks parse');
