import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 397: the Sketchfab model search has an "Animated only" toggle. Sketchfab's API supports a server-side
// &animated=true filter, so the toggle is accurate (and paging via the next-url keeps the filter).

// sfSearch takes an animatedOnly flag and appends the API filter
assert(/function sfSearch\(query, cb, errcb, animatedOnly\)\{/.test(src), 'sfSearch accepts an animatedOnly flag');
assert(/'\.\.\.count=24'\+\(animatedOnly\?'&animated=true':''\)\+'&q='/.test(src) || /count=24'\+\(animatedOnly\?'&animated=true':''\)\+'&q='/.test(src), 'animated=true is appended to the search URL when on');

// a persisted checkbox in the Sketchfab search bar
assert(/asp\.textContent='Animated only';/.test(src), 'an "Animated only" checkbox is shown');
assert(/localStorage\.getItem\('breach_sf_anim_only'\)==='1'/.test(src), 'the toggle persists');
assert(/acb\.onchange=\(\)=>\{ _sfAnimOnly=acb\.checked;[\s\S]*?if\(q\.value\.trim\(\)\) doSearch\(\); \}/.test(src), 'toggling re-runs the search with the filter');

// the flag is threaded into the actual search call
assert(/sfSearch\(term, \(list,next\)=>\{ sfLastResults=list; sfNextUrl=next; render\(\); \}, err=>\{[\s\S]*?\}, _sfAnimOnly\);/.test(src), 'doSearch passes the animated-only flag');

// each result already carries an animated flag (so the filter is meaningful)
assert(/animated:!!\(m\.animationCount\)/.test(src), 'Sketchfab results expose an animated flag');
done();
