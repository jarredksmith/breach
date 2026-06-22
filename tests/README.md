# BREACH test harnesses

Headless Node regression suite for `breach.html`. Reconstructed against **build 28**
(the original `.mjs` files from earlier sessions did not persist — Claude's container is
wiped between sessions). These pin the current behavior using the REAL three.js r149 and
Rapier 0.19.3, not just hand-rolled assertions.

## Run
Place this `tests/` folder next to `breach.html`:
```
your-folder/
  breach.html
  tests/
```
Then:
```
cd tests
npm install      # pulls three@0.149.0 + @dimforge/rapier3d-compat@0.19.3
npm test         # runs every test-*.mjs, prints a summary
```

## What's covered
1. syntax — every <script> block parses; exactly one BUILD_VERSION
2. build-version — "build N · YYYY-MM-DD" format
3. weapons — WEAPONS table fields + internal consistency
4. reload — mag/reserve transfer conserves rounds, no over/underflow
5. light-budget — <=8 lit at base; >8 keeps nearest 8 (real three lights)
6. prop-collider — per-mesh boxes stay tight, no setFromObject fusion (real three geo)
7. serialize — propTuple/tupleEq 9-tuple, 1e-4 tolerance, JSON round-trip
8. duel — DUEL_SPAWNS modulo wrap, distinct points, positive kill credits
9. world-defaults — DEFAULT_WORLD schema + sane values; ARENA agreement
10. player-constants — EYE/STEP/radius/PLAYER_HEIGHT relationships
11. physics-rapier — dynamic box falls + rests on floor (real Rapier, gravity from DEFAULT_WORLD)
12. coins — magnetism within 6u, pickup within 1.6u credits once, expiry

## How it works
`harness.mjs` brace-matches and extracts individual functions/literals straight out of
the game's big <script> block, then evals them with real libraries and mocks for the rest.
This means tests track the actual source — if you rename/restructure a function the test
extracts, the extractor will fail loudly and the regex/name should be updated.

## Re-uploading
Claude can't keep files between sessions. At the start of a session, upload `breach.html`
**and** this `tests/` folder (zip is fine) so the suite can run again.
