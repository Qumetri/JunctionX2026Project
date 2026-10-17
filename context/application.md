# Application — What we build and how

Companion to [context.md](context.md) (the brief), [techStack.md](techStack.md) (how it runs), and [MobileApplication.md](MobileApplication.md) (phone port).

## 1. One-liner

**A life-event planner that turns "I'm moving next month" into a personalized plan: what can go wrong, what to do about it, and which If insurance actually fits. Every recommendation is explained in plain language.**

The user comes for the planning; insurance is just a useful part of the plan, rather than the reason the app exists. This aligns perfectly with the brief's reminder—do not make insurance the center of the experience.

## 2. Value on both sides

| For the customer | For If |
| --- | --- |
| A clear, dated checklist for a stressful life event | Reaches users **before** they buy, right at the moment their insurance needs change |
| Risks they didn't know about, explained for *their specific situation* | Recommendations are fully explained, increasing trust and conversion rates |
| Honest advice: "You are already covered here" counts as value | Preventive measures (leak sensors, Anticimex checks) lower claim frequency |
| Partner discounts and services bundled in one place | The partner ecosystem becomes a reason to choose If, not just a post-purchase perk |
| Reminders at the right time, rather than after a loss | A continuous relationship, instead of a single renewal email a year (Retention) |

## 3. Core loop

```
 Select a life event ──► Answer 6–10 quick questions ──► Risk flags appear
        ▲                                                    │
        │                                                    ▼
 Nudges before date ◄── Journey timeline ◄── Ranked insurance plans + AI summary
        │                         ▲
        └── Complete tasks ───────┘  (Flags resolved, readiness score goes up)

```

## 4. What the app must include

### MVP (Must-haves for the demo)

1. **Life event picker:** Moving (fully developed), plus 1–3 "coming soon" cards to show the concept is scalable.
2. **Adaptive questionnaire:** Short, one question per screen, using taps and sliders instead of forms. Follow-up questions only appear when relevant (e.g., "Do you have a pet?" → "Dog or cat?").
3. **Flag system:** Risks derived from answers, shown as colored flags with a one-line "why" (see section 5).
4. **Ranked insurance plans:** Scored by how well they cover *this user's* flags, with details like "covers 5 out of 6 risks" (see section 6).
5. **AI risk summary:** A short, friendly explanation of the main risks and why the top plan is the best fit (see section 7).
6. **Journey timeline:** A dated checklist (8 weeks before → moving day → first week after), integrating preventive actions, partner services, and insurance steps.
7. **Readiness score:** A single 0–100 number that rises as the user completes tasks and resolves flags. This is the main interactive hook.

### Should have (If time allows)

* **"What if" toggles:** Change an answer ("What if I choose that 1950s apartment?") to see flags and ranking update in real-time. A very strong demo moment.
* **Partner offers within the timeline:** "Book a mover (-10% via If)", "Rent a moisture meter", "Anticimex pre-move check". These are placed right next to the relevant steps.
* **Nudges:** Scheduled reminders tied to the event date (in-app list for the demo, push notifications for mobile later).
* **Existing coverage input:** "I already have home insurance" → The app shows gaps instead of pushing duplicate coverage.

### Out of scope

Real quotes and payments, login, real customer data, more than one fully developed life event.

## 5. Flag system

A **flag** represents a specific risk for this user in this life event, explaining what triggered it. Flags are calculated by the rule engine in `shared/engine/` (deterministic, testable; it runs in the browser for the report and for instant "what if" toggles, and can move to a server later unchanged) and are never handed over to AI.

### Flag structure

```typescript
type Flag = {
  id: string;                 // 'old-plumbing'
  category: 'property' | 'belongings' | 'liability' | 'transit' | 'pet' | 'health' | 'income';
  severity: 'high' | 'medium' | 'low';
  title: string;              // 'Old pipes in a 1960s building'
  why: string;                // 'Buildings from before 1980 have a higher water leak risk…'
  evidence: string[];         // Which inputs triggered it: ['buildingYear=1964']
  source: 'answer' | 'open-data' | 'derived';
  actions: ActionRef[];       // Preventive steps; completing them can resolve or downgrade flags
  coverageTags: string[];     // Which insurance covers it: ['water-damage', 'home-contents']
  status: 'open' | 'mitigated' | 'covered';
};

```

### Visual language

| Severity | Color | Meaning to the user |
| --- | --- | --- |
| High | Red | Act before the event date |
| Medium | Amber | Worth handling, has a cheap fix |
| Low | Grey | Good to know |
| Resolved | Green | Mitigated by an action or covered by a plan |

