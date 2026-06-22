// Build/Edit-from-menu (build 34+): enter the editor without starting combat; waves stay suspended
// while the editor is open and begin when it closes.
import { extractFunction, gameSource, html, done, assert } from './harness.mjs';

// menu has the button + it's wired
assert(/id="editBtn"/.test(html), 'menu shows a Build / edit level button');
const bind = extractFunction('bindMenu');
assert(/editBtn'\)\s*;\s*if\(eb\)\s*eb\.onclick=enterEditor/.test(bind.replace(/\s+/g,' ')) || /eb\.onclick=enterEditor/.test(bind), 'editBtn wired to enterEditor');

// enterEditor: full init, then suspend waves + open the editor
const ee = extractFunction('enterEditor');
assert(/startGame\(\)/.test(ee), 'enterEditor builds the world via startGame');
assert(/wave = 0/.test(ee) && /toSpawn = 0/.test(ee), 'enterEditor suspends combat (wave 0 / nothing queued)');
assert(/enemies\.length=0/.test(ee), 'enterEditor clears any enemies');
assert(/toggleEditor\(\)/.test(ee), 'enterEditor opens the editor');

// wave + chest spawning are paused while the editor is open
const src = gameSource();
assert(/!duelMode && !editorOpen\)\{[\s\S]*?objectiveTick\(dt\);[\s\S]*?if\(toSpawn>0\)/.test(src), 'wave spawning is gated on !editorOpen');
assert(/if\(!isClient && !editorOpen && randomLootOn\)\{\s*\n?\s*chestTimer/.test(src), 'chest spawning is gated on !editorOpen AND the random-loot toggle');

// closing the editor with wave 0 / no enemies organically starts wave 1 (the existing auto-advance)
assert(/else \{ wave\+\+; SFX\.wave\(\); startWave\(\); \}/.test(src), 'closing build mode auto-starts wave 1 via the wave-advance path');
done('build/edit from menu (combat suspended in editor)');
