// (build 113) Kill feed: every PvP kill funnels through registerDuelKill on the host, which shows a
// transient "killer > victim" row locally and broadcasts it so all clients see it too. Team-colored.
import { gameSource, html, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

assert(/id="killFeed"/.test(html), 'kill feed element exists');
assert(/#killFeed \.kfRow/.test(html) && /\.kfRow\.kfFade/.test(html), 'feed row + fade CSS');
assert(/#killFeed \{ position:fixed; bottom:104px; left:18px;/.test(html), 'kill feed anchored bottom-left, clear of the scoreboard');

const akf = extractFunction('addKillFeed');
assert(/fe\.appendChild\(row\)/.test(akf), 'appends a row');
assert(/while\(fe\.childElementCount>5\)/.test(akf), 'caps at 5 rows');
assert(/row\.classList\.add\('kfFade'\)/.test(akf) && /removeChild\(row\)/.test(akf), 'rows fade then remove');
assert(/function killName/.test(src) && /function killColor/.test(src), 'name + team-color helpers');

const rk = extractFunction('registerDuelKill');
assert(/addKillFeed\(killerId, victimId\); broadcastFeed\(killerId, victimId\);/.test(rk), 'host shows + broadcasts every kill');
assert(/function broadcastFeed/.test(src), 'broadcastFeed exists');
assert(/else if\(msg\.t==='feed'\)\{ addKillFeed\(msg\.k, msg\.v\); \}/.test(src), 'client renders feed events');
assert(/clearKillFeed\(\);/.test(extractFunction('showDuelResult')), 'feed clears at match end');
done('kill feed');
