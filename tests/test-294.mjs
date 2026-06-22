import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 401: the signal "Play anim" clip dropdown lists the TARGET prop's animations (the prop carrying the
// target tag), not the trigger prop's. Before, a trigger with no animations only got a free-text box even when
// the target it pointed at was fully animated.

// it gathers clip names from props carrying the target tag
assert(/const tag = \(s\.target\|\|''\)\.trim\(\);/.test(src), 'reads the signal target tag');
assert(/for\(const o of propModels\)\{ if\(o && o\.userData\.tag===tag && o\.userData\.animClipNames\)\{ for\(const nm of o\.userData\.animClipNames\)\{ if\(nm\) names\.add\(nm\); \} \} \}/.test(src), 'collects clips from every prop with the target tag');
// falls back to this prop's own clips (self-signal), then free text
assert(/if\(!names\.size && sel\.userData\.animClipNames\)\{ for\(const nm of sel\.userData\.animClipNames\)\{ if\(nm\) names\.add\(nm\); \} \}/.test(src), 'falls back to the trigger prop\'s own clips');
assert(/ci\.placeholder=tag\?\('no clips found on /.test(src), 'free-text note tells you the tagged target had no clips');

// changing the target tag re-renders so the dropdown repopulates from the new target
assert(/s\.target=ti\.value\.trim\(\); renderEditorFields\(\);/.test(src), 'editing the target tag refreshes the clip dropdown');

// a clip whose target prop is not loaded/known yet is preserved
assert(/o\.textContent=nm\+' \(other\)'/.test(src) || /o\.textContent=s\.clip\+' \(other\)'/.test(src), 'an unknown chosen clip is preserved as "(other)"');
done();
