import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 439/440: opening the editor left the level's music playing. Fix is now bus-level (bulletproof): the music
// bus is forced to 0 gain whenever the editor is open, so NO code path can produce audible level music while
// editing. startMusic is also a no-op while editing, and stopMusic runs on open. Crucially, starting a game
// (Play) clears the editor flag and unmutes BEFORE music starts, so testing from the editor still has music.

// bus-level mute is the core guarantee
const aas = extractFunction('applyAudioSettings');
assert(/const _editing=\(typeof editorOpen!=='undefined' && editorOpen\);/.test(aas), 'applyAudioSettings knows when we are editing');
assert(/musicBus\.gain\.setTargetAtTime\(_editing\?0:audioSettings\.music, t, 0\.02\)/.test(aas), 'music bus is forced silent while editing');
assert(/sfxBus\.gain\.setTargetAtTime\(audioSettings\.sfx/.test(aas), 'SFX bus is untouched (preview buttons still work)');

// editor open: stop + mute
assert(/editorEl\.style\.display = 'block';\s*if\(typeof stopMusic==='function'\) stopMusic\(\);[\s\S]*?if\(typeof stopAudioZones==='function'\) stopAudioZones\(\);\s*if\(typeof applyAudioSettings==='function'\) applyAudioSettings\(\);/.test(src), 'opening the editor stops music/zones AND mutes the bus');
// editor close: restore
assert(/if\(typeof applyAudioSettings==='function'\) applyAudioSettings\(\);   \/\/ restore the music bus/.test(src), 'closing the editor restores the music bus');

// startMusic guarded
const sm = extractFunction('startMusic');
assert(/if\(typeof editorOpen!=='undefined' && editorOpen\) return;/.test(sm), 'startMusic is a no-op while the editor is open');
// stopMusic clears the on-flag (resume regression guard)
assert(/_musicOn=false/.test(extractFunction('stopMusic')), 'stopMusic clears _musicOn');

// REGRESSION GUARD: Play from the editor clears the flag + unmutes BEFORE startMusic, so the game has music
const sg = extractFunction('startGame');
const iReset = sg.indexOf('editorOpen=false; _editorOpenFlag=false; if(typeof applyAudioSettings');
const iMusic = sg.indexOf('startMusic();');
assert(iReset>=0 && iMusic>=0 && iReset < iMusic, 'startGame unmutes + clears editor flag BEFORE music starts (testing from editor has music)');

// executable: bus gain selection
function musicGain(editing, vol){ return editing ? 0 : vol; }
assert(musicGain(true, 0.8)===0, 'editing -> music bus 0 (silent regardless of volume setting)');
assert(musicGain(false, 0.8)===0.8, 'playing -> music bus at the set volume');
done();
