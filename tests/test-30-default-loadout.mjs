// (build 46) The authored default loadout: scifi gun framing + ADS pose, ammo-station transform,
// and the 3-prop starter scene. These are the fresh-load defaults (used when there's no saved level).
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();

// gun viewmodel
assert(/const GUN_MODEL_URL = 'https:\/\/static\.poly\.pizza\/78846e47-3be2-48f2-a7ce-6b50c09358bb\.glb'/.test(src), 'gun model url');
assert(/const GUN_OFFSET = new THREE\.Vector3\(0\.32000, -0\.34000, -0\.60000\)/.test(src), 'gun offset');
assert(/const GUN_SCALE = 0\.74782/.test(src), 'gun scale');
assert(/const GUN_ROT = new THREE\.Euler\(0\.00000, 1\.53388, 0\.00000\)/.test(src), 'gun rotation');

// ADS pose
assert(/ADS_FOV = 38\.20/.test(src), 'ADS fov');
assert(/const ADS_AIM = new THREE\.Vector3\(0\.20866, -0\.47289, -0\.04449\)/.test(src), 'ADS aim offset');
assert(/const ADS_ROT = new THREE\.Euler\(0\.13820, 0\.13102, 0\.00939\)/.test(src), 'ADS rotation');

// ammo station
assert(/const STATION_MODEL_URL = 'https:\/\/jarredksmith\.github\.io\/atg\/scifi_terminal\.glb'/.test(src), 'station model url');
assert(/const STATION_POS = new THREE\.Vector3\(8\.00000, 0\.00000, 7\.82061\)/.test(src), 'station pos');
assert(/const STATION_SCALE = 0\.25297/.test(src), 'station scale');
assert(/const STATION_ROT = new THREE\.Euler\(0\.00000, 3\.14159, 0\.00000\)/.test(src), 'station rotation');

// starter props: exactly the 3 poly.pizza models
const propBlock = src.slice(src.indexOf('const SCENE_PROPS = ['), src.indexOf('const propModels'));
assert((propBlock.match(/src:/g)||[]).length === 3, 'three default props');
assert(/78846e47-3be2-48f2-a7ce-6b50c09358bb\.glb/.test(propBlock), 'prop 1 present');
assert(/74ec40fe-8c6f-4946-8053-38899c85af88\.glb/.test(propBlock) && /4\.70229/.test(propBlock), 'prop 2 present (scaled 4.70)');
assert(/cc2ce213-28b2-4aed-a6f7-4b9cf8f80568\.glb/.test(propBlock), 'prop 3 present');
assert(/const SCENE_LIGHTS = \[\]/.test(src.replace(/\s+/g,' ')) || /const SCENE_LIGHTS = \[\s*\]/.test(src), 'no default scene lights');
done('default scifi loadout (gun / ADS / station / 3 props)');
