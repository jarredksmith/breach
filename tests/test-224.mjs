import { gameSource, extractFunction, html, assert, done } from './harness.mjs';
const src = gameSource();
// build 315: load a shared campaign from the front menu (no editor needed)
assert(/id="loadCampBtn"/.test(html), 'menu Load-campaign button exists');
assert(/id="menuCampFile"[^>]*type="file"|type="file" id="menuCampFile"/.test(html), 'menu has a hidden campaign file input');

// import now accepts an onDone callback
const imp = extractFunction('_importCampaignFile');
assert(/function _importCampaignFile\(file, onDone\)/.test(src), 'import takes an onDone callback');
assert(/if\(typeof onDone==='function'\)\{ onDone\(\); return; \}/.test(imp), 'onDone short-circuits the editor-panel path');
assert(/if\(typeof renderCampaignPanel==='function'\) renderCampaignPanel\(\)/.test(imp), 'editor path still refreshes its panel when no onDone');
// validation reused (campaign or single-level file)
assert(/Array\.isArray\(data\.levels\)/.test(imp), 'still validates a campaign file');

// the menu wires the button -> file picker -> import -> startCampaign
const bm = extractFunction('bindMenu');
assert(/getElementById\('loadCampBtn'\)/.test(bm) && /getElementById\('menuCampFile'\)/.test(bm), 'bindMenu grabs the button + input');
assert(/lcb\.onclick=\(\)=>lcf\.click\(\)/.test(bm), 'button opens the file picker');
assert(/_importCampaignFile\(f, \(\)=>\{[^]*startCampaign\(\)/.test(bm), 'import then starts the campaign');
assert(/lcf\.value=''/.test(bm), 'input cleared so re-picking the same file re-fires');
done();
