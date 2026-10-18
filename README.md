# If Life Moments

A Junction 2026 prototype for the If Insurance challenge. It helps people before a big life decision instead of after something goes wrong. The finished journey is **Moving**: enter the address you're moving to and the app checks the building, the area and moving day against Finnish open data. It then shows the risks, a suggested If home insurance level and a step-by-step moving plan. **Travel** works the same way for a trip abroad: risks from the season, how soon you leave and how long you stay, plus tips and a dated checklist.

Background and product decisions are in [`context/`](context/) (start with `context.md` and `application.md`).

## Run it

Needs Node 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173, plus Ollama and the model if installed
npm run dev:web    # Vite only (or OLLAMA=off npm run dev)
npm run build      # type-check + production build to dist/
npm run lint
```

Optional, for the AI summary on the Detailed risk overview and the AI summary and tips on Travel:

install Ollama from https://ollama.com. `npm run dev` then does the rest (`scripts/dev.mjs`): it starts `ollama serve` if Ollama isn't already running (and stops it with Vite), pulls `qwen2.5:3b` the first time (about 2 GB, or `VITE_OLLAMA_MODEL` if set), and loads it so the first summary is quick. Its lines in the terminal start with `[ollama]`.

Without Ollama the app still works and shows a template summary instead.

## How it works

**The Moving journey** (Moving menu in the header):

1. **Risk check** (`#moving`): the user enters the new address and a few answers (self-move, home type, renting, pets and so on) and presses **Calculate risk**.
2. The app geocodes the address and asks the open-data sources in parallel. A preview lists the risks found and an overall score.
3. **Moving plan** (`#moving-plan`) has four steps: choose cover (Perus, Laaja or LaajaPlus, with the suggested level marked), recommended actions, partners and help, and a moving-day checklist.
4. **Detailed risk overview** (`#risk-report`) shows where every point comes from, a protection gap check against the suggested level and a short "In short" summary.

**The Travel journey** (`#travel`): pick a destination, dates, purpose, pet and whether you already have travel insurance, and press **Check travel risks**. The snapshot shows the score and the biggest risks; the overview below adds an "In short" summary, a cover card (fixed-term or continuous), points per risk, "Tips for this trip" and a "Before you go" checklist with a date on every step.

**Pet Care** (`#pet-care`): a walk video banner with the demo dog's health record (vaccine, deworming, weight, allergies), a pet travel checklist (Finnish entry rules such as the tapeworm treatment before coming home), and dog parks and vets within 3 km on a map: near the new home after a moving check, near central Helsinki otherwise, or near the user with **Use my location**.

**Seniors** (`#seniors`): home safety, help with heavy chores, and technology and scams as checklists with "who can help" notes. It is built for older readers: larger text with a text-size control, big targets and strong focus rings.

**The risk engine** (`shared/engine/`) is plain TypeScript with no React:

- Each risk is a **flag** made of point lines, for example "+12 Burglary rate 1.6× the national rate" and "+4 Windows at street level". Moving has 10 flags (`rules.ts`), Travel 12 (`travelRules.ts`). Travel points come mostly from the season (winter at Helsinki Airport, flu season, holiday peaks, weather on the dates), the days left before departure and the trip length.
- Flag points add up to the **risk bar** (0–100): 40 or more is medium, 70 or more is high (`score.ts`).
- The **suggested plan** follows the risk level and is raised if a higher level is needed to cover a high risk (`plans.ts`). Plan perks come from If's published pages (`shared/data/homePlans.ts`).
- The **summary** (`summary.ts`, `shared/services/aiSummary.ts`) always computes the score and plan sentences. A local model through Ollama may rewrite only the risk sentences, and its answer is checked: no new numbers, no insurance claims, length limits. Otherwise the template is used. Travel (`travelSummary.ts`, `aiTravelSummary.ts`) also asks for 3–5 tips built from the expert tips of the biggest risks, checked the same way.

**Data** is fetched from the browser. No server, database or API keys are needed.

| Source | Used for | Notes |
| --- | --- | --- |
| OpenStreetMap Nominatim | Address → coordinates, town | Called only on submit (usage policy) |
| HSY building register | Building year and heating | Helsinki, Espoo, Vantaa, Kauniainen only. No CORS, so it goes through `/proxy/hsy` |
| SYKE | Flood risk areas | |
| Statistics Finland | Burglary, arson and road-accident rates vs the national rate | Falls back to built-in 2025 figures for the capital region |
| Open-Meteo | Moving-day weather; weather on travel dates; departure day at Helsinki Airport | Forecast within 16 days. Later trips use the same dates last year (archive) |
| UK FCDO travel advice | Warnings for the destination country | Finland's um.fi has no API, so the page links to it |
| GDACS | Current disaster alerts near the destination | Only for trips within 30 days |
| OpenStreetMap Overpass | Dog parks and vets near a point (Pet Care) | Free servers are often slow or busy: three are asked in turn (7 s in all), then a saved copy of all of Finland (`shared/reference/petPlaces.ts`, rebuilt with `scripts/pet-places.mjs`) answers |
| Fintraffic Digitraffic | Traffic announcements near the address | Only when the move is within 7 days |
| Finance Finland, Pelastusopisto PRONTO, EUROCONTROL | Average claim sizes; Helsinki Airport winter delays | Static figures in `shared/reference/figures.ts` |

