import { assert, done } from './harness.mjs';
import { readFileSync } from 'fs';
const page = readFileSync(new URL('../breach.html', import.meta.url), 'utf8');
// build 365: the pause button no longer overlaps the top-right Score panel — moved left of it on both layouts.

// desktop rule (the real multi-line one): top aligned to the panel, right pulled left to clear it
assert(/#pauseBtn \{\s*position:fixed; top:26px; right:140px; z-index:45;/.test(page), 'desktop pause button sits left of the Score panel');
// touch override: cleared past the touch-positioned panel (which sits at right:58)
assert(/body\.touch #pauseBtn \{ top: calc\(12px \+ env\(safe-area-inset-top\)\); right: calc\(162px \+ env\(safe-area-inset-right\)\);/.test(page), 'touch pause button also clears the panel');
// panels themselves unchanged
assert(/#score \{ position:absolute; top: 26px; right: 26px;/.test(page), 'desktop Score panel still top-right (button moved, not panel)');
assert(/body\.touch #score \{ top: calc\(12px \+ env\(safe-area-inset-top\)\); right: calc\(58px \+ env\(safe-area-inset-right\)\); \}/.test(page), 'touch Score panel unchanged');
done();
