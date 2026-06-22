// (build 142) Control Point / King of the Hill: a team PvP mode. Hold the centre zone to score; first
// team to the point target wins. Host-authoritative capture + scoring, synced to clients, with a HUD.
import { gameSource, extractFunction, html, done, assert } from './harness.mjs';
const src = gameSource();

assert(/NET\.gameMode==='cp'/.test(extractFunction('pvpMode')), "'cp' is a pvp mode");
assert(/NET\.gameMode==='cp'/.test(extractFunction('teamMode')), "'cp' is team-based");
assert(/cpOwner:-1, cpCap:0, cpCapTeam:-1, cpContested:false, cpScore:\{0:0,1:0\}/.test(src), 'NET carries CP state');

const ucp = extractFunction('updateControlPoint');
assert(/if\(NET\.mode!=='host' \|\| NET\.gameMode!=='cp' \|\| !gameOn\) return;/.test(ucp), 'capture is host-authoritative');
assert(/const contested=inR>0&&inB>0/.test(ucp), 'contested when both teams present');
assert(/NET\.cpCap=Math\.min\(1, NET\.cpCap\+dt\/CP_CAPTURE_TIME\)/.test(ucp), 'progress fills over the capture time');
assert(/NET\.cpScore\[NET\.cpOwner\]=\(NET\.cpScore\[NET\.cpOwner\]\|\|0\)\+CP_SCORE_RATE\*dt/.test(ucp), 'owner scores while held + uncontested');
assert(/NET\.cpScore\[NET\.cpOwner\]>=NET\.killTarget.*broadcastDuelOver\(_cpIdOnTeam\(tm\)\)/.test(ucp), 'reaching the target wins the match');

assert(/function buildCpZone\(\)/.test(src) && /function cpRecolor\(\)/.test(src) && /function cpRender\(\)/.test(src), 'zone build + recolor + render');
assert(/function broadcastCp\(\)/.test(src), 'host broadcasts CP state');
assert(/else if\(msg\.t==='cp'\)\{ NET\.cpOwner=msg\.o;/.test(src), 'clients receive CP state');
assert(/if\(NET\.gameMode!=='cp'\)\{   \/\/ KOTH ends on zone score, not kills/.test(src), 'kills do not end a CP match');

assert(/#cpHud \{ position:fixed/.test(html) && /<div id="cpHud">/.test(html), 'CP HUD element + style');
assert(/id="mpCP"/.test(html) && /id="mpCPScore"/.test(html), 'lobby has a KOTH button + target');
assert(/function startCP\(\)/.test(src) && /hostStart\(genRoomCode\(\), 'cp', n\)/.test(src), 'startCP hosts a cp match');
assert(/if\(cb\) cb\.onclick=startCP;/.test(src), 'KOTH button wired');
assert(/NET\.gameMode==='cp'\)\{ NET\.cpOwner=-1;.*buildCpZone\(\);/.test(src), 'startGame builds + resets the zone for cp');
assert(/updateControlPoint\(dt\); cpRender\(\);/.test(src), 'loop ticks capture + render');
done('control point');
