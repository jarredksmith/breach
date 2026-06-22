import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 503: the tactical map gains a mobile way in and touch controls. Tapping the minimap opens it (also a
// desktop shortcut), and the overlay carries close / zoom-/+ / clear-waypoint buttons since touch has no
// wheel, Esc, or right-click. Each control stops pointerdown so a tap on it never starts a pan or drops a
// waypoint underneath.

// ---- minimap tap opens the map (guarded to live play, not while editing the HUD) ----
assert(/miniCanvas\.addEventListener\('pointerdown', \(e\)=>\{ if\(touchEditMode \|\| !gameOn \|\| editorOpen \|\| shopOpen \|\| chatOpen \|\| mapOpen \|\| paused\) return; e\.preventDefault\(\); e\.stopPropagation\(\); openBigMap\(\); \}\)/.test(src),
  'tapping the minimap opens the full map via pointerdown (touch-reliable; guarded; not during HUD editing)');

// ---- touch control buttons exist and are wired ----
assert(/function _mapBtn\(txt, title\)\{/.test(src), 'a touch-button factory exists');
assert(/b\.addEventListener\('pointerdown', e=>e\.stopPropagation\(\)\)/.test(src), 'buttons stop pointerdown so a tap never pans or sets a waypoint under them');
assert(/_mapClose=_mapBtn\('\\u2715','Close map'\);[\s\S]*?_mapClose\.onclick=closeBigMap;/.test(src), 'a close (\u2715) button closes the map');
assert(/_zOut=_mapBtn\('\\u2212','Zoom out'\); _zOut\.onclick=\(\)=>\{ mapZoom=Math\.min\(MAP_ZMAX, mapZoom\*1\.25\); \};/.test(src), 'a zoom-out button widens the view');
assert(/_zIn=_mapBtn\('\+','Zoom in'\); _zIn\.onclick=\(\)=>\{ mapZoom=Math\.max\(MAP_ZMIN, mapZoom\*0\.8\); \};/.test(src), 'a zoom-in button tightens the view');
assert(/_wpClear=_mapBtn\('\\u232b','Clear waypoint'\); _wpClear\.onclick=\(\)=>\{ mapWaypoint=null; \};/.test(src), 'a clear button removes the waypoint (touch substitute for right-click)');

// ---- executable: the zoom-button steps stay within the clamp and invert each other near the middle ----
const MIN=8, MAX=8*1.6*7;   // representative clamp band (MAP_ZMIN .. MAP_ZMAX-ish); only the step math matters here
function zOut(z){ return Math.min(MAX, z*1.25); }
function zIn(z){ return Math.max(MIN, z*0.8); }
{
  let z=40;
  assert(zIn(z) < z && zOut(z) > z, 'in tightens, out widens');
  assert(Math.abs(zOut(zIn(z)) - z) < 1e-9, 'a zoom-in then zoom-out returns to the same level (mid-range)');
  assert(zIn(MIN) === MIN, 'zoom-in cannot go past the inner clamp');
  assert(zOut(MAX) === MAX, 'zoom-out cannot go past the outer clamp');
}

done();
