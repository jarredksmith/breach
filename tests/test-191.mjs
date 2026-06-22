import { gameSource, extractFunction, assert, done } from './harness.mjs';
const rcp = extractFunction('renderAudioZonesPanel');
// build 280: zone sound must use the same widgets as the other sounds
assert(/_sndRow\('Sound', \(\)=>z\.url\|\|'', /.test(rcp), 'zone sound should use the shared _sndRow widget (input + test + status)');
assert(/renderFreesoundBrowser\(card, \(\)=>renderAudioZonesPanel\(\), \{ label:'Zone '\+\(i\+1\), set:v=>\{ z\.url=/.test(rcp), 'zone should offer the Freesound search bound to that zone');
// no leftover plain text input for the url
assert(!/url\.placeholder='https/.test(rcp), 'old plain url input should be gone');
done();
