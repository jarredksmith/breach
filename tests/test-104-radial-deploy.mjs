// (build 151) Radial deploy menu: hold Tab to open a wheel of buildable props (crate/barrel/ball/cone/
// explosive); aim a wedge with the mouse and click (or release Tab) to spawn it in front of you. Deployed
// props are dynamic so they grab/stack/throw and ride the prop reconciler into co-op (host simulates).
import { gameSource, extractFunction, html, done, assert } from './harness.mjs';
const src = gameSource();

assert(/const RADIAL_ITEMS=\[/.test(src) && /label:'Explosive'\}/.test(src), 'radial item set incl. explosive');
assert(/function openRadial\(\)/.test(src) && /function closeRadial\(deploy\)/.test(src) && /function radialMove\(dx,dy\)/.test(src) && /function deployProp\(src, exp\)/.test(src), 'radial + deploy fns');

const op = extractFunction('openRadial');
assert(/if\(!gameOn \|\| editorOpen \|\| shopOpen \|\| paused \|\| duelDead \|\| radialOpen\) return;/.test(op), 'wheel only opens in live play');

const dp = extractFunction('deployProp');
assert(/if\(.*_deployCD>0\) return; _deployCD=0\.5;/.test(dp), 'deploy has a cooldown');
assert(/spawnProp\(src, \[px, 1\.1, pz, 0,0,0, 0\.9\], \(obj\)=>\{\n    obj\.userData\.runtime = true;[\s\S]*?setPropDynamic\(obj, true\);/.test(dp), 'deploys a dynamic prop in front of the player');
assert(/if\(exp\)\{ obj\.userData\.explosive=true; obj\.userData\.blastRadius=7; obj\.userData\.blastDmg=70; obj\.userData\.impactVel=10; \}/.test(dp), 'explosive option flags the prop');

assert(/if\(e\.code==='Tab'\)\{ if\(!e\.repeat\) openRadial\(\); e\.preventDefault\(\); return; \}/.test(src), 'hold Tab opens the wheel');
assert(/if\(e\.code==='Tab' && radialOpen\) closeRadial\(true\);/.test(src), 'releasing Tab confirms the highlighted wedge');
assert(/if\(radialOpen\)\{ radialMove\(e\.movementX, e\.movementY\); return; \}/.test(src), 'mouse aims the wheel + freezes look');
assert(/if\(radialOpen\)\{ if\(e\.button===0\) closeRadial\(true\); return; \}/.test(src), 'click deploys the highlighted wedge');
assert(/<div id="radial"><div id="radialRing">/.test(html) && /#radial \.radItem\.hot/.test(html), 'radial overlay element + style');
done('radial deploy menu');
