// (build 801) Drivable models: auto-detect the wheel meshes + the steered (front) subset from the model's named parts, and
// let the author click a "Detected parts" chip to add it to the matcher + highlight that part in the scene (so they can see
// which is which). Detection tries names (wheel / tyre / tire) first, then geometry (low, chunky, modest parts near the
// base), picks the spin axle from the wheel's thinnest axis, and the front pair from the longer wheelbase axis.
import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
const ad = extractFunction('_autoDetectWheels');

// name-based detection first, geometric fallback second
assert(/for\(const k of \['wheel','tyre','tire'\]\)/.test(ad), 'names are matched against wheel / tyre / tire first');
assert(/const yLow=full\.min\.y \+ fSz\.y\*0\.42/.test(ad) && /if\(mn\/Math\.max\(1e-4,mx\)<0\.28\) return false;/.test(ad), 'geometric fallback keeps low, chunky (non-flat) parts near the base');
// axle = the wheel's thinnest axis; returns a full config object
assert(/const rep=wheelParts\[0\], dims=\[\['x',rep\.sx\],\['y',rep\.sy\],\['z',rep\.sz\]\]\.sort\(\(a,b\)=>a\[1\]-b\[1\]\);\s*\n?\s*const wheelAxis=dims\[0\]\[0\];/.test(ad), 'the spin axle is the wheel’s thinnest axis');
assert(/return \{ wheels, wheelsFront, wheelAxis, found:wheelParts\.length \};/.test(ad), 'returns wheels + front + axle + a count');

// front subset: a 'front'-named subset, else the extreme along the longer wheelbase axis
assert(/if\(wheelParts\.some\(p=>\/front\/i\.test\(p\.name\)\) && !wheelParts\.every\(p=>\/front\/i\.test\(p\.name\)\)\) wheelsFront='front';/.test(ad), 'a front-named subset is used when present');
assert(/const key=spreadZ>=spreadX\?'cz':'cx';/.test(ad), 'otherwise it splits along the longer wheelbase axis');

// --- executable: the two pure heuristics (axle = thinnest axis, front = the low half of the longer axis) ---
{
  const axle = (sx,sy,sz) => [['x',sx],['y',sy],['z',sz]].sort((a,b)=>a[1]-b[1])[0][0];
  eq(axle(0.2, 0.6, 0.6), 'x', 'a wheel thin along X -> X axle');
  eq(axle(0.6, 0.6, 0.2), 'z', 'a wheel thin along Z -> Z axle');
  // front pair along the longer axis
  const wheels=[{name:'a',cx:-1,cz:2},{name:'b',cx:1,cz:2},{name:'c',cx:-1,cz:-2},{name:'d',cx:1,cz:-2}];
  const xs=wheels.map(p=>p.cx), zs=wheels.map(p=>p.cz);
  const spreadX=Math.max(...xs)-Math.min(...xs), spreadZ=Math.max(...zs)-Math.min(...zs);
  const key=spreadZ>=spreadX?'cz':'cx';
  eq(key,'cz','Z is the longer wheelbase axis here');
  const front=wheels.slice().sort((a,b)=>a[key]-b[key]).slice(0,2).map(p=>p.name).sort().join(',');
  eq(front,'c,d','the two wheels at the -Z extreme are the front pair');
}

// --- part highlight: flash a named part's emissive, then restore ---
const fp = extractFunction('_flashModelPart');
assert(/mat\.emissive\.setHex\(0x2f7bff\)/.test(fp) && /saved\.push\(\{ mat, hex:mat\.emissive\.getHex\(\) \}\)/.test(fp), 'flashing stores + overrides the part’s emissive');
assert(/setTimeout\(\(\)=>\{ if\(_partFlash===saved\)\{[\s\S]*?mat\.emissive\.setHex\(r\.hex\)/.test(fp), 'the emissive is restored after the flash');

// --- editor wiring: the Auto-detect button + clickable chips ---
assert(/ad\.onclick=\(\)=>\{ const r=\(typeof _autoDetectWheels==='function'\)\?_autoDetectWheels\(sel\):null;/.test(src), 'the Auto-detect button runs the detector on the selected model');
assert(/V\.wheels=r\.wheels; V\.wheelsFront=r\.wheelsFront; V\.wheelAxis=r\.wheelAxis;/.test(src), 'detection fills the wheel + front + axle fields');
assert(/chip\.onclick=\(ev\)=>\{ if\(typeof _flashModelPart==='function'\) _flashModelPart\(sel, nm\); _addToken\(ev\.shiftKey\?'wheelsFront':'wheels', nm\);/.test(src), 'a part chip highlights the part and adds it to Wheels (Shift = Front)');

done('build 801: auto-detect wheels + click-to-identify model parts');
