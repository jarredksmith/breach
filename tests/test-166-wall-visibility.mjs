import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/wallsVisible:true,/.test(src), 'wallsVisible default true');
assert(/for\(const w of arenaWalls\)\{ w\.visible = worldCfg\.wallsVisible !== false; \}/.test(src), 'walls toggle visibility in applyWorldCfg');
assert(/try \{ if\(typeof worldCfg !== 'undefined' && worldCfg\)\{ const _wv = worldCfg\.wallsVisible !== false; for\(const w of arenaWalls\) w\.visible = _wv; \} \} catch\(e\)\{\}/.test(src), 'rebuilt walls respect saved visibility (TDZ-guarded)');
assert(/Show boundary walls/.test(src), 'Walls panel has the visibility checkbox');
// collider must NOT depend on visibility: walls are still pushed to colliders unconditionally
assert(/const m=wall\(w,h,d,x,y,z\); arenaWalls\.push\(m\); colliders\.push\(m\); refreshWallCollider\(m\);/.test(src), 'collider added regardless of visibility (boundary preserved)');
done('wall-visibility');
