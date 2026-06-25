import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 689: the inventory inspect 3D viewer canvas inherited the global `canvas{position:fixed;inset:0}` rule, so
// it rendered full-screen — the model looked huge and the fixed canvas covered the card's Close / Use buttons. The
// canvas now overrides position inline so it stays inside the card holder (and the buttons stay clickable).

const oi = extractFunction('openInspect');
assert(/const cv=_invR\.domElement; cv\.style\.cssText='position:static;top:auto;left:auto;z-index:auto;width:100%;height:100%;display:block;'/.test(oi),
  'the inspect canvas overrides the global fixed positioning (stays in the card)');
// it is appended into the bounded holder, not the body
assert(/holder\.appendChild\(cv\)/.test(oi), 'the canvas lives inside the card holder');
// and the holder is a normal-sized, clipped box
assert(/holder=document\.createElement\('div'\); holder\.style\.cssText='position:relative;width:100%;aspect-ratio:1;max-height:60vh[^']*overflow:hidden/.test(oi),
  'the holder is a bounded, clipped square');

done('build 689: inventory inspect model stays inside the card (canvas position fix)');
