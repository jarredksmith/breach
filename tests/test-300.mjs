import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 407: (bug) on defeat/match-end a player could get stuck with no way out. Now Esc always opens a match
// menu in multiplayer (even while dead or on the result screen), and (feature) there's a Replay option.

// universal Esc hatch in the main keydown handler
assert(/if\(e\.code==='Escape' && NET\.mode && NET\.mode!=='off' && !editorOpen\)\{[\s\S]*?toggleMatchMenu\(\);/.test(src), 'Esc opens the match menu in multiplayer');

// the match menu works regardless of game state + releases the pointer lock
const tm = extractFunction('toggleMatchMenu');
assert(/_matchMenuOpen = true; safeExitPointerLock\(\);/.test(tm), 'opening the menu frees the pointer lock so buttons are clickable');
assert(/const onResult = \(typeof gameOver!=='undefined'\) && gameOver;/.test(tm), 'detects the result/defeat state');
assert(/if\(!onResult\) mk\('Resume'/.test(tm), 'Resume only when the match is still live');
assert(/mk\('Back to menu'/.test(tm), 'Back to menu is always offered (the escape hatch)');
assert(/mk\(isHost\?'Replay match':'Rejoin \/ replay'/.test(tm), 'Replay option present');

// build 512: replay is a real in-place rematch over the live connection (no reload)
const rp = extractFunction('replayMatch');
assert(/if\(NET\.mode==='host'\)\{ hostRematch\(\); \}/.test(rp), 'host replays in place');
assert(/else if\(NET\.mode==='client'\)\{ sendToPlayer\(0, \{t:'rematchReq'\}\);/.test(rp), 'client asks the host for a rematch');
assert(!/location\.reload/.test(rp), 'replay no longer reloads the page');

// result screen gained a Replay button alongside Back to menu
assert(/<button id="replayBtn">/.test(src) && /rb\.onclick = \(\)=>replayMatch\(\)/.test(src), 'the VICTORY/DEFEAT screen has a Replay button');
assert(/document\.getElementById\('startBtn'\)\.onclick = \(\)=>\{ NET\.mode='off'; NET\.gameMode='coop'; location\.reload\(\); \}/.test(src), 'Back to menu still works from the result screen');

// the host re-runs the normal start path and resets scores; no stale reload-restore remains
assert(/for\(const id in NET\.conns\)\{ try\{ NET\.conns\[id\]\.send\(\{t:'begin'\}\); \}catch\(e\)\{\} \}/.test(src), 'rematch tells every client to begin again');
assert(!/breach_replay/.test(src), 'the reload-and-restore replay is gone');
done();
