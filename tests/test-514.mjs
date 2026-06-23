import { gameSource, html, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
// build 666: per-element HUD control — each HUD element (health/ammo/score/wave/minimap/crosshair) gets its own
// size, X/Y nudge, and optional accent tint, on top of the build-665 theme. Driven by --el-<k>-{s,dx,dy} vars set
// on #hud + a per-element accent override on the element. Serialized inside hudCfg.el.

// --- the element table ---
assert(/const HUD_ELEMENTS = \[/.test(src), 'a HUD_ELEMENTS table exists');
for(const sel of ['#stats','#ammoPanel','#score','#wavePanel','#minimap','#crosshair'])
  assert(new RegExp("sel:'"+sel.replace(/[$.*+?^{}()|[\]\\]/g,'\\$&')+"'").test(src), 'element table covers '+sel);

// --- sanitize clamps size/offsets + validates the tint (executable) ---
const HUD_EL = [{k:'health'},{k:'ammo'},{k:'score'},{k:'wave'},{k:'minimap'},{k:'crosshair'}];
const _sanitizeHud = new Function('HUD_TOGGLES','HUD_FONTS','HUD_ELEMENTS','DEFAULT_HUD', extractFunction('_sanitizeHud') + '; return _sanitizeHud;')(
  ['minimap','score','wave','ammo','health','crosshair','killfeed'],
  ['Chakra Petch','Orbitron'], HUD_EL,
  { accent:'#38f5b5', health:'#ff4d6d', score:'#ffd166', uiFont:'Chakra Petch', displayFont:'Chakra Petch', shape:'angular', panelOp:1, border:true, hide:{}, el:{} }
);
{
  const d = _sanitizeHud(undefined);
  for(const e of HUD_EL){ eq(d.el[e.k].s,1,'default size 1: '+e.k); eq(d.el[e.k].dx,0,'default dx 0: '+e.k); eq(d.el[e.k].accent,'','no tint by default: '+e.k); }
  eq(_sanitizeHud({el:{health:{s:99}}}).el.health.s, 2.5, 'size clamped high');
  eq(_sanitizeHud({el:{health:{s:0.01}}}).el.health.s, 0.4, 'size clamped low');
  eq(_sanitizeHud({el:{ammo:{dx:9999}}}).el.ammo.dx, 400, 'offset clamped');
  eq(_sanitizeHud({el:{ammo:{dx:12.7}}}).el.ammo.dx, 13, 'offset rounded to px');
  eq(_sanitizeHud({el:{score:{accent:'#abc'}}}).el.score.accent, '#abc', 'a valid tint is kept');
  eq(_sanitizeHud({el:{score:{accent:'nope'}}}).el.score.accent, '', 'a bad tint is dropped');
}

// --- apply: per-element vars + accent override on the element ---
const ah = extractFunction('applyHudCfg');
assert(/for\(const e of HUD_ELEMENTS\)\{[\s\S]*?hud\.style\.setProperty\('--el-'\+e\.k\+'-s'/.test(ah), 'per-element size var set');
assert(/hud\.style\.setProperty\('--el-'\+e\.k\+'-dx', \(o\.dx\|\|0\)\+'px'\)/.test(ah), 'per-element X offset var set (px)');
assert(/const dom=document\.querySelector\(e\.sel\);[\s\S]*?dom\.style\.setProperty\('--accent', o\.accent\)/.test(ah), 'a per-element tint overrides --accent on that element');
assert(/dom\.style\.removeProperty\('--accent'\)/.test(ah), 'clearing the tint reverts to the global accent');

// --- CSS consumes the vars with the right anchor per element ---
assert(/#hud #stats     \{ transform: translate\(var\(--el-health-dx,0px\), var\(--el-health-dy,0px\)\) scale\(var\(--el-health-s,1\)\); transform-origin: left bottom;/.test(html), 'health scales from its bottom-left anchor');
assert(/#hud #wavePanel \{ transform: translateX\(-50%\) translate\(var\(--el-wave-dx,0px\)[\s\S]*?transform-origin: center top;/.test(html), 'wave keeps its centering transform');
assert(/#hud #crosshair \{ transform: translate\(-50%,-50%\) translate\(var\(--el-crosshair-dx,0px\)/.test(html), 'crosshair keeps its centering transform');

// --- editor: a per-element picker + controls ---
const rp = extractFunction('renderHudPanel');
assert(/grp\('Per-element'\)/.test(rp), 'the HUD panel has a Per-element group');
assert(/sel\.onchange=\(\)=>\{ _hudElSel=sel\.value; renderHudPanel\(\); \}/.test(rp), 'an element picker switches which element you edit');
assert(/slider\('Size','s'/.test(rp) && /slider\('X offset','dx'/.test(rp) && /slider\('Y offset','dy'/.test(rp), 'size + X/Y offset sliders');
assert(/let _hudElSel = 'health';/.test(src), 'the selected element is tracked');

done('build 666: per-element HUD size / position / tint');