### Example: Moving

| Input | Flag | Severity | Action | Coverage Tags |
| --- | --- | --- | --- | --- |
| Building built before 1980 | Old plumbing / Leak risk | High | Leak sensor, Anticimex moisture check | `water-damage`, `home` |
| Moving yourself (no movers) + Valuables | Transit damage | Medium | Book vetted mover, rent a moving dolly | `transit`, `home-contents` |
| Has a dog | Pet liability | Medium | — | `liability`, `pet` |
| No current home contents insurance | Belongings uninsured at new address | High | — | `home-contents` |
| Open-Meteo forecast: rain on moving day (open data) | Water damage in transit | Low | Plastic covers, reschedule tip | `transit` |
| Ground-floor apartment | Burglary risk | Medium | Smart lock / Verisure alarm discount | `theft`, `home-contents` |

Each flag now carries points. The risk bar and readiness are built from those points. The full catalogue with point lines is in [backendMovingPlan.md §5](backendMovingPlan.md#5-signals--flags).

Rules live as code in `shared/engine/rules.ts` (see the `Rule` type in [techStack.md](techStack.md#risk-engine--sharedengine)), so the team can add new flags without touching the UI.

Whenever possible, flags are driven by **Finnish open data**, not user guesses. Examples: real building year (HSY), area crime rate and housing prices (Statistics Finland), flood zones (SYKE), moving-day weather forecast (Open-Meteo). Euro amounts from published statistics (Finance Finland) make the severity tangible. Provider lists and the data pipeline are in [techStack.md → Open data](techStack.md#open-data-finland).

## 6. Ranking insurance plans

Ranking is **deterministic and explainable**, not AI. AI only explains the ranking already calculated by code. This keeps the demo stable and ensures the recommendation holds up in front of an insurance company.

Each product in the catalog declares which coverage tags it covers and how well:

```typescript
type InsuranceProduct = {
  id: string;                 // 'home-contents-plus'
  name: string;
  monthlyPriceEur: number;    // Illustrative
  covers: { tag: string; level: 'full' | 'partial' }[];
  termsExcerpt: string;       // Short excerpt from public If terms, used by the AI layer
};

```

### Fit score (0–100)

```text
weight(flag)  = high: 3 · medium: 2 · low: 1      (Flags already 'covered' by existing policies are skipped)
match(p, f)   = 1.0 if p fully covers all of f.coverageTags · 0.5 if it covers some · 0 otherwise
fit(p) = 100 × Σ weight(f) × match(p, f)  /  Σ weight(f)

```

* **Sorting:** By fit score first, then by price (if fit is equal, cheaper comes first).
* **Badges:** "Best fit", "Best value" (highest fit per Euro), "Covers all high risks".
* **Each card shows its reasoning:** ✅ Covered flags, ⚠️ Partially covered, ❌ Not covered.
* **Bundles:** When a combination (e.g., home contents + pet) has a significantly higher fit score than any single product, it is ranked as a single option.
* **Honesty rule:** If all open high-severity flags can be resolved purely by actions, the top recommendation is an action, not a product. This builds trust and supports the "not just selling" narrative for the judges.
* **Suggested level:** The higher of (a) the level for the risk (low → Perus, medium → Laaja, high → LaajaPlus) and (b) the cheapest level that fully covers every open high flag that any level can cover. The Moving page marks it with a "Suggested" badge.
* **Plan picker:** The Moving page header has three buttons: Perus, Laaja and LaajaPlus (a tablist). The chosen level shows its perks, with "Not in Perus" and "Laaja: €5,000" comparisons, and a "Your moving risks" list marked covered, partial or not covered.

## 7. AI Layer

**Status (2026-10-17):** the Detailed risk overview shows an "In short" summary. The template version (`shared/engine/summary.ts`) appears at once and cannot fail. When Ollama runs locally, a small local model (`qwen2.5:3b`, through `shared/services/aiSummary.ts`) rewrites the risk sentences; the score sentence and the plan sentence stay computed. The live Claude layer described below is still deferred to the optional Express server, which would hold the API key. Details and guardrails: [techStack.md → AI layer](techStack.md#ai-layer).

### What it does

1. **Gathers context per flag:** For the user's open flags and the top three ranked products, the app loads the `why` texts, the matching products' `termsExcerpt`, and relevant partner offers. This is a simple query by coverage tag, no vector search needed.
2. **Summary generation:** Claude turns this context into a short, personalized summary:
* 2–3 sentences explaining the user's overall situation ("Your biggest risk is…").
* One line per high/medium flag, in plain language.
* An explanation of why the #1 plan is the best fit, referencing the specific flags it covers, along with an honest caveat (what it doesn't cover).



### Guardrails

* **The model only explains, it never decides.** Flags and rankings are passed as inputs; the prompt strictly forbids adding new risks, products, or prices.
* **Structured output (live mode):** Response is in JSON, validated by a Zod schema (`summary`, `flagExplanations[{flagId, text}]`, `topPlan{productId, reason, caveat}`). The function checks all `flagId`s and `productId`s against the input. On mismatch, refusal, or API error, it gracefully falls back to template text built from the `why` fields. **The demo must never break because of AI.**
* **Grounded in terms:** Coverage statements must come from the provided `termsExcerpt`. The UI shows "Based on If's published terms" and includes a disclaimer: "This is guidance, not a binding offer."
* **Keys never reach the browser:** Live mode needs the optional Express server, which reads the API key from `server/.env`. Template mode needs no key.

### Implementation notes (live mode, deferred)

* `POST /api/summary` → An Express route on the optional server that takes the flags and ranking and returns the validated JSON. Not built yet.
* **Model:** `claude-opus-5-5`, `effort: "low"`. Since this is a short, bounded summary task, low effort keeps latency minimal. Uses `client.messages.parse()` + `zodOutputFormat(schema)` from `@anthropic-ai/sdk/helpers/zod`.
* **Refusals:** Enable server-side refusal fallback (`fallbacks: "default"` + beta `server-side-fallback-2026-07-01`), and check `stop_reason` before reading content.
* **Caching (Cost + Demo Reliability):** Live results are kept in memory, keyed by a hash of (open flags + ranking). Repeating the same demo is instant and free, and "what if" toggles reuse generated summaries. The template is cheap enough to recompute on every render, so it needs no cache. Keeping the system prompt and product catalog as a stable prefix also optimizes Prompt Caching.
* **UX:** Deterministic flags and rankings are shown instantly. The AI summary fades in once ready. Nothing blocks the UI waiting for the model.

## 8. Screens

1. **Home:** "What's coming up in your life?" with life event cards.
2. **Questionnaire:** One question per screen, a progress bar, and real-time flag counts ("3 things to look at so far").
3. **Risk overview:** Flag cards ordered by severity, the readiness score, and the AI summary at the top.
4. **Recommendations:** Ranked plan cards featuring fit score, covered/uncovered flags, price, and "why this fits" (AI). Partner offers sit alongside.
5. **Journey timeline:** A dated checklist; checking off items resolves flags and increases the score.
6. **Flag detail (Bottom sheet):** Why it triggered, evidence, actions to take, and which plans cover it.
7. **Moving page (built):**
   * Hero: only a **Moving to** field and a **Calculate risk** button. Geocoding and open-data calls run only when you press it.
   * Preview card: progress per source while loading, then the top 5 flags with their points, a liquid ring with the score and level, a readiness meter, and **See detailed overview** (goes to the risk report).
   * A separate **Create moving plan** block below: moving from, moving date, home size, home type, and toggles for self-move, valuables, ground floor, renting, dog and home insurance. Answers re-score at once on the saved signals. The **Create moving plan** button recalculates and opens the report.
   * Risk report: points per flag, "−N points" per action, a protection gap check against the suggested plan, and data sources with their status.

## 9. Data model

There is no database. These shapes exist only in code. [techStack.md](techStack.md) lists the modules that hold them.

| Shape | Where | Contents |
| --- | --- | --- |
| `InsuranceProduct` | `shared/data/products.ts` | Name, illustrative price, `covers` (tag + level), `termsExcerpt` |
| `Journey` | `src/state/` | Event type, answers, event date, completed task ids. Saved to `localStorage` |
| `Flag` | Computed by `shared/engine/` | Severity, `why`, actions, status (open / mitigated / covered). Never stored |
| `Task` | `src/data/events.ts` | Timeline item (action, partner offer, insurance step). Its `done` state lives in `Journey` |
| `Summary` | Computed by `shared/engine/summary.ts` | Template text built from flags and ranking. Live AI output is deferred |

## 10. Build plan (48-hour agile sprint · 2-person team)

Times are rough estimates for a 2-person team during a 48-hour hackathon. Technical execution is fully driven by the tech partner, strictly following a "lightweight, direct API + local preload fallback, UI and video first" approach.

### 🤝 Team division principles

* **Iurii (Architecture & Code):** Leads tech stack selection (React + Vite + TypeScript). Skips complex user accounts and backend DBs. Frontend connects directly to open APIs via mobile hotspot, with local core data preloaded as a Fallback. Fully focuses on the core questionnaire, rule engine, and UI states.
* **Felix (Product / Design / Video):** Defines business value and demo logic. Provides high-fidelity UI designs and transparent icon assets. Refines animation pacing and UI details. Helping on code part, design web's animation and texts.Takes full ownership of the 2-minute Pitch Video editing and the final Devpost submission on Saturday night.

### 📅 3-Day Execution Roadmap & Milestones

| Phase | Goals & Milestones | Tech Partner Output (Tech) | My Output (Product / Design / Video) |
| :--- | :--- | :--- | :--- |
| **Phase 0: Concept & Infrastructure**<br>*(Friday Night)* | Lock in scope reduction, initialize project skeleton | • Drop heavy DBs and user systems, adopt lightweight frontend architecture<br>• Init React + Vite + TS repo and setup base styling environment | • Map out core User Journey wireframes<br>• Complete 5 high-fidelity UI designs (Home, Moving, Risk Report, Member Benefits, Travel)<br>• Align on demo focus (Moving & Pet ecosystem) |
| **Phase 1: Rule Engine & UI**<br>*(Saturday 09:00–14:00)* | Run adaptive questionnaire and rule calculations | • Implement step-by-step questionnaire logic and state collection<br>• Write pure TS rule engine (Inputs → Output risk Flags)<br>• Connect open data APIs and preload static local data for offline Fallback | • Export high-quality transparent icons/graphics<br>• Draft English voiceover and storyboard for the 2-min Pitch Video<br>• Assist with UI layout and CSS styling |
| **Phase 2: End-to-End Flow & Polish**<br>*(Saturday 14:00–18:00)* | Flawless end-to-end moving flow, ready for demo | • Connect full flow: Home → Questionnaire → Risk Report → Partner Services → Insurance Plans<br>• Debug responsive layouts and click interactions to ensure a crash-free flow | • Add micro-animations (gauge rotation, readiness score counting up, card hover effects)<br>• UI review: standardize typography, margins, and brand colors<br>• **Code Freeze by 18:00** |
| **Phase 3: Video & Material Prep**<br>*(Saturday 18:00–24:00)* | **Core Deliverable Production (The lifeline)** | • Assist in recording full-screen, lag-free product walkthroughs (record 2–3 flawless runs)<br>• Fix minor text/styling bugs and prep the local offline environment for Sunday Expo | • **Full focus on the 2-min Pitch Video:** Edit in Premiere/DaVinci, mix BGM, voiceover, and key animated subtitles<br>• Draft the English project description for Devpost / platform submission |
| **Phase 4: Submission & Expo**<br>*(Sunday 08:00–11:00)* | Submit before deadline, prep for live judging | • Ensure the local dev server can boot offline instantly (zero-latency demo even without Wi-Fi)<br>• Double-check Public access rights on the GitHub repo | • Upload the rendered 1080p Pitch Video to YouTube/Vimeo<br>• **Finalize all platform submissions before 10:30** (30-min buffer)<br>• Prep a 1-minute live pitch script for when judges visit the table |

## 11. Open questions for If mentors

* Can we use If's real product names, public terms and conditions text, and illustrative prices in the demo?
* Which real partners (Anticimex, Verisure, FirstVet…) can we explicitly name during our pitch?
* Is it acceptable to use a deterministic "Fit score" wording, or do recommendations need to be framed strictly under the Demands-and-Needs Guidance (EU Insurance Distribution Directive)? If the latter, the questionnaire can double as that assessment—which is a strong business point to pitch.
* Which life event does If prioritize most right now: Moving, or something else?

## 12. Business value for If from this model

1. **Retention & Engagement:** If can convert existing policyholders into active platform users, offering diverse and flexible insurance services, drastically improving user retention and web traffic.
2. **Asset-Light Ecosystem:** By leveraging its user pool to expand a third-party partner ecosystem, If can perfect its service offerings without massive capital investment. If acts as the platform (providing the web, app, and user traffic), execution is handled by verified third parties, If regulates service quality, and If generates revenue through commission models.
3. **Loss Ratio Reduction & Acquisition:** Armed with proactive advice and risk assessments, users will actively avoid incidents that typically lead to claims, directly lowering If's claim probabilities (Loss Ratio). Simultaneously, by offering single-use or flexible micro-insurance plans, If can tap into new revenue streams from travelers or one-time service users, amplifying brand presence and capturing a wider potential customer base.