A source that fails or times out is marked "no answer" and only the flags that need it drop out. Answers are cached in `localStorage` (`lm:cache:*`). The user's answers, report and progress are saved there too; **Reset progress** on the home page clears them.

**Code layout**

```
shared/      types, open-data adapters, cache, risk engine, plans, partners (no React)
src/api/     ReportService: the only way the UI reaches shared/ (swap for a server later)
src/state/   hooks for the plan, report and journey progress
src/pages/   Home, Moving, Moving plan, Risk report, Travel, Pet Care, Seniors, Member benefits
data/        raw open-data samples and PDFs used while building (not shipped)
context/     product spec, data-source research, plans
```

## Demo addresses

Addresses for showing the Moving risk check at each risk level. Enter them in **Moving to** with one of these answer sets:

| Answer set | Moving from | Home | Answers |
| --- | --- | --- | --- |
| **Careful** | (empty) | Flat, 55 m² | Upper floor, buying, movers, home insurance, no valuables, no dog |
| **Mixed** | Hämeenkatu 20, Tampere | Flat, 70 m² | Like Careful, but renting and moving yourself |
| **Risky** | Hämeenkatu 20, Tampere | Flat, 95 m² | Ground floor, renting, moving yourself, valuables, dog, no home insurance |

| Address | Answers | Score | What drives it |
| --- | --- | --- | --- |
| Hämeenkatu 20, Tampere | Careful | 18, low | Burglary 0.77× the national rate, no flood area. Outside HSY, so the pipe age is unknown (+5) |
| Kuninkaantammenkierto 1, Helsinki | Careful | 20, low | Inland, no flood area, burglary at the national rate |
| Välimerenkatu 1, Helsinki | Careful | 25, low | Apartment block from 2019, so no pipe risk, but inside the coastal flood area (+10) |
| Hakunilantie 48, Vantaa | Careful | 40, medium | Address alone: building from 1976 (pipes +14) and burglary 1.63× the national rate |
| Välimerenkatu 1, Helsinki | Mixed | 50, medium | The same new building as above; renting and moving yourself add the rest |
| Itäpuisto 1, Pori | Mixed | 61, medium | Burglary 1.74× the national rate, flood area, and a long drive from Tampere |
| Kontulankaari 1, Helsinki | Risky | 95, high | Building from 1967 (pipes +14), no flood area |
| Mannerheimintie 10, Helsinki | Risky | 100, high | Building from 1961 (pipes +14), coastal flood area, and every risky answer |

Scores were measured on 18 October 2026 for a move on **17 November 2026**. The date matters:

- A move within 16 days adds the moving-day forecast (rain, snow, wind).
- The 28th to the 1st adds the end-of-month rush.
- A move within two weeks adds the booking squeeze.
- November to March adds winter roads when you drive yourself.

The open data also changes, for example new crime statistics.

The flood check uses SYKE's proposed flood risk *areas*, which are broad outlines, so central Helsinki, Leppävaara and central Pori count as flood areas even where SYKE's detailed maps show dry land. If the check moves to the detailed maps, Välimerenkatu, Itäpuisto and Mannerheimintie lose some flood points.

## What's needed for it to work fully

**To deploy it**

- **HSY proxy rewrite.** `/proxy/hsy/*` only works in `npm run dev`. On Vercel or Netlify, add a rewrite to `https://kartta.hsy.fi/geoserver/*`. Without it, building year is "unknown" and the pipe-age flag is less precise.
- **AI summary on a deployed site.** A visitor's browser can't reach Ollama on our machine, so a deployed site always shows the template summary and tips. A live model needs the optional server in `context/backendMovingPlan.md` §9, which would hold an API key.

**Not built yet**

- **Offline demo mode.** Snapshots of the demo addresses (`scripts/snapshot.ts`, `VITE_OPEN_DATA_MODE=snapshot`) so a venue without network still works.
- **Tests.** Vitest for the rules, scores and adapter parsers. `data/opendata/` already has sample responses to use as fixtures.
- **Home-value flag.** It would use the Statistics Finland price per m² (`13mu`) and the home size.
- **More travel data.** Travel has 8 fixed destinations (`shared/data/destinations.ts`); any city would need geocoding and a country lookup. Eurocontrol airport delays, rail to the airport and ferries are researched in `context/techStack.md` but not connected.
- **Pet Care profiles.** The pet is a fixed demo dog; only the checklist and the deworming date are saved.
- **Real quotes and login.** Out of scope for the prototype. "Get a quote" links go to if.fi.

**To confirm with If**

- **Plan details.** Perus/Laaja/LaajaPlus perks and limits were read from if.fi through a summarising tool and need checking against the terms PDF. In particular: is burglary in Perus, and do movers' damage and storage count?
- **Point values.** The values in `shared/engine/rules.ts` are our assumptions, for example pipes from 1960–1989 scoring +14.
- **Partner offers.** The offers in the action list ("member price", "free tool rental") are placeholders. Only `shared/data/partners.ts` lists confirmed If benefits.

**Licences.** Finance Finland and PRONTO publish no licence, so their figures are cited as facts with the source. The SYKE licence still needs checking.
