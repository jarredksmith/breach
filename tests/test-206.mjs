import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 294: the local third-person body must be re-pinned to its seated offset each frame, like every
// other animated avatar, so animation root-motion can't drift it (was breaking zoff + floating + clipping).
assert(/if\(_ownAvatar\)\{ const v=_ownAvatar\.userData\.visual, s=v&&v\.userData\.seat; if\(s\)\{ v\.position\.copy\(s\.p\); v\.quaternion\.copy\(s\.q\); v\.scale\.copy\(s\.s\); \} \}/.test(src),
  'own avatar must be in the per-frame seat re-pin loop');
done();
