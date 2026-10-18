# Optimization notes

Scope: the main app in `src/` (React 19, Vite 8, plain CSS) and the separate `component-demo/` app. Written 2026-10-17. No source file was changed. The only file written is this one. Measurement scripts live in the session scratchpad, not in the repo.

Legend: **[M]** measured in this session (numbers below). **[I]** inferred from the code or from general browser behaviour, not measured here.

Ranking: by expected impact on the live demo. Item 1 comes first because a failure there is total, not gradual.

---

## 0. How the measurements were made

- Production builds written to the scratchpad (`npx vite build --outDir ... --sourcemap`). The repo `dist/` was not touched.
- Served with `python3 -m http.server`. Chrome 155 headless, driven over the DevTools Protocol. Mobile emulation at 390x844, DPR 2.
- Idle windows of 3 to 4 s after a 2.5 to 3 s settle. This is the steady state of the demo with liquid animations running.
- Two cost views: DevTools trace events (Paint, Layout, UpdateLayoutTree) and `Performance.getMetrics` (TaskDuration, RecalcStyleDuration, LayoutDuration), with and without 4x CPU throttling.
- Headless Chrome on a Mac is not a phone. Absolute milliseconds are indicative. The on/off ratios are the useful part.
- Not done: Lighthouse runs, real Android or iOS devices, real network throttling. Commands for these are in section 6.

---

## 1. Baseline sizes [M]

| Artifact | Raw | gzip | Notes |
| --- | --- | --- | --- |
| Main app JS | 263.09 kB | 81.20 kB | one chunk, 44 modules, no build warnings |
| Main app CSS | 28.77 kB | 6.27 kB | |
| Main `index.html` | 0.73 kB | | |
| component-demo JS | 1,364.09 kB | 420.76 kB | 4,078 modules, Vite warns about chunks over 500 kB |
| component-demo CSS | 38.76 kB | 11.94 kB | |

Source-map grouping, approximate because it is pre-minify:

- component-demo: react-aria, react-aria-components, react-stately and `@internationalized/date` together are about 40% of source bytes. Motion (`motion-dom` plus `framer-motion`) is about 18%. Leaflet is about 10%. `react-gauge-component` is about 5%. `downshift` is about 4%.
- Main app: React DOM is most of the 263 kB [I]. The app's own code (pages, engine, data, components) is a small share. The sourcemap attributes almost all bytes to `react-dom` because it maps development sources, so the exact split is not reliable.

---

## 2. Liquid animations (LiquidMeter, LiquidRing)

### 2.1 Measured

Idle page, 3 s DevTools trace, animations on. Liquid element count is the number of `.liquid` plus `.liquid-ring` nodes on the page at its default state.

| Page | Liquid elements | Paint events | Paint ms | Style recalcs | Style ms | Layout events | Layout ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `#moving` | 3 | 360 | 84 (run 2: 55) | 180 | 85 (run 2: 62) | 180 | 30 (run 2: 22) |
| `#risk-report` | 4 | 905 | 225 (run 2: 177) | 181 | 96 (run 2: 75) | 0 | 0 |

With animations off (a `*{animation:none!important;transition:none!important}` style injected after load), the same 3 s window had zero Paint, Layout and Style events on both pages.

Ablation on `#moving`, one family off at a time, two separate runs:

| Case | Run A: layouts per s (CDP) | Run B: layout events per 3 s (trace) | Run B: paint events | Run B: style ms |
| --- | --- | --- | --- | --- |
| All on | 0 | 180 | 360 | 62 |
| Ring animations off | 0 | 0 | 180 | 51 |
| Meter animations off | 60 | 0 | 180 | 18 |
| Ring and meters off | 0 | not run | not run | not run |

Reading:

- The per-frame layout did not reproduce consistently. Run B had about 60 layouts per second with everything on. Run A had none with everything on. I could not attribute it to the ring with confidence, so treat the ring as the suspect, not the proven cause.
- What is consistent: the meter animations account for most of the style work (62 ms down to 18 ms in run B), and the ring keeps painting (180 paint events with the meters off).

On `#risk-report`, with meter animations off, paint time fell from 177 ms to 124 ms but the paint event count rose from 900 to 3,060. I did not resolve this. Paint event counts are not a clean cost measure, so use paint milliseconds, and check with the Paint Profiler (section 6).

Under 4x CPU throttling, Performance.getMetrics over 4 s:

