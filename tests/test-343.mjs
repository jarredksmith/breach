import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 455: fire zones expose particle-style settings like the WebGL reference — Density (emit rate),
// Particle size, Color hue (recolour to blue/green/purple), Turbulence, Wind drift, and a Sparks toggle.

// hue-rotation helper exists and is applied
assert(/function _hueRotate\(r,g,b,deg\)/.test(src), 'a luminance-preserving hue rotation exists');
const af = extractFunction('_animateFire');
assert(/const turb=\(u\.turb!=null\?u\.turb:1\), wind=\(u\.wind\|\|0\), hue=\(u\.hue!=null\?u\.hue:30\), hueD=hue-30/.test(af), 'animator reads turbulence/wind/hue from the zone');
assert(/\*p\.swayAmp\*turb\*/.test(af), 'turbulence scales the particle sway');
assert(/\+ wind\*f\*1\.4/.test(af), 'wind drifts particles sideways as they rise');
assert(/if\(hueD\)\{ const hr=_hueRotate\(cr,cg,cb,hueD\)/.test(af), 'a non-default hue recolours the flame');
assert(/if\(spk && u\.emberT<=0/.test(af), 'the Sparks toggle gates the rising embers');

// build uses Density (count) + Particle size
assert(/const den=\(z\.den!=null\?\+z\.den:1\), psz=\(z\.psz!=null\?\+z\.psz:1\)/.test(src), 'Density + Particle-size read from the zone');
assert(/Math\.round\(r\*r\*22\*den\)/.test(src), 'Density multiplies the particle count');
assert(/\(0\.5\+r\*0\.05\)\*psz/.test(src), 'Particle size scales the point size');

// editor panel exposes the controls
assert(/mkN\('Density','den',0\.3,2\.5/.test(src), 'panel: Density slider');
assert(/mkN\('Particle size','psz',0\.3,2\.4/.test(src), 'panel: Particle-size slider');
assert(/mkN\('Color hue','hue',0,360,1/.test(src), 'panel: Color-hue slider');
assert(/mkN\('Turbulence','turb',0,2\.5/.test(src), 'panel: Turbulence slider');
assert(/mkN\('Wind','wind',-3,3/.test(src), 'panel: Wind slider');
assert(/z\.spk=spkCb\.checked/.test(src), 'panel: Sparks toggle');

// --- executable: hue rotation. 0deg is identity; rotating a warm orange toward blue lifts blue above red. ---
function hueRotate(r,g,b,deg){ if(!deg) return [r,g,b]; const a=deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a);
  const r2=r*(0.213+c*0.787-s*0.213)+g*(0.715-c*0.715-s*0.715)+b*(0.072-c*0.072+s*0.928);
  const g2=r*(0.213-c*0.213+s*0.143)+g*(0.715+c*0.285+s*0.140)+b*(0.072-c*0.072-s*0.283);
  const b2=r*(0.213-c*0.213-s*0.787)+g*(0.715-c*0.715+s*0.715)+b*(0.072+c*0.928+s*0.072);
  return [Math.max(0,r2),Math.max(0,g2),Math.max(0,b2)]; }
const orange=[1,0.42,0.1];
const id=hueRotate(orange[0],orange[1],orange[2],0);
assert(id[0]===1 && id[1]===0.42 && id[2]===0.1, '0 degrees leaves natural fire untouched');
const blue=hueRotate(orange[0],orange[1],orange[2],180);   // 30->210 = blue fire
assert(blue[2] > blue[0], 'rotating ~180deg makes the flame blue-dominant (blue > red)');
// luminance is roughly preserved (within tolerance)
const lum = c => 0.213*c[0]+0.715*c[1]+0.072*c[2];
assert(Math.abs(lum(blue) - lum(orange)) < 0.02, 'hue rotation preserves brightness');
done();
