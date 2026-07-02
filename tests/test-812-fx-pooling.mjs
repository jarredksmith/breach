// (build 812) FX allocation churn: death particles and coins now recycle instead of allocating fresh GPU objects.
//  - playerDeathFx allocated 18-34 fresh geometries+materials per death and disposed them ~1s later; it now rides the
//    shared spark pools (shared geometry, recycled mesh+material). Gib chunks get their own shared box geo + pool.
//  - Coins pooled: a multi-kill payout reused meshes instead of building one per coin; the pool is keyed on the coin
//    config so changing the custom coin model can never resurrect stale meshes.
//  - Death rings now dispose their material too (was geometry-only).
import { gameSource, extractFunction, assert, eq, done } from './harness.mjs';
const src = gameSource();

// --- death particles ride the pools ---
const fx = extractFunction('playerDeathFx');
assert(!/new THREE\.SphereGeometry/.test(fx) && !/new THREE\.BoxGeometry/.test(fx), 'no per-particle geometry allocation remains');
assert(/const _box = P\.geo==='box', _geo = _box \? _deathBoxGeo : _sparkGeo, _pool = _box \? _deathBoxPool : _sparkPool;/.test(fx), 'particles pick the shared geo + pool by style');
assert(/const p = _getSpark\(_pool, _geo, col, false, P\.size\*SC, _dfxPos\.set\(x, y\+0\.9, z\)\);/.test(fx), 'each particle is drawn from the pool');
assert(/pool:_pool \}\);/.test(fx) && /pool:_sparkPool\}\);/.test(fx), 'spark entries carry their pool so the update loop recycles them');
assert(/const _deathBoxGeo = new THREE\.BoxGeometry\(1\.4, 1\.4, 1\.4\);/.test(src) && /const _deathBoxPool = \[\];/.test(src), 'the gib box geo + pool are shared, module-level');

// --- coin pool ---
assert(/const _coinPool = \[\];/.test(src), 'a coin pool exists');
const take = extractFunction('_takeCoinMesh');
assert(/while\(_coinPool\.length\)\{ const m=_coinPool\.pop\(\); if\(m\.userData\._coinKey===k\)\{ m\.visible=true; return m; \} \}/.test(take), 'reuse only matches the CURRENT coin config (stale meshes drop out)');
const free = extractFunction('_freeCoinMesh');
assert(/if\(m\.userData\._coinKey===_coinKey\(\) && _coinPool\.length<40\) _coinPool\.push\(m\);/.test(free), 'the pool is capped at 40 and never keeps stale-config meshes');
assert(/_freeCoinMesh\(c\.mesh\); coins\.splice\(i,1\);/.test(extractFunction('updateCoins')), 'picked-up / expired coins recycle');
// executable: the keying logic
{
  const key = (url,scale)=> (url||'')+'|'+(scale||1);
  const pool=[]; const mk=(k)=>({userData:{_coinKey:k}});
  pool.push(mk(key('old.glb',1)));
  // config changed to new.glb — the stale mesh must not come back
  const k=key('new.glb',1); let got=null;
  while(pool.length){ const m=pool.pop(); if(m.userData._coinKey===k){ got=m; break; } }
  eq(got, null, 'a config change drops stale pooled meshes');
}

// --- death rings dispose material ---
assert(/r\.mesh\.geometry\.dispose\(\); if\(r\.mesh\.material&&r\.mesh\.material\.dispose\) r\.mesh\.material\.dispose\(\); deathRings\.splice/.test(src), 'expired rings dispose geometry AND material');

done('build 812: death FX + coins recycle through pools (no per-event GPU allocation)');
