// (build 107) A custom looping music track can replace the procedural score. Stored per-device in
// audioSettings.musicUrl, routed through the music bus (so the ♪ slider controls it), with co-op sync.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// setting carried + persisted
assert(/musicUrl:\(typeof j\.musicUrl==='string'\?j\.musicUrl:''\)/.test(src), 'loadAudioSettings carries musicUrl');
assert(/musicUrl:''/.test(src), 'default musicUrl');

// playback: custom track loops through the music bus, falls back to procedural on failure
const sm = extractFunction('startMusic');
assert(/const murl=curMusicUrl\(\)/.test(sm), 'startMusic checks for a custom track');
assert(/s\.loop=true; s\.connect\(musicBus\); s\.start\(\); _musicSrc=s/.test(sm), 'custom track loops through the music bus');
assert(/else \{ _startProcMusic\(\); \}/.test(sm), 'falls back to the generated score if it cannot load');
assert(/if\(st==='loading'\) return;/.test(sm), 'waits for the terminal load result before falling back');
assert(/function _startProcMusic\(\)/.test(src), 'procedural music extracted');
const cm = extractFunction('curMusicUrl');
assert(/NET\.musicUrl\) \|\| \(audioSettings && audioSettings\.musicUrl\)/.test(cm), 'co-op clients hear the host track');
const stop = extractFunction('stopMusic');
assert(/if\(_musicSrc\)\{ try\{ _musicSrc\.stop\(\); \}catch\(e\)\{\} _musicSrc=null; \}/.test(stop), 'stopMusic stops the custom track');

// editor input
assert(/_sndRow\('Music track \(loops\)', \(\)=>audioSettings\.musicUrl\|\|'', v=>\{ audioSettings\.musicUrl=v\|\|''; if\(_musicOn\)\{ stopMusic\(\); startMusic\(\); \} \}\)/.test(src), 'editor exposes a music track input');

// co-op sync
assert(/music:audioSettings\.musicUrl/.test(src), 'host shares its music in the welcome');
assert(/if\(msg\.music!=null\) NET\.pendingMusic=msg\.music;/.test(src), 'client stashes the host music');
assert(/NET\.musicUrl=\(typeof NET\.pendingMusic==='string'\?NET\.pendingMusic:''\)/.test(src), 'client adopts the host music for the session');
done('custom music track');
