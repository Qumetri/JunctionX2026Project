# Tech Stack — Life Moments Prototype

Decisions for the If Insurance hackathon prototype (see [context.md](context.md)). The prototype is a **React app that does the work in the browser**: it calls the open-data APIs directly, runs the risk engine and builds the report. The code that touches data lives in plain-TS `shared/`, so an Express server can take over later (for a mobile app, API keys or a shared cache) without changing the engine or the UI. There is no server yet, no database and no accounts. The goal is a polished end-to-end demo of 1–2 journeys (Moving first). It is not meant to be production infrastructure.

**Decision record:**
- 2026-10-17: open data and the risk report run in the browser for now. The Express server is kept as an option for when a mobile app or another need justifies it ([backendMovingPlan.md §9](backendMovingPlan.md#9-optional-server-when-and-how)). The build plan, flag catalogue and report contract are in [backendMovingPlan.md](backendMovingPlan.md).
- No database. The earlier Express + PostgreSQL plan is preserved in commit `de51562` (`git show de51562:context/techStack.md`). [When to add a database](#when-to-add-a-database) lists what would bring PostgreSQL back.

## Guiding principles

1. **Demo over infrastructure.** The judges score customer value, business value, and experience. A static site with no server, database, queues or deployment pipeline.
2. **Frontend first, server-ready.** The browser calls the public APIs, caches the answers in `localStorage`, and falls back to committed snapshots. All data code is in `shared/` and is reached through one `ReportService` in `src/api/`, so a server can take over later by swapping that one implementation. Reference data is typed TypeScript in the repo.
3. **Keep the risk engine framework-free.** `shared/engine/` and `shared/opendata/` are plain TypeScript with no React, DOM or Express imports, using only `fetch`. They run in the browser now, and in a future server or React Native app (see [MobileApplication.md](MobileApplication.md)) unchanged.
4. **Mock data is fine; real open data is a bonus.** Every live signal has a committed snapshot for the demo addresses, so the journey works without a network (`VITE_OPEN_DATA_MODE=snapshot`).
5. **One command.** `npm install && npm run dev`. No Docker, no migrations, no seed step.
6. **Mobile-first layout.** Design for a ~390px viewport from day one. It looks like an app in the demo video and makes a later port easier.

## Repo layout

```
JunctionX2026Project/
├── src/                  # React app (Vite)
│   ├── data/             # UI-only data: life event cards, questionnaire copy
│   ├── state/            # Journey state (useReducer + Context), localStorage persistence
│   ├── api/              # ReportService: `local` (runs shared/ in the browser) now, `remote` (/api/*) later
│   ├── pages/            # Home, moving form, risk report, plans, timeline
│   └── components/       # Shared UI (flag cards, readiness gauge, bottom sheet)
├── shared/               # Plain TS, no React/DOM/Express; reusable by a server or React Native
│   ├── types.ts          # Signals, Flag, MovingReport, request types
│   ├── opendata/         # One adapter per provider: request, parse, timeout, fallback
│   ├── cache/            # CacheStore interface + localStorage implementation
│   ├── services/         # geocode, collectSignals, buildMovingReport
│   ├── engine/           # Rules, scores, product ranking, summary template
│   ├── reference/        # Static figures (Finance Finland, PRONTO) with sources
│   └── data/             # Insurance products, partners
├── public/
│   └── snapshots/        # Pre-fetched Signals for the demo addresses (committed)
├── data/opendata/        # Raw samples, metadata and PDFs (test fixtures, not shipped)
├── scripts/              # snapshot.ts, check.ts (run with tsx)
├── context/              # Brief, product spec, tech stack, data plan, mobile notes
└── package.json
```

No `server/` yet. When it is added ([backendMovingPlan.md §9](backendMovingPlan.md#9-optional-server-when-and-how)) it gets its own `package.json` and imports `shared/`. No npm workspaces. `shared/` is a plain folder included by `tsconfig.app.json`. The Vite dev server proxies `/proxy/hsy` to HSY, the only source without CORS.

Moving risk files that now exist: `shared/engine/rules.ts` (flags and points), `shared/engine/score.ts` (risk bar), `shared/engine/plans.ts` (plan fit and suggestion), `shared/data/homePlans.ts`, `shared/opendata/{nominatim,hsy,syke,statfin,weather,digitraffic,http}.ts`, `shared/cache/store.ts`, `shared/services/movingReport.ts`, `src/api/report.ts`, `src/state/movingPlan.ts` and `src/components/PlanPicker.tsx`.

## Frontend

| Concern       | Choice                                    | Why                                                                                   |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Framework     | React 19 + TypeScript + Vite (in place)   | Already scaffolded, fast HMR                                                          |
| Routing       | React Router                              | Multi-step flow: event picker → questionnaire → checklist → offers → timeline         |
| Data fetching | `ReportService` in `src/api/`, called from hooks; adapters in `shared/opendata/` | Two calls from the UI (geocode, report). Add TanStack Query only if caching or retries get fiddly |
| Local state   | `useReducer` + Context                    | Journey answers, task progress, readiness score. No Redux needed                      |
| Persistence   | `localStorage` (wrapped in try/catch)     | Keeps the journey across reloads. A per-browser convenience, not durable storage      |
| Styling       | Plain CSS modules or Tailwind             | Pick one on day one and stick to it. Tailwind ports to RN via NativeWind              |
| Validation    | TypeScript types                          | Add Zod only if the questionnaire needs runtime checks                                |
| Icons/maps    | Lucide icons; Leaflet only if a map earns its place | Keep the bundle and the scope small                                         |

## Reference data

There is no database. Reference data lives in TypeScript modules, not JSON, so the type-check validates it against the shared types.

| Data                            | Where                              | Notes                                                                                  |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| Life events and questionnaires  | `src/data/events.ts`               | Moving (fully developed), plus "coming soon" cards for Pet, Home purchase, New job     |
| Partners                        | `shared/data/partners.ts`          | Movers, tool rentals, Anticimex, Verisure, FirstVet… with status and source per entry  |
| Insurance products              | `shared/data/products.ts`          | Coverage tags, illustrative price, `termsExcerpt` from public If terms                 |
| Risk rules                      | `shared/engine/rules.ts`           | Code, not data: rules contain `when` functions and stay reviewable in git              |
| Static statistics               | `shared/reference/figures.ts`      | Finance Finland and PRONTO figures, each with value, year, source and URL              |
| Open-data snapshots             | `public/snapshots/*.json`          | Pre-fetched `Signals` for the demo addresses, used when a live call fails or in snapshot mode |

Full field-level detail for flags, products, and ranking: [application.md](application.md).

### Browser state

| State                                    | Where                              | Notes                                                                   |
| ---------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Journey (event, answers, event date)     | React state, saved to `localStorage` | One journey per browser. "Start over" clears it                       |
| Task progress                            | Same journey object                | Ticking a task re-runs the engine on the saved `Signals`, which updates flags and readiness |
| Last report (`Signals` + report)         | Same journey object                | Open-data responses are cached separately (`localStorage`, `lm:cache:` prefix) |
| AI summary                               | Not stored                         | The template is computed on render. It is free and instant             |

No accounts and no auth. A journey is not shared between devices, which is fine for the demo.

## Risk engine — `shared/engine/`

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

Rules emit **flags**. A separate ranking function scores insurance products against the open flags. The summary template (see [AI layer](#ai-layer)) turns the result into text. See [application.md](application.md) §5–6. The Moving flag catalogue, severity thresholds and category scores are in [backendMovingPlan.md §5](backendMovingPlan.md#5-signals--flags).

**Moving rules (built 2026-10-17):** `shared/engine/rules.ts` scores flags with points, not only severity. Each flag lists point lines (`{label, points}`), and its points are their sum. Severity comes from points: 14 or more is high, 7 or more is medium, otherwise low. Each done action removes an equal share of its flag's points. The risk bar is the sum of open points across flags, capped at 100 (70 or more is high, 40 or more is medium). `shared/engine/score.ts` computes the risk bar. `shared/engine/plans.ts` ranks plans by coverage of each open flag (full, partial or none), weighted by severity.

Rules are data in spirit, so the team can write them in parallel and tune the demo story without touching UI code.

## Open data (Finland)

The app uses free Finnish public data to make the flags and estimates specific to **this address, this area, this date**. This turns "old buildings have pipe problems" into "your building was completed in 1964, and a typical water-damage claim in Finland is about €4,300".

All open-data calls are made from the browser by the adapters in `shared/opendata/`. Every source sends CORS headers that allow this (verified 2026-10-17) **except HSY**, which goes through a same-origin proxy path (see [HSY buildings](#hsy-buildings-wfs)). Sample responses and small static files are kept in `data/opendata/<provider>/`.

None of the in-scope sources needs an API key or registration. See [API keys](#api-keys).

### Sources by what they help estimate

| Provider | Data | Access | Used for (flags / estimates) | Priority |
| --- | --- | --- | --- | --- |
| **HSY buildings** (Helsinki metropolitan area) | Per building: completion year, floors, use, floor area, heating | WFS `kartta.hsy.fi/geoserver/wfs`, **no key** | **Old-plumbing / moisture flag** from the completion year (`valm_v`). Helsinki, Espoo, Vantaa, Kauniainen only | 1 |
| **StatFin `ashi` 13mu** | Price per m² of old dwellings by postal code | PxWeb API v1, **no key** | Estimated value at stake; home insurance level | 1 |
| **StatFin `rpk` 13h4 / 13ex** | Offences known to police by municipality: home burglary and arson | PxWeb API v1, **no key** | Burglary flag and arson-type flag, compared with the national rate | 1 |
| **StatFin Paavo 12f4** | Buildings by postal code | PxWeb API v1, **no key** | Building count context for the destination postal code | 2 |
| **StatFin `raku` 15er, 15f6** | Buildings and dwellings by build year, municipality | PxWeb API v1, **no key** | Building-age context outside the HSY area. 15f6 query not verified | 2 |
| **StatFin `asvu` 15fa** | Rent index and average rent per m², by region | PxWeb API v1, **no key** | Rent context for a rental move. No postal-code level | 2 |
| **StatFin `ton` 12qh** | Road accidents with injuries and deaths, by municipality | PxWeb API v1, **no key** | Traffic context for the destination | 3 |
| **SYKE flood risk areas** | Flood risk areas (coastal and river), flood-depth layers | ArcGIS REST, **no key** | Flood flag for ground-floor, riverside and coastal addresses | 2 |
| **Finance Finland** (Finanssiala) | Claim totals and counts: fire, burglary, water damage | Public web page and PDF, **static** | Euro estimates per claim type. See [Reference figures](#reference-figures) | 3 |
| **PRONTO / Pelastusopisto** | National rescue statistics: building fires, causes, deaths | PDF, **static** (no data endpoint verified) | Fire-risk context for smoke-detector and stove-guard actions | 3 |
| **Fintraffic Digitraffic** | Traffic messages: announcements, road works, restrictions | REST, **no key**, gzip required | Road works and announcements on the moving route, on moving day | 2 |

Digitraffic has **no accident data**. Use StatFin `ton/12qh` for accidents.

Not used in this design: PRH (YTJ) company register, DVV building addresses (avoindata.fi), and STUK radon data. None of these was verified in the access checks.

**Priority:** 1 = build on day one; 2 = adds a lot to the demo if time allows; 3 = static numbers we hardcode into `shared/reference/figures.ts` or the rules.

Also checked and not useful for incidents: **Helsinki Region Infoshare (hri.fi)** and **avoindata.fi**. Their CKAN searches returned no fire or rescue incident dataset. Live alarm sites (missapalaa.fi, tilannehuone.fi, paloasema.fi) are third-party sites with no API or terms. Do not scrape them.

### API keys

None of the in-scope sources needs an API key or registration. HSY, Statistics Finland, SYKE, Digitraffic, PRONTO and Finance Finland all work without one.

Two geocoders need a free key, and both are optional: **Digitransit** (geocoding and routing) and **NLS** (Maanmittauslaitos geocoder). Nominatim needs no key and is the fallback. A key can't be used from the browser, because anything in the bundle is public. Using one is a reason to build the optional server, where it would live in `server/.env`, never in the bundle or the repo. Until then, geocode with Nominatim. From Nominatim, the town is `address.city` (or town/village). `address.municipality` is the sub-region (e.g. "Helsingin seutukunta").

### HSY buildings (WFS)

- **Used for:** completion year of the building, which drives the old-plumbing flag. Also floors, use and floor area.
- **Access:** no key. WFS 2.0.0 on GeoServer.
- **Base URL:** `https://kartta.hsy.fi/geoserver/wfs`
- **Layer:** `ilmasto_ja_energia:rakennukset`. Use this one for attributes.
  - Do not use `asuminen_ja_maankaytto:rakennukset`. It has geometry and a `name` property only.
  - The old layer name `pks_rakennukset_paivittyva` is wrong.
- **Key fields:**
  - `valm_v`: completion year (integer). Use this. `valm_pvm` was null in all samples.
  - `kerrosluku`: floors above ground. Can be the sentinel `999999999`, so check for it before using the value.
  - `kayttark`: use label (e.g. "Liikerakennus"). `kayt_luok` was null in samples.
  - `kerrosala`: floor area (m²).
  - `kunta` (`091` = Helsinki), `kuntanimi`.
  - Others: `vtj_prt` (VTJ building ID), `lamm_tapa`, `polttoaine`, `panel_ala`, `elec_kwh_v`, `viherk`.
  - Add `propertyName=valm_v,kerrosluku,kayttark,kuntanimi` to trim the response (verified). Add `geom` to `propertyName` to get polygons.
- **CRS:** native EPSG:3879 (ETRS-GK25). EPSG:4326 is accepted. Bbox axis order: `bbox=<minLon>,<minLat>,<maxLon>,<maxLat>,EPSG:4326` (lon,lat). With `urn:ogc:def:crs:EPSG::4326`, the order is lat,lon.
- **Matching a point to a building:** geocoded points often fall outside every building polygon, so the adapter takes the building that contains the point or, failing that, the nearest one.
- **Example:**
  ```bash
  curl -G "https://kartta.hsy.fi/geoserver/wfs" \
    --data-urlencode "service=WFS" --data-urlencode "version=2.0.0" \
    --data-urlencode "request=GetFeature" \
    --data-urlencode "typeNames=ilmasto_ja_energia:rakennukset" \
    --data-urlencode "outputFormat=application/json" \
    --data-urlencode "count=3" --data-urlencode "srsName=EPSG:4326" \
    --data-urlencode "bbox=60.1690,24.9360,60.1710,24.9400,urn:ogc:def:crs:EPSG::4326"
  ```
- **Licence:** CC BY 4.0. The exact credit line is unverified. Credit HSY as the source.
- **CORS: none.** No `Access-Control-Allow-Origin` header, and the preflight returns 403 (verified 2026-10-17). From the browser, call `/proxy/hsy/wfs`: the Vite dev proxy forwards it in development, and a host rewrite (Vercel `rewrites`, Netlify `_redirects`) when deployed. Node scripts, React Native and a future server call `kartta.hsy.fi` directly.
- **Rate limits:** none documented, not tested (unverified). The capabilities XML is about 350 KB, so cache it.
- **Local files:** `data/opendata/hsy/sample_ilmasto_ja_energia_rakennukset_mannerheim_count3.json` (use this one). `data/opendata/hsy/sample_rakennukset_mannerheim_count3.json` (geometry-only sample, `asuminen` layer, not for attributes).
- **Coverage:** Helsinki metropolitan area only. Elsewhere the app asks the user for the building year.

### Statistics Finland StatFin (PxWeb)

- **Used for:** burglary and arson flags (`rpk`), home value (`ashi`), rents (`asvu`), building age and count (`raku`, Paavo), road accidents (`ton`).
- **Access:** no key. PxWeb API v1. Licence CC BY 4.0.
- **URL pattern:**
  - Folder listing: `GET https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/<folder>`
  - Table metadata: `GET https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/<folder>/<table>.px`
  - Data: `POST` the same `.px` URL with a JSON `query` and `"response":{"format":"json-stat2"}`.
  - Paavo is under `https://pxdata.stat.fi/PxWeb/api/v1/fi/Postinumeroalueittainen_avoin_tieto/uusin/<table>.px`, not under `StatFin`.
- **CORS:** `Access-Control-Allow-Origin: *` for GET and POST with `Content-Type` (verified).
- **Rate limits:** HTTP 429 (`Too many requests in too short timeframe`) after about 135 parallel requests. Requests succeeded after a pause. The documented limit is unverified. Keep requests sequential and cache metadata and results.
- **Gotcha:** variable codes carry date suffixes (e.g. `alue_23_20260101`) and change between table versions. Always `GET` the table metadata before building a POST. There is no verified evidence of a rename on 8 June 2026.

#### Tables and codes

| Table | Folder | Measure / use | Key variable codes | Notes |
| --- | --- | --- | --- | --- |
| `13mu.px` | `ashi` | Old condo prices, postal code, yearly (2009–2025) | `timeperiod_y`, `postinumeroalue_4_20220101` (postal code), `talotyyppi_6_20131021` (1 = kerrostalo yksiöt, 2 = kaksiot, 3 = kolmiot+, 5 = rivitalot), `contentscode` = `keskihinta_aritm_nw` (EUR/m²) | Verified |
| `13h4.px` | `rpk` | Offences by municipality, by reporting year, **rates** | Area `alue_28_20210101` (330 values, incl. regions; `SSS` = whole country), class `rikokset_74_20211209`, measures `rikokset_lkm`, `rik_1000`, `rik_10000` | **Use for flags.** Rates per 10,000 residents (`rik_10000`). Verified with classes `101T103a0101` and `351` |
| `13ex.px` | `rpk` | Offences by municipality, **counts**, 1980–2025 | Area `alue_23_20230101` (311 values), class `rikokset_74_20211209`, `timeperiod_y`, `contentscode` = `rikokset_lkm` | Verified |
| `12f4.px` (Paavo) | `Postinumeroalueittainen_avoin_tieto/uusin` | Buildings by postal code, 2010–2024 | `postinumeroalue_4_20260101` (postal code), `contentscode` = `ra_raky` (buildings total), `ra_ke`, `ra_muut`, `timeperiod_y` | Verified |
| `15er.px` | `raku` | Buildings by build year, municipality, 2025 | Area `alue_23_20260101` (`KU091` = Helsinki), `rak_valm_v_10_20210101` (build-year classes), `rakennus_6_20180101`, `polttoaineet_12_20260101`, `contentscode` = `rakennus_lkm` | Verified |
| `15f6.px` | `raku` | Dwellings by building type and build year | `alue_23_20260101`, `talotyyppi_4_20210101`, `rak_valm_v_10_20210101`, `asunnon_kaytolo_3_20190101`, `contentscode` = `asunto_lkm` | Metadata verified. No data query verified (unverified) |
| `15fa.px` | `asvu` | Rent index (2025=100) and average rent per m², region, 2025Q1–2026Q3 | `alue_44_20260101` (`SSS` = whole country, `pks` = PKS area), `rahoitus_2_20260101`, `huoneluku_5_20260101`, `timeperiod_q`, `contentscode` = `asvu2025` | No postal-code level. Verified |
| `12qh.px` | `ton` | Road accidents by municipality, 2015–2026* | `alue_23_20260101` (`KU091` = Helsinki, `KOKO MAA`), `tieluokka_2_20200101`, `tienkayttaja_2_20200101`, `contentscode`: `konn` (with injuries), `kuolonn` (fatal), `loukonn` (injury), `timeperiod_y` | Verified |

Municipality codes: `KU091` = Helsinki, `KU049` = Espoo, `KU092` = Vantaa. `SSS` = whole country.

For `12qh`, provisional years are marked with `*` in `valueTexts` (`2025*`, `2026*`), not in the codes. The last full year is 2024. The road class and road user totals use code `SSS`.

#### Example: Paavo buildings, postal code 00100, 2024

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  "https://pxdata.stat.fi/PxWeb/api/v1/fi/Postinumeroalueittainen_avoin_tieto/uusin/12f4.px" \
  -d '{"query":[
    {"code":"postinumeroalue_4_20260101","selection":{"filter":"item","values":["00100"]}},
    {"code":"contentscode","selection":{"filter":"item","values":["ra_raky"]}},
    {"code":"timeperiod_y","selection":{"filter":"item","values":["2024"]}}],
    "response":{"format":"json-stat2"}}'
```
Response: `"value":[608]`.

#### Example: home burglary and arson rates, Finland and the Helsinki region, 2025 (13h4)

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/rpk/13h4.px" \
  -d '{"query":[
    {"code":"alue_28_20210101","selection":{"filter":"item","values":["SSS","KU091","KU049","KU092"]}},
    {"code":"rikokset_74_20211209","selection":{"filter":"item","values":["101T103a0101","351"]}},
    {"code":"timeperiod_y","selection":{"filter":"item","values":["2025"]}},
    {"code":"contentscode","selection":{"filter":"item","values":["rik_10000"]}}],
    "response":{"format":"json-stat2"}}'
```
Verified 2026-10-17. 2025 home burglary / arson per 10,000 residents: Finland 6.03 / 0.40, Helsinki 6.11 / 0.43, Espoo 6.02 / 0.37, Vantaa 9.84 / 0.51, Tampere 4.67 / 0.30.

Offence classes used: `101T103a0101` = theft by breaking into a dwelling (home burglary); `351` = arson, traffic arson and aggravated arson; `352` = attempts. For yearly counts by place of offence, query `13ex.px` with area variable `alue_23_20230101` instead (verified: arson in Helsinki 11 in 2024, 30 in 2025).

#### Licence and files

- **Licence:** CC BY 4.0. Credit: "Lähde: Tilastokeskus". The table-level licence was not checked.
- **Local files** (`data/opendata/statfi/`): `meta_13mu.json`, `meta_15fa.json`, `meta_15er.json`, `meta_15f6.json`, `meta_12qh.json`, `meta_12f4.json` (metadata). `sample_13mu_2025_postinumero_00100_00120.json`, `sample_15fa_2026Q1_pks.json`, `sample_12qh_helsinki_2024_accidents.json`, `sample_15er_helsinki_2025_buildings.json`, `sample_12f4_paavo_00100_2024_buildings.json` (query responses).

#### Caveats

- `rpk` counts offences recorded by police, not fire-brigade call-outs. Arson class 351 covers traffic arson and aggravated arson together. It is a proxy for arson, not a count of building fires. Show it as "police-recorded arson-type offences in this municipality".
- Single-year counts are noisy. Helsinki's 351 count went from 11 (2024) to 30 (2025).

### Finance Finland (Finanssiala)

- **Used for:** euro estimates per claim type (fire, burglary, water damage). These are the figures quoted in the summary text.
- **Access:** public web page and PDF. No key, no registration. Static: no data endpoint.
- **Pages:**
  - Damage topic page: `https://www.finanssiala.fi/aiheet/palo-murto-vuotovahingot/` (updated 4.10.2026). The page gives no reference year for its averages.
  - Annual review, "Finanssivuosi 2025" (PDF, 62 pages): `https://www.finanssiala.fi/wp-content/uploads/2026/05/finanssivuosi-katsaus-2025.pdf`
- **Example:**
  ```bash
  curl -sL "https://www.finanssiala.fi/wp-content/uploads/2026/05/finanssivuosi-katsaus-2025.pdf" -o finanssivuosi-katsaus-2025.pdf
  ```
  The annual review's per-year split of claims by class could not be read from the PDF text (chart labels were not extracted). Year-by-year numbers are unverified.
- **Figures:** see [Reference figures](#reference-figures).
- **Licence:** unverified. No licence statement was found. Cite as "Lähde: Finanssiala ry". Do not redistribute charts or tables without permission.
- **Local file:** `data/opendata/finanssiala/finanssivuosi-katsaus-2025.pdf`.
- **Gotcha:** `.../aiheet/vahinkovakuutustilasto/` returns 404. The page is `palo-murto-vuotovahingot`.

### PRONTO / Pelastusopisto

- **Used for:** national context for fire risk. Used for smoke-detector and stove-guard actions and their wording.
- **Access:** public PDFs. No key. Static. No data endpoint is verified. The online tool at `https://prontonet.fi/Pronto3/online1/OnlineTilastot.htm` has rescue-department level data, but no export endpoint was found (unverified).
- **Level:** national. There is no municipal building-fire table. Rescue-region breakdowns exist only for total rescue operations (unverified for other categories).
- **Publications** (series D, ISSN 2342-9305):

  | File | Title | Coverage | Language | URL |
  | --- | --- | --- | --- | --- |
  | `D2_2025.pdf` | Pelastustoimen taskutilasto 2020–2024 (2/2025) | 2020–2024 | Finnish | `https://info.smedu.fi/kirjasto/Sarja_D/D2_2025.pdf` |
  | `D1_2026.pdf` | Räddningsväsendets fickstatistik 2020–2024 (1/2026) | 2020–2024 | Swedish | `https://info.smedu.fi/kirjasto/sarja_D/D1_2026.pdf` |
  | `D5_2024.pdf` | Finnish Rescue Services' Pocket Statistics 2019–2023 (5/2024) | 2019–2023 | English | `http://info.smedu.fi/kirjasto/Sarja_D/D5_2024.pdf` (http, not https) |

- **Example:**
  ```bash
  curl -sL "https://info.smedu.fi/kirjasto/Sarja_D/D2_2025.pdf" -o D2_2025.pdf
  ```
- **Figures:** see [Reference figures](#reference-figures). The newest data covers 2020–2024. There are no 2025 figures.
- **Licence:** unverified. Cite as "Lähde: Pelastusopisto, Pelastustoimen taskutilasto 2020–2024 (prontonet.fi)".
- **Local files:** `data/opendata/pronto/D2_2025.pdf`, `data/opendata/pronto/D1_2026.pdf`, `data/opendata/pronto/D5_2024.pdf`.
- **Gotcha:** `pronto.fi` does not resolve. Use `prontonet.fi` or the Pelastusopisto site.

### SYKE flood risk areas (ArcGIS REST)

- **Used for:** flood flag for ground-floor, riverside and coastal addresses.
- **Access:** public ArcGIS REST, no key. Owner: Suomen ympäristökeskus (SYKE). This is REST, not WMS. The old WMS GetFeatureInfo description was wrong.
- **Base URL:** `https://paikkatieto.ymparisto.fi/arcgis/rest/services/Tulva/<ServiceName>/MapServer`
- **Services and layers:**
  - `VHSTULVAMERISuunnitelmat/MapServer/0`: sea flood risk areas. `TulvaTyyppi` = `meritulva`. Verified.
  - `Tulvariskialueet_2024_ehdotetut/MapServer/0`: proposed 2024 flood risk areas. `1` = current (2018). Verified.
  - `Tulvariskiaineistot_perusskenaariot_toistuvuuksittain/MapServer`: river flood data by return period. Group layers `5` (1/1000), `11` (1/250), `17` (1/100), `23` (1/50), `29` (1/20), `35` (1/10), `41` (1/5), `47` (1/2).
  - Leaf layer `22` (1/100, depth fields `SyvSuojLuokka`, `SyvVyohLuokka`, `KorkeusAin`): schema verified, but a point query returned no usable features in testing (unverified).
  - Sea return-period layers were not located (unverified).
- **Key fields:** `TulvaTyyppi`, `Nimi`, `APSFRCode`. `VHSTULVAMERISuunnitelmat` has no `Merkittavyys` field: asking for it returns HTTP 200 with an error body. Request `outFields=Nimi,TulvaTyyppi`. ArcGIS CORS echoes the `Origin` header.
- **Example** (verified, Kaivopuisto, Helsinki):
  ```bash
  curl -G "https://paikkatieto.ymparisto.fi/arcgis/rest/services/Tulva/VHSTULVAMERISuunnitelmat/MapServer/0/query" \
    --data-urlencode "geometry=24.9495,60.1544" --data-urlencode "geometryType=esriGeometryPoint" \
    --data-urlencode "inSR=4326" --data-urlencode "spatialRel=esriSpatialRelIntersects" \
    --data-urlencode "outFields=Nimi,TulvaTyyppi" --data-urlencode "returnGeometry=false" --data-urlencode "f=json"
  ```
  Returns `Nimi` = "Helsingin ja Espoon rannikkoalue", `TulvaTyyppi` = `meritulva`.
- **CORS:** echoes the request origin (verified from `http://localhost:5173`).
- **CRS:** `inSR=4326` is accepted (verified). The service's native CRS was not checked (EPSG:3067 is the usual choice, unverified).
- **Licence:** unverified. `copyrightText` was empty in the samples. Cite as "Lähde: Suomen ympäristökeskus (SYKE)".
- **Rate limits:** none documented, not tested.
- **Local files:** `data/opendata/syke/sample_point_kaivopuisto_meritulva.json`, `data/opendata/syke/sample_point_kaivopuisto_tulvariskialue_2024.json`.
- **Gotchas:** `wwwd3.ymparisto.fi` returned 404 for these paths. Use `paikkatieto.ymparisto.fi`. Polygon queries on a group layer return its sublayers. Query the leaf layer for attributes.

### Fintraffic Digitraffic (traffic messages only)

- **Used for:** road works and traffic announcements near the moving route, on moving day. Not for accidents.
- **Access:** public REST, no key. **Gzip is required**: send `Accept-Encoding: gzip`. Without it the server returns `406`. Browsers send it on their own; Node scripts must set it. Send a `Digitraffic-User: <app-name>` header as Digitraffic requests it. It was not enforced in testing.
- **CORS:** `*`, and `Digitraffic-User` is in the allowed headers (verified).
- **Base URL:** `https://tie.digitraffic.fi/api/traffic-message/v1/messages`
- **Situation types** (`situationType`): `TRAFFIC_ANNOUNCEMENT`, `ROAD_WORK` (495 features on 2026-10-17), `WEIGHT_RESTRICTION` (0), `EXEMPTED_TRANSPORT` (0).
- **What the app uses:** only `situationType=TRAFFIC_ANNOUNCEMENT` (~28 KB). `ROAD_WORK` is ~6 MB, too heavy for the browser. The text is in `announcements[0].title` (there is no `description`). It is used only for moves within 7 days.
- **Gotchas:**
  - `limit` is not a parameter of v1 (`400`).
  - `/api/traffic-message/v3/messages/situation-types` returns 404. Do not use it.
  - Geometry is `[lon, lat]`. `includeAreaGeometry=false` drops area polygons.
  - No accident data. Searches of announcements for "accident" or "onnettomuus" found nothing.
- **Example:**
  ```bash
  curl --compressed -H "Digitraffic-User: <app-name>" \
    "https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT"
  ```
- **Licence:** CC BY 4.0 (https://www.digitraffic.fi/kayttoehdot). Credit: "Lähde: Fintraffic Digitraffic".
- **Rate limits:** none documented, not tested.
- **Local file:** `data/opendata/digitraffic/sample_traffic_announcement_messages.json` (`TRAFFIC_ANNOUNCEMENT` response).

### Travel disruption data (by destination)

Inputs for a **trip disruption score** for a trip from Finland to a destination: how likely the trip is to be delayed, disrupted or cancelled, and why. Verified with live requests on 2026-10-17. Sample files are in `data/opendata/travel/<provider>/`.

None of these sources needs a key. **Access** says how the frontend-first app reaches each one: *browser* (CORS allows a direct call), *proxy* (same-origin path, like HSY), or *build* (bulk file that `scripts/snapshot.ts` turns into a small JSON in `public/`).

| Provider | Data | Level | Access | Signal for the score | Priority |
| --- | --- | --- | --- | --- | --- |
| **Eurocontrol performance data** | Daily airport delay CSVs: arrival ATFM delay by cause, all-cause pre-departure delay, traffic | Airport (ICAO), daily, 2014–2026 | build (no CORS) | `arrivalDelayRate`, `weatherDelayShare`, `preDepartureDelayMin` for the destination airport and HEL, by month | 1 |
| **UK FCDO travel advice** | Advice level per country, change notes | Country | browser (`*`) | `advisoryLevel` | 1 |
| **Open-Meteo** | Forecast (≤ 16 days) and historical weather | Point | browser (`*`) | `weatherRisk` for the travel dates or month | 1 |
| **GDACS** | Current natural-hazard events (EQ, TC, FL, VO, DR, WF) with alert level | Event, with country and coordinates | browser (`*`) | `activeHazards` near the destination | 2 |
| **Digitraffic rail** | Scheduled vs actual times and cancellations, per train and station, live and by date | Station (Finland) | browser (`*`) | `railToAirportReliability` (trains to Lentoasema `LEN`) | 2 |
| **Digitraffic marine** | Port calls with ETA/ATA/ETD/ATD, previous and next port | Port call (Finnish ports) | browser (`*`) | `ferryDelay` for ferry trips (Helsinki–Tallinn, –Stockholm) | 2 |
| **Eurostat `avia_par_fi`** | Passengers and flights per HEL airport pair | Route, yearly/quarterly | browser (`*`) | Route exists / direct-flight volume (fewer flights = fewer rebooking options) | 3 |
| **US State Dept advisories** | Advisory level 1–4 per country | Country | proxy (no CORS) | Second opinion on `advisoryLevel` | 3 |
| **USGS earthquakes** | Earthquake events and counts | Event | browser (`*`) | Optional context; GDACS already covers major earthquakes | 3 |

**Gap: cancellation rates.** No free source gives flight cancellation rates by route or airport. Eurocontrol gives delay, not cancellations. The score should therefore estimate *disruption likelihood* from delays, weather, hazards and advisories, and leave cancellation as an insurer-side figure (see [Not usable / gaps](#not-usable--gaps)).

#### Eurocontrol performance data (airport delays)

- **Used for:** the delay part of the score, for the destination airport (arrival) and for the return flight (pre-departure delay at the destination airport).
- **Access:** free CSV downloads, no key, listed on `https://ansperformance.eu/csv/`. No CORS header (verified), and the files are large, so read them only at build time.
- **Files** (one per year, 2014–2026):
  - `https://www.eurocontrol.int/performance/data/download/csv/apt_dly_<year>.csv.bz2`: **arrival ATFM delay** per airport per day. Columns: `FLT_DATE`, `APT_ICAO`, `APT_NAME`, `STATE_NAME`, `FLT_ARR_1` (arrivals), `DLY_APT_ARR_1` (delay minutes), cause split `DLY_APT_ARR_<code>_1` (`W` = weather, `C` = ATC capacity, `S` = ATC staffing, `G` = aerodrome capacity, `I` = industrial action, and others), `FLT_ARR_1_DLY` and `FLT_ARR_1_DLY_15` (delayed arrivals, and those delayed more than 15 min). 2025: 444 KB compressed, 101,129 rows.
  - `https://www.eurocontrol.int/performance/data/download/csv/all_pre_departure_delays_<year>.csv`: **all-cause pre-departure delay** per airport per day: `FLT_DEP_IFR_2` (departures), `DLY_ALL_PRE_2` (delay minutes). Empty for airports that don't report.
  - Also listed: `airport_traffic_<year>.csv`, `atc_pre_departure_delays_<year>.csv`, `asma_additional_time_<year>.csv`, `atfm_slot_adherence_<year>.csv`.
- **Encoding:** Latin-1, not UTF-8 (airport names fail to decode as UTF-8).
- **Example:**
  ```bash
  curl -s "https://www.eurocontrol.int/performance/data/download/csv/apt_dly_2025.csv.bz2" | bunzip2 | grep ',EFHK,' | head -3
  ```
- **Verified 2025 aggregates** (computed from the two files):

  | Airport | Arrivals | ATFM delay min per arrival | Weather share of ATFM delay | Arrivals ATFM-delayed > 15 min | All-cause pre-departure delay, min per departure |
  | --- | --- | --- | --- | --- | --- |
  | EFHK Helsinki | 78,019 | 0.18 | 95% | 0.51% | 10.8 |
  | ESSA Stockholm | 100,916 | 0.01 | 36% | 0.03% | 9.1 |
  | LIRF Rome | 161,374 | 0.04 | 73% | 0.08% | 14.3 |
  | LFPG Paris CDG | 239,863 | 0.93 | 56% | 2.10% | 19.5 |
  | EGLL London Heathrow | 240,069 | 1.51 | 87% | 3.44% | 12.4 |
  | LEBL Barcelona | 180,428 | 1.36 | 87% | 2.67% | 16.7 |
  | GCLP Gran Canaria | 70,713 | 1.28 | 17% | 3.08% | 14.3 |
  | LPPT Lisbon | 115,294 | 2.83 | 69% | 6.51% | 25.5 |

- **How to use:** `scripts/snapshot.ts` downloads the last full year and writes `public/reference/airport-delays.json`: per ICAO code and month, `{ arrivals, atfmMinPerArrival, delayed15Share, weatherShare, preDepMinPerDep }`. Compare the destination with the all-airport median for that month.
- **Caveats:** ATFM delay is only the part caused by air-traffic flow restrictions, so it understates total delay. Pre-departure delay covers all causes but not every airport. Neither counts cancellations. Coverage is the Eurocontrol area (Europe, Canary Islands, Turkey, some neighbours); long-haul destinations have no data.
- **Licence:** unverified. Credit: "Source: EUROCONTROL".
- **Local files:** `data/opendata/travel/eurocontrol/apt_dly_2025_head50.csv`, `data/opendata/travel/eurocontrol/all_pre_departure_delays_2025_head50.csv` (header + 50 rows each).

#### UK FCDO travel advice

- **Used for:** `advisoryLevel` for the destination country.
- **Access:** JSON, no key, CORS `*` (verified).
- **Endpoints:**
  - Index: `https://www.gov.uk/api/content/foreign-travel-advice` lists 226 countries (`links.children[]`, with `details.country.slug` and the latest `change_description`). It does **not** include the alert level (verified).
  - Country: `https://www.gov.uk/api/content/foreign-travel-advice/<slug>` → `details.alert_status` (array) and `details.change_description`.
- **Alert values:** `avoid_all_travel_to_whole_country`, `avoid_all_travel_to_parts`, `avoid_all_but_essential_travel_to_whole_country`, `avoid_all_but_essential_travel_to_parts`. An empty array means no warning. Verified 2026-10-17: Ukraine and Israel `['avoid_all_travel_to_parts', 'avoid_all_but_essential_travel_to_parts']`, Italy `[]`.
- **Example:**
  ```bash
  curl -s "https://www.gov.uk/api/content/foreign-travel-advice/italy" | jq '.details.alert_status, .details.change_description'
  ```
- **Mapping:** whole country, all travel → 4; parts, all travel → 3; whole country, all but essential → 3; parts, all but essential → 2; empty → 1.
- **Licence:** Open Government Licence v3.0 (standard for gov.uk content; unverified on the page). This is UK advice. The Finnish ministry's advice has no API (see gaps), so the UI should say "UK FCDO advice" and link to um.fi.
- **Local file:** `data/opendata/travel/fcdo/italy_sample.json`.

#### Open-Meteo (destination weather)

- **Used for:** `weatherRisk`. Use the forecast for trips within 16 days. For later trips, use the archive for the same month in recent years (days with heavy rain, strong wind or extreme heat).
- **Access:** JSON, no key, CORS `*` (verified).
- **Base URLs:** `https://api.open-meteo.com/v1/forecast`, `https://archive-api.open-meteo.com/v1/archive`.
- **Example:**
  ```bash
  curl -s "https://archive-api.open-meteo.com/v1/archive?latitude=41.90&longitude=12.50&start_date=2025-10-01&end_date=2025-10-03&daily=temperature_2m_max,precipitation_sum"
  ```
- **Rate limits and licence:** non-commercial daily limit and CC BY 4.0 per the provider (both unverified on the live page). Cache by destination and month.
- **Local files:** `data/opendata/travel/open_meteo/archive_rome_sample.json`, `data/opendata/travel/open_meteo/current_helsinki_sample.json`.

#### GDACS (natural hazards)

- **Used for:** `activeHazards`, meaning current events near the destination. Filter by country or distance from the destination, and by alert level.
- **Access:** JSON (GeoJSON features), no key, CORS `*` (verified).
- **Example:**
  ```bash
  curl -s "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,DR,WF"
  ```
- **Event types:** EQ earthquake, TC tropical cyclone, FL flood, VO volcano, DR drought, WF wildfire.
- **Licence:** unverified. Credit: "Source: GDACS".
- **Local file:** `data/opendata/travel/gdacs/events_sample.json` (2 features).

#### Digitraffic rail (getting to the airport)

- **Used for:** `railToAirportReliability`, i.e. how often trains to the airport station run late or are cancelled. It covers the Finnish leg only.
- **Access:** REST, no key, CORS `*`. Gzip required (HTTP 406 without it; browsers send it on their own). Send `Digitraffic-User`.
- **Endpoints (verified):**
  - `https://rata.digitraffic.fi/api/v1/trains/<YYYY-MM-DD>`: every train on a date, with `cancelled` and `timeTableRows[]` (`stationShortCode`, `type`, `scheduledTime`, `actualTime`, `differenceInMinutes`). 2026-10-15: 1,740 trains (917 KB), 121 cancelled. 219 arrivals at Lentoasema (`LEN`) had an actual time; 1 was 3 or more min late.
  - `https://rata.digitraffic.fi/api/v1/live-trains/station/HKI`: live and upcoming trains at a station.
  - `https://rata.digitraffic.fi/api/v1/metadata/stations`: 563 stations.
- **How to use:** for a punctuality figure, the snapshot script reads about 30 recent dates and stores the share of `LEN` arrivals ≥ 3 min late and the cancellation share. For a trip within 24 h, call `live-trains` instead.
- **Licence:** CC BY 4.0. Credit: "Lähde: Fintraffic Digitraffic".
- **Local files:** `data/opendata/travel/digitraffic/rail_trains_2026-10-15_first3.json`, `rail_live_trains_HKI_sample.json`, `rail_stations_sample.json`, `rail_train_locations_sample.json`.

#### Digitraffic marine (ferries)

- **Used for:** `ferryDelay` on ferry trips from Finnish ports, mainly Helsinki–Tallinn and Helsinki–Stockholm.
- **Access:** REST, no key, CORS `*`, gzip required. The old `/api/v1/*` paths return 404; use `/api/port-call/v1/`.
- **Endpoint:** `https://meri.digitraffic.fi/api/port-call/v1/port-calls?from=<ISO>&to=<ISO>`. Each port call has `portToVisit` (UN/LOCODE, e.g. `FIHEL`), `prevPort`, `nextPort` (e.g. `EETLL`, `SESTO`), `vesselName` and `portAreaDetails[]` with `eta`, `ata`, `etd`, `atd` and their sources (verified). One day: 353 port calls, 923 KB.
- **How to use:** delay = `ata − eta` for calls whose `prevPort` is the destination port. `eta` is the agent's estimate, sometimes filed months ahead, so it is an approximation of the timetable, not the timetable itself.
- **Local files:** `data/opendata/travel/digitraffic/marine_port_calls_2026-10-16_sample.json`, `marine_ports_sample.json`.

#### Eurostat air passengers by route (`avia_par_fi`)

- **Used for:** whether a direct route from HEL exists and how busy it is. A thin route means fewer rebooking options if a flight is cancelled. It is not a delay signal.
- **Access:** JSON-stat 2.0, no key, CORS `*` (verified). `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/avia_par_fi?format=JSON&lang=EN&time=2024`. Routes look like `FI_EFHK_AE_OMDB`; units include passengers (`PAS_BRD`, `PAS_CRD`), `FLIGHT` and `SEAT`.
- **Gotcha:** unfiltered requests return HTTP 413 and are queued; always filter (for example `time=`). Data to 2024-Q4.
- **Local file:** `data/opendata/travel/eurostat/avia_par_fi_2024_sample.json`.

#### US State Department advisories

- **Used for:** second opinion on `advisoryLevel` (levels 1–4 in `Title`, ISO country in `Category`).
- **Access:** `https://cadataapi.state.gov/api/TravelAdvisories`, JSON, no key, 541 KB. **No CORS header** (verified), so the browser must use a proxy path like HSY (`/proxy/state/*`), or the snapshot script stores it daily.
- **Local file:** `data/opendata/travel/us_state/advisories_sample.json`.

#### Not usable / gaps

- **Flight cancellation rates:** no free source found. AeroDataBox, AviationStack and FlightAware AeroAPI all need keys (HTTP 401 without one; free tiers unverified). A key can't go in the browser bundle, so any of them would need the optional server ([backendMovingPlan.md §9](backendMovingPlan.md#9-optional-server-when-and-how)).
- **Finavia flight API:** `api.finavia.fi` did not answer (no HTTP status). Unverified; believed to need a free developer key.
- **OpenSky:** live positions work anonymously, but CORS allows only `opensky-network.org`, and historical flights return 403 without an account. Not used.
- **Eurocontrol API (`api.eurocontrol.int`):** unreachable. The CSV downloads above replace it.
- **US BTS on-time data:** US domestic flights only.
- **Finnish Ministry for Foreign Affairs (um.fi travel advice):** returns 403 to scripts, no documented API or feed. Not used; link to it from the UI.
- **ReliefWeb:** needs an approved `appname` (HTTP 403 without one). Not requested.
- **Health alerts (WHO, ECDC), strikes:** no verified machine-readable feed. The Eurocontrol cause code `I` (industrial action) captures strike-related air-traffic delay after the fact.
- **Trip-cancellation claim statistics:** none found from Finance Finland or the EU. Until If provides a figure, the app should not show a "% of trips cancelled" number.

#### How the score uses them

`tripDisruption` is a flag set built like the Moving flags ([backendMovingPlan.md §5](backendMovingPlan.md#5-signals--flags)), using `relativeLevel(local, reference)`:

| Flag | Signal | Reference | High when |
| --- | --- | --- | --- |
| `flight-delay` | Destination `delayed15Share` and `preDepMinPerDep` for the travel month | Median of all Eurocontrol airports that month | ratio ≥ 1.5 |
| `weather-disruption` | Open-Meteo forecast, or the share of heavy-rain/strong-wind days in that month; Eurocontrol `weatherShare` | Same month at HEL | forecast warning, or ratio ≥ 1.5 |
| `destination-advisory` | FCDO `advisoryLevel` (US State as tie-break) | — | level ≥ 3 |
| `natural-hazard` | GDACS event within ~300 km, orange/red alert | — | any orange or red event |
| `airport-connection` | Rail `LEN` lateness/cancellation share, or ferry `ata − eta` | Last 30 days | ratio ≥ 1.5 against the 30-day mean |
| `thin-route` | No direct HEL route, or few flights in `avia_par_fi` | — | informative only |

Coverage tags for product ranking: `trip-cancellation`, `travel-delay`, `baggage-delay`, `medical-abroad`. Outside the Eurocontrol area, `flight-delay` is "unknown" and the explanation says so.

### Caching and failure handling

- **Cache:** each adapter caches its parsed result through `CacheStore` (`localStorage` in the browser). Planned TTLs: weather 1 h, area statistics 30 days, buildings 7 days. The TTLs are design values, not tested.
- **Metadata:** cache table metadata (StatFin) and the HSY capabilities XML. Do not refetch them per request.
- **Timeout and fallback:** each adapter has a short timeout (about 2.5 s). On failure it returns the cached value, then the committed snapshot for the demo address (`public/snapshots/`), otherwise `undefined`. The rules then fall back to what the user typed (e.g. "Roughly when was the building built?").
- **Coordinates:** HSY accepts EPSG:4326 (see above). SYKE accepts `inSR=4326`. StatFin is keyed by postal code and municipality, not by coordinates.

### How the app uses it

```
address + move date
   │
   ▼
browser ──► shared/services/collectSignals (adapters in shared/opendata/)
   │
   ├─► geocode (Nominatim / NLS / Digitransit) ──► { lat, lon, postalCode, municipality }
   │
   ├─► buildingInfo   (HSY WFS)                      → completion year (valm_v), floors, use
   ├─► areaStats      (ashi 13mu, asvu 15fa, Paavo 12f4, raku 15er) → pricePerM2, rent, building counts
   ├─► crimeRates     (rpk 13h4, 13ex)               → burglary and arson rates vs. national
   ├─► roadAccidents  (ton 12qh)                     → injury and fatal accident counts
   ├─► floodRisk      (SYKE ArcGIS REST)             → inFloodZone, flood type
   ├─► trafficNotices (Digitraffic)                  → traffic announcements near the address
   └─► weather        (Open-Meteo)                   → forecast for the move date
   │
   ▼
Signals object ──► rules (shared/engine) ──► flags + severity + € estimates ──► MovingReport
```

- **Adapters:** one adapter per provider in `shared/opendata/`, returning typed `Signals` fields. The rules see only `Signals`, never raw API responses, so a broken API means a missing signal instead of a crash.
- **Weather:** `shared/opendata/weather.ts` calls Open-Meteo's forecast endpoint (`api.open-meteo.com/v1/forecast`) with `start_date` and `end_date` set to the move date, and `wind_speed_unit=ms`. The forecast reaches 16 days ahead. Open-Meteo can return 503 ("service is overloaded"), and then the adapter marks the source missing. FMI remains an alternative.
- **Coverage limit:** building-level data (completion year) is available for the Helsinki region via HSY. Pick a Helsinki-region address for the demo persona.

### Example: what the user sees

> 🔴 **Old pipes:** Your building was completed in **1964** (HSY). Buildings from 1960–1984 are at pipe-renovation age, and a typical water-damage claim in Finland is about **€4,300** (Finance Finland).
> 🟠 **Burglary:** Vantaa had **9.84 home burglaries per 10,000 residents** in 2025, against 6.03 nationally (Statistics Finland). You're moving to a ground-floor flat.
> 🟡 **Fire safety:** 605 residential fires in Finland in 2024 happened where there was no smoke detector, and an average building fire caused **€36,800** of damage (PRONTO). Test the alarms on day one.

### Reference figures

Figures used in the summary text and the flags. Year and source are given for each.

| Figure | Value | Year | Source |
| --- | --- | --- | --- |
| Fire claims paid | About €200M per year; more than 50 fire deaths per year | No reference year on page | Finance Finland, damage topic page (updated 4.10.2026) |
| Burglary and theft claims | About €30M per year, about 30,000 claims. About €1,000 per claim (derived: €30M ÷ 30,000) | No reference year on page | Finance Finland |
| Water and leak claims | About €160M per year, about 37,000 claims. About €4,300 per claim (derived: €160M ÷ 37,000) | No reference year on page | Finance Finland. Leak study 2013; series 2015–2025 |
| Building fires (rakennuspalo) | 1,875 | 2024 | PRONTO (`D2_2025`) |
| Building fire hazards (rakennuspalovaara) | 3,149 | 2024 | PRONTO |
| Fires and fire hazards in residential buildings | 2,898 (detached 1,278, terraced 234, blocks of flats 1,260; the listed subtypes sum to 2,772, the table does not show the rest) | 2024 | PRONTO |
| Building and contents damage, building fires | €186M total; €36,796 average per building fire | 2024 | PRONTO |
| Deaths in building fires | 55 | 2024 | PRONTO |
| Intentional building fires | 423 | 2024 | PRONTO |
| Ignition cause, building fires (incl. secondary fires): cooking / electrical device / fireplace or flue / deliberately set | 805 / 813 / 479 / 365 | 2024 | PRONTO. "Deliberately set" (365, ignition-cause table) and "intentional" (423, intentionality table) come from two different classifications, so they differ |
| Residential fires with no smoke detector | 605 | 2024 | PRONTO |
| Home burglary (101T103a0101), per 10,000 residents: Finland / Helsinki / Espoo / Vantaa / Tampere | 6.03 / 6.11 / 6.02 / 9.84 / 4.67 | 2025 | StatFin `rpk/13h4`, `rik_10000` |
| Arson (351), per 10,000 residents: Finland / Helsinki / Espoo / Vantaa / Tampere | 0.40 / 0.43 / 0.37 / 0.51 / 0.30 | 2025 | StatFin `rpk/13h4`, `rik_10000` |
| Arson (351), counts: Finland / Helsinki | 228 / 30 | 2025 | StatFin `rpk/13ex` (by place of offence). `13h4` counts by reporting year, so its rates don't divide out exactly from these counts. Use `13h4` for rates, `13ex` for counts |
| Road accidents, Helsinki: with injuries / fatal / injury-only | 302 / 5 / 297 | 2024 | StatFin `ton/12qh` (`konn`, `kuolonn`, `loukonn`) |
| Road accidents with injuries, 2024: Finland / Vantaa | 2,811 / 91 | 2024 | StatFin `ton/12qh` |

### Licences and attribution

| Source | Licence | Credit line |
| --- | --- | --- |
| HSY buildings | CC BY 4.0 | HSY (exact line unverified) |
| Statistics Finland | CC BY 4.0 | Lähde: Tilastokeskus |
| SYKE | Unverified | Lähde: Suomen ympäristökeskus (SYKE) |
| Fintraffic Digitraffic | CC BY 4.0 | Lähde: Fintraffic Digitraffic |
| Finance Finland | Unverified | Lähde: Finanssiala ry |
| PRONTO / Pelastusopisto | Unverified | Lähde: Pelastusopisto, Pelastustoimen taskutilasto 2020–2024 (prontonet.fi) |
| EUROCONTROL performance data | Unverified | Source: EUROCONTROL |
| UK FCDO travel advice | Open Government Licence v3.0 (unverified on page) | Contains public sector information licensed under the Open Government Licence v3.0 (FCDO) |
| Open-Meteo | CC BY 4.0 (unverified on page) | Weather data by Open-Meteo.com |
| GDACS | Unverified | Source: GDACS |
| Eurostat | Eurostat reuse policy (unverified for this dataset) | Source: Eurostat |
| US State Department | Unverified (US government works are generally public domain) | Source: U.S. Department of State |

The frontend shows one attribution line for all sources, e.g. "Data: Statistics Finland, HSY, SYKE, Fintraffic, Finanssiala, Pelastusopisto."

## AI layer

The summary shown in the demo is a **deterministic template** in `shared/engine/summary.ts`. It is built from the flags' `why` texts, the top plan's `termsExcerpt`, and partner offers. It needs no key and cannot fail, so the demo stays safe.

The live Claude summary (see [application.md](application.md) §7) is **deferred**. It needs an API key, which can't go in the browser bundle, so it is one of the triggers for the optional server: a route (`POST /api/summary`) that reads `ANTHROPIC_API_KEY` from `server/.env` and validates the output. It still needs no database. The template already covers the "AI risk summary" MVP item in [application.md](application.md) §4. Live Claude output is a stretch goal.

## When to add a database

No database for now: journeys and the open-data cache stay in `localStorage`. A database only makes sense after the optional server exists. Add PostgreSQL only when a requirement below appears:

| Trigger                                                    | What to add                                                                 | Why not before                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Journeys shared across devices, or reviewed by If staff   | PostgreSQL (Docker locally, `npm run db:*` scripts; managed e.g. Neon when deployed) | The demo needs no accounts                                  |
| Partners or products edited without redeploying            | Move `shared/data/` into tables                                              | Static files are faster to change in git                    |
| Several server instances sharing one cache                 | A Postgres implementation of `CacheStore`                                    | One local server is enough for the demo                     |
| Real push notifications                                    | A push provider and a server-side scheduler                                  | Local in-app or local notifications cover the demo          |

The risk engine does not change when a database is added. The earlier Express + Postgres plan in commit `de51562` is the starting point.

## Deployment

- **Simplest:** run locally (`npm run dev`) and record the demo video from localhost.
- **Shareable link:** `npm run build` → `dist/` on a static host. Prefer Vercel or Netlify, because a rewrite rule can forward `/proxy/hsy/*` to `https://kartta.hsy.fi/geoserver/*`. On a host without rewrites (e.g. GitHub Pages), HSY falls back to snapshots and the form asks for the building year.
- **Offline demo:** build or run with `VITE_OPEN_DATA_MODE=snapshot`. The app then reads `public/snapshots/` and never touches the network.
- **If the optional server is built:** it needs a Node host (Render, Railway, Fly.io), with keys set there.

## Explicitly out of scope

A server and a database (including Docker) for the MVP, auth and user accounts, real insurer integrations, payments, CI/CD, test coverage beyond the risk engine and adapter parsers.
