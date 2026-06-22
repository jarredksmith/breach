import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// "Go to" moves the editor camera to the waypoint (fly + look + top-view), without mutating the path
assert(/go\.textContent='Go to'/.test(src), 'button still labelled the old way');
assert(/go\.onclick=\(\)=>\{ const q=CS\.path\[i\]; if\(!q\) return; flyPos\.set\(q\[0\],q\[1\],q\[2\]\); player\.pos\.set\(q\[0\],q\[1\],q\[2\]\); if\(editorTopView\)\{ topPanX=q\[0\]; topPanZ=q\[2\]; \} \};/.test(src), 'Go to does not move the camera to the waypoint');
// Go to must NOT overwrite or splice the waypoint
const goBody = src.match(/go\.onclick=\(\)=>\{[\s\S]*?\};/)[0];
assert(!/CS\.path\[i\]\s*=/.test(goBody), 'Go to must not overwrite the waypoint');
assert(!/\.splice\(/.test(goBody), 'Go to must not delete the waypoint');
// recapture lives on a separate Set button
assert(/setb\.textContent='Set'/.test(src), 'Set (recapture) button missing');
assert(/setb\.onclick=\(\)=>\{ pushUndoSnapshot\(\); const o=CS\.path\[i\]; const keep=\(o && o\.length>=6\)\?\[o\[3\],o\[4\],o\[5\]\]:\[\]; CS\.path\[i\]=\[\+camera\.position\.x/.test(src), 'Set recaptures the view and preserves an authored look (build 353)');
assert(/r\.appendChild\(lab\); r\.appendChild\(go\); r\.appendChild\(setb\); r\.appendChild\(eye\);/.test(src), 'row order: Go to / Set / look-eye (build 353)');
done();