| Page | Animations | Main thread busy | Style | Layout | Layouts per s | rAF fps |
| --- | --- | --- | --- | --- | --- | --- |
| `#moving` | on | 61 ms/s (about 6%) | 16 ms/s | 6 ms/s | 60 | 60 |
| `#moving` | off | 3 ms/s | 0 | 0 | 0 | 180 (display quirk) |
| `#risk-report` | on | 104 ms/s (about 10%) | 28 ms/s | 0 | 0 | 120 |
| `#risk-report` | off | 3 ms/s | 0 | 0 | 0 | 240 (display quirk) |

rAF rates above 60 come from the headless display and are not meaningful. What matters is that the liquid animations keep the main thread busy at idle, about 6 to 10% under throttling, while the page is doing nothing.

### 2.2 Why it costs this much [I, consistent with the measurements]

- `src/components/LiquidMeter.css:24-31`: `.liquid__fill` uses a `mask` built from a data-URI SVG and animates `mask-position` (`liquid-edge`, lines 98-104). Mask position is a paint property, so every frame repaints the fill. It is not compositor-only.
- `src/components/LiquidMeter.css:43-55`: `::before` and `::after` animate `background-position` (`liquid-wave` at line 48, `liquid-wave-back` at line 54; keyframes at 106-118). That is paint every frame.
- `src/components/LiquidMeter.css:68-96`: three bubble layers animate `background-position` (`liquid-rise-*`, keyframes at 120-136). That is three more paints per frame.
- Per meter that is about four animated background or mask layers repainting at 60 fps. Multiply by the meters on screen: four on the risk report, one per risk row on the travel page (`src/pages/TravelPage.tsx:184`).
- `src/components/liquidColor.ts:22-33`: `--flow`, `--boil` and `--boil-speed` are recomputed from the value. Changing a running animation's duration re-times it, which can show as a jump when a checklist tick changes readiness [I].
- `src/components/LiquidRing.css:54` and `:73`, with `src/components/LiquidRing.tsx:13-18` and `:66`: the wave `<path>` and bubble `<circle>`s animate `transform` on SVG elements. This is a plausible source of the per-frame layouts seen on `#moving`, because SVG transform changes can go through layout in Chromium [I]. The layout counts did not reproduce reliably across runs (section 2.1), so confirm it in the Performance panel before rebuilding the ring.
- Nothing pauses off-screen. There is no `IntersectionObserver` anywhere in `src/`. Meters below the fold (`risk-card__meter` in `src/pages/RiskReportPage.tsx:148`, travel risk rows) keep painting.
- Already good: reduced motion turns the animations off (`LiquidMeter.css:138-151`, `LiquidRing.css:118-128`, plus the same pattern in other CSS files). Keep it.

### 2.3 Recommendations

**2.3a Meters: move the animation onto transforms of a few static layers** (see ranking item 2)

- Structure each meter as: a static `.liquid__fill` with `overflow: hidden` and no mask, containing
  - `.liquid__wave`: an element about 200% wide with the wave pattern as `background-image`, looped with `transform: translate3d(-50%, 0, 0)`. Put two copies of the wave period in the element so the `-50%` loop is seamless.
  - `.liquid__crest`: a narrow element pinned to the fill's trailing edge, containing the vertical edge pattern repeated to about 200% height, moved with `translateY`. This replaces the mask-position animation.
  - `.liquid__bubbles`: one pre-rendered bubble tile (merge the three layers into one or two tile sizes), moved with `translateY`. Keep `opacity: var(--boil)`, which is compositor-friendly.
- Put `will-change: transform` only on those layers (about three per meter). Check the Layers panel afterwards so the page does not create hundreds of layers.
- Expected impact: removes the per-frame paint and style work for meters. Only compositing remains [I]. Re-run the trace in section 6 to confirm.
- Effort: about half a day, including a visual check against `Design/Moving.png` and `Design/Risk Report.png`.

**2.3b Quick version (about 30 minutes, lower gain)**

- Pause what is off-screen: an `IntersectionObserver` hook sets a `data-paused` attribute, and CSS sets `animation-play-state: paused` on it. Helps only the meters below the fold.
- On phone widths (`@media (max-width: 560px)`), render one bubble layer instead of three.
- Keep `--flow` and `--boil-speed` constant after mount, so a value change does not re-time running animations.

**2.3c Ring: make the wave and bubbles HTML transform layers** (see ranking item 3)

