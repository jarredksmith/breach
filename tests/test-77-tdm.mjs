// (build 112) Team deathmatch: teams layer on the PvP engine — auto-balanced assignment, no friendly
// fire, team colors, team-aggregated scoring + win, grouped scoreboard, mode-aware result.
import { gameSource, html, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// mode + helpers
assert(/NET\.gameMode==='tdm'/.test(extractFunction('pvpMode')), 'pvpMode includes tdm');
assert(/function teamMode\(\)\{ return NET\.gameMode==='tdm' \|\| NET\.gameMode==='cp'; \}/.test(src), 'teamMode helper');
assert(/function sameTeam\(a,b\)\{ return teamMode\(\) && NET\.teams\[a\]!=null && NET\.teams\[a\]===NET\.teams\[b\]; \}/.test(src), 'sameTeam helper');
assert(/function teamTotal\(tm\)\{/.test(src) && /function assignTeam\(id\)\{/.test(src), 'teamTotal + assignTeam');
assert(/TEAM_NAME=\['RED','BLUE'\]/.test(src), 'team names');

// friendly fire off (shooter + victim)
assert(/if\(tid!=null && sameTeam\(NET\.myId, tid\)\)\{ spark\(hit\.point, 0x7fdcc4\); \}/.test(src), 'shooter skips teammates');
assert(/if\(sameTeam\(from, NET\.myId\)\) return;/.test(extractFunction('applyPvpDamage')), 'victim ignores friendly fire');

// team scoring + win
const rk = extractFunction('registerDuelKill');
assert(/if\(teamMode\(\)\)\{ const tm=NET\.teams\[killerId\]; if\(tm!=null && teamTotal\(tm\) >= NET\.killTarget\) broadcastDuelOver/.test(rk), 'team total triggers the win');
assert(/const wt=teamMode\(\)\?NET\.teams\[winnerId\]:null;/.test(extractFunction('broadcastDuelOver')), 'winner team is broadcast');

// result + hud
const sdr = extractFunction('showDuelResult');
assert(/const win = teamMode\(\) \? \(NET\.team===winnerTeam\)/.test(sdr), 'result keyed by team in tdm');
assert(/TEAM_NAME\[winnerTeam\]\+' TEAM WINS'/.test(src), 'team win subtitle');
assert(/wn\.textContent='TDM  '\+TEAM_NAME\[0\]\+' '\+teamTotal\(0\)/.test(src), 'team HUD line');

// colors
assert(/function applyTeamColors\(\)/.test(src) && /function tintAvatar\(mesh, tm\)/.test(src), 'team color helpers');
assert(/if\(teamMode\(\) && NET\.teams\[id\]!=null\) tintAvatar\(rp\.mesh, NET\.teams\[id\]\)/.test(src), 'new avatars tinted by team');

// host plumbing + client adopt
assert(/NET\.teams = \{0:0\}; NET\.team = 0;/.test(src), 'host inits teams');
assert(/if\(teamMode\(\)\) assignTeam\(conn\._pid\);/.test(src), 'joiners auto-assigned');
assert(/teams:NET\.teams, yourTeam:\(teamMode\(\)\?NET\.teams\[conn\._pid\]:undefined\)/.test(src), 'welcome carries teams');
assert(/if\(teamMode\(\)\)\{ broadcastTeams\(\); applyTeamColors\(\); \}/.test(src), 'host broadcasts teams on join');
assert(/if\(msg\.yourTeam!=null\) NET\.team=msg\.yourTeam;/.test(src), 'client adopts its team');
assert(/else if\(msg\.t==='teams'\)\{ NET\.teams=msg\.tm/.test(src), 'client handles team updates');

// grouped scoreboard + lobby
assert(/if\(tdm\)\{\n    for\(let tm=0; tm<2; tm\+\+\)\{/.test(extractFunction('renderScoreboard')), 'scoreboard groups by team');
assert(/id="mpTDM"/.test(html) && /id="mpTDMKills"/.test(html), 'TDM lobby option');
assert(/hostStart\(genRoomCode\(\), 'tdm', n\)/.test(extractFunction('startTDM')), 'startTDM hosts a tdm room');
assert(/tb\.onclick=startTDM/.test(src), 'TDM button wired');
done('team deathmatch');
