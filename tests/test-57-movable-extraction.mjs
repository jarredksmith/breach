// (build 81) The extraction beacon can be placed manually in the editor (gizmo), saved with the level,
// and falls back to auto-placement (opposite the spawn) when no manual spot is set.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// state + helpers
assert(/let extractSpot = null;/.test(src), 'manual extraction spot state exists');
assert(/function extractAutoPos\(\)/.test(src) && /function currentExtractXZ\(\)/.test(src), 'auto + current position helpers exist');
const rf = extractFunction('refreshExtractMarker');
assert(/currentExtractXZ\(\)/.test(rf) && /extractZone\.position\.set/.test(rf), 'refresh positions the beacon at the current spot');
const pe = extractFunction('placeExtraction');
assert(/refreshExtractMarker\(\)/.test(pe) && /extractZone\.visible = true/.test(pe), 'placeExtraction reuses the marker + shows it');

// editor target (a tab) + gizmo wiring
assert(/extract: \{[\s\S]*?isExtract: true[\s\S]*?refreshExtractMarker\(\); return extractZone;/.test(src), 'editor has an Extract target that returns the beacon');
const ssp = extractFunction('setSelPos');
assert(/editorActive==='extract'/.test(ssp) && /extractSpot=\{x,z\}/.test(ssp), 'dragging the gizmo records the manual spot');
const gsp = extractFunction('getSelPos');
assert(/editorActive==='extract'[\s\S]*?extractZone\?extractZone\.position/.test(gsp), 'gizmo reads the beacon position');
const sso = extractFunction('selectedSceneObject');
assert(/editorActive==='extract'[\s\S]*?extractZone\.userData\.ring/.test(sso), 'the ring is the selectable mesh');

// serialize + restore round-trip
assert(/extract: extractSpot \? \{ x: \+extractSpot\.x\.toFixed\(3\), z: \+extractSpot\.z\.toFixed\(3\) \} : null/.test(src), 'manual spot is serialized (null when auto)');
assert(/extractSpot = level\.extract \? \{ x:level\.extract\.x\|\|0, z:level\.extract\.z\|\|0 \} : null;/.test(src), 'manual spot is restored');

// reset returns to auto
assert(/key==='extract'\)\{ extractSpot=null; refreshExtractMarker\(\);/.test(src), 'reset target clears the manual spot (back to auto)');

// editor marker visibility is tied to the extract tab
assert(/extractZone\.visible = \(editorActive==='extract'\)/.test(src), 'beacon shows as an editor marker only on the Extract tab');
// the move gizmo must actually be allowed on the extract tab (translate-only)
const ug = extractFunction('updateGizmo');
assert(/editorActive==='extract'\)/.test(ug), 'gizmo is enabled on the extract tab');
assert(/if\(editorActive==='extract'\) mode='translate'/.test(ug), 'extract uses the move gizmo only');
done('movable extraction point');
