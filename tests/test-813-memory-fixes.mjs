// (build 813) Memory-audit fixes — the three real leaks:
//  1. Name-tag sprites own a 256x64 CanvasTexture that was dropped WITHOUT dispose on player leave and on every team
//     re-tint (the only genuinely unbounded VRAM leak). disposeAvatarLabel now runs at every drop/replace site.
//  2. _thumbCache (character-thumbnail data URLs) grew forever while browsing models — now capped at 64.
//  3. Corpse material clones (spawnCorpse clones for the fade) are disposed in _removeCorpse.
import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();

// --- 1. the label dispose helper + its call sites ---
const dal = extractFunction('disposeAvatarLabel');
assert(/if\(l\.material\.map && l\.material\.map\.dispose\) l\.material\.map\.dispose\(\);/.test(dal) && /if\(l\.material\.dispose\) l\.material\.dispose\(\);/.test(dal), 'the helper frees the texture AND the sprite material');
assert(/function removeRemotePlayer\(id\)\{ const rp=NET\.players\[id\]; if\(rp\)\{ if\(typeof disposeAvatarLabel==='function'\) disposeAvatarLabel\(rp\.mesh\); scene\.remove\(rp\.mesh\);/.test(src), 'leaving players free their name tag');
assert(/if\(typeof disposeAvatarLabel==='function'\) disposeAvatarLabel\(mesh\); mesh\.remove\(mesh\.userData\.label\); const l=makeNameSprite\(mesh\.userData\._name/.test(src), 'a team re-tint disposes the OLD tag before building the new one');
assert(/if\(typeof disposeAvatarLabel==='function'\) disposeAvatarLabel\(rp\.mesh\); rp\.mesh\.remove\(rp\.mesh\.userData\.label\); const l=makeNameSprite\(msg\.n/.test(src), 'a rename disposes the old tag too');

// --- 2. thumb cache cap ---
assert(/const _THUMB_CACHE_MAX = 64;/.test(src), 'the thumbnail cache is capped');
const put = extractFunction('_thumbCachePut');
assert(/if\(keys\.length>=_THUMB_CACHE_MAX\) delete _thumbCache\[keys\[0\]\];/.test(put), 'at the cap, the oldest entry is evicted');
assert(/_thumbCachePut\(k, url\); apply\(url\);/.test(src), 'writes route through the capped put');
{
  const MAX=3, cache={};
  const putFn=(k,u)=>{ const keys=Object.keys(cache); if(keys.length>=MAX) delete cache[keys[0]]; cache[k]=u; };
  for(let i=0;i<10;i++) putFn('k'+i, 'u'+i);
  eq(Object.keys(cache).length, MAX, 'the cache never exceeds its cap');
}

// --- 3. corpse material clones disposed ---
const rc = extractFunction('_removeCorpse');
assert(/c\.mesh\.traverse\(o=>\{ if\(o\.isMesh && o\.material\)\{ \(Array\.isArray\(o\.material\)\?o\.material:\[o\.material\]\)\.forEach\(m=>\{ if\(m && m\.dispose\) m\.dispose\(\); \}\); \} \}\);/.test(rc), 'corpse-owned material clones are disposed on removal');
// and spawnCorpse really does clone (so disposing can never touch a live enemy's material)
assert(/\.clone\(\)/.test(extractFunction('spawnCorpse')), 'spawnCorpse clones materials — dispose is safe');

done('build 813: name-tag textures freed, thumb cache capped, corpse materials disposed');
