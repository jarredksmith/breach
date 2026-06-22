import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 311: a saved cinematic survives a page reload (boot reads savedLevel.cine)
assert(/function _applyCine\(lc\)\{/.test(src), 'shared cine-apply helper exists');
assert(/_applyCine\(savedLevel && savedLevel\.cine\);/.test(src), 'boot restores the saved cinematic');
// serialize still writes it
assert(/cine:\s*\{ on: cineCfg\.on, path: cineCfg\.path\.map/.test(src), 'cinematic still serialized');
// the two runtime restore paths now call the helper (no more inline duplication)
assert((src.match(/_applyCine\(level\.cine\);/g)||[]).length===2, 'loadLevelFromNet + restoreLevel both use the helper');
assert(!/if\(level\.cine\)\{ const lc=level\.cine; cineCfg\.on=/.test(src), 'old inline restore blocks gone');
// helper handles the empty case
const ac = extractFunction('_applyCine');
assert(/else \{ cineCfg\.on=false; cineCfg\.path=\[\];/.test(ac), 'helper falls back to defaults when no cinematic');
done();
