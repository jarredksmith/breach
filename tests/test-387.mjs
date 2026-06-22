import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
// build 512: "Replay" is a real in-place multiplayer rematch over the live connection (no page reload).
// The match ends on a flag, not a disconnect, so peers stay connected; the host re-runs the normal start
// path ({t:'begin'} + startGame) and resets scores. A client's replay asks the host (honored once over).

// ---- executable: hostRematch resets scores for host + clients + bots and broadcasts begin + score ----
const NET = { mode:'host',
  conns:{ 1:{sent:[],send(m){this.sent.push(m);}}, 2:{sent:[],send(m){this.sent.push(m);}} },
  duelScore:{ 0:5, 1:3, 2:7, b1:2, b2:4 } };
const bots = [{id:'b1'},{id:'b2'}];
let started=false;
const hostRematch = new Function('NET','bots','startGame','closeMatchMenu','pvpMode','duelHUD','renderScoreboard',
  'return ('+extractFunction('hostRematch')+')')(
  NET, bots, ()=>{started=true;}, ()=>{}, ()=>true, ()=>{}, ()=>{});
hostRematch();
assert(started, 'hostRematch runs the normal startGame path');
eq(NET.duelScore[0], 0, 'host score reset'); eq(NET.duelScore[1], 0, 'client 1 score reset'); eq(NET.duelScore[2], 0, 'client 2 score reset');
eq(NET.duelScore.b1, 0, 'bot score reset'); eq(NET.duelScore.b2, 0, 'bot score reset');
for(const id of [1,2]){
  const kinds = NET.conns[id].sent.map(m=>m.t);
  assert(kinds.includes('begin'), 'client '+id+' told to begin');
  assert(kinds.includes('score'), 'client '+id+' gets the fresh score');
}

// ---- source: replay routing + host honoring a client request only after the match ends ----
assert(/function hostRematch\(\)\{\s*if\(NET\.mode!=='host'\) return;/.test(src), 'hostRematch is host-only');
assert(/if\(NET\.mode==='host'\)\{ hostRematch\(\); \}[\s\S]*?else if\(NET\.mode==='client'\)\{ sendToPlayer\(0, \{t:'rematchReq'\}\);/.test(src),
  'host replays immediately; client requests a rematch');
assert(/else if\(msg\.t==='rematchReq'\)\{ if\(gameOver\) hostRematch\(\); \}/.test(src),
  'host honors a client rematch request only once the match has ended');
assert(/else if\(msg\.t==='begin'\)\{ NET\.phase='playing'; closeModal\('lobby'\); if\(typeof closeMatchMenu==='function'\) closeMatchMenu\(\); startGame\(\); \}/.test(src),
  'the rematch dismisses the client match menu');

// ---- no page reload / no stale-state stash anymore ----
assert(!/sessionStorage\.setItem\('breach_replay'/.test(src) && !/breach_replay/.test(src), 'the old reload-and-restore replay is gone');

done();
