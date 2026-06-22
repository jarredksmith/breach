import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 372: 'slide' player animation state — plays a dedicated slide clip while sliding on the ground,
// synced across multiplayer. Models without a slide clip fall back to their auto-matched state.

// the canonical player state list now includes slide (between jump and die)
// build 486: clip slots come from the ANIM_SLOTS taxonomy
assert(/for\(const _slot of ANIM_SLOTS\)\{ const st = _slot\.k;/.test(src), 'editor/refresh iterate the ANIM_SLOTS taxonomy');
for(const k of ['slide','aim','crouch']) assert(new RegExp("k:'"+k+"'").test(src), k+' slot exposed');

// local runtime: slide pose is chosen while sliding + grounded, ABOVE the airborne(jump) check,
// BELOW attack/die (so a fired shot or death still wins)
const loop = src;
assert(/else if\(sliding && player\.onGround\) st='slide';/.test(loop), 'slide selected while grounded-sliding'); assert(/else if\(air\) st=air;/.test(loop), 'airborne sub-states below slide (build 488)');
const order = src.indexOf("st='attack'");
const slideAt = src.indexOf("st='slide'");
const airAt = src.indexOf("else if(air) st=air;");
assert(order < slideAt && slideAt < airAt, 'priority: attack > slide > airborne');

// remote: a sliding flag in the packet maps to the slide pose, taking priority over airborne
assert(/if\(rp\.slide\) _st='slide';/.test(src), 'remote players show slide from the synced flag'); assert(/if\(rp\.air\) _st='jump';/.test(src), 'remote jump from the synced airborne flag (build 497: sequential overrides)');

// network: sl flag rides every send site, is relayed, and is read on both receive sites
assert((src.match(/sl:sliding\?1:0/g)||[]).length === 2, 'both local send sites include the slide flag');
assert(/sl:rp\.slide\?1:0/.test(src), 'host relays peer slide flags');
assert(/rp\.slide = !!msg\.sl;/.test(src) && /rp\.slide=!!pl\.sl;/.test(src), 'slide flag read at both receive sites');

// safety: setEnemyAnimState falls back when a clip slot is missing (models without a slide clip still work)
const sa = extractFunction('setEnemyAnimState');
assert(/const key = _stateActionKey\(acts, state\); if\(!key \|\| !acts\[key\]\) return;/.test(sa), 'missing clip -> no-op (keeps the current pose), so slide is optional per model');
done();
