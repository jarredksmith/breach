import { gameSource, html, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 296: player-facing Play Campaign from the main menu
assert(/id="campaignBtn"/.test(html), 'main menu has a Play campaign button');
const bm = extractFunction('bindMenu');
assert(/getElementById\('campaignBtn'\)/.test(bm) && /startCampaign\(\)/.test(bm), 'campaign button starts the campaign');
assert(/campaignActive=false; _campaignComplete=false; startGame\(\)/.test(bm), 'normal Deploy clears campaign state');
// leaving to menu ends a campaign
const etm = extractFunction('exitToMenu');
assert(/campaignActive=false; _campaignComplete=false;/.test(etm), 'exitToMenu clears campaign state');
// end screen retries the current campaign level on death
const bes = extractFunction('bindEndScreen');
assert(/if\(campaignActive\)\{ sb\.textContent='Retry level'; sb\.onclick=\(\)=>_campaignLoad\(campaignIdx\); \}/.test(bes), 'death offers a clean level retry in campaign');
// engine sanity (already present)
assert(/function startCampaign\(\)\{/.test(src) && /campaignIdx < campaign\.levels\.length-1/.test(src), 'campaign advance engine intact');
done();
