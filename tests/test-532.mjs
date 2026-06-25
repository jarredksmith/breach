import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 686: when the editor is popped into its own window the panel DOM is MOVED into that window's document.
// Panel sub-renderers that resolved their host via the MAIN document's getElementById came back null and rendered
// blank tabs. They now resolve against the editor's CURRENT document (edDoc()).

assert(/function edDoc\(\)\{ return \(editorEl && editorEl\.ownerDocument\) \|\| document; \}/.test(src), 'edDoc resolves the editor’s current document');

// every panel sub-host now goes through edDoc()
for(const id of ['edBuildMenu','edHud','edBoltFx','edImpactFx','edZonePicker','edWepFxPicker','edTracerFx','edTexInput','edPlayerClip_','edEnemyClip_']){
  assert(new RegExp('edDoc\\(\\)\\.getElementById\\(\''+id).test(src), id+' resolved via edDoc()');
  assert(!new RegExp('document\\.getElementById\\(\''+id).test(src), id+' no longer uses the main document');
}

// the floating + Add button INTENTIONALLY stays in the main window (it adds to the 3D scene), so it keeps document
assert(/document\.getElementById\('edAddFab'\)/.test(src), 'the + Add fab still lives in the main window');

// it is exercised by the popped panel: the move into the popup is what makes ownerDocument differ
assert(/w\.document\.body\.appendChild\(ed\);/.test(src), 'the editor node is moved into the popup');

done('build 686: editor pop-out renders every tab (document-aware host lookups)');
