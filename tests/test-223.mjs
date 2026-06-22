import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 314: the cutscene body shows the character but not its feet identity ring
const fn = extractFunction('_showCineAvatar');
assert(/buildAvatarVisual\(_cineAvatar,/.test(fn), 'cine avatar still built from the shared pipeline');
assert(/_cineAvatar\.userData\.charRing\) _cineAvatar\.userData\.charRing\.visible=false/.test(fn), 'cine avatar ring hidden');
// ring is hidden AFTER the build (build replaces the ring, so the hide must follow it)
const bi = fn.indexOf('buildAvatarVisual(_cineAvatar');
const ri = fn.indexOf('charRing.visible=false');
assert(bi>=0 && ri>bi, 'ring hidden after the avatar is built');
done();
