import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 704: placed pickups (incl. inventory items) are now click-selectable in the editor, and their transform
// panel gives finer height control. The floating model has raycast disabled (shots pass through), so a hidden
// hitbox makes the whole pickup clickable; clicking jumps to the Pickups panel; the readouts are editable.

// --- an invisible, raycastable hitbox is added to every editor pickup marker ---
const rp = extractFunction('refreshPickupMarkers');
assert(/new THREE\.Mesh\(new THREE\.CylinderGeometry\(1\.05,1\.05,2\.6,10\), new THREE\.MeshBasicMaterial\(\{ visible:false \}\)\)/.test(rp), 'a hidden cylinder hitbox is built per marker');
assert(/hit\.userData\.pickHit=true; g\.add\(hit\);/.test(rp), 'the hitbox is parented to the marker group so the raycast root resolves to the pickup');

// --- the scene-pick handler resolves a hitbox/model hit to the pickup index (walks parents to the marker) ---
assert(/const ki = pickupMarkers\.indexOf\(root\);\s*if\(ki>=0\)\{ picked='pickups'; selPickup=ki; break; \}/.test(src), 'a hit on the pickup (hitbox/model/disc) selects it');

// --- clicking a pickup surfaces the Pickups panel + gizmo ---
assert(/if\(picked==='pickups'\)\{[^]*editorActive='pickups';/.test(src), 'selecting a pickup sets the pickups tab active');
assert(/if\(typeof setEditorMode==='function' && editorMode!=='rules'\) setEditorMode\('rules', true\);/.test(src), 'it jumps to the Gameplay (rules) tab so the Pickups controls are visible');
assert(/if\(picked==='pickups'\)\{[^]*if\(typeof updateGizmo==='function'\) updateGizmo\(\);/.test(src), 'the move gizmo attaches on select');

// --- finer transform control: editable number boxes with an independent fine step ---
const px = extractFunction('_pickupXformPanel');
assert(/const num=\(label, get, mn, mx, st, set, nstep\)=>\{ const fine=\(nstep!=null\?nstep:st\);/.test(px), 'the transform helper takes a separate fine step');
assert(/const v=document\.createElement\('input'\); v\.type='number'; v\.min=mn; v\.max=mx; v\.step=fine;/.test(px), 'the value readout is an editable number input (not a static label)');
assert(/v\.onchange=\(\)=>apply\(parseFloat\(v\.value\)\|\|0, true\);/.test(px), 'typing a value applies it');
assert(/num\('Height \(Y\)', \(\)=>\(\+sp\.y\|\|0\), -10, 20, 0\.1, v=>sp\.y=v, 0\.01\);/.test(px), 'height gets a fine 0.01 step for precise placement');
assert(/apply=\(val, fromBox\)=>\{ val=Math\.max\(mn, Math\.min\(mx, val\)\);/.test(px), 'typed values are clamped to range');

done('build 704: placed pickups are click-selectable + have finer height control');
