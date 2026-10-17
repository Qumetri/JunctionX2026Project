# Travel: which sources we actually check

Checked on 2026-10-17. I ran `buildTravelReport` (the same shared code the browser runs) against the live APIs from Node, then checked CORS headers from the browser's point of view. Probe script: `/private/tmp/claude-501/-Users-urijalekseev-Cursor-JunctionProject/4529f3d5-03c9-46e4-a853-8af0744de276/scratchpad/probe.ts`.

## Short answer

Yes, four sources are called on every "Check travel risks" run. Two of them only run when the trip is close enough, so for distant trips they show as "not needed".

| Source (id) | Provider | Runs when | Result in the probe | Key | CORS |
| --- | --- | --- | --- | --- | --- |
| `advisory` | UK FCDO travel advice (gov.uk content API) | Always | Live for every destination tried | No | `*` |
| `weather` | Open-Meteo | Always: forecast if the trip starts within 15 days, otherwise last year's archive for the same dates | Live | No | `*` |
| `departure` | Open-Meteo, Helsinki Airport | Trip starts within 15 days (forecast limit) | Live when it runs | No | `*` |
| `hazards` | GDACS current events | Trip starts within 30 days, or is under way | Live; returns 0 events for Rome | No | `*` |

Probe results:

- **Bangkok, 60 days out:** advisory live (`avoid_all_but_essential_travel_to_parts`), weather live (last-year archive, 2025-12-16 to 2026-01-01), departure skipped, hazards skipped.
- **Rome, 5 days out:** all four live. Hazards returned no events near Rome.
- **Tallinn, 2 days out:** all four live. Hazards came from the cache because the probe shared one cache with the Rome run.

Each run took 0.2 to 1.4 s.

## Not live

- **Helsinki Airport weather delay share (95%)**: hard-coded in `shared/reference/figures.ts` with the EUROCONTROL `apt_dly_2025` source. The footer names EUROCONTROL, but it is not in the sources list. The sample in `data/opendata/travel/eurocontrol/` has only 50 rows, so the 95% cannot be re-checked from it.
- **Finland's own advice (um.fi)**: no API. The page only links to it.
- **Entry rules, vaccines, medical costs, pet rules**: hand-written per destination in `shared/data/destinations.ts` and `travelRules.ts`.

## Available in `data/opendata/travel/` but not wired up

| Dataset | What it would add | Difficulty | Notes |
| --- | --- | --- | --- |
| US State Department advisories | Warnings for `new-york` (the only US destination) | Medium | 223 advisories, about 540 KB. `cadataapi.state.gov` sends no CORS header, so it needs the same proxy approach as HSY (Vite dev proxy plus a host rewrite when deployed). Then one adapter and mapping Levels 1 to 4 to points. |
| Digitraffic live trains at Helsinki (`rata.digitraffic.fi`) | Rail disruption to the airport | Small to medium | Works from the browser without a key (CORS `*`), but it is rail, not flights. Low value for a flight-based risk. |
| Eurostat air passengers 2024 | Context for Helsinki traffic | Small | Annual reference only, so a figure like the EUROCONTROL one, not a live check. |
| Flight status (Finavia or similar) | Departure-day flight delays | Small code, blocked on access | Not checked here. I expect it needs a registered API key, so verify the terms before building. |

## Issues found, not changed

1. **"not needed" reads as "not checked".** The footer shows `hazards` and `departure` as "not needed" for distant trips. Users may take that as a failure. Clearer wording would be something like "not needed: trip more than 30 days away".
2. **No fallback when a live source fails.** If FCDO or GDACS fails, its flags just disappear. Moving has a reference fallback (`referenceCrimeRates`); Travel has none.
3. **Departure weather has a 15-day window.** Destination weather falls back to last year's archive, but Helsinki departure weather does not, so for trips more than 15 days out the departure check is silently skipped.
4. **Hazard filter is correct.** GDACS returns current and past events together. The code keeps only `iscurrent === 'true'`. The sample had 2 current events out of 80.

## Browser check

The probe ran in Node, not in the browser. CORS headers for FCDO, GDACS, Open-Meteo and Digitraffic all allow `*`, so the browser calls should work. The US State Department endpoint does not, which matters only if it is added.
