import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
assert(/moon\.shadow\.normalBias\s*=\s*1\.2/.test(src), 'moon light has normalBias to clear shadow acne');
assert(/moon\.shadow\.bias\s*=\s*-0\.0004/.test(src), 'moon light has a small negative depth bias');
done('shadow-bias');
