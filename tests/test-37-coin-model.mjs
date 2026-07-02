// (build 56) Editor controls for coins: GLB model URL, scale, and on/off. Saved + restored; the model
// builder is shared by solo + co-op rendering.
import { extractFunction, gameSource, done, assert } from './harness.mjs';
const src = gameSource();

assert(/let coinCfg = \{ url:'', scale:1, on:true \}/.test(src), 'config defaults: built-in token, scale 1, on');
assert(/if\(savedLevel && savedLevel\.coin\)\{/.test(src), 'loads saved coin settings at startup');

const mk = extractFunction('makeCoinMesh');
assert(/if\(coinCfg\.url\)\{/.test(mk), 'uses a GLB when a URL is set');
assert(/loadGLTFCached\(coinCfg\.url/.test(mk) && /model\.scale\.setScalar\(coinCfg\.scale\|\|1\)/.test(mk), 'loads + scales the model');
assert(/const m = new THREE\.Mesh\(coinGeo, coinMat\); m\.rotation\.x = Math\.PI\/2; return m;/.test(mk), 'falls back to the built-in cylinder token');

const sc = extractFunction('spawnCoin');
assert(/if\(!coinCfg\.on\) return;/.test(sc), 'OFF => no coins drop');
assert(/const mesh = _takeCoinMesh\(\);/.test(sc) && /const m=makeCoinMesh\(\); m\.userData\._coinKey=k; return m;/.test(src), 'spawn draws from the coin pool, which builds via the shared builder (build 812)');

const up = extractFunction('upsertCoinMesh');
assert(/m=makeCoinMesh\(\); scene\.add\(m\)/.test(up), 'co-op coin rendering uses the shared builder too');

// save + restore
assert(/coin:\s*\{ url: coinCfg\.url, scale: coinCfg\.scale, on: coinCfg\.on !== false \}/.test(src), 'serialized with the level');
assert(/if\(level\.coin\)\{ const c=level\.coin; coinCfg\.url=c\.url\|\|''; coinCfg\.scale=c\.scale\|\|1; coinCfg\.on=c\.on!==false; \}/.test(src), 'restored from a loaded level');

// editor wiring
assert(/cnCb\.onchange=\(\)=>\{ pushUndoSnapshot\(\); coinCfg\.on=cnCb\.checked; renderEditorFields\(\); \}/.test(src), 'on/off checkbox wired');
assert(/coinCfg\.url=cu\.value\.trim\(\)/.test(src), 'model URL apply wired (clears current coins)');
assert(/coinCfg\.scale=Math\.max\(0\.05,Math\.min\(50,parseFloat\(csN\.value\)\|\|1\)\)/.test(src), 'scale input wired');
done('coin model controls (model / scale / on-off) persist');
