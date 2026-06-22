// (build 180) Floor/wall material controls: roughness + metalness, separate W/H tiling (fixes stretch on
// non-square surfaces), and texture rotation — plus texture rotation for props.
import { gameSource, extractFunction, done, assert } from './harness.mjs';
const src = gameSource();

// rotation in the per-prop texture instance
const ti = extractFunction('texInstance');
assert(/rot = \+rot \|\| 0;/.test(ti) && /t\.center\.set\(0\.5, 0\.5\); t\.rotation = rot;/.test(ti), 'texInstance rotates about center');
assert(/o\.material\.map          = texInstance\(url, rep\[0\], rep\[1\], true, rot\)/.test(extractFunction('applyPropTexture')), 'prop maps fed rotation');
assert(/function applyPropTexRot\(obj, deg\)/.test(src), 'applyPropTexRot exists');

// surface maps: separate U/V + rotation
const su = extractFunction('applySurfaceTexture');
assert(/applySurfaceTexture\(mat, url, urlKey, repU, repV, normalUrl, roughUrl, rot\)/.test(src), 'surface takes separate U/V + rotation');
assert(/_loadSurfaceMap\(mat, 'map',          url,       repU, repV, true,  rot\)/.test(su), 'surface color map gets U/V + rot');
const lm = extractFunction('_loadSurfaceMap');
assert(/_surfTf\(mat\[slot\], ru, rv, rot\)/.test(lm), 'live tiling/rotation update on url-unchanged path');

// world finish + W/H + rotate applied
assert(/floorMat\.roughness = Math\.max\(0, Math\.min\(1, \+worldCfg\.floorRough\)\)/.test(src), 'floor roughness applied');
assert(/floorMat\.metalness = Math\.max\(0, Math\.min\(1, \+worldCfg\.floorMetal\)\)/.test(src), 'floor metalness applied');
assert(/wallMat\.roughness = Math\.max\(0, Math\.min\(1, \+worldCfg\.wallRough\)\)/.test(src), 'wall roughness applied');
assert(/const fu = \+worldCfg\.floorTileU>0 \? \+worldCfg\.floorTileU : fAuto, fv = \+worldCfg\.floorTileV>0/.test(src), 'floor uses separate W/H tiles');
assert(/applySurfaceTexture\(floorMat, worldCfg\.floorTex, '_floorTexUrl', fu, fv, worldCfg\.floorTexN, worldCfg\.floorTexR, \(\+worldCfg\.floorRot\|\|0\)\*Math\.PI\/180\)/.test(src), 'floor passes U/V + rotation');
assert(/worldCfg\.floorTileU=worldCfg\.floorTileV=\+worldCfg\.floorTile; worldCfg\.floorTile=0;/.test(src), 'legacy uniform floor tile migrates to W/H');

// defaults + serialization
assert(/floorRough:0\.95, floorMetal:0\.1/.test(src) && /floorTileU:0, floorTileV:0, floorRot:0/.test(src), 'DEFAULT_WORLD floor fields');
assert(/wallRough:0\.8, wallMetal:0\.2/.test(src) && /wallTileU:0, wallTileV:0, wallRot:0/.test(src), 'DEFAULT_WORLD wall fields');
assert(/if\(o\.userData\.texRot\) m\.texRot = o\.userData\.texRot;/.test(extractFunction('propMaterialDesc')), 'prop texRot serialized');
assert(/if\(mat\.texRot != null\) obj\.userData\.texRot = mat\.texRot;/.test(extractFunction('applyStoredMaterial')), 'prop texRot restored');

// UI present
assert(/slider\(b,'Floor tile W','floorTileU',0,80,0\.5\)/.test(src) && /slider\(b,'Floor rotate/.test(src), 'floor W/H + rotate sliders');
assert(/slider\(b,'Wall roughness','wallRough',0,1,0\.05\)/.test(src), 'wall finish slider');
assert(/rotI\.oninput=\(\)=>\{ const d=\+rotI\.value\|\|0; for\(const o of _matTargets\(\)\) applyPropTexRot\(o, d\); \}/.test(src), 'prop rotation input wired (bulk over selection)');
done('floor/wall finish + W/H tiling + texture rotation');
