# Tech Stack — Life Moments Prototype

Decisions for the If Insurance hackathon prototype (see [context.md](context.md)). The prototype is a **frontend-only React app**: no backend server, no database, no accounts. The risk engine, reference data, and open-data calls all run in the browser. The goal is a polished end-to-end demo of 1–2 journeys (Moving first). It is not meant to be production infrastructure.

**Decision record:** the earlier Express + PostgreSQL plan is dropped for now. It is preserved in commit `de51562` (`git show de51562:context/techStack.md`). The [When to add a backend](#when-to-add-a-backend-or-database) section lists what would bring it back.

## Guiding principles

1. **Demo over infrastructure.** The judges score customer value, business value, and experience. Every hour spent on servers, databases, or deployment pipelines is an hour not spent on the journey.
2. **Frontend only.** Reference data is typed TypeScript in the repo. Open data is fetched directly from public APIs, with bundled snapshots as the fallback.
3. **Keep the risk engine framework-free.** `src/engine/` is plain TypeScript with no React or DOM imports. It can be tested on its own and reused by a future React Native app (see [MobileApplication.md](MobileApplication.md)).
4. **Mock data is fine; real open data is a bonus.** Every live signal has a bundled snapshot for the demo addresses, so the journey works without a network.
5. **One command.** `npm install && npm run dev`. No Docker, no migrations, no seed step.
6. **Mobile-first layout.** Design for a ~390px viewport from day one. It looks like an app in the demo video and makes a later port easier.

## Repo layout

```
JunctionX2026Project/
├── src/
│   ├── engine/       # Rules, flags, product ranking, summary template (pure TS)
│   ├── data/         # Life events, questionnaires, partners, products, open-data snapshots
│   ├── openData/     # One adapter per provider: fetch, timeout, cache, fallback
│   ├── state/        # Journey state (useReducer + Context), localStorage persistence
│   ├── screens/      # Home, questionnaire, risk overview, plans, timeline
│   └── components/   # Shared UI (flag cards, readiness gauge, bottom sheet)
├── public/
├── context/          # Brief, product spec, tech stack, mobile notes
└── package.json
```

This stays a single Vite package with no npm workspaces. If the React Native port starts, `src/engine/` and `src/data/` move into a small shared package at that point (see [MobileApplication.md](MobileApplication.md)).

## Frontend

| Concern       | Choice                                    | Why                                                                                   |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Framework     | React 19 + TypeScript + Vite (in place)   | Already scaffolded, fast HMR                                                          |
| Routing       | React Router                              | Multi-step flow: event picker → questionnaire → checklist → offers → timeline         |
| Data fetching | `fetch` in hooks, with timeout and cache | Only the open-data calls need the network. TanStack Query is not needed without a backend |
| Local state   | `useReducer` + Context                    | Journey answers, task progress, readiness score. No Redux needed                      |
| Persistence   | `localStorage` (wrapped in try/catch)     | Keeps the journey across reloads. A per-browser convenience, not durable storage      |
| Styling       | Plain CSS modules or Tailwind             | Pick one on day one and stick to it. Tailwind ports to RN via NativeWind              |
| Validation    | TypeScript types                          | Add Zod only if the questionnaire needs runtime checks                                |
| Icons/maps    | Lucide icons; Leaflet only if a map earns its place | Keep the bundle and the scope small                                         |

## Reference data — `src/data/`

There is no database. Reference data lives in TypeScript modules, not JSON, so `npm run build` (`tsc -b`) checks it against the shared types.

| Data                            | Where                       | Notes                                                                                  |
| ------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| Life events and questionnaires  | `src/data/events.ts`        | Moving (fully developed), plus "coming soon" cards for Pet, Home purchase, New job     |
| Partners                        | `src/data/partners.ts`      | Movers, tool rentals, Anticimex, Verisure, FirstVet… with status and source per entry  |
| Insurance products              | `src/data/products.ts`      | Coverage tags, illustrative price, `termsExcerpt` from public If terms                 |
| Risk rules                      | `src/engine/rules.ts`       | Code, not data: rules contain `when` functions and stay reviewable in git              |
| Open-data snapshots             | `src/data/snapshots.ts`     | Pre-fetched values for the demo addresses, used when a live call fails or is blocked   |

Full field-level detail for flags, products, and ranking: [application.md](application.md).

### Browser state

| State                                    | Where                              | Notes                                                                   |
| ---------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Journey (event, answers, event date)     | React state, saved to `localStorage` | One journey per browser. "Start over" clears it                       |
| Task progress                            | Same journey object                | Ticking a task re-runs the engine, which updates flags and readiness    |
| Open-data responses                      | Memory, then `localStorage` with TTL | Weather 1h, area statistics 30 days, buildings 7 days                |
| AI summary                               | Not stored                         | The template is computed on render. It is free and instant             |

No accounts and no auth. A journey is not shared between devices, which is fine for the demo.

## Risk engine — `src/engine/`

The core of the demo is a rule-based engine, not ML. The brief says AI training isn't required.

```ts
type Rule = {
  id: string;
  event: 'moving' | 'pet' | 'home-purchase' | 'new-job';
  when: (a: Answers, ctx: Signals) => boolean; // e.g. a.buildingYear < 1980
  flag: { id: string; category: string; title: string; why: string; severity: 'low' | 'medium' | 'high' };
  actions: string[];      // preventive steps
  partners?: string[];    // partner ids, e.g. 'anticimex'
  coverageTags: string[]; // e.g. 'water-damage' — products are ranked by these
  nudgeDaysBefore?: number;
};
```

The engine is a set of pure functions with one entry point:

```ts
evaluate(journey: Journey, signals: Signals, products: InsuranceProduct[])
  → { flags: Flag[]; rankedPlans: RankedPlan[]; readiness: number }
```

Rules emit **flags**. A separate ranking function scores insurance products against the open flags. The summary template (see [AI layer](#ai-layer)) turns the result into text. See [application.md](application.md) §5–6.

Rules are data in spirit, so the team can write them in parallel and tune the demo story without touching UI code.

## Open data (Finland)

The app uses free Finnish public data to make the flags and estimates specific to **this address, this area, this date**. This turns "old buildings have pipe problems" into "your building is from 1964, and a typical water-damage claim in Finland is about €4,000".

All sources below are free. Most need no key; those that do (Digitransit, NLS) take a free registration. Statistics Finland, SYKE, PRH, and Fintraffic data are **CC BY 4.0**, so the UI needs a small "Data: Statistics Finland, FMI, …" attribution line.

### Sources by what they help estimate

| Provider                                              | Data                                                                 | Access                                                                                          | Used for (flags / estimates)                                                                                      | Priority |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| **FMI** (Finnish Meteorological Institute)            | Forecasts, observations, CAP weather warnings                        | WFS at `opendata.fmi.fi/wfs`, **no key**; stored queries                                        | Rain/storm/frost on moving day → transit damage flag, timeline tip                                                 | 1        |
| **Statistics Finland — Paavo**                        | Open data by postal code: population, households, income, dwellings  | PxWeb API (JSON) + WFS `geo.stat.fi/geoserver/postialue/wfs`, **no key**, updated each January  | Area profile for the new address; household-size and income context for contents value                            | 1        |
| **Statistics Finland — StatFin `ashi`**               | Price per m² of old dwellings by postal code (table `13mu`)          | PxWeb API, **no key**                                                                           | Estimated home value → how much is at stake; suggested home insurance level                                        | 1        |
| **Statistics Finland — StatFin `rpk`**                | Offences known to police by municipality, per 1,000 residents (`13h4`) | PxWeb API, **no key**                                                                         | Burglary/theft flag severity relative to the national average                                                      | 1        |
| **HSY — Buildings in the Helsinki metropolitan area** | Every building: year of construction, use, floor area, material      | WFS layer `pks_rakennukset_paivittyva`, **no key**, updated every 2 weeks                       | **Old-plumbing / moisture flag** from the actual building year (Helsinki, Espoo, Vantaa, Kauniainen)               | 1        |
| **SYKE** (Finnish Environment Institute)              | Flood hazard and flood risk areas                                    | WMS "Luonnonriskialueet" (GetFeatureInfo point query), **no key**                               | Flood flag for ground-floor / riverside / coastal addresses                                                        | 2        |
| **PRH open data (YTJ)**                               | Company register: name, business ID, status, industry               | REST/JSON `avoindata.prh.fi/opendata-ytj-api/v3/…`, **no key**, updated daily                   | **"Verified mover" badge:** partner movers are registered, active companies                                        | 2        |
| **Fintraffic Digitraffic**                            | Road weather stations, road weather forecasts, traffic messages      | REST, **no key** or contract                                                                    | Road conditions on the moving route (ice, snow) → transit flag, rental van tip                                     | 2        |
| **Digitransit**                                       | Geocoding (address → coordinates + postal code), public transit routing | GraphQL/REST, **free key** via the API portal                                                | Turns the typed address into coordinates and a postal code for all the lookups above                               | 2        |
| **NLS (Maanmittauslaitos)**                           | Geocoding incl. building addresses from the Population Information System | REST (Pelias-style), **free API key**                                                       | Alternative geocoder. OpenStreetMap Nominatim (no key, ≤1 req/s) is the no-signup fallback                        | 2        |
| **DVV building addresses** (via avoindata.fi)         | All Finnish buildings: address, postal code, coordinates, building ID, intended use | Bulk download, updated quarterly                                                 | National address → building ID lookup outside the Helsinki region (no construction year)                         | 3        |
| **STUK** (Radiation and Nuclear Safety Authority)     | Indoor radon measurements and radon map by municipality              | Open data service (registration required); municipal stats on the STUK website                  | Radon flag for detached houses in high-radon regions (e.g. Uusimaa, Kymenlaakso, Häme); radon measurement action  | 3        |
| **Finance Finland** (Finanssiala)                     | Published insurance claim statistics                                 | Reports and press figures, **static**                                                           | Euro estimates: about 22,000 household water-damage claims a year, over €90M paid (≈ €4k per case); verify the year | 3        |
| **Pelastusopisto / PRONTO**                           | National rescue-service incident statistics (building fires, stove fires) | Published annual figures, **static**                                                       | Fire-risk context for the smoke detector / stove-guard actions                                                     | 3        |
| **If's public terms and conditions**                  | What each product covers and excludes                                | Public PDFs/web pages, **static**                                                               | `termsExcerpt` per product, which grounds the summary text                                                         | 1        |

**Priority:** 1 = build on day one; 2 = adds a lot to the demo if time allows; 3 = static numbers or regional data we hardcode into `src/data/snapshots.ts` or the rules.

Also useful for finding more: **avoindata.fi** (the national open data catalog) and **Helsinki Region Infoshare (hri.fi)** for Helsinki-region datasets.

### How the app uses it

```
address + move date
   │
   ▼
geocode (Nominatim / NLS / Digitransit) ──► { lat, lon, postalCode, municipality }
   │
   ├─► buildingInfo   (HSY WFS)            → buildingYear, material
   ├─► areaStats      (Paavo, ashi, rpk)   → pricePerM2, crimeRate vs. national, household size
   ├─► floodRisk      (SYKE WMS)           → inFloodZone: boolean
   └─► weather        (FMI, Digitraffic)   → forecast + warnings for the move date
   │
   ▼
Signals object ──► src/engine (rules) ──► flags + severity + € estimates
```

- **Adapters:** one small module per provider in `src/openData/`, returning typed `Signals` fields. The rules see only `Signals`, never raw API responses, so a broken API means a missing signal instead of a crash.
- **Browser calls and CORS:** each provider must allow browser requests (CORS). Test every adapter on the **deployed build**, not only on `npm run dev`. A Vite dev proxy hides CORS problems that the deployed build will hit. If a provider blocks the browser, its adapter uses the snapshot.
- **Keys are public:** anything in the bundle is visible to anyone. Prefer no-key sources. Use Nominatim (≤1 req/s, and its usage policy applies) or pre-geocoded demo addresses. Skip Digitransit and NLS unless the team accepts a public key.
- **Graceful degradation:** each adapter has a short timeout (≈2s). On failure it returns the snapshot value for the demo address if one exists, otherwise `undefined`. The rules then fall back to what the user typed (e.g. "Roughly when was the building built?").
- **Caching:** in memory, then `localStorage`, with per-provider TTLs: weather 1h, area statistics 30 days, buildings 7 days. The demo addresses have bundled snapshots, so a fresh browser with no network still shows the full flow.
- **Coordinates:** Statistics Finland and NLS use ETRS-TM35FIN (EPSG:3067), and the HSY/Helsinki services use GK25 (EPSG:3879). Request WGS84 (`EPSG:4326`) output where the service supports it; otherwise convert with `proj4`.
- **PxWeb gotcha:** Statistics Finland shortened some table and variable identifiers on 8 June 2026. Build queries against the current table metadata (`GET` on the table URL returns it) rather than copying old examples.
- **Coverage limit:** building-level data (year of construction) is open for the Helsinki region via HSY. **Pick a Helsinki-region address for the demo persona**; elsewhere the app asks the user for the building year.

### Example: what the user sees

> 🔴 **Old pipes:** Your building at Mannerheimintie X was completed in **1964** (HSY). Buildings from before 1980 are entering pipe-renovation age, and water damage is the most common home insurance claim in Finland, at about **€4,000** per case (Finance Finland).
> 🟠 **Burglary:** Reported property crime in Helsinki is **above the national average** per 1,000 residents (Statistics Finland). You're moving to a ground-floor flat.
> 🟡 **Moving-day weather:** FMI forecasts **rain** on 14 Nov. Pack electronics in plastic and book a covered van.

## AI layer

The summary shown in the demo is a **deterministic template** in `src/engine/summary.ts`. It is built from the flags' `why` texts, the top plan's `termsExcerpt`, and partner offers. It needs no key and cannot fail, so the demo stays safe.

The live Claude summary (see [application.md](application.md) §7) is **deferred**. A browser bundle cannot keep an API key secret, so live mode needs a small serverless function that holds the key and validates the output. That function would be the first piece of backend, and it does not need a database. The template already covers the "AI risk summary" MVP item in [application.md](application.md) §4. Live Claude output is a stretch goal.

## When to add a backend or database

No backend or database for now. Add one only when a requirement below appears, and pick the smallest option that meets it:

| Trigger                                                    | What to add                                                                 | Why not before                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Live Claude summary                                        | One serverless function (`POST /api/summary`) with the key in the host's environment | A key cannot stay secret in the browser                    |
| Journeys shared across devices, or reviewed by If staff   | Managed Postgres (e.g. Neon) behind the same function                       | The demo needs no accounts                                  |
| Partners or products edited without redeploying            | Move `src/data/` into tables                                                 | Static files are faster to change in git                    |
| Real push notifications                                    | A push provider and a server-side scheduler                                  | Local in-app or local notifications cover the demo          |

The risk engine does not change when a backend is added. It is framework-free and runs the same way in the browser or in a function. If a backend is added, the earlier Express + Postgres plan in commit `de51562` is the starting point.

## Deployment

- **Simplest:** run locally and record the demo video from localhost.
- **Shareable link:** `npm run build` writes `dist/`. Any static host works (Vercel, Netlify, GitHub Pages). There is no server to deploy. Test the open-data calls on that URL (see the CORS note above).
- **Offline demo:** the snapshots are bundled into the build, so the journey works offline once the page has loaded.

## Explicitly out of scope

Backend server, database (including Docker), auth and user accounts, real insurer integrations, payments, CI/CD, test coverage beyond the risk engine.
