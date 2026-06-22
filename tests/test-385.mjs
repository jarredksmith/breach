import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 510: a map waypoint placed in one mission must not bleed into the next (solo -> multiplayer).
// startGame() is the shared entry for solo and both MP roles, so it resets the waypoint there.
const sg = extractFunction('startGame');
assert(/mapWaypoint=null;/.test(sg), 'startGame clears any leftover map waypoint');
// guard: still only assigned to {x,z} by the map UI, so the reset is the only cross-game clear path needed
assert(/mapWaypoint=\{ x:w\[0\], z:w\[1\] \}/.test(src), 'the map still sets the waypoint from a click');
done();
