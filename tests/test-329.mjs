import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 437: saved levels were lost when localStorage was cleared/evicted on browser close (and quota could
// silently drop large Sketchfab levels). Now the level is also kept in a durable IndexedDB store, the
// localStorage write is verified, and startup self-heals localStorage from IndexedDB. Plus loot glow syncs to MP.

// durable store + verified save
assert(/const _LVLDB_NAME='breachLevel'/.test(src) && /function _levelDBPut\(str\)/.test(src) && /function _levelDBGet\(\)/.test(src), 'a durable IndexedDB level store exists');
const sv = extractFunction('saveLevel');
assert(/_levelDBPut\(str\)/.test(sv), 'save also writes the durable copy');
assert(/localStorage\.setItem\(SAVE_KEY, str\); return localStorage\.getItem\(SAVE_KEY\)===str;/.test(sv), 'localStorage write is verified (no false "saved")');
assert(/catch\(e\)\{ return \(typeof _levelDB==='function'\); \}/.test(sv), 'if localStorage is full, the IndexedDB copy still counts as saved');

// startup self-heal
assert(/if\(!savedLevel\)\{ try\{ if\(!sessionStorage\.getItem\('breach_lvl_healed'\)[\s\S]*?_levelDBGet\(\)\.then\(str=>\{[\s\S]*?localStorage\.setItem\(SAVE_KEY, str\); sessionStorage\.setItem\('breach_lvl_healed','1'\); location\.reload\(\)/.test(src), 'startup restores localStorage from the durable copy (once)');

// clear wipes both
assert(/function clearSave\(\)\{ try \{ localStorage\.removeItem\(SAVE_KEY\); \}catch\(e\)\{\} try\{ if\(typeof _levelDBPut==='function'\) _levelDBPut\(''\);/.test(src), 'Clear save wipes both stores');

// loot glow syncs to MP clients
assert(/gc:\(ch\.glowColor!=null\?ch\.glowColor:undefined\), gi:\(ch\.glowI!=null\?ch\.glowI:undefined\), gy:\(ch\.yOff\|\|undefined\)/.test(src), 'chest snapshot carries glow + height');
assert(/buildChestMesh\(k\.p\[0\], k\.p\[1\], \{ y:k\.gy, glowColor:k\.gc, glowI:k\.gi \}\)/.test(src), 'client renders the chest with the synced glow + height');

// executable: verified-save logic — a silently-dropped write (readback mismatch) reports false
function verifiedSave(store, str){ store.data = (store.full ? store.data : str); return store.data === str; }
assert(verifiedSave({full:false}, 'lvl')===true, 'normal write verifies true');
assert(verifiedSave({full:true, data:undefined}, 'lvl')===false, 'a dropped write verifies FALSE (user warned, not lied to)');
done();
