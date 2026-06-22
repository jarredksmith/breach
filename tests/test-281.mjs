import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 386: enemy Model scale is now a (logarithmic) slider + number box, and the minimum dropped from
// 0.05 to 0.001 — some models were still too large even at 0.05.

// a range slider drives the scale, paired with the number input
assert(/const esRng=document\.createElement\('input'\); esRng\.type='range';/.test(src), 'enemy scale has a slider');
assert(/esRng\.oninput=\(\)=>\{ esApply\(slider2es\(parseFloat\(esRng\.value\)\), true\); \};/.test(src), 'slider drives the scale');
assert(/esNum\.onchange=\(\)=>\{ esApply\(parseFloat\(esNum\.value\), false\); \};/.test(src), 'number box still allows exact entry');

// minimum lowered to 0.001 (was 0.05) in the editor + the auto-fit clamp
assert(/const ES_MIN=0\.001, ES_MAX=50/.test(src), 'editor scale minimum is 0.001');
assert(/esNum\.min='0\.001'/.test(src), 'number input min is 0.001');
assert(/mc\.scale = Math\.max\(0\.001, Math\.min\(50, \(mc\.scale\|\|1\) \* \(2\.6\/h\)\)\)/.test(src), 'auto-fit clamp lowered to 0.001');
assert(!/mc\.scale=Math\.max\(0\.05,Math\.min\(50/.test(src), 'no leftover 0.05 enemy-scale clamp');

// executable: the log mapping spans the full range and round-trips
const ES_MIN=0.001, ES_MAX=50, ES_LMIN=Math.log(ES_MIN), ES_LSPAN=Math.log(ES_MAX)-ES_LMIN;
const es2slider=v=>Math.round(((Math.log(Math.max(ES_MIN,v))-ES_LMIN)/ES_LSPAN)*1000);
const slider2es=p=>Math.exp(ES_LMIN + (p/1000)*ES_LSPAN);
assert(Math.abs(slider2es(0) - 0.001) < 1e-6, 'slider min = 0.001');
assert(Math.abs(slider2es(1000) - 50) < 1e-6, 'slider max = 50');
for(const s of [0.002, 0.05, 0.5, 5, 40]){ assert(Math.abs(slider2es(es2slider(s)) - s) / s < 0.01, `round-trips ${s}`); }
// small values get real slider travel (0.001->0.01 spans >100 of 1000 steps, not crammed)
assert((es2slider(0.01) - es2slider(0.001)) > 100, 'small scales get usable slider precision (log scale)');
done();
