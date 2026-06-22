import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 378: 'aim' player animation state — plays while holding right-click (ADS) and NOT shooting,
// standing still. Synced across multiplayer. Distinct from 'attack' (which fires briefly after a shot).

// the state list + auto-match regex include aim
assert(/for\(const _slot of ANIM_SLOTS\)\{ const st = _slot\.k;\s*const clip = _resolveStateClip/.test(src), 'avatar builds an action per taxonomy slot (build 486)');
for(const k of ['aim','crouch']) assert(new RegExp("k:'"+k+"'").test(src), k+' slot present');
assert(/re:\/aim\|ads\|sight\|scope\|ready\/i/.test(src), 'aim auto-matches by clip name (ANIM_SLOTS)');

// LOCAL: aim chosen when ADS held, grounded, ~stationary — and BELOW attack (a shot still shows attack)
assert(/else if\(\(ads\|\|padAds\|\|touchAds\) && _ownSpeed<0\.05\) st='aim';/.test(src), 'local aim pose: ADS held, ~stationary (airborne handled above, build 488)');
const atk = src.indexOf("st='attack'"), aim = src.indexOf("st='aim'"), slide = src.indexOf("st='slide'");
assert(atk < slide && slide < aim, 'priority: attack > slide > aim (firing + sliding win over a static aim pose)');

// REMOTE: rp.ads drives the aim pose for other players, when roughly stationary
assert(/if\(rp\.ads && md<0\.05 && !rp\.crouch\) _st='aim';/.test(src), 'remote players show aim from the synced flag (build 497)');

// network: ad flag rides every send site, is relayed, and is read on both receive sites
assert((src.match(/ad:\(ads\|\|padAds\|\|touchAds\)\?1:0/g)||[]).length === 2, 'both local send sites include the ADS flag');
assert(/ad:rp\.ads\?1:0/.test(src), 'host relays peer ADS flags');
assert(/rp\.ads = !!msg\.ad;/.test(src) && /rp\.ads=!!pl\.ad;/.test(src), 'ADS flag read at both receive sites');

// missing-clip fallback still applies (aim is optional per model)
const sa = extractFunction('setEnemyAnimState');
assert(/if\(!key \|\| !acts\[key\]\) return;/.test(sa), 'a model without an aim clip just keeps its pose');
done();
