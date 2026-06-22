import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 458: the ground footprint ring is editor-only now (it no longer shows under the flames in play), and
// fire zones get a Saturation control so a fire element can be desaturated into grey smoke.

// ring is tagged editor-only + hidden during play
assert(/ring\.userData\.editorOnly=true/.test(src) && /fill\.userData\.editorOnly=true/.test(src), 'the footprint ring + fill are marked editor-only');
assert(/ground:\[ring,fill\]/.test(src), 'the ground meshes are tracked on the emitter');
const uz = extractFunction('updateFireZones');
assert(/if\(g\.userData\.ground\)\{ for\(const m of g\.userData\.ground\) m\.visible=_eo; \}/.test(uz), 'the ground ring shows only while the editor is open');

// saturation: schema + panel + desaturation in the animator
assert(/sat:\(z\.sat!=null\?\+z\.sat:1\)/.test(src), 'saturation defaults to full fire (1)');
assert(/mkN\('Saturation','sat',0,1,0\.05/.test(src), 'panel exposes a Saturation slider');
const af = extractFunction('_animateFire');
assert(/sat=\(u\.sat!=null\?u\.sat:1\)/.test(af), 'the animator reads saturation');
assert(/if\(sat<1\)\{ const L=0\.299\*cr\+0\.587\*cg\+0\.114\*cb; cr=L\+\(cr-L\)\*sat; cg=L\+\(cg-L\)\*sat; cb=L\+\(cb-L\)\*sat; \}/.test(af), 'colour is blended toward its luminance grey by (1 - saturation)');

// --- executable: desaturation maths ---
function desat(r,g,b,sat){ if(sat>=1) return [r,g,b]; const L=0.299*r+0.587*g+0.114*b; return [L+(r-L)*sat, L+(g-L)*sat, L+(b-L)*sat]; }
const fire=[1,0.42,0.1];
const full=desat(fire[0],fire[1],fire[2],1);
assert(full[0]===1 && full[1]===0.42 && full[2]===0.1, 'saturation 1 leaves fire untouched');
const smoke=desat(fire[0],fire[1],fire[2],0);
assert(Math.abs(smoke[0]-smoke[1])<1e-9 && Math.abs(smoke[1]-smoke[2])<1e-9, 'saturation 0 is pure grey (smoke) — all channels equal');
const L=0.299*fire[0]+0.587*fire[1]+0.114*fire[2];
assert(Math.abs(smoke[0]-L)<1e-9, 'the grey equals the colour luminance (brightness preserved)');
const half=desat(fire[0],fire[1],fire[2],0.5);
assert(half[0]>smoke[0] && half[0]<fire[0], 'partial saturation sits between fire and grey');
done();
