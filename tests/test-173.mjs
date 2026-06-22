import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();

// trimesh built from the actual floor geometry, transformed to world space
const tm = extractFunction('_terrainTrimesh');
assert(/worldCfg\.terrain/.test(tm) && /return null/.test(tm), 'trimesh not gated to terrain levels');
assert(/floor\.matrixWorld/.test(tm) && /applyMatrix4\(m\)/.test(tm), 'trimesh verts not transformed to world space');
assert(/geo\.index/.test(tm) && /Uint32Array/.test(tm), 'trimesh indices not built');

// physics floor uses the trimesh when present, with a safety slab below the lowest valley + flat fallback
const bp = extractFunction('buildPhysWorld');
assert(/ColliderDesc\.trimesh\(_tri\.verts, _tri\.idx\)/.test(bp), 'physics floor does not use the terrain trimesh');
assert(/slabTop = Math\.min\(0, minH\) - 2/.test(bp), 'no safety slab below the terrain');
assert(/catch\(e\)\{ console\.warn\('terrain collider failed; using flat floor', e\); slabTop = 0; \}/.test(bp), 'no flat-floor fallback');
assert(/setTranslation\(0, slabTop-2, 0\)/.test(bp), 'slab not positioned from slabTop');

// spawns land on the terrain so the capsule is never embedded (no eject)
assert(/player\.pos\.set\(sp\.x, \(sp\.y!=null\?sp\.y:terrainHeightAt\(sp\.x, sp\.z\)\)\+EYE, sp\.z\)/.test(src), 'wave/duel spawn places on the real floor (sp.y), terrain fallback');
assert(/player\.pos\.set\(playerSpawn\.x, terrainHeightAt\(playerSpawn\.x, playerSpawn\.z\)\+\(playerSpawn\.y\|\|0\)\+EYE, playerSpawn\.z\)/.test(src), 'reset spawn not terrain-aware');
done();
