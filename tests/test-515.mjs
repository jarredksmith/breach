import { gameSource, html, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();
// build 667: per-element font + opacity, layered onto the per-element size/position/tint (build 666).

// --- sanitize adds font ('' = inherit) + op (0..1) ---
const HUD_EL = [{k:'health',text:true},{k:'ammo',text:true},{k:'score',text:true},{k:'wave',text:true},{k:'minimap'},{k:'crosshair'}];
const _sanitizeHud = new Function('HUD_TOGGLES','HUD_FONTS','HUD_ELEMENTS','DEFAULT_HUD', extractFunction('_sanitizeHud') + '; return _sanitizeHud;')(
  ['minimap','score','wave','ammo','health','crosshair','killfeed'],
  ['Chakra Petch','Orbitron'], HUD_EL,
  { accent:'#38f5b5', health:'#ff4d6d', score:'#ffd166', uiFont:'Chakra Petch', displayFont:'Chakra Petch', shape:'angular', panelOp:1, border:true, hide:{}, el:{} }
);
{
  const d = _sanitizeHud(undefined);
  for(const e of HUD_EL){ eq(d.el[e.k].font,'','no per-element font by default: '+e.k); eq(d.el[e.k].op,1,'full opacity by default: '+e.k); }
  eq(_sanitizeHud({el:{health:{font:'Orbitron'}}}).el.health.font,'Orbitron','a loaded font is kept');
  eq(_sanitizeHud({el:{health:{font:'Comic Sans'}}}).el.health.font,'','an unknown font is dropped to inherit');
  eq(_sanitizeHud({el:{ammo:{op:5}}}).el.ammo.op,1,'opacity clamped high');
  eq(_sanitizeHud({el:{ammo:{op:-1}}}).el.ammo.op,0,'opacity clamped low');
  eq(_sanitizeHud({el:{ammo:{op:0.3}}}).el.ammo.op,0.3,'a mid opacity is kept');
}

// --- apply: opacity var + per-element font on the element (cascades to its number children) ---
const ah = extractFunction('applyHudCfg');
assert(/hud\.style\.setProperty\('--el-'\+e\.k\+'-op', String\(o\.op!=null\?o\.op:1\)\)/.test(ah), 'per-element opacity var set');
assert(/if\(o\.font\)\{ dom\.style\.setProperty\('--el-font', "'"\+o\.font\+"'"\); \} else \{ dom\.style\.removeProperty\('--el-font'\); \}/.test(ah), 'a per-element font sets --el-font on the element (empty -> inherit)');

// --- CSS: elements honour opacity, text elements honour --el-font, numbers fall through --el-font first ---
assert(/#hud #stats     \{[^}]*opacity: var\(--el-health-op,1\);[^}]*font-family: var\(--el-font/.test(html), 'health element honours its opacity + font');
assert(/#hud #minimap   \{[^}]*opacity: var\(--el-minimap-op,1\);/.test(html), 'minimap honours its opacity');
assert(/#hud \.big, #hud #waveNum, #hud #scoreVal, #hud #creditsVal \{ font-family: var\(--el-font, var\(--hud-display-font/.test(html), 'the big numbers pick up a per-element font first');

// --- editor controls ---
const rp = extractFunction('renderHudPanel');
assert(/slider\('Opacity','op',0,1,0\.05,'%'\)/.test(rp), 'an opacity slider exists per element');
assert(/if\(eDef\.text\)\{[\s\S]*?inh\.textContent='\(inherit HUD font\)'/.test(rp), 'a font dropdown shows for text elements (with an inherit option)');

done('build 667: per-element font + opacity');
