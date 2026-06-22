import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 302: transforms apply to the third-person avatar + editor preview origin marker
const eoa = extractFunction('ensureOwnAvatar');
assert(/cfg\.xoff\|\|0, cfg\.yoff\|\|0, cfg\.zoff\|\|0/.test(eoa), 'avatar key includes x/y/z offsets');
assert(/cfg\.rx\|\|0, cfg\.rz\|\|0/.test(eoa), 'avatar key includes rx/rz');
assert(!/key=\(cfg\.url\|\|''\)\+'\|'\+\(cfg\.tint==null\?'x':cfg\.tint\)\+'\|'\+\(cfg\.scale\|\|1\)\+'\|'\+\(cfg\.face\|\|0\);/.test(eoa), 'old offset-blind key gone');
const epp = extractFunction('ensurePlayerPreview');
assert(/_ensurePreviewOriginMarker\(\)/.test(epp), 'preview adds an origin marker');
const m = extractFunction('_ensurePreviewOriginMarker');
assert(/originMarker/.test(m) && /RingGeometry/.test(m) && /raycast=\(\)=>\{\}/.test(m), 'origin marker is a non-interactive ring at the player origin');
done();
