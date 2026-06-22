import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 326: a freshly built world is warmed AFTER the player collider exists, so the first move sees the floor
const kcc = extractFunction('ensurePlayerKCC');
assert(/createCharacterController/.test(kcc), 'KCC still created here');
// the warm step comes after the controller is fully configured, before return
const ctrlI = kcc.indexOf('setApplyImpulsesToDynamicBodies(true)');
const stepI = kcc.indexOf('physWorld.step()');
const retI = kcc.lastIndexOf('return true;');
assert(stepI>ctrlI && stepI<retI, 'world stepped after KCC setup, before returning');
// buildPhysWorld keeps its own warm step too (belt + suspenders for the floor colliders)
assert(/try\{ physWorld\.step\(\); \}catch\(e\)\{\}/.test(extractFunction('buildPhysWorld')), 'buildPhysWorld still warms the floor');
done();
