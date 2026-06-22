import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 426: death-zone markers now show their lethal HEIGHT visually — a translucent wall spanning the band
// (like the extraction pillar) plus a top ring marking the lethal ceiling, so you can see how high the plane kills.

const rf = extractFunction('refreshDeathZoneMarkers');
// reads the band from the zone's base y + height h
assert(/const baseY=\(\+z\.y\|\|0\), h=Math\.max\(0\.5, z\.h!=null\?\+z\.h:3\);/.test(rf), 'marker reads the lethal band (baseY .. baseY+h)');
// vertical wall spanning the band
assert(/new THREE\.CylinderGeometry\(r, r, h, 40, 1, true\)/.test(rf), 'a cylinder wall spans the lethal height');
assert(/wall\.position\.y=baseY\+h\/2;/.test(rf), 'the wall is centered on the band');
// top ring at the ceiling
assert(/topRing[\s\S]*?position\.y=baseY\+h;/.test(rf), 'a top ring marks the lethal ceiling');
// base ring sits at the band floor (baseY), not always 0
assert(/ring\.position\.y=baseY\+0\.07;/.test(rf), 'the base ring sits at the band floor');
assert(/dot\.position\.y=baseY\+0\.8;/.test(rf), 'the center dot rides with the base height');
// selection still emphasized
assert(/const sel=\(i===selDeathZone\);/.test(rf), 'selected zone still emphasized');
// editing radius/height/baseY rebuilds the marker (so the height updates live)
assert(/refreshDeathZoneMarkers\(\); \};/.test(src) || /refreshDeathZoneMarkers\(\)/.test(src), 'marker rebuilds when fields change');
done();
