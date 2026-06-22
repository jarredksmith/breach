import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
const rcp = extractFunction('renderCampaignPanel');
assert(/let campaignEditIdx=-1;/.test(src), 'campaignEditIdx not declared');
// adding a level names it and clears any edit pointer
assert(/lv\.name='Level '\+\(campaign\.levels\.length\+1\); campaign\.levels\.push\(lv\); campaignEditIdx=-1;/.test(rcp), 'add does not name the level');
// each row has an editable name field bound to lv.name
assert(/nm\.value=\(lv\.name!=null\?lv\.name:\('Level '\+\(i\+1\)\)\)/.test(rcp), 'row missing name field');
assert(/nm\.onchange=\(\)=>\{ lv\.name=nm\.value\.trim\(\)\|\|\('Level '\+\(i\+1\)\); saveCampaign\(\); \}/.test(rcp), 'renaming not persisted');
// Edit re-opens the level into the editor and remembers the slot
assert(/ed\.onclick=\(\)=>\{[\s\S]*?restoreLevel\(campaign\.levels\[i\]\); campaignEditIdx=i;[\s\S]*?renderEditorFields\(\)/.test(rcp), 'Edit does not load the level for editing');
// save-back writes the current level into the edited slot, preserving the name
assert(/if\(campaignEditIdx>=0 && campaign\.levels\[campaignEditIdx\]\)\{/.test(rcp), 'no save-back banner when editing');
assert(/const lv=serializeLevel\(\); lv\.name=_enm; campaign\.levels\[campaignEditIdx\]=lv; saveCampaign\(\)/.test(rcp), 'save-back does not write the slot / keep the name');
// reorder + delete + clear release the edit pointer so save-back can't target the wrong slot
assert((rcp.match(/campaignEditIdx=-1;/g)||[]).length >= 5, 'edit pointer not reset on structural changes');
done();
