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
| POST   | `/api/events/:id/assess`     | Answers → risk checklist + preventive actions + coverage gaps    |
| GET    | `/api/partners?event=moving` | Partner services (movers, tool rentals, Anticimex, Verisure…)    |
| GET    | `/api/signals?postcode=…`    | Contextual open-data signals (weather on moving day, etc.)       |
| GET    | `/api/nudges/:planId`        | Timeline of reminders leading up to the event                    |

The Express layer stays thin: validate input, call `shared/riskEngine`, enrich the result with partner and open-data lookups, then return JSON.

## Database — PostgreSQL in Docker

### What goes in the DB

| Table                     | Contents                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| `life_events`             | Moving, Pet, … plus their questionnaire definitions (`jsonb`)            |
| `partners`                | Movers, tool rentals, Anticimex, Verisure, FirstVet… (seeded)            |
| `coverage_products`       | Home, contents, pet, liability add-ons with short descriptions (seeded)  |
| `plans`                   | A user's saved journey: event, answers (`jsonb`), event date             |
| `plan_items`              | Generated checklist items with `done` state, so progress persists        |
| `nudges`                  | Scheduled reminders per plan (`due_at`, `sent_at`)                       |

The **risk rules stay in code** (`shared/`), not in the DB. They contain logic (`when` functions), they need to work offline in a future mobile app, and keeping them in git makes them easy to review. Postgres stores reference data and user state.

No auth: a plan is identified by a random UUID that the client keeps (`localStorage`/URL). That is enough for the demo.

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
  risk: { title: string; why: string; severity: 'low' | 'medium' | 'high' };
  actions: string[];   // preventive steps
  partners?: string[]; // partner ids, e.g. 'anticimex'
  coverage?: string[]; // product ids, e.g. 'home-contents'
  nudgeDaysBefore?: number;
};
```

Rules are data, so the team can write them in parallel and tune the demo story without touching UI code.

## Open data (Finland)

These are candidates to check early. Use at most one or two in the demo.

- **Finnish Meteorological Institute (FMI) open data:** forecasts or warnings for moving day (rain → water-damage risk to furniture in transit).
- **Statistics Finland (PxWeb API):** regional statistics such as building age by postcode, to drive moisture and pipe-renovation (_putkiremontti_) risks.
- **If's public terms and conditions:** what home or pet coverage actually includes, so the "coverage gap" explanations are accurate.

If an API is slow or awkward, cache a snapshot as JSON and move on.

## Optional AI layer

An LLM can turn the rule output into a friendly, personalized explanation ("Because your new building is from 1972…"), or answer free-text questions about the checklist. Call it **server-side only** and keep it optional: the demo must work without it, and the deterministic checklist stays the source of truth.

## Deployment (for the demo)

- **Simplest:** run locally and record the demo video from localhost.
- **Shareable link:** deploy the client to Vercel or Netlify and the API to Render or Railway, or have Express serve `client/dist` so only one service needs deploying. Use the host's managed Postgres (Render, Railway, or Neon), set `DATABASE_URL`, and run `db:migrate` + `db:seed` once. Docker Compose is for local development only.

## Explicitly out of scope

Auth and user accounts, real insurer integrations, payments, CI/CD, test coverage beyond the risk engine.
