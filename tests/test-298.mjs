import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 405: player name tags rendered with depthTest:false, so they showed THROUGH walls and props — a
// wallhack that revealed players hiding behind cover. Now they respect depth and get occluded by geometry.

const ns = extractFunction('makeNameSprite');
assert(/depthTest:true/.test(ns), 'name tag respects depth (occluded by walls/props)');
assert(/depthWrite:false/.test(ns), 'but does not write depth (so it does not block other transparents)');
assert(!/depthTest:false/.test(ns), 'no see-through flag remains on the name tag');

// the tag is still a transparent sprite mounted above the avatar
assert(/transparent:true/.test(ns), 'tag stays transparent');
assert(/label\.position\.y=2\.5; g\.add\(label\)/.test(src) || /\.position\.y=2\.5/.test(src), 'tag still sits above the head');

// damage numbers stay depthTest:false on purpose (transient hit feedback, not a positional reveal) — guard it
// wasn't accidentally changed in a way that breaks them
assert(/new THREE\.Sprite\(new THREE\.SpriteMaterial\(\{ transparent:true, depthTest:false, depthWrite:false \}\)\)/.test(src), 'damage numbers intentionally remain see-through (brief feedback)');
done();
