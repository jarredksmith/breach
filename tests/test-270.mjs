import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 375 (orig) -> build 486: the player editor, enemy editor, both option-refresh loops, the avatar
// build loop and the preview row are ALL driven by the single ANIM_SLOTS taxonomy. That makes the original
// invariant — "the engine never plays a state the editor can't map" — hold by construction across the full
// ~50-slot set, not just the old nine.
assert(/_animSlotFolds\(urlHost, 'pAnim'/.test(src), 'player clip editor builds grouped rows from the taxonomy');
assert(/_animSlotFolds\(eHost, 'eAnim'/.test(src), 'enemy clip editor builds grouped rows from the taxonomy');
assert(/function _animSlotFolds\(host, prefix, openGroups, mkRow\)/.test(src), 'shared grouped-fold builder exists');

// build loop + player-refresh + enemy-refresh (+ preview) all iterate ANIM_SLOTS
assert((src.match(/for\(const _slot of ANIM_SLOTS\)\{ const st ?= ?_slot\.k;/g)||[]).length >= 3, 'build + both refresh loops iterate the taxonomy');
assert(/for\(const _slot of ANIM_SLOTS\)\{ const st = _slot\.k;\s*const clip = _resolveStateClip/.test(src), 'avatar build loop iterates the taxonomy');
assert(/'edPlayerClip_'\+st/.test(src) && /'edEnemyClip_'\+st/.test(src), 'both editors key their dropdowns by slot id');

// the taxonomy covers the original nine PLUS the expanded slots the user asked for
for(const k of ['idle','walk','run','attack','aim','crouch','jump','slide','die',
                'sprint','walkBack','strafeL','reload','crouchWalk','standToCrouch',
                'jumpStart','jumpLand','hardLand','fall','meleeLight','dodge','throw',
                'hitFront','hitBack','stagger','knockdown','getup','dieFront','dieBack'])
  assert(new RegExp("k:'"+k+"'").test(src), k+' slot in taxonomy');
done();