- First confirm the cost: in the DevTools Performance panel, record `#moving` at 4x throttling and look for Layout entries repeating every frame. If they are absent, the ring is only a paint cost and the change is lower priority.
- Keep the SVG arc. Its one-shot `stroke-dashoffset` transition (`LiquidRing.css:31-33`) costs nothing per frame.
- Move the glass, surface, wave and bubbles into HTML: a round container with `overflow: hidden; border-radius: 50%`, a surface child moved with `transform`, a wave child animated with `transform`, and bubble spans animated with `transform` and `opacity`. Everything stays on the compositor.
- Expected impact: removes the ring's per-frame paint and any per-frame layout on `#moving` and `#travel` [I]. The layout part is unconfirmed (section 2.1).
- Effort: about half a day, including a check against the design.

---

## 3. Rendering and React

Measured: an idle page with no animations has zero paint, style and layout work (section 2.1). React re-renders are not on the hot path today. Optimise the CSS first.

Findings:

- `src/main.tsx:6-10`: `StrictMode` double-invokes effects in development only. No production cost. Keep it.
- `src/App.tsx:31-50`: the route is read with `useSyncExternalStore` on `hashchange`. A route change remounts one page. This is fine.
- `src/pages/MovingPage.tsx:37` and `src/pages/RiskReportPage.tsx:58`: `scoreReport(...)` runs on every render. It is pure and cheap (`src/engine/movingRisk.ts:82`). Wrap it in `useMemo(..., [doneActions])` only if the React Profiler shows it [I, cheap].
- `src/pages/TravelPage.tsx:33-49`: `assessTravel(...)` and the `checklistItems` array are rebuilt on every render, including each change to a date field. Cheap. The new array reference also stops `Checklist` (`src/components/blocks.tsx:100`) from being memoised. Do nothing unless the profiler says so.
- `src/state/useStoredSet.ts:16-22`: the effect writes `localStorage` on mount as well as on change. Harmless. A ref can skip the first write.
- `src/state/movingPlan.ts:18-27` and `src/pages/RiskReportPage.tsx:57`: `useState(loadMovingPlan)` passes the function as a lazy initializer. Correct. Keep it.
- `src/components/LiquidRing.tsx:37-41` and `src/pages/RiskReportPage.tsx:232-240`: both animate from zero with `requestAnimationFrame` plus `setState`. That adds one render per mount. Negligible.
- No Context providers, so there is no context-driven re-render problem.
- `src/pages/HomePage.css:54`: `backdrop-filter: blur(8px)` on `.moments-panel`. The cost is one raster while the content behind is static. It becomes per-frame if the content behind moves or the page scrolls on a phone [I]. Remove it if home-page scrolling looks janky on a device.
- `src/components/SiteLayout.css:25`: a sticky header. Fine.

Recommendation: do not optimise React now. Use the React Profiler (section 6) when the real data layer arrives, since that is where fetch-driven re-renders would appear. Expected impact of the items above: small, under 1 ms per interaction [I]. Effort: small.

---

## 4. Bundle and loading

### 4.1 Main app

- `src/App.tsx:3-7`: all five pages are imported statically, so there is one chunk (263 kB, 81 kB gzip). `React.lazy` plus `Suspense` for `RiskReportPage`, `TravelPage` and `MemberBenefitsPage` (`src/App.tsx:17-23`) would move their code out of the first load. App code is a minority of the bundle [I], so expect a single-digit to low double-digit kB gzip saving. Effort: small. Impact: low today. Do it once the demo merge adds weight.
- `index.html:7-12`: two preconnects and a render-blocking Google Fonts stylesheet. The CSS request returned HTTP 200 here (848 bytes) [M]. The font files are split into unicode-range subsets. Seven Onest subset files were fetched to measure them, between 10.5 kB and 33.8 kB each [M]. The browser downloads only the ranges the page needs. Fix in section 5.
- `src/index.css:26`: `font-family: 'Onest', system-ui, sans-serif`. The fallback is correct. The `display=swap` in the Google URL is also correct.
- Images: no raster images are referenced from `src/` or `public/` [M]. `Design/*.png` (1.2 to 1.5 MB each) and `data/` (4.7 MB) are not imported. Keep them out of `public/` and out of the bundle [M].
- `public/icons.svg` (5 kB) is not referenced anywhere in `src/` [M]. Delete it if still unused. `public/favicon.svg` (9.5 kB) could be run through SVGO. Trivial.
- Icons are inline SVG in `src/components/Icon.tsx`. No extra requests. Good.
- The data-URI SVGs in `LiquidMeter.css:26`, `:45`, `:52` are small and decoded once. Fine.

