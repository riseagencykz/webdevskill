# Performance

## Budgets

Enforce these in CI (Lighthouse CI or bundle-size checks) so regressions are
caught by a machine, not by a user.

| Metric | Target | Fails at |
|--------|--------|----------|
| LCP (largest contentful paint) | ≤ 2.5 s | > 4 s |
| INP (interaction to next paint) | ≤ 200 ms | > 500 ms |
| CLS (cumulative layout shift) | ≤ 0.1 | > 0.25 |
| TTFB | ≤ 0.8 s | > 1.8 s |
| Initial JS (gzipped) | ≤ 170 kB | > 300 kB |
| Fonts | ≤ 2 families, ≤ 4 weights | — |

Measure on a throttled mid-tier mobile profile. Your laptop on office wifi is
not the user.

## LCP — Get the Main Thing on Screen

- Identify the LCP element (Lighthouse names it). Usually a hero image or H1.
- Preload it; do **not** lazy-load it. `loading="lazy"` on the hero image is a
  common self-inflicted LCP regression.
- Serve modern formats (AVIF/WebP) at the rendered size, with `srcset`.
- Remove render-blocking resources: inline critical CSS, `defer` scripts.
- Fix the server side first if TTFB is high — no frontend trick beats a slow
  origin. Cache at the CDN.

## CLS — Stop the Page Jumping

- Every image and video: explicit `width`/`height` or `aspect-ratio`.
- Reserve space for ads, embeds, banners, and async content before it arrives.
- `font-display: swap` **plus** a fallback with matched metrics
  (`size-adjust`, or a framework font loader) — otherwise swap itself shifts text.
- Never insert content above existing content after load.

## INP — Keep Interactions Snappy

- Break long tasks (> 50 ms). Yield with `await scheduler.yield()` or chunking.
- Debounce expensive handlers; throttle scroll/resize with `requestAnimationFrame`.
- Virtualize long lists (TanStack Virtual) — rendering 5,000 rows is never right.
- Memoize only measured hot paths. `useMemo` everywhere adds cost and hides bugs.
- Animate `transform` and `opacity` only. Animating `width`, `top`, or
  `box-shadow` forces layout/paint every frame.

## JavaScript Weight

- Analyze before cutting: `next build` output, `vite-bundle-visualizer`,
  `@next/bundle-analyzer`.
- Common heavyweights and replacements: `moment` → `date-fns`/`Temporal`;
  `lodash` → per-method imports or native; full icon packs → per-icon imports;
  chart libraries → dynamic import, below the fold.
- Dynamic-import anything not needed for first paint: modals, editors, charts,
  video players.
- Check the client/server boundary. A single stray `"use client"` can drag a
  whole subtree into the bundle (see `frontend-architecture.md`).

## Images and Fonts

- Use the framework image component (`next/image`, `nuxt/image`) — it handles
  sizing, formats, and lazy-loading correctly.
- Self-host fonts or use the framework font loader; a third-party font request
  costs a DNS + TLS round trip before any text renders.
- Subset fonts to the character set you actually use.

## Database and Network

Most "slow page" reports are backend, not frontend. Before touching bundles:

1. Time the server response alone (`curl -w '%{time_total}'`).
2. Count queries per request — look for N+1 (`data-layer.md`).
3. Look for sequential awaits that should be `Promise.all` (`api-design.md`).

## Measurement Order

Never optimize from intuition. In order: reproduce on a throttled profile →
record a performance trace → find the single biggest block → fix it → re-measure.
Ship one change at a time so you know what worked.
