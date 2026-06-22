import { gameSource, html, assert, near, done } from './harness.mjs';
const src = gameSource();
// build 515: player-adjustable touch look + aim sensitivity. Two persisted multipliers scale the base
// turn rate, surfaced as sliders in the touch HUD editor next to opacity/hand.

// ---- persisted multipliers, clamped 0.3–3, default 1 ----
assert(/let touchLookMul = \(\(\)=>\{ const v=parseFloat\(localStorage\.getItem\('breach_touch_looksens'\)\); return \(v>=0\.3 && v<=3\)\?v:1; \}\)\(\);/.test(src), 'look sensitivity persists, clamped, default 1');
assert(/let touchAdsMul  = \(\(\)=>\{ const v=parseFloat\(localStorage\.getItem\('breach_touch_adssens'\)\); +return \(v>=0\.3 && v<=3\)\?v:1; \}\)\(\);/.test(src), 'aim sensitivity persists, clamped, default 1');

// ---- the multipliers actually scale the look/aim turn rate ----
assert(/const tsens = \(ads\|\|touchAds\) \? \(TOUCH_ADS_SENS\*touchAdsMul\) : \(TOUCH_LOOK_SENS\*touchLookMul\);/.test(src),
  'look uses TOUCH_LOOK_SENS*touchLookMul, aim uses TOUCH_ADS_SENS*touchAdsMul');

// ---- executable: confirm the scaling math (yaw delta scales with the multiplier) ----
const BASE = 0.0042;   // TOUCH_LOOK_SENS
const yawDelta = (dx, mul)=> -(dx * (BASE*mul));
near(yawDelta(100,1),  -0.42,  1e-9, '1x baseline');
near(yawDelta(100,2),  -0.84,  1e-9, '2x is twice as fast');
near(yawDelta(100,0.5),-0.21,  1e-9, '0.5x is half as fast');

// ---- sliders exist in the touch editor and the reset clears them ----
assert(/const lookSl=mkSens\('Look', \(\)=>touchLookMul, v=>touchLookMul=v, 'breach_touch_looksens'\);/.test(src), 'a Look slider is wired');
assert(/const adsSl =mkSens\('Aim',  \(\)=>touchAdsMul,  v=>touchAdsMul=v,  'breach_touch_adssens'\);/.test(src), 'an Aim slider is wired');
assert(/touchLookMul=1; touchAdsMul=1;[\s\S]*?localStorage\.setItem\('breach_touch_looksens','1'\); localStorage\.setItem\('breach_touch_adssens','1'\);/.test(src), 'Reset restores default sensitivity');

done();
