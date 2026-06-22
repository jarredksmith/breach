import { gameSource, extractFunction, assert, near, done } from './harness.mjs';
const src = gameSource();
// build 329: crouch is physical, not cosmetic. Body height + hurt sphere follow crouchT;
// standing up requires headroom; enemy aim tracks the target instead of a hardcoded world y.

// --- executable: the effective-height helpers ---
const mk = (name) => new Function('PLAYER_HEIGHT','CROUCH_DIP','crouchT','player','EYE',
  extractFunction(name) + `\nreturn ${name}();`);
near(mk('effPlayerHeight')(1.9, 0.8, 0,   null, 1.7), 1.9, 1e-9);   // standing: full body
near(mk('effPlayerHeight')(1.9, 0.8, 1,   null, 1.7), 1.1, 1e-9);   // crouched: shrunk by the camera dip
near(mk('effPlayerHeight')(1.9, 0.8, 0.5, null, 1.7), 1.5, 1e-9);   // mid-transition tracks crouchT
near(mk('effEyeY')(1.9, 0.8, 1, { pos:{ y:1.7 } }, 1.7), 0.9, 1e-9); // crouched eye drops with the camera

// --- KCC capsule retunes with crouch, feet stay anchored ---
const kcc = extractFunction('moveKCC');
assert(/const effH = effPlayerHeight\(\);/.test(kcc), 'moveKCC reads the effective height');
assert(/Math\.abs\(effH - _kccH\) > 0\.02 && playerCollider\.setHalfHeight/.test(kcc), 'capsule resize is thresholded and feature-detected');
assert(/playerCollider\.setHalfHeight\(Math\.max\(0\.05, \(effH - 2\*PLAYER_CAP_R\)\/2\)\); _kccH = effH;/.test(kcc), 'half-height derived from effective body height');
assert(/const half = _kccH\/2;/.test(kcc), 'body centered at feet + currentHeight/2 (feet anchored)');
assert(/_kccH = PLAYER_HEIGHT;/.test(extractFunction('ensurePlayerKCC')), 'fresh capsule starts at full height and is retuned by moveKCC');

// --- classic resolver follows the crouched body ---
assert(/const bandLo = standY \+ STEP, bandHi = standY \+ effPlayerHeight\(\);/.test(src), 'clearAt wall band shrinks while crouched');
assert(/const bandLo = feetY \+ STEP, bandHi = feetY \+ effPlayerHeight\(\);/.test(src), 'insideSolid band shrinks while crouched');
assert(/const HEAD = effPlayerHeight\(\) - EYE;/.test(src), 'head-bump uses the crouched body top');

// --- stand-up requires headroom ---
const gate = src.indexOf('if(!_wantCrouch && crouchT > 0.4)');
assert(gate > 0, 'stand-up clearance gate exists');
const gateSeg = src.slice(gate, gate + 420);
assert(/ceilingAt\(player\.pos\.x, player\.pos\.z, _feetY\) < _feetY \+ PLAYER_HEIGHT \+ 0\.05\) _wantCrouch = true;/.test(gateSeg), 'no headroom -> stay crouched');
assert(/crouching = gameOn && !shopOpen && !editorOpen && _wantCrouch;/.test(gateSeg), 'gate feeds the crouch state');

// --- hurt sphere + enemy aim use the crouched eye ---
assert(/\{ id:NET\.myId, pos:player\.pos, eyeY:effEyeY\(\), local:true,/.test(src), 'local player reports a crouch-adjusted eye');
assert(/pos:rp\.posEye, eyeY:\(rp\.posEye\?rp\.posEye\.y:null\), local:false,/.test(src), 'remote players report their eye too');
assert(/dy=\(\(pl\.eyeY!=null\?pl\.eyeY:\(pl\.pos\.y!=null\?pl\.pos\.y:1\.4\)\)\)-p\.y/.test(src), 'bolt hit sphere centers on the crouched eye');
const fes = extractFunction('fireEnemyShot');
assert(!/1\.3 - from\.y/.test(fes), 'hardcoded world-y aim is gone');
assert(/const aimY = \(\(target\.eyeY!=null\?target\.eyeY:target\.pos\.y\) \|\| 1\.7\) - 0\.4;/.test(fes), 'enemies aim at the target chest, crouch- and terrain-aware');
assert(/aimY - from\.y/.test(fes), 'aim vector uses the computed chest height');
done();
