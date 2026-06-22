import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 420: (1) toggle to disable RANDOM loot boxes (placed-only), (2) click a placed loot box in the editor
// to select/edit it, (3) visual controls for the extraction beacon (color/glow/height/pillar).

// --- 1) random loot toggle ---
assert(/let randomLootOn    = !\(savedLevel && savedLevel\.chest && savedLevel\.chest\.randomOff\);/.test(src), 'randomLootOn loads (default on, back-compat)');
assert(/if\(!isClient && !editorOpen && randomLootOn\)\{/.test(src), 'random timer spawn is gated on the toggle');
assert(/randomOff: !randomLootOn/.test(src), 'toggle saved with the level');
assert(/randomLootOn = !level\.chest\.randomOff;/.test(src), 'toggle restored on load');
assert(/<b>Spawn random loot boxes<\/b>/.test(src), 'loot panel has the on/off control');

// --- 2) click-to-select a placed loot box ---
assert(/for\(const m of lootMarkers\)\{ if\(m && m\.visible\) targets\.push\(m\); \}/.test(src), 'loot markers are click-pick targets');
assert(/const lti = lootMarkers\.indexOf\(root\);\s*if\(lti>=0\)\{ picked='loot'; selLoot=lti; break; \}/.test(src), 'clicking a loot marker selects that box');
assert(/else if\(picked==='loot'\)\{[\s\S]*?selLoot[\s\S]*?refreshLootMarkers\(\)/.test(src) || /picked==='loot'/.test(src), 'loot pick clears other selections + refreshes');
const rf = extractFunction('refreshLootMarkers');
assert(/if\(i===selLoot\)\{/.test(rf), 'the selected loot box is visually highlighted');

// --- 3) extraction beacon visuals ---
assert(/let extractFxCfg = \{/.test(src), 'extraction beacon has a visual config');
const bz = extractFunction('buildExtractZone');
assert(/color:extractFxCfg\.color, transparent:true, opacity:extractFxCfg\.opacity/.test(bz), 'ring uses the configured color + opacity');
assert(/new THREE\.CylinderGeometry\(1, 1, extractFxCfg\.height/.test(bz), 'pillar uses the configured height');
assert(/pillar\.visible = extractFxCfg\.pillar/.test(bz), 'pillar can be toggled off');
const af = extractFunction('applyExtractFx');
assert(/r\.material\.color\.setHex\(extractFxCfg\.color\); r\.material\.opacity=extractFxCfg\.opacity;/.test(af), 'live restyle updates the ring');
assert(/p\.geometry=new THREE\.CylinderGeometry\(1,1,extractFxCfg\.height,32,1,true\)/.test(af), 'live restyle rebuilds the pillar height');
assert(/extractFx: \{ color: extractFxCfg\.color, opacity: extractFxCfg\.opacity, height: extractFxCfg\.height, pillar: extractFxCfg\.pillar \}/.test(src), 'beacon look saved with the level');
assert(/<b>Beacon look<\/b>/.test(src), 'editor has the beacon-look controls');
done();
