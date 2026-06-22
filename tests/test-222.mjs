import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 313: campaign interstitial transition card
assert(/function showCampaignInterstitial\(fromName, clearedNum, toIdx, total, onContinue\)\{/.test(src), 'interstitial fn exists');
assert(/let _interActive=false/.test(src), 'interstitial freeze flag declared');
assert(/function _clearInterstitial\(\)\{/.test(src), 'teardown helper exists');
assert(/function _interEsc\(/.test(src), 'name escaper exists (user level names)');

const fn = extractFunction('showCampaignInterstitial');
assert(/safeExitPointerLock/.test(fn), 'releases pointer lock so the button is clickable');
assert(/campaign\.levels\[toIdx\]/.test(fn), 'reads the next level');
assert(/nextLv\.game && nextLv\.game\.objective/.test(fn), 'shows the next objective');
assert(/interGo/.test(fn) && /addEventListener\('keydown', _interKeyGo, true\)/.test(fn), 'continue button + any-key');
assert(/setTimeout\(tick,1000\)/.test(fn), 'auto-advance countdown');
assert(/_clearInterstitial\(\); try\{ onContinue\(\)/.test(fn), 'continue tears down then advances');

// the loop freezes the sim behind the card
assert(/if\(_interActive\)\{ pollGamepad\(dt\); renderScene\(scene,camera\); renderViewmodel\(\); return; \}/.test(src), 'loop freezes behind the card');

// gameWon uses the card instead of the old toast
const gw = extractFunction('gameWon');
assert(/showCampaignInterstitial\(fromName, clearedNum, toIdx, total/.test(gw), 'gameWon shows the card');
assert(/\)=>\{ _campaignLoad\(toIdx\); _restoreLoadout\(carry\); \}/.test(gw), 'card advances + carries loadout');
assert(/gameOn=false;/.test(gw), 'ticks paused while the card is up');
assert(!/flashToast\('LEVEL '\+\(campaignIdx\+1\)\+' \/ '/.test(gw), 'old level toast gone');

// bailing to menu clears a lingering card
assert(/_clearInterstitial\(\);/.test(extractFunction('exitToMenu')), 'exitToMenu clears the card');
done();
