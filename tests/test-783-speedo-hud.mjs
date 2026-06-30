// (build 783) The driving speedometer is a movable/resizable HUD element: it joins HUD_ELEMENTS (so the per-element
// size/position/opacity controls + drag-to-move work on it), its CSS reads the --el-speedo vars, and it's force-shown
// while theming the HUD so you can place it without driving.
import { gameSource, html, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();

// registered as a HUD element pointing at #driveHud
assert(/\{ k:'speedo',\s*sel:'#driveHud',\s*label:'Speedometer' \}/.test(src), 'the speedometer is a HUD element (#driveHud)');

// its CSS honours the per-element size/offset/opacity vars (same scheme as the other HUD elements)
assert(/#driveHud \{[^}]*transform:translateX\(-50%\) translate\(var\(--el-speedo-dx,0px\), var\(--el-speedo-dy,0px\)\) scale\(var\(--el-speedo-s,1\)\)/.test(html), 'driveHud transform reads the el-speedo position + scale vars');
assert(/#driveHud \{[^}]*opacity:var\(--el-speedo-op,1\)/.test(html), 'driveHud opacity reads the el-speedo var');

// force-shown + draggable while theming the HUD
assert(/body\.hudPreview #driveHud \{ display: block !important; pointer-events: auto; cursor: move;/.test(html), 'the speedometer is shown + draggable in HUD-preview mode');
assert(/const sh=\(on && typeof _driveHudEl==='function'\)\?_driveHudEl\(\):document\.getElementById\('driveHud'\);/.test(src) && /sh\.dataset\.hudPreview='1'; sh\.style\.display='block';/.test(src), 'entering HUD mode ensures the speedometer exists + shows it');

// the element picks up the saved layout when it is lazily created
assert(/document\.body\.appendChild\(el\);\s*\n?\s*if\(typeof applyHudCfg==='function'\) try\{ applyHudCfg\(\); \}catch\(e\)\{\}/.test(extractFunction('_driveHudEl')), 'creating the speedometer re-applies the saved HUD layout');

done('build 783: speedometer is a movable/resizable HUD element');
