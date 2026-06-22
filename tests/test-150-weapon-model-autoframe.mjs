import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/if\(WEAPONS\[key\] && WEAPONS\[key\]\.model && !WEAPONS\[key\]\.view\)\{/.test(src), 'auto-frame only for a custom weapon model with no saved view');
assert(/const maxd=Math\.max\(_sz\.x,_sz\.y,_sz\.z\)\|\|1, fit=0\.5\/maxd/.test(src), 'fits longest axis to a sane viewmodel size');
assert(/WEAPONS\[key\]\.view = \{ px:GUN_OFFSET\.x[\s\S]*?s:fit/.test(src), 'auto-frame writes a view with the fitted scale');
assert(/if\(\(w\.model\|\|''\)!==\(url\|\|''\)\) w\.view = null;/.test(src), 'changing the weapon URL clears the old view so the new model re-frames');
done('weapon-model-autoframe');
