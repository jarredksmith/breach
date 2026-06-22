import { gameSource, extractFunction, assert, done } from './harness.mjs';
const sg = extractFunction('startGame');
// build 284: every match must build a fresh physics world, not inherit a stale one from a prior session.
// (The loading-screen reveal only rebuilds an EXISTING world and only runs when assets are pending, so a
//  flat duel arena with nothing to load left the client on its old solo-session floor -> free-flying.)
assert(/buildPhysWorld\(\)/.test(sg), 'startGame must (re)build the physics world for the level');
// it must happen after the static meshes are (re)instanced, so colliders match the play-time geometry
const inst = sg.indexOf('teardownInstancing(); buildInstancing();');
const phys = sg.indexOf('buildPhysWorld()');
assert(inst !== -1 && phys > inst, 'buildPhysWorld must run after buildInstancing in startGame');
// regression guard: the reveal still rebuilds once async assets land
const src = gameSource();
assert(/const reveal=\(\)=>\{ try\{ if\(physWorld\) buildPhysWorld\(\);/.test(src), 'loader reveal should still rebuild physics after assets load');
done();
