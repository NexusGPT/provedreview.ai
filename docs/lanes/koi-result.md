# Lane koi: the result

The koi hero was rebuilt with the ascii-sharks approach. The koi are still the owner's photo (`public/koi-body.png` and its two pectoral fins, with the hinges from `public/koi-straight.json`), read into the same ASCII tile grid, glow and motes on the dark ground. What changed is how they move and how the engine runs. Everything is in `engine.js`. In `index.html` the hero copy block gains `data-koi-avoid` and the inline IntersectionObserver is gone: the engine now owns `window.__koiIdle`. `NOTICES` carries the MIT notice. Checks, shots and results are under `docs/shots/koi/`.

## What was ported, and how

**Steering (R3).** Each koi has a heading and a speed. The desired direction is the sum of: momentum; a bounded random-walk wander (weight 0.35); a patrol, made of the tangent of the koi's own ring plus a radial pull back to it, which wins once the koi is well off the ring; a push out of the steering ellipse, tested at the head and at 0.35 L and 0.7 L ahead; and an edge pull toward the patrol centre. The heading turns toward the desired direction at min(0.6 rad/s, speed / 0.22 L). Speed eases to its target with k 1.1.

- **Headline ellipse.** It passes through the corners of `[data-koi-avoid]` (rx = w/√2, ry = h/√2). The steering ellipse is that ellipse grown by 0.42 body lengths. Both are measured on every ResizeObserver callback, from the viewport and from the copy block itself, so a late font load counts too.
- **Patrol.** The patrol is the largest ellipse in the free water: inside the viewport and clear of the steering ellipse. It is found by searching over centres and aspects. The koi rings are 1, 0.74 and 0.5 of it.
- **Body length.** Length is 0.4 of the short side (100 to 400 px), then shrunk until the patrol's short radius is at least 0.65 L.
- **Pace.** The fixed orbit is gone; the 2.5-minute pace is the patrol period, `PERIOD = 150`. Speed is the feedforward speed for the current point on the ring, times a phase lock (0.8 to 1.3) that catches up after detours.
- **Wall backstop.** If the head is ever inside the steering ellipse, it may not swim inward and slides along the boundary. It never fired in the sweeps.
- **No separation rule.** The sharks have one. Here it made the counter-turning koi pirouette (full 360° loops), so it was dropped. The rings keep the koi apart, and where two cross the smaller one passes beneath.

**Body (R2).** The sim spine has 16 nodes, follow-the-leader with a 0.16 rad bend limit per joint. At draw time a travelling wave goes on a copy of the spine: amplitude 0.04 L × (0.1 + 0.9 s^1.8) × speed factor, phase lag 4.8 rad from head to tail. The beat rate is 0.16 + 3.2 · speed / L Hz.

- Every cell near a koi is sampled five times. Each sample is projected onto the nearest spine segment to get (s, v) and read from a mip of the photo. A turn therefore bends the whole photo, tail fin included; nothing rotates as a flat image.
- The pectoral fins are cut out of the body and drawn beneath it, each hanging on its hinge in the spine frame there. bank = clamp(turn × 1.4, ±0.35): the outside fin spreads (rotated out by 0.55 × bank, scaled by 1 + 0.7 × bank) and the inside fin folds. A slow flap rides on top.
- The photo is drawn 1.25× wider across the body than along it (`WIDE`). At 1:1 the slender photo koi read as a 2-to-3-cell line.

**Variation (R4).** Three koi: sizes 1, 0.84 and 0.7, dim 1, 0.81 and 0.64 (alpha), smaller ones drawn first. Speed comes from length, direction alternates by index, and tail phase, wander, ring jitter and start angle are random. Everything is seeded: `?koiseed=N`, or seed 1 under reduced motion so the still is stable.

**Engine (R8).** A fixed 1/60 s step with an accumulator, dt clamped to 0.1 s, at most 4 steps per frame, and one draw per frame on a single requestAnimationFrame.

