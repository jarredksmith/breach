// propTuple/tupleEq: 9-element TRS tuple, JSON round-trip stable, tolerance 1e-4.
import * as THREE from 'three';
import { extractFunction, evalIn, done, assert, eq } from './harness.mjs';
const propTuple = evalIn(extractFunction('propTuple'), { _maxTerrainOver: () => 0 });
const tupleEq = evalIn(extractFunction('tupleEq'));
const o = new THREE.Object3D();
o.position.set(1.5, 2.25, -3.75); o.rotation.set(0.1, 0.2, 0.3); o.scale.set(2, 2, 2);
const t = propTuple(o);
eq(t.length, 9, 'tuple has 9 elements (pos3, rot3, scale3)');
eq(t[0], 1.5); eq(t[4], 0.2); eq(t[8], 2);
const t2 = JSON.parse(JSON.stringify(t));
assert(tupleEq(t, t2), 'tuple equal to its JSON round-trip');
const drift = t.slice(); drift[0] += 5e-5;
assert(tupleEq(t, drift), 'sub-1e-4 drift still equal');
const big = t.slice(); big[0] += 1e-2;
assert(!tupleEq(t, big), '1e-2 difference is NOT equal');
assert(!tupleEq(t, null) && !tupleEq(null, t), 'null safe');
done('prop tuple + equality + round-trip');
