# Tideglass local validation

- `node tests/simulation.cjs` passes geometry, self-crossing ribbons, all four blessings, reset, and the tide timeout.
- Stock Chromium play-test passes start → weave → capture → lantern blessing → win, plus restart, pause/resume, dash, hull loss, mouse weaving, and direct `file://` loading with no page errors.
- The game requests only `index.html`, `style.css`, and the seven local scripts from `127.0.0.1`; it has no external resources.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` succeeds twice; the two `out/dossier.json` files are byte-identical.
- Four unedited Chromium PNGs are 900 × 570 and each is at most 256 KiB.
