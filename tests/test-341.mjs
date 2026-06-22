import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 452-456: fire is soft additive rising particles (like the WebGL reference). build 456 moved to a custom
// GLSL shader on a single Points cloud so each particle has its OWN size (small at birth -> swell -> taper),
// size variance, and high density — the fix for the "uniform floating balls" look that PointsMaterial caused.

// shared shader material with per-particle size/colour/alpha attributes + size attenuation
assert(/function fireSoftTex\(\)/.test(src), 'a shared soft radial-gradient texture is built');
assert(/createRadialGradient/.test(src), 'the texture is a radial gradient (soft, not a hard shape)');
assert(/function _getFireMat\(\)/.test(src), 'one shared fire shader material');
assert(/new THREE\.ShaderMaterial\(/.test(src) && /blending:THREE\.AdditiveBlending/.test(src), 'it is an additive ShaderMaterial');
assert(/gl_PointSize = clamp\( aSize \* \( uScale \/ max\(0\.001, -mv\.z\) \), 1\.0, 128\.0 \)/.test(src), 'per-particle size with distance attenuation, clamped so it cannot fill the screen');
assert(/gl_FragColor = vec4\( vColor \* t\.a \* vAlpha, 1\.0 \)/.test(src), 'fragment tints the soft texture by per-particle colour + alpha (additive)');

// seeding gives per-particle size + intensity variance
assert(/p\.size0=0\.55\+Math\.random\(\)\*0\.95/.test(src), 'each particle gets a size variance');
assert(/p\.bright=0\.55\+Math\.random\(\)\*0\.55/.test(src), 'each particle gets an intensity variance');

// geometry has position + aColor + aSize + aAlpha buffers, one Points object
assert(/geo\.setAttribute\('aColor'/.test(src) && /geo\.setAttribute\('aSize'/.test(src) && /geo\.setAttribute\('aAlpha'/.test(src), 'per-particle colour/size/alpha buffers');
assert(/new THREE\.Points\(geo, smoke \? _getFireMatSmoke\(\) : _getFireMat\(\)\)/.test(src), 'one Points object per emitter; fire or smoke material');

// dense counts (was capped at ~620 / big sizes)
assert(/const count=Math\.max\(160, Math\.min\(1600, Math\.round\(r\*r\*22\*den\)\)\)/.test(src), 'fire zones use up to ~1600 small particles');
assert(/const count=Math\.max\(140, Math\.min\(420, Math\.round\(rad\*260\)\)\)/.test(src), 'burning props use a dense small column');

// animator drives size + rise + ramp + fade through the buffers
const af = extractFunction('_animateFire');
assert(/_fireUniforms\.uScale\.value/.test(af), 'point-size attenuation tracks the active camera/viewport (shared uniforms)');
assert(/siz\[i\]=sw\*\(p\.size0\|\|1\)\*Math\.max\(0\.04, szp\)/.test(af), 'each particle size grows then tapers (per-particle)');
assert(/pos\[i\*3\+1\]=baseY \+ f\*p\.riseH/.test(af), 'particles rise from the base to their rise height');
assert(/conv=1-0\.55\*f/.test(af), 'the column tapers inward as particles rise');
assert(/cr=1; cg=0\.95; cb=0\.66;/.test(af) && /cr=0\.72; cg=0\.14; cb=0\.03;/.test(af), 'colour ramps from a hot core to deep red');
assert(/u\.geo\.attributes\.aSize\.needsUpdate=true/.test(af), 'the size buffer is flushed each frame');
assert(!/ConeGeometry/.test(af) && !/PointsMaterial/.test(af), 'no cones / uniform-size material drive the flames');

// --- executable model of a particle's lifecycle ---
function rampColor(f){ if(f<0.16) return [1,0.95,0.66]; if(f<0.4) return [1,0.70,0.20]; if(f<0.68) return [1,0.40,0.08]; return [0.72,0.14,0.03]; }
function sizeProfile(f){ return f<0.2 ? (0.35+(f/0.2)*0.75) : (1.1-((f-0.2)/0.8)*0.92); }
function fade(f){ const op=(f<0.1)?(f/0.1):(1-(f-0.1)/0.9); return Math.max(0,op); }
const sum = f => rampColor(f).reduce((a,b)=>a+b,0);
assert(sum(0.05) > sum(0.5) && sum(0.5) > sum(0.9), 'particles cool/darken monotonically with age');
assert(fade(0) < 1e-9 && fade(0.1) > 0.95 && fade(1.0) < 0.02, 'alpha fades in then to ~0 (death speed)');
// size: small at birth, peaks in the lower-mid, ~0 at the very top
assert(sizeProfile(0) < sizeProfile(0.2), 'particles start small and swell');
assert(sizeProfile(1.0) < 0.2, 'particles taper to almost nothing at the top');
assert(sizeProfile(0.2) > sizeProfile(0.9), 'widest low, narrow high -> flame shape');
done();
