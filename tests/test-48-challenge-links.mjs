// (build 69) Challenge links: a shared level PLUS a score target (#lvl=…&chal=…). Beating it on the end
// screen lets you copy a fresh challenge. Encode/decode round-trip + comparison + wiring.
import { gameSource, extractFunction, done, assert, eq } from './harness.mjs';
const src = gameSource();

// wiring
assert(/buildChallengeLink\(\)/.test(src), 'challenge link builder exists');
assert(/'#lvl=' \+ lvlCode \+ '&chal=' \+ chal/.test(src), 'link carries level + challenge token');
assert(/function challengeFromUrl\(\)/.test(src) && /\[#&\]chal=\(\[\^&\]\+\)/.test(src), 'parses the challenge from the URL');
assert(/challenge = challengeFromUrl\(\)/.test(src), 'startup reads the challenge target');
assert(/\$\{challengeResultHTML\(\)\}/.test(src), 'end screens show the comparison');
assert((src.match(/id=\\"chalBtn\\"/g)||src.match(/id="chalBtn"/g)||[]).length >= 2, 'both end screens get a challenge button');
assert(/cb\.onclick=async \(\)=>/.test(src) && /navigator\.clipboard\.writeText\(link\)/.test(src), 'button copies the link');
assert(!/document\.getElementById\('startBtn'\)\.onclick = startGame;/.test(src) && /bindEndScreen\(\)/.test(src), 'end screens use the shared binder');

// --- runnable: token round-trip (url-safe) ---
const line = (name)=>{ const m = src.match(new RegExp('^.*function '+name+'\\(.*$','m')); return m ? m[0] : ''; };
const codec = new Function(`
  ${line('_b64urlFromBytes')}
  ${line('_bytesFromB64url')}
  ${line('_encChallenge')}
  ${line('_decChallenge')}
  return { enc:_encChallenge, dec:_decChallenge };
`)();
const tok = codec.enc({ s:8400, w:12, k:57, o:'eliminate' });
assert(typeof tok==='string' && tok.length>0 && !/[+/=]/.test(tok), 'token is URL-safe base64');
const back = codec.dec(tok);
eq(back.s, 8400, 'score survives the round-trip');
eq(back.w, 12, 'wave survives'); eq(back.k, 57, 'kills survive'); eq(back.o, 'eliminate', 'objective survives');
eq(codec.dec('!!!not valid!!!'), null, 'garbage decodes to null (no crash)');

// --- runnable: comparison line ---
const cr = new Function('challenge','score','UI_ICON', `
  ${extractFunction('challengeResultHTML')}
  return challengeResultHTML();
`);
eq(cr(null, 100), '', 'no active challenge -> no line');
assert(/CHALLENGE BEATEN/.test(cr({s:500}, 600, {trophy:''})), 'beating the target reads BEATEN');
const short = cr({s:500}, 300, {trophy:''});
assert(/TARGET 500/.test(short) && !/BEATEN/.test(short), 'falling short shows the target, not BEATEN');
done('challenge / score share links');
