import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// waypoint markers can't linger into play
assert(/_pathPreviewGroup && !editorOpen\)\{ scene\.remove\(_pathPreviewGroup\)/.test(src), 'no per-frame waypoint-marker guard in loop');
// level serializes authored audio
const ser = extractFunction('serializeLevel');
assert(/audio:\s*\{\s*musicUrl:/.test(ser), 'serializeLevel missing audio.musicUrl');
assert(/sounds:\s*_sanitizeSounds\(audioSettings\.sounds\)/.test(ser), 'serializeLevel missing sanitized sounds');
// both load paths adopt level.audio
const restore = extractFunction('restoreLevel');
assert(/level\.audio/.test(restore) && /audioSettings\.musicUrl=/.test(restore) && /audioSettings\.sounds=_sanitizeSounds/.test(restore), 'restoreLevel does not adopt level.audio');
const net = extractFunction('loadLevelFromNet');
assert(/level\.audio && NET\.mode!=='client'/.test(net), 'net load missing client guard for audio');
done();
