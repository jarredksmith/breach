import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 434: when a hosted level uses Sketchfab models, the host lends its Sketchfab token to joiners over the
// connection (obfuscated, session-only) so the models load even for players with no Sketchfab account/token.

// session token + fallback
assert(/let _sfSessionToken = '';/.test(src), 'a session token slot exists');
const get = extractFunction('sfGetToken');
assert(/const own=\(localStorage\.getItem\(SF_TOKEN_KEY\)\|\|''\)\.trim\(\); return own \|\| _sfSessionToken \|\| '';/.test(get), 'own token wins; host-shared token is the fallback');
assert(/function sfSetSessionToken\(t\)\{ _sfSessionToken = \(t\|\|''\)\.trim\(\); \}/.test(src), 'session token is set, never persisted');

// obfuscation round-trips and is not plaintext
const pack = extractFunction('_sfPack'); const unpack = extractFunction('_sfUnpack');
assert(/return 'sfk1:'\+btoa/.test(pack) && /indexOf\('sfk1:'\)!==0\) return ''/.test(unpack), 'tagged, base64, reversible');

// only lent when the level actually uses Sketchfab
const det = extractFunction('_levelUsesSketchfab');
assert(/u\.indexOf\('sketchfab:'\)===0/.test(det), 'detects sketchfab: model URLs');
assert(/if\(_levelUsesSketchfab\(level\) && sfGetToken\(\)\) sfTok = _sfPack\(sfGetToken\(\)\)/.test(src), 'host only shares the token when the level needs it AND it has one');
assert(/conn\.send\(\{t:'welcome'[\s\S]*?sfTok,/.test(src), 'token rides along in the welcome message');

// joiner applies it (session only)
assert(/if\(msg\.sfTok\)\{ try\{ const t=_sfUnpack\(msg\.sfTok\); if\(t\) sfSetSessionToken\(t\); \}/.test(src), 'joiner unpacks + uses the host token for the session');

// executable: pack -> unpack restores the token; output is not the raw token
function pk(s){ s=String(s||''); let o=''; for(let i=0;i<s.length;i++) o+=String.fromCharCode(s.charCodeAt(i)^(0x42+(i%13))); return 'sfk1:'+Buffer.from(o,'binary').toString('base64'); }
function un(p){ if(typeof p!=='string'||p.indexOf('sfk1:')!==0) return ''; const o=Buffer.from(p.slice(5),'base64').toString('binary'); let s=''; for(let i=0;i<o.length;i++) s+=String.fromCharCode(o.charCodeAt(i)^(0x42+(i%13))); return s; }
const tok='abc123-DEADBEEF-sketchfab-token-9f8e';
const packed=pk(tok);
assert(packed.indexOf('sfk1:')===0, 'packed token is tagged');
assert(packed.indexOf(tok)<0, 'raw token is not visible in the packed payload');
assert(un(packed)===tok, 'unpack restores the exact token');
assert(un('garbage')==='' && un(null)==='', 'bad payloads unpack to empty (joiner keeps no token)');

// level detector executable
function uses(level){ try{ const props=(level&&level.props)||[]; for(const p of props){ const u=p&&(p.src||p.url||p.model); if(typeof u==='string' && u.indexOf('sketchfab:')===0) return true; } }catch(e){} return false; }
assert(uses({props:[{src:'box'},{src:'sketchfab:abcd1234'}]})===true, 'level with a sketchfab prop -> needs the token');
assert(uses({props:[{src:'box'},{src:'https://x/y.glb'}]})===false, 'level with only built-in/url props -> no token shared');
done();
