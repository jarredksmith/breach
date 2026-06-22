// (build 161) Editor-placeable pickups: weapons/ammo/health/buffs dropped on the map, extending the
// powerup-pad system (proximity grant, respawn, host-authoritative co-op). Persisted in the level.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();
assert(/ammo:   \{ c:0xffd166/.test(src) && /launcher:\{ c:0xff7a3a, label:'ROCKET LAUNCHER' \}/.test(src), 'weapon + ammo pickup kinds');
const ap = extractFunction('applyPowerupLocal');
assert(/else if\(kind==='ammo'\)\{ for\(const key of owned\)/.test(ap) && /else if\(WEAPONS\[kind\]\)\{ giveWeapon\(kind\);/.test(ap), 'ammo refills, weapon grants on pickup');
assert(/let pickupSpots =/.test(src) && /function addPickupSpot\(kind\)/.test(src) && /function removePickupSpot\(i\)/.test(src), 'placed-pickup data + add/remove');
const sp = extractFunction('spawnPowerups');
assert(/const spots = \(pickupSpots && pickupSpots\.length\) \? pickupSpots : powerupLayout\(\);/.test(sp), 'deploy uses placed pickups, else the default layout');
const sl = extractFunction('serializeLevel');
assert(/pickups: pickupSpots\.map/.test(sl), 'pickups saved into the level');
assert(/pickupSpots = Array\.isArray\(level\.pickups\)/.test(src), 'pickups restored when a level loads');
assert(/<b>Pickups<\/b>/.test(src) && /addPickupSpot\(newPickupKind\)/.test(src), 'editor Pickups UI');
done('editor pickups');
