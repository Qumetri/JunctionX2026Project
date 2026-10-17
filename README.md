# If Life Moments

A Junction 2026 prototype for the If Insurance challenge. It helps people before a big life decision instead of after something goes wrong. The finished journey is **Moving**: enter the address you're moving to and the app checks the building, the area and moving day against Finnish open data. It then shows the risks, a suggested If home insurance level and a step-by-step moving plan.

Background and product decisions are in [`context/`](context/) (start with `context.md` and `application.md`).

## Run it

Needs Node 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run lint
```

Optional, for the AI summary on the Detailed risk overview:

```bash
# install Ollama from https://ollama.com, then
ollama pull qwen2.5:3b
```

Without Ollama the app still works and shows a template summary instead.

## How it works

**The Moving journey** (Moving menu in the header):

1. **Risk check** (`#moving`): the user enters the new address and a few answers (self-move, home type, renting, pets and so on) and presses **Calculate risk**.
2. The app geocodes the address and asks the open-data sources in parallel. A preview lists the risks found and an overall score.
3. **Moving plan** (`#moving-plan`) has four steps: choose cover (Perus, Laaja or LaajaPlus, with the suggested level marked), recommended actions, partners and help, and a moving-day checklist.
4. **Detailed risk overview** (`#risk-report`) shows where every point comes from, a protection gap check against the suggested level and a short "In short" summary.

**The risk engine** (`shared/engine/`) is plain TypeScript with no React:

- Each risk is a **flag** made of point lines, for example "+12 Burglary rate 1.6× the national rate" and "+4 Windows at street level". There are 10 flags (`rules.ts`).
- Flag points add up to the **risk bar** (0–100): 40 or more is medium, 70 or more is high (`score.ts`).
- The **suggested plan** follows the risk level and is raised if a higher level is needed to cover a high risk (`plans.ts`). Plan perks come from If's published pages (`shared/data/homePlans.ts`).
- The **summary** (`summary.ts`, `shared/services/aiSummary.ts`) always computes the score and plan sentences. A local model through Ollama may rewrite only the risk sentences, and its answer is checked: no new numbers, no insurance claims, length limits. Otherwise the template is used.

**Data** is fetched from the browser. No server, database or API keys are needed.

| Source | Used for | Notes |
| --- | --- | --- |
| OpenStreetMap Nominatim | Address → coordinates, town | Called only on submit (usage policy) |
| HSY building register | Building year and heating | Helsinki, Espoo, Vantaa, Kauniainen only. No CORS, so it goes through `/proxy/hsy` |
| SYKE | Flood risk areas | |
| Statistics Finland | Burglary, arson and road-accident rates vs the national rate | Falls back to built-in 2025 figures for the capital region |
| Open-Meteo | Moving-day weather | Only when the move is within 16 days |
| Fintraffic Digitraffic | Traffic announcements near the address | Only when the move is within 7 days |
| Finance Finland, Pelastusopisto PRONTO | Average claim sizes shown on flags | Static figures in `shared/reference/figures.ts` |

A source that fails or times out is marked "no answer" and only the flags that need it drop out. Answers are cached in `localStorage` (`lm:cache:*`). The user's answers, report and progress are saved there too; **Reset progress** on the home page clears them.

**Code layout**

```
shared/      types, open-data adapters, cache, risk engine, plans, partners (no React)
src/api/     ReportService: the only way the UI reaches shared/ (swap for a server later)
src/state/   hooks for the plan, report and journey progress
src/pages/   Home, Moving, Moving plan, Risk report, Travel, Member benefits
data/        raw open-data samples and PDFs used while building (not shipped)
context/     product spec, data-source research, plans
```

## What's needed for it to work fully

**To deploy it**

- **HSY proxy rewrite.** `/proxy/hsy/*` only works in `npm run dev`. On Vercel or Netlify, add a rewrite to `https://kartta.hsy.fi/geoserver/*`. Without it, building year is "unknown" and the pipe-age flag is less precise.
- **AI summary on a deployed site.** A visitor's browser can't reach Ollama on our machine, so a deployed site always shows the template summary. A live model needs the optional server in `context/backendMovingPlan.md` §9, which would hold an API key.

**Not built yet**

- **Offline demo mode.** Snapshots of the demo addresses (`scripts/snapshot.ts`, `VITE_OPEN_DATA_MODE=snapshot`) so a venue without network still works.
- **Tests.** Vitest for the rules, scores and adapter parsers. `data/opendata/` already has sample responses to use as fixtures.
- **Home-value flag.** It would use the Statistics Finland price per m² (`13mu`) and the home size.
- **Travel uses static data.** It runs on a hand-written destination list (`src/data/destinations.ts`). The researched sources (Eurocontrol delays, FCDO advisories, Open-Meteo, GDACS) are documented in `context/techStack.md` but not connected.
- **Pet Care.** Only a card on the home page.
- **Real quotes and login.** Out of scope for the prototype. "Get a quote" links go to if.fi.

**To confirm with If**

- **Plan details.** Perus/Laaja/LaajaPlus perks and limits were read from if.fi through a summarising tool and need checking against the terms PDF. In particular: is burglary in Perus, and do movers' damage and storage count?
- **Point values.** The values in `shared/engine/rules.ts` are our assumptions, for example pipes from 1960–1989 scoring +14.
- **Partner offers.** The offers in the action list ("member price", "free tool rental") are placeholders. Only `shared/data/partners.ts` lists confirmed If benefits.

**Licences.** Finance Finland and PRONTO publish no licence, so their figures are cited as facts with the source. The SYKE licence still needs checking.
