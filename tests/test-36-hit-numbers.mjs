// (build 55) Editor controls for floating hit numbers: on/off, font size, hit + kill colors. Saved + restored.
import { extractFunction, gameSource, done, assert } from './harness.mjs';
const src = gameSource();

assert(/let dmgNumCfg = \{ on:true, size:44, hitColor:'#ffe08a', killColor:'#ff6b6b' \}/.test(src), 'config defaults: on, size 44, amber/red');
assert(/if\(savedLevel && savedLevel\.dmgNum\)\{/.test(src), 'loads saved hit-number settings at startup');

const sdn = extractFunction('spawnDamageNumber');
assert(/if\(!dmgNumCfg\.on\) return;/.test(sdn), 'OFF => no numbers spawned');
assert(/const fs = Math\.max\(10, Math\.min\(120, dmgNumCfg\.size\|\|44\)\);/.test(sdn), 'font size from config (clamped 10..120)');
assert(/cx\.font = 'bold '\+fs\+'px system-ui/.test(sdn), 'canvas font uses the configured size');
assert(/cv\.width = Math\.ceil\(fs\*2\.9\)/.test(sdn), 'canvas scales with the font so big sizes do not clip');
assert(/dmgNumCfg\.killColor\|\|'#ff6b6b'/.test(sdn) && /dmgNumCfg\.hitColor\|\|'#ffe08a'/.test(sdn), 'colors come from config');
assert(/const sc = \(fs\/44\) \* \(kill \? 1\.1 : 0\.8\)/.test(sdn), 'world size scales with font size');

// save + restore
assert(/dmgNum:\s*\{ on: dmgNumCfg\.on !== false, size: dmgNumCfg\.size, hit: dmgNumCfg\.hitColor, kill: dmgNumCfg\.killColor \}/.test(src), 'serialized with the level');
assert(/if\(level\.dmgNum\)\{ const d=level\.dmgNum; dmgNumCfg\.on = d\.on!==false;/.test(src), 'restored from a loaded level');

// editor wiring
assert(/hnCb\.onchange=\(\)=>\{ pushUndoSnapshot\(\); dmgNumCfg\.on=hnCb\.checked; renderEditorFields\(\); \}/.test(src), 'checkbox toggles on/off');
assert(/dmgNumCfg\.size=Math\.max\(10,Math\.min\(120,parseInt\(szN\.value,10\)\|\|44\)\)/.test(src), 'size input wired');
assert(/mkCol\('Hit', dmgNumCfg\.hitColor/.test(src) && /mkCol\('Kill', dmgNumCfg\.killColor/.test(src), 'hit + kill color pickers wired');
done('hit-number controls (on/off, size, colors) persist');
