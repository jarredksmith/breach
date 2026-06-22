// (build 87) Both end screens (win + death) offer "Return to home" next to Redeploy, wired to exitToMenu.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();
const wins = src.match(/id="homeBtn" class="secBtn"[^>]*>⌂ Return to home</g) || [];
assert(wins.length===2, 'both end screens have a Return-to-home button (got '+wins.length+')');
const be = extractFunction('bindEndScreen');
assert(/homeBtn'\); if\(hb\) hb\.onclick=exitToMenu/.test(be), 'the home button is wired to exitToMenu');
assert(/sb\.onclick=startGame/.test(be), 'Redeploy still redeploys');
done('end-screen return-to-home button');
