// (build 75) SFX volume slider in the menu (Master/Music already existed; SFX was missing).
import { gameSource, html, done, assert } from './harness.mjs';
assert(/id="volSfx"/.test(html), 'SFX slider exists in the menu');
const src = gameSource();
assert(/volSfx'\);[^]*audioSettings\.sfx=\(\+vS\.value\)\/100/.test(src), 'SFX slider drives audioSettings.sfx');
done('sfx volume slider');
