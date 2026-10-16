# Tech Stack — Life Moments Prototype

Decisions for the If Insurance hackathon prototype (see [context.md](context.md)). Frontend: **React**. Backend: **Express**. Database: **PostgreSQL in Docker**. The goal is a polished end-to-end demo of 1–2 journeys (Moving first). It is not meant to be production infrastructure.

## Guiding principles

1. **Demo over infrastructure.** The judges score customer value, business value, and experience. Every hour spent on auth, databases, or deployment pipelines is an hour not spent on the journey.
2. **Keep the risk engine framework-free.** The checklist and recommendation logic is plain TypeScript with no React, DOM, or Express imports. Web, server, and a future React Native app can all use it (see [MobileApplication.md](MobileApplication.md)).
3. **Mock data is fine; real open data is a bonus.** A seed script that loads partners and coverage into Postgres, plus one or two live open-data signals (for example weather), make the demo feel real.
4. **One command to a working stack.** `npm run dev` starts Postgres (Docker), the API, and the client. A fresh clone needs only `npm install && npm run db:reset && npm run dev`.
5. **Mobile-first layout.** Design for a ~390px viewport from day one. It looks like an app in the demo video and makes a later port easier.

## Repo layout (proposed)

```
JunctionX2026Project/
├── client/          # React + Vite (the current src/ moves here)
├── server/          # Express API
│   └── src/db/      # Drizzle schema, migrations, seed script
├── shared/          # Types + risk engine (pure TS), imported by both
├── context/         # Brief, tech stack, notes
├── docker-compose.yml
└── .env.example     # DATABASE_URL etc. — copy to .env
```

