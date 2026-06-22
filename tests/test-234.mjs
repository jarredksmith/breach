import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 328: (1) cutscene audio gets a Freesound search like every other audio slot,
//            (2) the freesound preview button is a play/stop toggle instead of play-only.

// --- cutscene freesound wiring ---
const ref = extractFunction('renderEditorFields');
const cineI = ref.indexOf('Cutscene audio</b>');
assert(cineI > 0, 'cutscene audio row still present');
const after = ref.slice(cineI, cineI + 2500);
assert(/use it as the cutscene track/.test(after), 'cutscene freesound toggle button exists near the audio row');
assert(/renderFreesoundBrowser\(fsHold, \(\)=>renderEditorFields\(\), \{ label:'Cutscene audio', set:v=>\{ pushUndoSnapshot\(\); CC\.audio=\(v\|\|''\)\.trim\(\); \} \}\)/.test(after), 'browser targets cineCfg.audio with an undo snapshot');
assert(/fsHold\.appendChild\(fsBox\)/.test(after), 'browser box anchors next to its toggle, not the end of the section');
assert(/if\(fsBox\)\{ fsBox\.remove\(\); fsBox=null; fsBtn\.textContent='Search Freesound'; return; \}/.test(after), 'toggle collapses the browser');

// --- preview play/stop toggle ---
const fb = extractFunction('renderFreesoundBrowser');
assert(/_fsAudio && _fsAudioBtn===play && !_fsAudio\.paused/.test(fb), 'clicking the playing card stops it');
const stopBranch = fb.indexOf('_fsAudioBtn===play && !_fsAudio.paused');
const startI = fb.indexOf('_fsAudio.play(); _fsAudioBtn=play;');
assert(stopBranch > 0 && startI > stopBranch, 'stop branch is checked before starting a new preview');
assert(/_fsAudio\.pause\(\); _fsAudio=null; _fsAudioBtn=null; play\.textContent='\\u25b6'/.test(fb), 'stop resets state and the button glyph');
assert(/_fsAudioBtn\.textContent='\\u25b6'/.test(fb), 'starting a new preview resets the previously playing card');
assert(/_fsAudio\.onended=\(\)=>/.test(fb), 'natural end of the clip resets the button');
assert(/play\.textContent='\\u25a0'; play\.title='Stop'/.test(fb), 'playing card shows a stop glyph');
assert(/let fsLastQuery='', fsLastResults=\[\]; let _fsAudio=null, _fsAudioBtn=null;/.test(src), '_fsAudioBtn declared beside _fsAudio');
done();
