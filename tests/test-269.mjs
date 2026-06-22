import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 374 (orig) -> build 486: _STATE_RE is now DERIVED from the ANIM_SLOTS taxonomy, so every slot the
// avatar build loop iterates has a name-pattern by construction — the old "state with no pattern -> crash"
// regression is now structurally impossible. Verify the derivation, that every slot carries a regex, and
// that the resolver still guards defensively.
assert(/const ANIM_SLOTS = \[/.test(src), 'ANIM_SLOTS taxonomy defined');
assert(/const _STATE_RE = \{\}; for\(const _s of ANIM_SLOTS\) _STATE_RE\[_s\.k\] = _s\.re;/.test(src), '_STATE_RE derived from every slot (no missing pattern possible)');
assert(/for\(const _slot of ANIM_SLOTS\)\{ const st = _slot\.k;\s*const clip = _resolveStateClip/.test(src), 'build loop iterates the taxonomy');

// every slot entry carries both a key and a regex
const slotBlock = src.match(/const ANIM_SLOTS = \[([\s\S]*?)\n\];/)[1];
const slotCount = (slotBlock.match(/\bk:'/g)||[]).length;
const reCount   = (slotBlock.match(/\bre:\//g)||[]).length;
assert(slotCount >= 40 && reCount === slotCount, `every one of the ${slotCount} slots has a name-pattern (${reCount} regexes)`);
// legacy nine still present so old saved levels resolve unchanged
for(const k of ['idle','walk','run','attack','aim','crouch','jump','slide','die']) assert(new RegExp("k:'"+k+"'").test(slotBlock), k+' slot present (back-compat)');

// the resolver no longer assumes the key exists (defensive guard kept)
const rs = extractFunction('_resolveStateClip');
assert(/const re = _STATE_RE\[state\]; if\(!re\) return null;/.test(rs), '_resolveStateClip guards a missing pattern');
const rg = extractFunction('_resolveGunClip');
assert(/const re = _GUN_CLIP_RE\[st\]; if\(!re\) return null;/.test(rg), '_resolveGunClip guards a missing pattern too');
done();
