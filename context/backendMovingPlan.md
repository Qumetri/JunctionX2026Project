# Moving journey: data and risk plan (frontend-first, server optional)

How the Moving journey gets its data and turns it into risk flags: which public data it calls, how that data becomes flags, and what the report contains. Product rules (flag shape, fit score, AI layer) are in [application.md](application.md). Access details for every data source (URLs, table IDs, field codes, example requests) are in [techStack.md → Open data](techStack.md#open-data-finland).

**Decision record:**
- 2026-10-17 (first version): an Express backend in `server/` called the open-data APIs and ran the engine.
- 2026-10-17 (current): **the browser does the work for now.** The React app calls the open-data APIs directly, runs the risk engine and builds the report itself. The Express server is kept as a documented option ([§9](#9-optional-server-when-and-how)) for when a mobile app or another need makes one worth having. The code is arranged so that moving work to the server later changes one file in `src/api/` and nothing in the engine or the UI.
- No database ([§10](#10-database-deferred)).

## 1. What the report must deliver

The [Moving](../Design/Moving.png) and [Risk Report](../Design/Risk%20Report.png) designs need:

| Screen element | Report field |
| --- | --- |
| "Plan your move" form: moving from, moving to, moving date, home size | `MovingReportRequest` input |
| Moving risk preview: Transport damage / Schedule delay / Key safety, each low–high | `categories[]` with level and score |
| Report summary: event, date, address, overall risk, gauge | `summary` + `overallRisk` |
| Risk cards with progress bars | `flags[]` grouped by category, with `score` 0–100 |
| Recommended actions | `actions[]`, deduplicated, linked to the flags they resolve |
| Protection gap check | `protectionGaps[]` computed from flags and existing coverage |
| Ranked insurance plans | `rankedPlans[]` (fit score from [application.md §6](application.md#6-ranking-insurance-plans)) |
| Data attribution line | `sources[]` (provider, dataset, year, licence) |

## 2. Data sources

All chosen sources are **free and need no API key**. Verified with live requests on 2026-10-17, including whether each one allows calls from a browser (CORS). Sample responses and static files are in `data/opendata/<provider>/`.

| Provider | Dataset (ID) | Level | Signal it produces | Flags it drives | Browser call | Cache TTL |
| --- | --- | --- | --- | --- | --- | --- |
| **HSY** | Buildings, WFS layer `ilmasto_ja_energia:rakennukset` | Building (Helsinki, Espoo, Vantaa, Kauniainen) | `buildingYear` (`valm_v`), `floors`, `buildingUse`, `heatingFuel` | Old plumbing, fire safety | **No CORS.** Use the Vite proxy in dev and a host rewrite when deployed ([§4](#hsy-has-no-cors)) | 7 days |
| **Statistics Finland** | `ashi/13mu` old dwelling prices €/m² | Postal code | `pricePerM2` | Home value at stake (€) | Yes (`*`, GET and POST) | 30 days |
| | `raku/15er` buildings by completion year | Municipality | `shareBuiltBefore1980` | Old plumbing (fallback outside HSY area) | Yes | 30 days |
| | `Paavo 12f4` buildings and dwellings | Postal code | `areaProfile` (dwellings, buildings) | Context for the summary | Yes | 30 days |
| | `asvu/15fa` rents | Region (no postal code) | `avgRentPerM2` | Optional: renter context | Yes | 30 days |
| | `rpk/13h4` offences per 10,000 residents, class `101T103a0101` | Municipality | `homeBurglaryRate` and national rate | Burglary / key safety | Yes | 30 days |
| | `rpk/13h4`, class `351` (arson) | Municipality | `arsonRate` and national rate | Fire safety | Yes | 30 days |
| | `ton/12qh` road accidents with injuries | Municipality | `injuryAccidents` (2024, per 10,000 residents) | Transport (self-drive move) | Yes | 30 days |
| **SYKE** | Flood risk areas, ArcGIS REST `Tulva/Tulvariskialueet_2024_ehdotetut` and `Tulva/VHSTULVAMERISuunnitelmat` | Point | `floodRiskArea` (name, sea/river, significance) | Flood | Yes (echoes the origin) | 30 days |
| **Fintraffic Digitraffic** | Traffic announcements `/api/traffic-message/v1/messages`, `situationType=TRAFFIC_ANNOUNCEMENT` only (road works are ~6 MB, too big for the browser). Used for moves within 7 days, 1.5 km from the route | Point / route | `routeDisruptions[]` | Schedule delay | Yes (`*`; the `Digitraffic-User` header is allowed) | 15 min (live), none for future dates |
| **Pelastusopisto PRONTO** | Pelastustoimen taskutilasto 2020–2024 (PDF) | National | Static figures in `shared/reference/figures.ts` | Fire safety (€ and "why" text) | Not called (static) | Static |
| **Finance Finland** | Fire / burglary / water-damage claim figures (web page, updated 4.10.2026) | National | Static figures | € per claim on water, burglary and fire flags | Not called (static) | Static |
| **Open-Meteo** | Moving-day forecast, `api.open-meteo.com/v1/forecast` (`start_date` = `end_date` = move date, up to 16 days ahead, `wind_speed_unit=ms`) | Point | `weatherOnMoveDay` (rain, snow, gusts, frost) | Transport damage, schedule delay | Yes (`*`) | 1 h |
| **Geocoding** (Nominatim, no key) | Address search | Point | `lat`, `lon`, `postalCode`, `municipalityCode` | Input to every adapter above | Yes (`*`) | 30 days |

### Fire and arson by area

No free source gives building fires per municipality. The plan combines two:

1. **Area signal:** Statistics Finland `rpk/13h4`, class `351` (arson, traffic arson, aggravated arson; police-recorded), as a rate per 10,000 residents for the destination municipality, compared to the national rate. In 2025 it was 0.40 nationally, 0.43 Helsinki, 0.37 Espoo and 0.51 Vantaa.
2. **National context and €:** PRONTO 2024. There were 1,875 building fires and 3,149 building fire hazards; 2,898 of these incidents were in residential buildings. 423 building fires were intentional. Average building and contents damage was €36,796 per building fire. 605 residential fires happened where there was no smoke detector.

The UI must call the area figure "police-recorded arson offences", not "fire risk". PRONTO's online tool has rescue-department figures, but no export, so it is not used. The live alarm sites (tilannehuone.fi, paloasema.fi, missapalaa.fi) are third-party and have no API or terms, so they are not used either.

### Traffic accidents

Digitraffic has **no accident data**. Its traffic messages are announcements, road works and restrictions. Accident statistics come from Statistics Finland `ton/12qh`, which gives road accidents with injuries and deaths by municipality. Digitraffic is used only for live disruptions on the moving route, and only when the move is within the next 7 days.

### Reference figures (static)

| Figure | Value | Source |
| --- | --- | --- |
| Water/leak damage | ~€160M a year, ~37,000 claims, **≈ €4,300 per claim** | Finance Finland, page updated 4.10.2026 |
| Burglary and theft | ~€30M a year, ~30,000 claims, **≈ €1,000 per claim** | Finance Finland |
| Fire damage paid | ~€200M a year | Finance Finland |
| Average damage per building fire | **€36,796** (2024) | PRONTO, taskutilasto 2020–2024 |
| Building fires / hazards (2024) | 1,875 / 3,149, of which residential 2,898 | PRONTO |
| Home burglary rate (2025, per 10,000) | Finland 6.03, Helsinki 6.11, Espoo 6.02, Vantaa 9.84 | Statistics Finland `rpk/13h4` |
| Arson rate (2025, per 10,000) | Finland 0.40, Helsinki 0.43, Espoo 0.37, Vantaa 0.51 | Statistics Finland `rpk/13h4` |

These live in `shared/reference/figures.ts`, each with `{ value, unit, year, source, url }`, so every number shown to the user can carry its source.

## 3. Architecture

```
React app (Vite, :5173)
   ├─ src/pages, src/components     UI only; never calls fetch for open data
   └─ src/api/report.ts             ReportService: the one seam between UI and data
          │  now:   local  → runs shared/ code in the browser
          │  later: remote → fetch('/api/moving/report') on the optional server
          ▼
shared/                             plain TS, no React/DOM/Express imports
   ├─ types.ts         Signals, Flag, MovingReport, request types
   ├─ opendata/        one adapter per provider: request, parse, timeout, fallback
   ├─ cache/           CacheStore interface + localStorage implementation
   ├─ services/        geocode, collectSignals, buildMovingReport
   ├─ engine/          rules, scoring, ranking, summary template
   ├─ reference/       static figures (Finance Finland, PRONTO) with sources
   └─ data/            insurance products, partners
public/snapshots/      pre-fetched Signals for the demo addresses (committed)
data/opendata/         raw samples and PDFs; test fixtures, not shipped
scripts/snapshot.ts    Node script (tsx) that writes public/snapshots/
```

The full repo tree is in [techStack.md → Repo layout](techStack.md#repo-layout).

Layout decisions:

- **Everything that touches data lives in `shared/`, not `src/`.** Adapters use only the standard `fetch` and `AbortSignal`, which exist in browsers, Node 18+ and React Native. The same files can run in the browser now, and in an Express server or a mobile app later, without edits.
- **`src/api/report.ts` is the only seam.** It exports one interface:

  ```ts
  interface ReportService {
    geocode(q: string): Promise<GeoResult[]>;
    movingReport(req: MovingReportRequest): Promise<MovingReport>;
  }
  ```

  The `local` implementation calls `shared/services/` directly. A `remote` implementation, added only when the server exists, sends the same request to `/api/*` and gets the same `MovingReport` back. Pages call hooks that use `ReportService`. They don't know which one it is.
- **The engine lives in `shared/engine/`** and is pure. "What if" toggles (ticking a task, changing an answer) re-run it on the saved `Signals` with no network call.
- **Stack additions:** Vitest (tests), `tsx` (snapshot script). `shared/` is included in `tsconfig.app.json`. No Express, Zod or `dotenv` until the server is built.

## 4. Adapters

Each adapter has the same contract:

```ts
type AdapterResult<T> = {
  value: T | undefined;          // undefined = signal missing, never throws
  source: SourceRef;             // provider, dataset, year, licence, url
  status: 'live' | 'cache' | 'snapshot' | 'missing';
};

type Adapter<I, T> = (input: I, ctx: { signal: AbortSignal; cache: CacheStore }) => Promise<AdapterResult<T>>;
```

The cache is passed in, so the browser gives a `localStorage` store and a future server gives a file or Postgres store.

Rules for every adapter:

- **Timeout 2.5 s** (`AbortSignal.timeout`). On timeout or error: cache → snapshot → `undefined`.
- **Parse once, return only what the rules need.** Rules never see raw API responses.
- **Statistics Finland:** read each table's metadata once and cache it (variable codes carry date suffixes such as `alue_23_20260101` and change between versions). Build POST bodies from the cached metadata. Send requests one at a time through a small queue; parallel bursts return HTTP 429. The calls are made from each user's browser, so the limit applies per user, not to the whole app.
- **Municipality codes:** map the geocoder's municipality name to the StatFin code (`KU091` = Helsinki) using the metadata `valueTexts`. Cache the map.
- **Digitraffic:** send `Digitraffic-User: LifeMoments/JunctionX2026` (CORS allows it). Browsers send `Accept-Encoding: gzip` on their own; the Node snapshot script must set it, or Digitraffic returns HTTP 406.
- **Nominatim:** at most 1 request per second, and cache every answer. Its usage policy does not allow as-you-type autocomplete, so geocode when the user leaves the address field or submits, not on every keystroke. Browsers can't set `User-Agent`; the `Referer` identifies the app. If real autocomplete is wanted, use Digitransit, which needs a key, and therefore the server ([§9](#9-optional-server-when-and-how)).

### HSY has no CORS

HSY's GeoServer sends no `Access-Control-Allow-Origin` header and answers the preflight with 403, so a browser can't call it directly. Every other source can. The HSY adapter therefore calls a same-origin path, `/proxy/hsy/wfs`, and the host forwards it:

| Where | How `/proxy/hsy/*` reaches `https://kartta.hsy.fi/geoserver/*` |
| --- | --- |
| `npm run dev` | Vite `server.proxy` in `vite.config.ts` |
| Deployed static site | A host rewrite rule (Vercel `rewrites` or Netlify `_redirects`, both config only, no code) |
| Static host without rewrites | No live HSY call. The adapter returns the snapshot for demo addresses, otherwise `undefined`, and the form asks for the building year |
| React Native or the optional server | Call `kartta.hsy.fi` directly; CORS applies only to browsers |

The base URL is a constant in `shared/opendata/hsy.ts` that each platform can override.

| Adapter | File | Input | Output (`Signals` field) |
| --- | --- | --- | --- |
| geocode | `shared/opendata/nominatim.ts` | address string | `location` |
| hsyBuilding | `shared/opendata/hsy.ts` | lat, lon | `building` (year, floors, use, fuel) |
| dwellingPrice | `shared/opendata/statfin/ashi.ts` | postal code | `pricePerM2` |
| buildingStock | `shared/opendata/statfin/raku.ts` | municipality | `shareBuiltBefore1980` |
| crimeRates | `shared/opendata/statfin/rpk.ts` | municipality | `homeBurglaryRate`, `arsonRate` (+ national) |
| roadAccidents | `shared/opendata/statfin/ton.ts` | municipality | `injuryAccidents` |
| floodRisk | `shared/opendata/syke.ts` | lat, lon | `floodRiskArea` |
| routeDisruptions | `shared/opendata/digitraffic.ts` | from/to points, move date | `routeDisruptions` |
| weather | `shared/opendata/weather.ts` | lat, lon, move date | `weatherOnMoveDay` |

The HSY query uses a small bbox around the point (about ±15 m). It picks the building whose polygon contains the point, or the nearest one.

* **WFS details:** The bbox is `minLon,minLat,maxLon,maxLat,EPSG:4326` (lon first). The `urn:ogc:def:crs:EPSG::4326` form takes lat, lon instead. `geom` must be listed in `propertyName`, or no polygons come back. Geocoded points often fall outside every polygon, so the adapter takes the containing building or the nearest one. `kerrosluku` can be the sentinel 999999999.

`shared/services/collectSignals.ts` runs the adapters in parallel, except the StatFin ones, which share the queue, and merges them into one `Signals` object. On a fast connection the report should be ready in 2–3 s. The UI shows each category card as soon as its signals arrive.

## 5. Signals → flags

Rules are the `Rule` type from [techStack.md](techStack.md#risk-engine--sharedengine), in `shared/engine/rules.ts`. The area statistics use one helper:

```ts
// ratio of local rate to national rate → severity
relativeLevel(local, national): 'low' | 'medium' | 'high'
  ratio < 1.15 → 'low';  1.15–1.5 → 'medium';  ≥ 1.5 → 'high'
```

### Moving flag catalogue

Each flag lists its point lines. Severity comes from the total (see below).

| Flag | Category | Point lines | Evidence source | € estimate | Actions | Coverage tags |
| --- | --- | --- | --- | --- | --- | --- |
| `old-plumbing` | New home | HSY `valm_v` 1960–1989: +14; before 1960: +8; 1990–2004: +4; 2005 or later: no flag; year unknown: +5. Detached house: +4 (adds tag `structure-moisture`) | HSY buildings (`valm_v`) | ≈ €4,300 per leak claim | Ask the housing company when the pipes were renewed (detached: Anticimex moisture check), leak sensors, find the water shut-off | `water-damage` (+ `structure-moisture` for a detached house) |
| `burglary` | Break-in and keys | StatFin `rpk/13h4` home-burglary rate ÷ national rate: below 0.85 +2, below 1.15 +4, below 1.5 +8, 1.5 or more +12 (no data: +5). Detached house +4, or street-level windows (ground floor / terraced) +4 | StatFin `rpk/13h4`; home answers | ≈ €1,000 per claim | Change the lock cylinder, keep boxes out of sight, home alarm (member discount) | `theft` |
| `key-handover` | Break-in and keys | Renting +6; buying +4 | Answers | — | Change the lock cylinder, count and sign for keys at handover | `theft` |
| `fire-safety` | New home | Always +4 (smoke alarm). Wood, pellet or peat heating (HSY `polttoaine`) +6, else detached house +3. Arson rate ≥ 1.15× national +3 | PRONTO 2024; HSY `polttoaine`; StatFin `rpk/13h4` class 351 | €36,796 average building fire damage | Test or fit smoke alarms, stove guard and fire blanket, chimney sweep (wood heating) | `fire` |
| `flood` | New home | Inside SYKE flood risk area +10; home at ground level +6 | SYKE flood risk areas; home answers | — | Keep stored boxes off the floor, turn on flood and storm warnings | `natural-hazard` |
| `transit-damage` | Transport damage | Self-move +8, or movers +3; fragile or valuable items +5 (adds tag `valuables`); rain ≥ 2 mm or snow on move day +4 (Open-Meteo) | Answers; Open-Meteo | — | Book a verified mover, rent a dolly, wrap fragile items and photograph valuables, plastic covers if wet | `transit` (+ `valuables`) |
| `road-accident` | Transport damage | Self-move only. StatFin `ton/12qh` injury accidents per 10,000 residents ÷ national: below 0.85 +1, below 1.15 +2, below 1.5 +4, 1.5 or more +6 (no data: +3). Winter month (Nov–Mar) or frost forecast +3 | StatFin `ton/12qh`, `rpk/13h4` (population); Open-Meteo | — | Book a verified mover, drive outside rush hours | `vehicle` |
| `schedule-delay` | Schedule delay | Move on day 28–31 or day 1 +5; move within 14 days +4; gusts ≥ 15 m/s or snow ≥ 2 cm +5; Digitraffic traffic announcement within 1.5 km +3 each (max 2) | Digitraffic; Open-Meteo; move date | — | Book the mover and lift now, keep the next day free, check the route the day before | `delay` |
| `uninsured-contents` | New home | No home insurance +20 | Answer | Contents value estimate | Arrange home insurance from moving day | `home-contents`, `liability` |
| `pet-liability` | New home | Dog +6 | Answer | — | Read the housing company's pet rules | `liability` |

Coverage tags are the ones in `shared/types.ts` (`CoverageTag`); each plan's coverage per tag is in `shared/data/homePlans.ts`. Each done action removes an equal share of its flag's points. The `home-value` flag is not built, so it is listed under [§12](#12-open-items).

### Points, risk bar and readiness

```
flag points    = sum of the flag's point lines
severity       = flag points ≥ 14: high · ≥ 7: medium · else low
open points    = flag points × share of actions not done (each done action removes an equal share)
risk bar       = min(100, sum of open points of all flags); ≥ 70 high · ≥ 40 medium · else low
category meter = min(100, open points in the category ÷ 30)
readiness      = share of all flag points removed by done actions
```

Categories: Transport damage, Schedule delay, Break-in and keys, New home. The category cards show the category meter as the progress bar.

Calibration (live data, 2026-10-17): a careful move with movers, insurance and a new building ≈ 15–25 (low). A Helsinki self-move with valuables and rain ≈ 60 (medium). A 1967 Vantaa building, ground floor, self-move ≈ 60–70.

### Suggested plan and plan fit

Plan match is strict. A plan fully covers a flag only if it fully covers **all** of the flag's coverage tags. The old rule was "any tag". A plan that covers some of the tags is a partial match. Fit = 100 × Σ weight × match ÷ Σ weight, with weight high 3, medium 2, low 1. Only open flags count.

Suggested plan is the higher of:

* the plan for the risk level: low → Perus, medium → Laaja, high → LaajaPlus
* the cheapest plan that fully covers every open high flag that any plan can cover

Code: `shared/engine/plans.ts`.

### Protection gaps

For each open high or medium flag: if the user's existing coverage (questionnaire answer) includes one of its `coverageTags`, the result is "covered". Otherwise the gap is listed, with the cheapest product that fully covers it. This produces lines like "Liability extension recommended" and "Single-trip cover available for moving day", as in the design.

## 6. Report contract

`ReportService.movingReport()` takes a `MovingReportRequest` and returns a `MovingReport`. These types are the contract: they stay the same if the work later moves to the server, where they become the body of `POST /api/moving/report`.

```ts
type MovingReportRequest = {
  from: AddressInput;              // { text } or { lat, lon, postalCode }
  to: AddressInput;
  moveDate: string;                // ISO date
  homeSizeM2: number;
  answers: {
    housing: 'flat' | 'terraced' | 'detached';
    floor?: number;                // 0 = ground floor
    tenure: 'own' | 'rent';
    buildingYear?: number;         // only asked when HSY has no answer
    selfMove: boolean;
    valuables: boolean;
    pets: ('dog' | 'cat' | 'other')[];
    smokeDetector?: boolean;
    existingCoverage: string[];    // coverage tags the user already has
  };
};

type MovingReport = {
  summary: { event: 'moving'; moveDate: string; address: string; overallRisk: Level };
  categories: { id: 'transport' | 'schedule' | 'keys' | 'property'; level: Level; score: number; flagIds: string[] }[];
  flags: Flag[];                   // application.md §5, plus `estimateEur?` and `sourceRefs`
  actions: { id: string; title: string; resolves: string[]; partnerId?: string }[];
  protectionGaps: { flagId: string; status: 'covered' | 'gap'; suggestion?: string; productId?: string }[];
  rankedPlans: RankedPlan[];
  readiness: number;
  signals: Signals;                // saved with the journey so the engine can re-run for "what if"
  sources: SourceRef[];
};
```

Errors: `movingReport()` never rejects because one source failed; a missing signal only removes or downgrades the flags that need it. It rejects only for invalid input (for example, an address that can't be geocoded), with `{ code, message }`, which the form shows next to the field.

## 7. Caching, snapshots and the offline demo

- **`CacheStore` interface** (`get`, `set` with TTL), in `shared/cache/`. The browser implementation uses `localStorage` under a `lm:cache:` prefix, with every read and write wrapped in try/catch. If storage is unavailable it acts as an in-memory cache. TTLs are in [§2](#2-data-sources).
- **Snapshots:** `npm run data:snapshot` (Node, `scripts/snapshot.ts`) runs `collectSignals` for the demo addresses (one Helsinki, one Vantaa, one coastal address inside the SYKE area) and writes `public/snapshots/<slug>.json`. These files are committed. Node has no CORS, so the script calls HSY directly.
- **Modes:** `VITE_OPEN_DATA_MODE=live` (default; falls back to snapshots) or `snapshot` (never touches the network, for the venue and the video).
- **Static figures** are code, so they cannot fail.

## 8. Testing

- **Vitest** for `shared/engine` (rules, scores, ranking). Table-driven tests per flag: for example, given `buildingYear=1964`, expect `old-plumbing` with severity high.
- **Adapter parser tests** use the saved responses in `data/opendata/` as fixtures, so no network is needed.
- **One live smoke script** (`npm run data:check`) calls each provider once and prints status. Run it on the morning of the demo.
- **A browser check** in `npm run dev`: one report with the network tab open, to confirm every call is either same-origin (`/proxy/hsy`) or CORS-allowed.

## 9. Optional server: when and how

There is no server now. Build `server/` (Express 5 + TypeScript, its own `package.json`) only when one of these appears:

| Trigger | Why the browser can't do it |
| --- | --- |
| A React Native app ships next to the web app | Both apps would otherwise each carry the adapters. A server lets a StatFin code change or an API fix ship once, without an app-store release |
| A key is needed (Digitransit autocomplete, NLS geocoder, Claude for the live AI summary) | Anything in the bundle is public |
| Shared cache or rate limits matter (many users, StatFin 429s) | Each browser caches only for itself |
| HSY must be live on a host without rewrites | The browser needs a proxy anyway |

How to add it, without changing the engine or the UI:

1. Create `server/` with Express routes that call the same `shared/services/` functions: `POST /api/moving/report` → `buildMovingReport`, `GET /api/geocode?q=` → `geocode`, plus `GET /api/health` and `GET /api/sources`. Validate input with Zod.
2. Give the server a file-backed `CacheStore` (JSON in `server/data/cache/`, gitignored). Keys go in `server/.env`, never in the bundle or the repo.
3. Add a `remote` `ReportService` in `src/api/` that calls those routes. Switch with `VITE_REPORT_SERVICE=local|remote`. The Vite dev proxy forwards `/api` to `http://localhost:3001`.
4. Move the HSY call from the proxy to the server. The snapshot script can then call the server or keep running `shared/` directly.

Estimated effort once `shared/` exists: about 2–3 h, because the routes are thin wrappers.

## 10. Database (deferred)

Not needed for the MVP. Journeys stay in the browser (`localStorage`), and so does the open-data cache. Add PostgreSQL (Docker, `npm run db:*` scripts, as in commit `de51562`) only after the server exists and one of these appears: journeys shared across devices, If staff reviewing journeys, partners or products edited without redeploying, or a cache shared by several server instances. `CacheStore` then gets a Postgres implementation, and nothing else changes.

## 11. Build order

| Step | Work | Done when | Est. | Status (2026-10-17) |
| --- | --- | --- | --- | --- |
| 1 | `shared/types.ts`, `shared/` in `tsconfig.app.json`, Vitest, Vite proxy for `/proxy/hsy`, `ReportService` stub | `npm run build` passes and one Vitest test runs | 1 h | Built. Vitest tests not built |
| 2 | Geocode adapter; municipality-code map from StatFin metadata | Entering "Mannerheimintie 1" returns a postcode and `KU091` | 1.5 h | Built |
| 3 | HSY, StatFin (`13mu`, `13h4`, `12qh`, `15er`), SYKE adapters, with parser tests on the saved samples | `collectSignals` returns real figures for 00100 in the browser | 3 h | Built. `13mu` price not built; parser tests not built |
| 4 | Engine in `shared/engine/`: flag catalogue, scores, gaps, ranking; Vitest tests | Engine tests pass for the demo personas | 3 h | Built. Vitest tests not built |
| 5 | `buildMovingReport`, reference figures, `sources[]`, `local` `ReportService` | Report object matches the Risk Report design | 1 h | Built |
| 6 | `localStorage` cache, snapshot script, `VITE_OPEN_DATA_MODE=snapshot` | Report works with Wi-Fi off | 1.5 h | Not built: snapshot script and `VITE_OPEN_DATA_MODE` |
| 7 | FMI and Digitraffic adapters (schedule delay, weather) | Move date within 7 days shows live disruptions | 2 h | Built, with Open-Meteo instead of FMI and Digitraffic `TRAFFIC_ANNOUNCEMENT` only |
| 8 | Frontend wiring: form → report → cards, gauge, actions, gaps | Full Moving flow in the browser | separate frontend plan | Built: Moving page and risk report |

Steps 1–6 are the data and engine MVP (~11 h). Step 7 is a stretch goal. The server ([§9](#9-optional-server-when-and-how)) is not in the build order.

## 12. Open items

Status on 2026-10-17: the engine, adapters, `ReportService`, Moving page and risk report are built. The items below are not built yet, or are open.

| Item | Status | Action |
| --- | --- | --- |
| HSY when deployed | No CORS (verified) | Pick a host with rewrites (Vercel or Netlify), or accept snapshot-only HSY outside dev |
| SYKE licence and the sea-flood return-period layers (1/20, 1/100, 1/250) | Unverified | Use the flood-risk-area layer only; ask SYKE or check the layer metadata |
| Finance Finland and PRONTO licences | Not stated | Cite as facts with the source; don't reproduce their charts |
| PRONTO rescue-department building-fire export | No endpoint found | Ask Pelastusopisto; not needed for the MVP |
| HSY rate limits | Not documented | Cache aggressively; snapshots for the demo addresses |
| Population denominator for `ton/12qh` accident rates | Resolved: derived from `13h4` (`rikokset_lkm ÷ rik_10000 × 10,000`) | None |
| Open-Meteo request (replaces FMI) | Can return 503 "service is overloaded" | The adapter marks the source missing; flags that need it drop out |
| `old-plumbing` points by build year | Product assumption: 1960–1989 +14, before 1960 +8 | Confirm with If mentors (pipe renovation is typically due at ~50 years) |
| StatFin price `13mu` and the home-value flag | Not built | Add the adapter and flag later. The flag was removed from the catalogue |
| Snapshots, `scripts/snapshot.ts` and `VITE_OPEN_DATA_MODE` | Not built | Build in step 6 |
| Vitest tests | Not built | Engine rules, scores and parser tests (see §8) |
| Deploy rewrites for `/proxy/hsy` | Not built | Add the Vercel or Netlify rewrite when deploying (see §4) |
