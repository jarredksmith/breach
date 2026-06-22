import { html, assert, done } from './harness.mjs';
const src = html;   // this is page MARKUP + CSS, so read from the raw html
// build 416: the Multiplayer modal was one tall single-column scroll with "Join a room" buried at the bottom.
// Now it's a wider card using horizontal space, mode cards in a 2-column grid, and Join moved up to the top.

// wider card + grid layout CSS
assert(/#mpModal \.modalCard\{ max-width:880px; width:100%; \}/.test(src), 'MP modal card is wider (uses horizontal space)');
assert(/#mpModal \.mpModes\{ display:grid; grid-template-columns:1fr 1fr;/.test(src), 'mode cards lay out in a 2-column grid');
assert(/#mpModal \.mpTop\{ display:grid; grid-template-columns:1fr 1fr;/.test(src), 'the top row (join + co-op) is a 2-column grid');
assert(/@media \(max-width:680px\)\{ #mpModal \.mpModes, #mpModal \.mpTop\{ grid-template-columns:1fr; \} \}/.test(src), 'collapses to one column on narrow screens');

// Join a room moved UP — it now appears before the duel/FFA/TDM mode cards
const joinAt = src.indexOf('JOIN A ROOM');
const duelAt = src.indexOf('1 v 1 DUEL');
const topAt = src.indexOf('class="mpTop"');
assert(joinAt>0 && topAt>0 && topAt < joinAt && joinAt < duelAt, 'Join a room sits in the top area, above the host-mode cards');

// the four host modes are inside the .mpModes grid
const modesAt = src.indexOf('class="mpModes"');
assert(modesAt>0 && modesAt < duelAt, 'duel/FFA/TDM live in the modes grid');
assert(/TEAM DEATHMATCH[\s\S]*?grid-column:1 \/ -1|class="mpSection duel" style="grid-column:1 \/ -1"/.test(src), 'TDM/KOTH spans the full width (it has the most controls)');

// every control ID the JS binds to is still present exactly once (layout-only change, no broken handlers)
for(const id of ['mpName','charBtn','mpHost','mpDuel','mpFFA','mpTDM','mpCP','mpKills','mpFFAKills','mpTDMKills','mpCPScore','mpBots','mpBotDiff','mpCode','mpJoin','mpRefresh','mpGames','mpGamesRow','mpStatus']){
  const re = new RegExp('id="'+id+'"','g');
  assert((src.match(re)||[]).length===1, id+' still present exactly once');
}
done();
