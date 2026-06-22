import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 413: downloaded Sketchfab model archives are now cached on disk (IndexedDB). Before, every session
// re-ran the slow chain (API call + signed-CDN archive download + unzip), ~30s, so models popped in long after
// the load gate's 15s safety cap revealed the game. Now the FIRST session pays it once; later sessions are instant.

// IndexedDB helpers exist
assert(/const _MODELDB_NAME='breachModels', _MODELDB_STORE='archives'/.test(src), 'a model archive DB is defined');
const db = extractFunction('_modelDB');
assert(/indexedDB\.open\(_MODELDB_NAME, _MODELDB_VER\)/.test(db), 'opens the IndexedDB');
assert(/createObjectStore\(_MODELDB_STORE\)/.test(db), 'creates the archive store');
assert(/rq\.onerror=\(\)=>res\(null\)/.test(db), 'best-effort: DB failure resolves null (falls back to network)');
const get = extractFunction('_modelCacheGet');
assert(/objectStore\(_MODELDB_STORE\)\.get\(key\)/.test(get), 'cache get reads by key');
const put = extractFunction('_modelCachePut');
assert(/objectStore\(_MODELDB_STORE\)\.put\(buf, key\)/.test(put), 'cache put writes the archive bytes');

// loadSketchfabModel is cache-first, network-fallback, and saves on download
const lsf = extractFunction('loadSketchfabModel');
assert(/_modelCacheGet\(_cacheKey\)\.then\(buf=>\{/.test(lsf), 'tries the on-disk cache first');
assert(/if\(buf\)\{ _process\(buf\)\.then\(g=>cb\(g\)\)\.catch\(\(\)=>\{ _fromNetwork\(\); \}\); return; \}/.test(lsf), 'cache hit -> unzip locally, no network (corrupt entry refetches)');
assert(/function _fromNetwork\(\)\{/.test(lsf), 'has a network fallback');
assert(/\.then\(buf=>\{ try\{ _modelCachePut\(_cacheKey, buf\); \}catch\(e\)\{\} return _process\(buf\); \}\)/.test(lsf), 'on download, the archive bytes are saved for next time');
assert(/const _cacheKey='sf:'\+uid;/.test(lsf), 'cache is keyed by the model uid');

// the unzip step is shared by both paths (no duplicate logic drift)
assert(/const _process=\(buf\)=>/.test(lsf), 'a shared _process(buf) unzips + loads for both paths');
done();
