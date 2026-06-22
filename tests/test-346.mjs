import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 459: a Smoke toggle per fire zone — switches the particles from additive (glowing fire) to normal
// alpha-blending (a dark, occluding plume), with a dark grey colour ramp and lower opacity so layers build up.

// two shader materials sharing one uniforms object; smoke uses normal (occluding) blending
assert(/function _getFireMat\(\)/.test(src) && /function _getFireMatSmoke\(\)/.test(src), 'separate fire + smoke materials');
assert(/function _fireUni\(\)/.test(src), 'they share one uniforms object (so uScale updates once)');
const fireMat = src.slice(src.indexOf('function _getFireMat()'), src.indexOf('function _getFireMatSmoke()'));
assert(/blending:THREE\.AdditiveBlending/.test(fireMat) && /vColor \* t\.a \* vAlpha, 1\.0/.test(fireMat), 'fire is additive (glow)');
const smkMat = src.slice(src.indexOf('function _getFireMatSmoke()'), src.indexOf('function _getFireMatSmoke()')+700);
assert(/blending:THREE\.NormalBlending/.test(smkMat) && /vec4\( vColor, t\.a \* vAlpha \)/.test(smkMat), 'smoke is alpha-blended (occludes)');

// material is chosen by the zone's smoke flag; flag is serialized
assert(/smoke \? _getFireMatSmoke\(\) : _getFireMat\(\)/.test(src), 'a zone picks fire or smoke material');
assert(/smoke:\(z\.smoke===true\)/.test(src), 'smoke flag migrates/builds');
assert(/smoke:\(z\.smoke===true\?1:0\)/.test(src), 'smoke flag serializes');
assert(/z\.smoke=smkCb\.checked/.test(src), 'panel exposes a Smoke toggle');

// animator: smoke gets a dark ramp + lower (layering) alpha
const af = extractFunction('_animateFire');
assert(/smoke=\(u\.smoke===true\)/.test(af), 'animator reads the smoke flag');
assert(/if\(smoke\)\{ const v=0\.06 \+ 0\.18\*\(1-f\); cr=v\*1\.0; cg=v\*0\.96; cb=v\*0\.92; \}/.test(af), 'smoke uses a dark, faintly-warm grey ramp that darkens as it rises');
assert(/alp\[i\]=Math\.max\(0, op\)\*\(smoke\?0\.5:0\.9\)\*\(p\.bright\|\|0\.8\)/.test(af), 'smoke is more transparent so overlapping particles occlude into a plume');

// --- executable: smoke colour darkens with height; fire stays bright ---
function smokeV(f){ return 0.06 + 0.18*(1-f); }
assert(smokeV(0) > smokeV(1), 'smoke is lighter at the base, darker as it rises');
assert(smokeV(0) <= 0.24 && smokeV(1) >= 0.06, 'smoke stays dark (never a bright glow)');
done();
