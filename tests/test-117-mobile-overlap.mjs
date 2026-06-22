// (build 167) Mobile multiplayer layout: the buff-timer list no longer overlaps the ammo panel; the PvP
// scoreboard drops below the score panel instead of overlapping it; the minimap is solidly visible (no
// longer washed out against the grid in sparse scenes like waves).
import { html, done, assert } from './harness.mjs';

assert(/body\.touch #buffs \{ top: calc\(100px \+ env\(safe-area-inset-top\)\); left: calc\(82px \+ env\(safe-area-inset-left\)\); gap:4px; \}/.test(html), 'buff list sits below the left panel stack on touch');
assert(/body\.touch \.buff \{ padding:3px 7px; font-size:10px; \}/.test(html), 'buff chips shrink on touch');
assert(/body\.touch #scoreboard \{ top: calc\(86px \+ env\(safe-area-inset-top\)\);/.test(html), 'scoreboard drops below the score panel');
assert(/body\.touch #minimap \{ background: rgba\(7,13,18,0\.88\); border-color: rgba\(var\(--accent-rgb\),0\.6\)/.test(html), 'minimap is solidly visible on touch (themable accent)');
assert(!/transform: scale\(\.8\); transform-origin: top right; \}/.test(html), 'old washed-out minimap scale removed');
done('mobile multiplayer overlap fixes');
