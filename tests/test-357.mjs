import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 473: Sketchfab search threw "Unexpected end of JSON input" because r.json() was called on a blank
// 200 body. Fix: read the body as text first (clear message on empty / non-JSON), and retry through the
// CORS proxy before giving up.

const f = extractFunction('sfFetchPage');
assert(/r\.text\(\)\.then\(t=>\{/.test(f), 'reads the body as text before parsing');
assert(/if\(!t \|\| !t\.trim\(\)\) throw new Error\('Sketchfab returned an empty response/.test(f), 'empty body -> clear, actionable message (not a JSON parse crash)');
assert(/try\{ return JSON\.parse\(t\); \}catch\(e\)\{ throw new Error\('Sketchfab sent a non-JSON response'\)/.test(f), 'non-JSON body -> clear message');
assert(/const px = proxied\(url\);/.test(f) && /fetch\(px\)\.then\(parse\)\.then\(deliver\)/.test(f), 'falls back through the CORS proxy on failure');
assert(/if\(px===url\)\{ errcb && errcb\(err\); return; \}/.test(f), 'no proxy configured -> reports the original error');
assert(/r\.status===401\?' \\u2014 check your token'/.test(f), 'a 401 still tells the user to check their token');

// --- executable: the parse contract (empty -> throw, valid -> object, junk -> throw) ---
function parseText(ok, status, t){
  if(!ok) throw new Error('HTTP '+status);
  if(!t || !t.trim()) throw new Error('empty');
  try{ return JSON.parse(t); }catch(e){ throw new Error('nonjson'); }
}
let threw=''; try{ parseText(true,200,''); }catch(e){ threw=e.message; } assert(threw==='empty', 'blank body throws "empty", not a parse crash');
threw=''; try{ parseText(true,200,'<html>oops</html>'); }catch(e){ threw=e.message; } assert(threw==='nonjson', 'HTML body throws "nonjson"');
const d=parseText(true,200,'{"results":[{"uid":"abc","name":"Rock"}],"next":null}');
assert(Array.isArray(d.results) && d.results[0].uid==='abc', 'valid JSON parses into results');
threw=''; try{ parseText(false,401,''); }catch(e){ threw=e.message; } assert(/401/.test(threw), 'a 401 surfaces the status');
done();