- **Pause.** The loop stops (rAF cancelled, not polled) while the hero is off screen (IntersectionObserver) or the tab is hidden (visibilitychange). `window.__koiIdle` reports which.
- **Reduced motion.** The engine settles 4 s of simulation, draws 30 frames, then stops, and re-draws on resize.
- **Allocation.** DPR is capped at 2. Nothing is allocated per frame: the cell buffers are typed arrays rebuilt only on a grid change, every colour string is built once, and the draws are counting-sorted by colour so each colour sets fillStyle once.
- **No readback.** There is no `getImageData` per frame any more. That call cost master's engine about 27 ms of script per frame at 1440.

**Wake field (R7).** Not built.

Also removed:

- The pointer parallax of the near motes (docs/DESIGN.md: "no parallax"). The pointer brightening of lit cells stays.
- The fixed far koi.
- The `#plate` glass pass (index.html has no `#plate`). The `#glass` canvas stays in the page, unused.

## Checks: `node docs/shots/koi/koi-check.mjs <base>`, headless Chromium

Red first: run against master's engine, the script fails at load (`waitForFunction: Timeout`). Master has no seeded simulation to test, and a frame wrapper measured it at about 27 ms of script per frame at 1440.

Green, seeds 1 to 3, from `results.json`. The run is on the branch rebased onto master b21084f and on the built site (`node scripts/build.mjs`, `dist/` served):

| check | result |
|---|---|
| exclusion, 60 s, every step rasterised, every lit photo sample | min e² 2.20 at 1440, 1.81 at 390 (must be ≥ 1) |
| pace, 400 s, every circuit of every koi | 18 circuits at each size, 130.5 to 165.0 s at 1440, 127.7 to 166.5 s at 390 |
| budget, 600 live frames at 1440×900 | 3.44 ms average (1.78 ms in a quieter run before the rebase); machine load average was 57 on 32 cores |
| hidden tab | `__koiIdle` true, rAF stopped, 0 frames while hidden, resumes |
| hero off screen | idle and stopped below, running at the top |
| resize | the ellipse at 390 equals the one computed from the DOM, and differs from the one at 1440 |
| reduced motion | 30 frames, then stopped; the canvas is byte-identical at 2 s and 3 s |

A wider sweep, done during the work and not part of the script: 6 seeds × 460 s at 1440, 390, 1024×768 and 1920×1080. Every circuit fell between 120 and 169 s (6 seeds × 3 koi × ~3 circuits per size), and every min e² was ≥ 1.35. That sweep ran on the build just before `WIDE` and the 0.4 L length; the script's checks ran on the final build.

The page's own `scripts/check.mjs` gives the same hero-vs-q4 diff on this branch as on the branch base e6a9af1 (the kicker text and the phone reorder), so nothing new.

## Shots, read back

- `docs/shots/koi/koi-{1440,390}-{00,05,20,60}s.png` are taken at simulated time 0, 5, 20 and 60 s, seed 1.
- `strip-{1440,390}.png`: 20 frames 0.5 s apart from t = 20 s. The loop is held and the simulation advanced exactly 0.5 s between frames, every step drawn.
- `reduced-1440.png` is the reduced-motion still.

At 1440 the 60 s still shows two koi right of the copy, one bent through an S near the stats and one partly behind the certificate. Both show orange patches and fins at the head. The strip shows the bend and the beat move along the body.

## Open, for the lead

1. **Phone.** On the phone the copy block's ellipse covers the top half. The only free water is behind the certificate card (an opaque glass panel) and the stats, so the koi are almost invisible at 390 (see `strip-390.png`). The options are to exclude only the headline and sub on narrow screens, to let the koi pass under the copy there, or to keep it as is. It is a design call.
2. **Merge.** The branch is rebased onto master b21084f. Master had rewritten the hero line; I kept master's line and added `data-koi-avoid` to the copy `<div>`. Against master, `index.html` differs only by that attribute and the removed inline observer. Master's build rebases `'/public/` and `` `/public/ `` strings in engine.js, and both asset paths here use those forms. The build was run with `node_modules` borrowed from the docs-build lane (no network) and was not committed.
3. **SECTIONS.md** still says the engine "keeps every motion parameter" and that the page sets `__koiIdle`. Both are stale now; I don't own that file.
