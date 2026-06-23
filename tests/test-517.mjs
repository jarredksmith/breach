import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 669: the canvas-drawn minimap (and full-screen map) now recolour with the per-level HUD accent, so a
// creator's theme reaches the rings + objective markers too — not just the CSS HUD. Priority: a minimap
// per-element tint > the HUD accent > the global theme accent.

for(const fn of ['drawMinimap','drawBigMap']){
  const f = extractFunction(fn);
  assert(/const _mAcc = \(typeof hudCfg!=='undefined' && hudCfg && hudCfg\.el && hudCfg\.el\.minimap && hudCfg\.el\.minimap\.accent\) \? hudCfg\.el\.minimap\.accent\s*\n\s*: \(\(typeof hudCfg!=='undefined' && hudCfg && hudCfg\.accent\) \? hudCfg\.accent : UI_ACCENT\);/.test(f), fn+': accent = minimap tint > HUD accent > global');
  assert(/const _mAccRgb = _hexToRgbTriplet\(_mAcc\);/.test(f), fn+': rgb form derived for rgba() strokes');
}

// minimap uses the local accent for rings + objective markers
const dm = extractFunction('drawMinimap');
assert(/ctx\.strokeStyle = 'rgba\('\+_mAccRgb\+',0\.12\)';/.test(dm), 'minimap range rings use the per-level accent');
assert((dm.match(/blip\(extractPos\.x, extractPos\.z, _mAcc, 4\.2\)/g)||[]).length===2, 'extraction + escort blips use the per-level accent');

// big map uses it for the arena border + objective dot
const bm = extractFunction('drawBigMap');
assert(/ctx\.strokeStyle='rgba\('\+_mAccRgb\+',0\.35\)';/.test(bm), 'big-map arena border uses the per-level accent');
assert(/dot\(extractPos\.x,extractPos\.z,_mAcc,6\)/.test(bm), 'big-map objective dot uses the per-level accent');

// the global theme globals are untouched (still drive the menu/editor + default)
assert(/let UI_ACCENT = '#38f5b5', UI_ACCENT_RGB = '56,245,181';/.test(src), 'the global theme accent globals still exist as the fallback');

done('build 669: minimap + map recolour with the per-level HUD accent');
