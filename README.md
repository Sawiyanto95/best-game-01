# Tideglass

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Sawiyanto95/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Sawiyanto95/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original luminous loop-hunting game. Pilot a tiny silk-trailing skiff through a sleeping sea, enclose golden sparks and predatory creatures, and release your ribbon to capture them. Wake three lanterns with 36 sparks before the 150-second tide returns.

## Run it

Requires Node.js 22.18 or newer. No installation or build step.

```sh
node serve.ts
```

Open **http://127.0.0.1:8080** in desktop Chrome. All resources are local. The game also works by opening `game/index.html` directly.

- **Enter** or click **Begin Voyage**: start. **Enter / R**: restart after a voyage.
- **WASD / arrows**: steer. Diagonal movement has the same speed.
- **Hold Space / left mouse** while moving: draw silk. **Release**: close the shape with a straight line and capture everything inside.
- **Shift**: dash through hunters; cuts an unfinished ribbon. Recharges in three seconds.
- **P / Escape**: pause or resume. **M**: toggle synthesized sound and ambient music.

Twelve sparks wake each lantern, repair one hull point, refill silk, and clear the hunters. Each lantern increases the danger: drifting hunters get faster, and needle hunters telegraph a straight charge. Watch your hull, thread reserve, and time. Empty loops do not score; successful loops chained within eleven seconds multiply the haul up to ×5. Winning adds time and hull bonuses. At the first two lanterns, choose one of two blessings with **1 / 2** or a click: faster weaving versus more silk, then faster dashes versus extra hull. Your best haul is saved locally when storage is available.

## Entry build

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` and `screenshots/` to `out/` and writes the deterministic `dossier.json` using the kit's unchanged `vendor/makefun-game.ts`.

The game uses original procedural Canvas 2D art and WebAudio synthesis, without libraries, images, audio files, external fonts, or runtime network access. Source responsibilities are split between configuration, geometry, input, audio, simulation, rendering, and application flow in `game/src/`.

The screenshots are unedited stock Chromium renders at 900 × 570: title, keyboard-controlled gameplay with its HUD, the actual victory screen, and a lantern blessing choice. See `VALIDATION.md` for the local checks.

MIT licensed. This directory is the prepared entry; publishing and competition submission are separate steps.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bc76ffwb&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