### 4.2 component-demo, before merging

- Do not merge the demo wholesale. It adds 421 kB gzip [M]. Cherry-pick the components the story uses.
- The liquid files in `component-demo/src/components/` are byte-identical to the main app's `src/components/` [M, `diff -q`]. Import them from `src/components/` instead of copying.
- Leaflet (about 10%): load it only on the map route with a dynamic `import()`. Leaflet tiles also need the network, which breaks an offline demo. Use a static image for the offline run.
- The react-aria family (about 40%): tree-shakes, so the cost is in what is imported. Check which components the demo actually uses and drop the rest.
- Motion (about 18%): `LazyMotion` with the smallest feature set cuts the size considerably [I]. Check the motion docs for the exact import.
- `react-gauge-component` (about 5%): the main app already has its own gauge (`RiskGauge`, `src/pages/RiskReportPage.tsx:232-270`). Use that and drop the dependency.
- Demo working tree is mid-change: `git status` shows edited and deleted demo files. These numbers describe the current working tree.

---

## 5. Offline and demo reliability

### 5.1 Measured

- Opening `dist/index.html` straight from disk (`file://`) renders an empty `<div id="root">` in headless Chrome [M]. The built script is `type="module"` with absolute `/assets/...` paths, and Chrome blocks module scripts from `file://`. The same build served over `http://127.0.0.1` renders correctly [M]. The demo cannot be double-clicked from the folder.
- The Google Fonts CSS was reachable from this machine [M]. Offline, the request fails and the page falls back to `system-ui` [I, not tested offline].
- No service worker, no manifest and no `fetch` call in `src/` [M, grep]. The app has no runtime network dependency except the font. The gap is that nothing caches the files for a new offline session.
- A phone on the LAN (`http://192.168.x.x`) is not a secure context, so a service worker will not register there [I, standard browser rule].

### 5.2 Recommendations

1. Demo from a production build served over HTTP, not `npm run dev`. For a phone on the same Wi-Fi: `npm run build && npm run preview -- --host --port 4173 --strictPort`. Effort: small. Impact: the judged bundle, no HMR overhead.
2. Self-host Onest. Either `npm i @fontsource-variable/onest` and import it from `src/`, or copy the Latin woff2 into `src/assets/` and reference it with `@font-face` (`font-display: swap`, `font-weight: 400 700`). Remove the Google `<link>`s at `index.html:7-12`. Importing from `src/` lets Vite hash the file, which gives correct cache headers and lets a service worker precache it. Effort: small (30 to 45 minutes). Impact: no external origins, no render-blocking CSS, and the font works offline.
3. Add a precaching service worker with `vite-plugin-pwa` (`generateSW` mode, `registerType: 'autoUpdate'`). Precache `**/*.{js,css,html,svg,woff2}`. That is about 300 kB including the font [I, from the sizes above]. After one online visit the app loads and runs offline. Effort: medium (1 to 2 hours with testing). Requires HTTPS or `localhost`; for a phone, use a tunnel with HTTPS or a local `mkcert` certificate. Test with DevTools > Application > Service Workers > Offline, and bump the version before the rehearsal so stale caches do not surprise you.
4. Keep the demo data in code. `src/data/movingReport.ts` is inline and the app reads only `localStorage`, so the journey needs no network. When the open-data layer arrives (per `context/techStack.md`), bundle its snapshots rather than fetching them at demo time [I, design advice].
5. Keep a screen recording of the full flow as insurance. It costs nothing and covers the case where the venue network or the device fails.

---

## 6. How to measure each point

Production size and gzip:

```bash
npm run build
ls -l dist/assets
gzip -c dist/assets/*.js | wc -c
```

Bundle map (installs from npm the first time; not run in this session):

```bash
npx vite build --sourcemap --outDir /tmp/lm-map   # or a scratchpad path
npx source-map-explorer dist/assets/*.js            # per-module treemap
npx vite-bundle-visualizer                          # alternative treemap
```

Lighthouse, mobile, with a throttled network (not run in this session):

```bash
npm run build && npm run preview -- --port 4173 &
npx lighthouse "http://127.0.0.1:4173/#moving" --form-factor=mobile \
  --throttling-method=simulate --only-categories=performance --view
```

Animation and paint cost in Chrome DevTools:

