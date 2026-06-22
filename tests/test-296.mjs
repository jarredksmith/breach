import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 403: the minimap only plotted single-player/campaign entities (campaign enemies, station, chests,
// coins, objective markers) — so in a multiplayer match it showed an empty dial. Now it also plots remote
// players and bots, team-colored in team modes (TDM/CP) and as foes in FFA.

const dm = extractFunction('drawMinimap');

// plots remote players (skipping the dead) and bots
assert(/if\(typeof NET!=='undefined' && NET\.mode\)\{/.test(dm), 'minimap has a multiplayer branch');
assert(/for\(const id in NET\.players\)\{ const rp=NET\.players\[id\];/.test(dm), 'iterates remote players');
assert(/if\(!rp \|\| !rp\.mesh \|\| \(rp\.hp!=null && rp\.hp<=0\)\) continue;/.test(dm), 'skips dead / mesh-less players');
assert(/for\(const b of bots\)\{ if\(!b \|\| b\.dead\) continue;/.test(dm), 'plots live bots');
assert(/blip\(b\.pos\.x, b\.pos\.z,/.test(dm), 'bot blip uses its position');

// team coloring: friend vs foe in team modes; everyone a foe in FFA
assert(/const isTeam = \(typeof teamMode==='function'\) && teamMode\(\);/.test(dm), 'detects team modes');
assert(/const colorFor = \(tm\)=> isTeam \? \(tm===myTeam \? friend : foe\) : foe;/.test(dm), 'colors by friend/foe vs my team');
assert(/const myTeam = \(NET\.teams && NET\.myId!=null\) \? NET\.teams\[NET\.myId\] : undefined;/.test(dm), 'reads my own team');

// it still draws the single-player stuff (regression guard)
assert(/for\(const en of enemies\) blip\(/.test(dm), 'campaign enemies still plotted');
done();
