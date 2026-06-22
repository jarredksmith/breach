// (build 138) Root fix for the init TDZ cascade: RAD/DEG are pure constants used by wepView's default
// branch, which applyWeaponMuzzle() calls synchronously during init. They must be declared before that
// use, or init throws "Cannot access 'DEG' before initialization" and leaves shopOpen/gizmoDrag/etc unset.
import { gameSource, done, assert } from './harness.mjs';
const src = gameSource();
const deg = src.indexOf('const RAD = Math.PI/180, DEG = 180/Math.PI;');
assert(deg >= 0, 'RAD/DEG declared once');
assert(src.indexOf('const RAD = Math.PI/180, DEG = 180/Math.PI;', deg+1) === -1, 'no duplicate RAD/DEG');
assert(deg < src.indexOf('function wepView'), 'RAD/DEG declared before wepView (which uses DEG)');
assert(deg < src.indexOf('applyWeaponMuzzle(curWep);'), 'RAD/DEG declared before the init call that reaches DEG');
done('DEG TDZ');