- Performance panel. Set CPU throttling to 4x, record 3 to 5 s on `#moving`, then `#risk-report`. Look for Paint, Layout and Recalculate Style entries repeating every frame.
- Rendering tab (More tools > Rendering): turn on Paint flashing and Layer borders. Liquid meters should flash continuously while animating, and the flashing should stop after the change in 2.3a.
- More tools > Animations: flags non-composited animations, which is what `mask-position` and `background-position` produce [I].
- Layers panel: check the layer count after adding `will-change`.

Scripted, the same way this session measured it: connect to Chrome with `--remote-debugging-port`, enable `Emulation.setCPUThrottlingRate`, and read `Performance.getMetrics` before and after a 4 s wait. The scripts are in the session scratchpad: `measure-throttled.mjs`, and `trace4.mjs` for the per-family trace ablation.

React:

- React DevTools > Profiler. Record, then tick a task, change a travel date, and switch routes. Turn on "Highlight updates when components render" to see which components re-render.

Fonts and network:

- DevTools Network panel with "Slow 4G" and "Disable cache". Check the font request timing and the number of origins.
- Offline test: DevTools Network > Offline, then reload.

Real devices (the most important measurement, not yet done):

- Android: Chrome on a mid-range phone, `chrome://inspect` for remote DevTools.
- iOS: Safari on the phone, then Develop > [device] > page in desktop Safari's Web Inspector.
- Check on a phone: scroll smoothness on the risk report, meter animation smoothness, first paint time, and whether the app loads with Wi-Fi off.

---

## 7. Measured versus inferred, in short

Measured in this session:

- Bundle sizes for the main app and component-demo, and per-package weights from the sourcemaps (approximate).
- Liquid animation cost on the idle page: paint, style and layout events, and main-thread time at 1x and 4x CPU. Ablation of ring versus meter animations.
- Per-frame layouts on `#moving` appeared in some runs and not others. Their cause is not established.
- Zero paint, style and layout work when animations are off.
- `file://` loading fails; `http://` loading works.
- Google Fonts CSS reachable; Onest subset sizes.
- Liquid files duplicated byte-for-byte in component-demo.
- No `fetch`, no service worker, no `IntersectionObserver`, no raster images in use.

Inferred, not measured:

- Expected gains from the transform rewrites (2.3a, 2.3c).
- That the ring causes the per-frame layouts. The evidence is mixed (section 2.1).
- Phone-specific cost and battery effects (the 4x throttle is only an approximation).
- Offline font fallback behaviour (the font was not blocked during the test).
- Motion `LazyMotion` saving, and the exact size of each code-split gain.
- The mechanism for SVG transform layouts in Chromium.

Not measured at all: Lighthouse scores, real devices, and the paint-cost split of the risk-report meters (section 2.1).

---

## 8. Ranked recommendations

| # | Recommendation | Expected impact | Effort | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Make the demo offline-proof: run a production build, self-host Onest, add a precaching service worker | High: removes the total-failure modes (`file://` blank page, font request, no cache) | Small for build and font; medium for the service worker | Section 5.1 [M]; `index.html:7-12` |
| 2 | Move meter animations onto transforms of static layers, pause off-screen meters | High on phones: about 6 to 10% of main thread busy at idle under 4x throttle [M] | Medium (half a day) | `LiquidMeter.css:24-31, 43-55, 68-96`; section 2.1 [M] |
| 3 | Confirm, then rebuild the ring's wave and bubbles as HTML transform layers | Medium, unconfirmed: per-frame layouts on `#moving` appeared in some runs only [M]; the ring's paint cost is certain | Medium (half a day) | `LiquidRing.css:54, 73`; `LiquidRing.tsx:13-18, 66`; section 2.1 [M] |
| 4 | Cherry-pick from component-demo and lazy-load Leaflet and the react-aria family, do not merge wholesale | High if done naively: avoids adding 421 kB gzip [M] | Small to medium | Section 4.2 [M] |
| 5 | Route-level code splitting with `React.lazy` in `App.tsx` | Low today, rises as the demo grows | Small | `src/App.tsx:3-7, 17-23` [M for structure, I for gain] |

Lower priority, do only if a device test shows a problem:

- `HomePage.css:54` backdrop blur on phones.
- Memoising `scoreReport` and `assessTravel` (`MovingPage.tsx:37`, `RiskReportPage.tsx:58`, `TravelPage.tsx:33`).
- Removing the unused `public/icons.svg`, trimming `favicon.svg`.
- Skipping the first `localStorage` write in `useStoredSet.ts:16-22`.
