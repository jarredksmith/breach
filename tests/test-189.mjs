import { gameSource, extractFunction, assert, done } from './harness.mjs';
const rcp = extractFunction('renderCampaignPanel');
// build 278: clicking Edit must re-render the campaign panel, since renderEditorFields() does NOT,
// so the "Save changes to ..." banner (built from campaignEditIdx inside renderCampaignPanel) actually appears.
const editIdx = rcp.indexOf("ed.onclick=");
assert(editIdx !== -1, 'Edit handler not found');
const editHandler = rcp.slice(editIdx, editIdx + 400);
assert(/campaignEditIdx=i;/.test(editHandler), 'Edit handler should set campaignEditIdx');
assert(/renderCampaignPanel\(\)/.test(editHandler), 'Edit handler must re-render the campaign panel so the save banner shows');
// and the banner itself is still gated on campaignEditIdx (regression guard)
assert(/if\(campaignEditIdx>=0 && campaign\.levels\[campaignEditIdx\]\)/.test(rcp), 'save banner gate missing');
assert(/Save changes to/.test(rcp), 'save button text missing');
done();
