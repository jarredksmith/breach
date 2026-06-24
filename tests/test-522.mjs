import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
// build 674/676: the radial build-menu editor gains (1) an always-available per-slot Poly Pizza / Sketchfab
// model search (reusing renderModelSearch) and (2) a prebuilt SVG icon picker. Slots store an icon KEY that the
// wheel/picker resolve through a trusted RADIAL_ICON_SVG map; unknown values fall back to an escaped text glyph.

// --- a prebuilt SVG icon set keyed by name ---
assert(/const RADIAL_ICON_SVG = \{/.test(src), 'RADIAL_ICON_SVG map exists');
assert(/const RADIAL_ICONS = Object\.keys\(RADIAL_ICON_SVG\);/.test(src), 'RADIAL_ICONS is the set of keys');
for(const k of ['box','barrel','sphere','cone','bomb']) assert(new RegExp('\\b'+k+':_RICO\\(').test(src), 'icon "'+k+'" is defined');
// the icons are inline SVG (currentColor stroke), not emoji
assert(/const _RICO = \(inner\)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"/.test(src), 'icons are currentColor SVG');

// --- the wheel renders icons via the safe resolver (and escapes the label) ---
assert(/function radialIconHTML\(icon\)\{/.test(src), 'a radialIconHTML resolver exists');
assert(/if\(RADIAL_ICON_SVG\[icon\]\) return RADIAL_ICON_SVG\[icon\];/.test(src), 'known keys resolve to the trusted SVG');
assert(/return '<span class="radGlyph">'\+_escHtml\(icon\|\|'(?:◆|\\u25c6)'\)\+'<\/span>';/.test(src), 'unknown/legacy icons are HTML-escaped (multiplayer-safe)');
const op = extractFunction('openRadial');
assert(/radialIconHTML\(it\.icon\)/.test(op) && /_escHtml\(it\.label\)/.test(op), 'the wheel uses the resolver + escapes the label');

// --- defaults use icon keys, not raw emoji ---
assert(/label:'Crate',     icon:'crate'/.test(src) && /label:'Explosive', icon:'bomb'/.test(src), 'default slots use SVG icon keys');

// --- the editor: always-on model search + SVG icon picker ---
const panel = extractFunction('renderBuildMenuPanel');
assert(/Custom model — search a library or paste a \.glb URL/.test(panel), 'the model search is always shown (not gated behind the dropdown)');
assert(/renderModelSearch\(sBox, \(m,st\)=>\{[\s\S]*?s\.src=m\.glb; u\.value=m\.glb;/.test(panel), 'picking a result sets the slot src');
assert(/for\(const g of RADIAL_ICONS\)\{[\s\S]*?b\.innerHTML=RADIAL_ICON_SVG\[g\];/.test(panel), 'the picker renders each icon as its SVG');
assert(/b\.onclick=\(\)=>\{ touch\(\); s\.icon=g; setPrev\(\); markIcons\(\); \}/.test(panel), 'clicking an icon stores its key');

// --- sanitize keeps the icon as a (longer) key string ---
const san = extractFunction('_sanitizeRadial');
assert(/s\.icon\.slice\(0,24\)/.test(san), 'icon keys (longer than a glyph) survive sanitize');

done('build 676: radial editor — always-on model search + SVG icon picker');
