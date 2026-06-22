import { extractFunction, assert, done } from './harness.mjs';
// build 290b: remote avatars must load their own GLB, not bail because it differs from the LOCAL model.
const bav = extractFunction('buildAvatarVisual');
assert(/g\.userData\._loadingUrl = mc\.url;/.test(bav), 'must record a per-group load token');
assert(/if\(g\.userData\._loadingUrl!==mc\.url\) return;/.test(bav), 'stale-load guard must be per-group');
assert(!/if\(playerModelCfg\.url!==mc\.url\) return;/.test(bav), 'old local-only guard must be gone');
done();