We can use npm workspaces (`"workspaces": ["client", "server", "shared"]` in the root `package.json`) and start Postgres, the API, and the client from one `npm run dev` (see [Database](#database--postgresql-in-docker)).

## Frontend — `client/`

| Concern     | Choice                                   | Why                                                                                   |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Framework   | React 19 + TypeScript + Vite (in place)  | Already scaffolded, fast HMR                                                          |
| Routing     | React Router                             | Journey is multi-step: event picker → questionnaire → checklist → offers → timeline  |
| Server data | TanStack Query (or plain `fetch` + hooks) | Loading/error states for free; plain hooks are enough if we stay small                |
| Local state | `useState` / `useReducer` + Context      | Questionnaire answers and checklist progress; no Redux needed                         |
| Styling     | Plain CSS modules or Tailwind            | Pick one on day one and stick to it. Tailwind ports to RN via NativeWind              |
| Validation  | Zod (schemas live in `shared/`)          | Same schema validates the form on the client and the request on the server            |
| Icons/maps  | Lucide icons; Leaflet only if a map earns its place | Keep the bundle and the scope small                                         |

Vite dev proxy forwards `/api` to Express so the client uses relative URLs:

```ts
// client/vite.config.ts
server: { proxy: { '/api': 'http://localhost:3001' } }
```

## Backend — `server/`

| Concern     | Choice                              | Why                                                                 |
| ----------- | ----------------------------------- | ------------------------------------------------------------------- |
| Framework   | Express 5 + TypeScript              | Team preference; async errors are handled natively in v5            |
| Dev runner  | `tsx watch src/index.ts`            | No build step during the hackathon                                  |
| Validation  | Zod (shared schemas)                | One source of truth for the request shape                           |
| Database    | PostgreSQL via Drizzle ORM          | See [Database](#database--postgresql-in-docker)                     |
| Secrets     | `.env` + `dotenv`                   | `DATABASE_URL`, open-data and optional LLM keys stay server-side, never in the client bundle |
| CORS        | `cors` middleware                   | Only needed when the mobile app or a deployed client calls the API  |

### API sketch

| Method | Path                         | Purpose                                                          |
| ------ | ---------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/events`                | List of life events (Moving, Pet, …) with their questionnaires   |
| POST   | `/api/journeys`              | Create a journey from answers → flags + ranked products + timeline |
| PATCH  | `/api/journeys/:id/tasks/:taskId` | Tick a task → flags re-evaluated, readiness score updated   |
| POST   | `/api/journeys/:id/summary`  | AI summary of flags + why the top plan fits (cached)             |
| GET    | `/api/partners?event=moving` | Partner services (movers, tool rentals, Anticimex, Verisure…)    |
| GET    | `/api/signals?postcode=…`    | Contextual open-data signals (weather on moving day, etc.)       |
| GET    | `/api/journeys/:id/nudges`   | Timeline of reminders leading up to the event                    |

The Express layer stays thin: validate input, call `shared/riskEngine`, enrich the result with partner and open-data lookups, then return JSON.

## Database — PostgreSQL in Docker

### What goes in the DB

| Table                     | Contents                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| `life_events`             | Moving, Pet, … plus their questionnaire definitions (`jsonb`)            |
| `partners`                | Movers, tool rentals, Anticimex, Verisure, FirstVet… (seeded)            |
| `insurance_products`      | Home, contents, pet, liability products with coverage tags + terms excerpt (seeded) |
| `journeys`                | A user's life event: event type, answers (`jsonb`), event date           |
| `journey_flags`           | Computed risk flags with status (open / mitigated / covered)             |
| `journey_tasks`           | Timeline items with `done` state, so progress persists                   |
| `nudges`                  | Scheduled reminders per journey (`due_at`, `sent_at`)                    |
| `ai_summaries`            | Cached AI output keyed by a hash of its input                            |
| `open_data_cache`         | Responses from FMI, Statistics Finland, HSY, SYKE… with per-provider TTL (see [Open data](#open-data-finland)) |

Full field-level detail for flags, products, and ranking: [application.md](application.md).

The **risk rules stay in code** (`shared/`), not in the DB. They contain logic (`when` functions), they need to work offline in a future mobile app, and keeping them in git makes them easy to review. Postgres stores reference data and user state.

No auth: a journey is identified by a random UUID that the client keeps (`localStorage`/URL). That is enough for the demo.

### Data access: Drizzle ORM

- Schema is TypeScript (`server/src/db/schema.ts`), and the query results are typed.
- `drizzle-kit` generates SQL migrations from the schema, and Drizzle Studio gives a browser UI to inspect data.
- It's thin and close to SQL. Prisma would also work but adds a generate step and a heavier client.
- Driver: `pg` (node-postgres).

### Docker Compose

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: lifemoments
      POSTGRES_PASSWORD: lifemoments
      POSTGRES_DB: lifemoments
    ports:
      - '${DB_PORT:-5433}:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U lifemoments -d lifemoments']
      interval: 2s
      timeout: 3s
      retries: 15
volumes:
  pgdata:
```

- **Host port 5433, not 5432.** At least one dev machine already runs a local Postgres on 5432. Override with `DB_PORT` in `.env` if needed.
- **`postgres:17`, not 18.** Postgres 18 images changed the expected volume mount path (`/var/lib/postgresql`), and the mount above would need adjusting. 17 avoids that gotcha; it has everything we need.
- The healthcheck lets `docker compose up --wait` block until the DB actually accepts connections, so migrations never race the startup.

```bash
# .env.example
DATABASE_URL=postgres://lifemoments:lifemoments@localhost:5433/lifemoments
DB_PORT=5433
```

### npm scripts (root `package.json`)

```jsonc
{
  "scripts": {
    "db:up": "docker compose up -d --wait db",
    "db:down": "docker compose down",
    "db:generate": "npm run db:generate -w server", // drizzle-kit generate
    "db:migrate": "npm run db:migrate -w server",   // drizzle-kit migrate
    "db:seed": "npm run db:seed -w server",         // tsx src/db/seed.ts
    "db:reset": "docker compose down -v && npm run db:up && npm run db:migrate && npm run db:seed",
    "db:studio": "npm run db:studio -w server",     // drizzle-kit studio
    "predev": "npm run db:up && npm run db:migrate",
    "dev": "concurrently -n api,web -c blue,green \"npm run dev -w server\" \"npm run dev -w client\""
  }
}
```

- `npm run dev`: the `predev` hook starts the container (if not running), waits for it to be healthy, and applies pending migrations. Then API and client start side by side.
- `npm run db:reset`: wipes the volume and reseeds from scratch. Use this whenever the demo data drifts.
- `npm run db:down` stops the container but keeps the data; `down -v` (inside `db:reset`) deletes it.
- Seed must be **idempotent** (upsert on stable ids) so running it twice doesn't duplicate partners.

**Requirement:** Docker Desktop (or a compatible engine) must be running before `npm run dev`. Otherwise `db:up` fails with a "cannot connect to the Docker daemon" error.

## Risk engine — `shared/`

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

Rules emit **flags**; a separate ranking function scores insurance products against the open flags. Both are pure functions in `shared/`. See [application.md](application.md) §5–6.

Rules are data, so the team can write them in parallel and tune the demo story without touching UI code.

## Open data (Finland)

The backend uses free Finnish public data to make the flags and estimates specific to **this address, this area, this date**. This turns "old buildings have pipe problems" into "your building is from 1964, and a typical water-damage claim in Finland is about €4,000".

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
| **If's public terms and conditions**                  | What each product covers and excludes                                | Public PDFs/web pages, **static**                                                               | `terms_excerpt` per product, which grounds the AI explanations                                                     | 1        |

**Priority:** 1 = build on day one; 2 = adds a lot to the demo if time allows; 3 = static numbers or regional data we hardcode into seed data or rules.

Also useful for finding more: **avoindata.fi** (the national open data catalog) and **Helsinki Region Infoshare (hri.fi)** for Helsinki-region datasets.

### How the backend uses it

```
address + move date
   │
   ▼
geocode (Digitransit / NLS / Nominatim) ──► { lat, lon, postalCode, municipality }
   │
   ├─► buildingInfo   (HSY WFS)            → buildingYear, material
   ├─► areaStats      (Paavo, ashi, rpk)   → pricePerM2, crimeRate vs. national, household size
   ├─► floodRisk      (SYKE WMS)           → inFloodZone: boolean
   └─► weather        (FMI, Digitraffic)   → forecast + warnings for the move date
   │
   ▼
Signals object ──► shared/riskEngine (rules) ──► flags + severity + € estimates
```

- **Adapters:** one small module per provider in `server/src/opendata/` that returns typed `Signals` fields. The risk engine only sees `Signals`, never raw API responses, so a broken API means a missing signal instead of a crash.
- **Graceful degradation:** each adapter has a short timeout (≈2s). On failure the signal is `undefined`, and rules fall back to what the user typed (e.g. "Roughly when was the building built?").
- **Caching in Postgres:** an `open_data_cache` table (`provider`, `key`, `payload jsonb`, `fetched_at`) with a per-provider TTL: weather 1h, area statistics 30 days, buildings 7 days. Area statistics rarely change, so the demo addresses can be pre-warmed by the seed script. The demo then works offline.
- **Coordinates:** Statistics Finland and NLS use ETRS-TM35FIN (EPSG:3067), and the HSY/Helsinki services use GK25 (EPSG:3879). Request WGS84 (`EPSG:4326`) output where the service supports it; otherwise convert with `proj4`.
- **PxWeb gotcha:** Statistics Finland shortened some table and variable identifiers on 8 June 2026. Build queries against the current table metadata (`GET` on the table URL returns it) rather than copying old examples.
- **Coverage limit:** building-level data (year of construction) is open for the Helsinki region via HSY. **Pick a Helsinki-region address for the demo persona**; elsewhere the app asks the user for the building year.

### Example: what the user sees

> 🔴 **Old pipes:** Your building at Mannerheimintie X was completed in **1964** (HSY). Buildings from before 1980 are entering pipe-renovation age, and water damage is the most common home insurance claim in Finland, at about **€4,000** per case (Finance Finland).
> 🟠 **Burglary:** Reported property crime in Helsinki is **above the national average** per 1,000 residents (Statistics Finland). You're moving to a ground-floor flat.
> 🟡 **Moving-day weather:** FMI forecasts **rain** on 14 Nov. Pack electronics in plastic and book a covered van.

## AI layer

Claude (`@anthropic-ai/sdk`, server-side only) summarizes the flags and explains why the top-ranked plan fits. It explains the ranking but never computes it; flags and ranking stay deterministic. The output is validated JSON, cached in Postgres, with a template fallback so the demo works without it. Details in [application.md](application.md) §7.

## Deployment (for the demo)

- **Simplest:** run locally and record the demo video from localhost.
- **Shareable link:** deploy the client to Vercel or Netlify and the API to Render or Railway, or have Express serve `client/dist` so only one service needs deploying. Use the host's managed Postgres (Render, Railway, or Neon), set `DATABASE_URL`, and run `db:migrate` + `db:seed` once. Docker Compose is for local development only.

## Explicitly out of scope

Auth and user accounts, real insurer integrations, payments, CI/CD, test coverage beyond the risk engine.
