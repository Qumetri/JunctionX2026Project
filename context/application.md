# Application — What we build and how

Companion to [context.md](context.md) (the brief), [techStack.md](techStack.md) (how it runs), and [MobileApplication.md](MobileApplication.md) (phone port).

## 1. One-liner

**A life-event planner that turns "I'm moving next month" into a personal plan: what can go wrong, what to do about it, and which If insurance actually fits. It explains every recommendation in plain language.**

The user comes for the planning; insurance shows up as one useful part of the plan rather than as the reason the app exists. This matches the brief's warning not to make insurance the center of the experience.

## 2. Value on both sides

| For the customer                                              | For If                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A clear, dated checklist for a stressful life event           | Reaches people **before** they buy, at the moment insurance needs change      |
| Risks they didn't know about, explained for *their* situation | Recommendations are explained, so customers trust them and convert better     |
| Honest advice: "you're already covered here" counts too       | Prevention actions (leak sensors, Anticimex checks) lower claim frequency     |
| Partner discounts and services bundled in one place           | Partner ecosystem becomes a reason to use If, not just a perk after purchase  |
| Reminders at the right moment, not after a loss               | An ongoing relationship instead of one renewal email a year (retention)       |

## 3. Core loop

```
 Pick a life event ──► Answer 6–10 quick questions ──► Risk flags appear
        ▲                                                     │
        │                                                     ▼
 Nudges before the date ◄── Journey timeline ◄── Ranked insurance plans + AI summary
        │                         ▲
        └── Complete actions ─────┘  (flags resolve, readiness score goes up)
```

## 4. What the app must include

### MVP (must have for the demo)

1. **Life event picker:** Moving (fully built), plus 1–3 more shown as "coming soon" cards to show the concept scales.
2. **Adaptive questionnaire:** short, one question per screen, with taps and sliders instead of forms. Follow-up questions appear only when relevant (e.g. "Do you have a pet?" → "Dog or cat?").
3. **Flag system:** risks derived from the answers and shown as colored flags with a one-line "why" (section 5).
4. **Ranked insurance plans:** plans scored by how well they cover *this user's* flags, with a "covers 5 of 6 risks" breakdown (section 6).
5. **AI risk summary:** a short, friendly explanation of the main risks and why the top plan fits best (section 7).
6. **Journey timeline:** the checklist laid out by date (8 weeks before → moving day → first week after), combining preventive actions, partner services, and the insurance step.
7. **Readiness score:** a single 0–100 number that rises as the user completes actions and resolves flags. This is the main interactive hook.

### Should have (if time allows)

- **"What if" toggles:** change an answer ("What if I take the 1950s apartment instead?") and watch the flags and the ranking update live. This is a strong demo moment.
- **Partner offers inside the timeline:** "Book a mover (−10% via If)", "Rent a moisture meter", "Anticimex pre-move inspection". These sit next to the step they help with.
- **Nudges:** scheduled reminders tied to the event date (in-app list in the demo, notifications on mobile later).
- **Existing coverage input:** "I already have home insurance" → the app shows gaps instead of duplicate offers.

### Out of scope

Real quotes and payments, login, real customer data, more than one fully built event.

## 5. Flag system

A **flag** is one specific risk for this user, at this life event, with the reason it was raised. Flags are computed by the rule engine in `shared/` (deterministic, testable) and never by the AI.

### Flag shape

```ts
type Flag = {
  id: string;                 // 'old-plumbing'
  category: 'property' | 'belongings' | 'liability' | 'transit' | 'pet' | 'health' | 'income';
  severity: 'high' | 'medium' | 'low';
  title: string;              // 'Old pipes in a 1960s building'
  why: string;                // 'Buildings from before 1980 have a higher water-damage risk…'
  evidence: string[];         // which inputs triggered it: ['buildingYear=1964']
  source: 'answer' | 'open-data' | 'derived';
  actions: ActionRef[];       // preventive steps; completing them can resolve or downgrade the flag
  coverageTags: string[];     // what kind of insurance addresses it: ['water-damage', 'home-contents']
  status: 'open' | 'mitigated' | 'covered';
};
```

### Visual language

| Severity | Color | Meaning to the user                         |
| -------- | ----- | ------------------------------------------- |
| High     | Red   | Act before the event date                   |
| Medium   | Amber | Worth handling, has a cheap fix             |
| Low      | Grey  | Good to know                                |
| Resolved | Green | Mitigated by an action or covered by a plan |

### Example: Moving

| Input                                         | Flag                                | Severity | Actions                                | Coverage tags                 |
| --------------------------------------------- | ----------------------------------- | -------- | -------------------------------------- | ----------------------------- |
| Building year < 1980                          | Old plumbing / water-damage risk    | High     | Leak sensor, Anticimex moisture check  | `water-damage`, `home`        |
| Moving yourself (no movers) + valuable items  | Damage to belongings in transit     | Medium   | Book vetted mover, rent dolly          | `transit`, `home-contents`    |
| Has a dog                                     | Liability if the dog causes damage  | Medium   | —                                      | `liability`, `pet`            |
| No current home contents insurance            | Belongings uninsured at new address | High     | —                                      | `home-contents`               |
| FMI forecast: rain on moving day (open data)  | Water damage during the move        | Low      | Plastic covers, reschedule tip         | `transit`                     |
| Ground-floor apartment                        | Burglary risk                       | Medium   | Smart lock / Verisure alarm discount   | `theft`, `home-contents`      |

Rules live in code as data (see the `Rule` type in [techStack.md](techStack.md)), so the team can add flags without touching the UI.

Wherever possible, flags are driven by **Finnish open data** rather than by the user's own guesses. Examples: the actual building year (HSY), area crime rate and housing prices (Statistics Finland), flood zones (SYKE), and the forecast for moving day (FMI). Euro figures from published statistics (Finance Finland) make the severity tangible. The provider list and the backend pipeline are in [techStack.md → Open data](techStack.md#open-data-finland).

## 6. Ranking insurance plans

Ranking is **deterministic and explainable**, not AI. The AI only explains a ranking that the code has already computed. This keeps the demo stable and keeps the recommendation defensible in front of an insurance company.

Each product in the catalog declares which coverage tags it covers and how well it covers them:

```ts
type InsuranceProduct = {
  id: string;                 // 'home-contents-plus'
  name: string;
  monthlyPriceEur: number;    // illustrative
  covers: { tag: string; level: 'full' | 'partial' }[];
  termsExcerpt: string;       // short excerpt from public If terms, used by the AI layer
};
```

### Fit score (0–100)

```
weight(flag)  = high: 3 · medium: 2 · low: 1      (flags already 'covered' by existing policies are skipped)
match(p, f)   = 1.0 if p fully covers any of f.coverageTags · 0.5 if partial · 0 otherwise

fit(p) = 100 × Σ weight(f) × match(p, f)  /  Σ weight(f)
```

- **Sorting:** by fit, then by price (cheaper first when fit ties).
- **Badges:** "Best fit", "Best value" (highest fit per €), and "Covers all high risks".
- **Every card shows its reasoning:** ✅ covered flags, ⚠️ partially covered, ❌ not covered.
- **Bundles:** a combination (e.g. home contents + pet) is ranked as a single option when it reaches a meaningfully higher fit than any single product.
- **Honesty rule:** if the open high-severity flags are all solvable by actions alone, the top recommendation is the action, not a product. This builds trust and supports the "not just selling" story for the judges.

## 7. AI layer

### What it does

1. **Gathers context per flag:** for the user's open flags and the top 3 ranked products, the server loads from Postgres the `why` texts, the matching product `termsExcerpt`s, and relevant partner offers. This is a simple lookup by coverage tag; no vector search is needed.
2. **Summarizes:** Claude turns that context into a short, personal summary:
   - 2–3 sentences on the user's overall situation ("Your biggest risk is…").
   - One line per high/medium flag, in plain language.
   - Why the #1 plan fits best, referencing the specific flags it covers, plus one honest caveat (what it doesn't cover).

### Guardrails

- **The model only explains; it never decides.** Flags and the ranking come in as input; the prompt forbids adding new risks, products, or prices.
- **Structured output:** the response is JSON validated against a Zod schema (`summary`, `flagExplanations[{flagId, text}]`, `topPlan{productId, reason, caveat}`). The server checks that every `flagId` and `productId` exists in the input; on mismatch, a refusal, or an API error it falls back to template text built from the `why` fields. **The demo must never break because of the AI.**
- **Grounded in the terms:** coverage claims must come from the provided `termsExcerpt`. The UI shows "Based on If's published terms" plus a short "this is guidance, not a binding offer" note.
- **Server-side only:** the API key lives in `.env` on the Express server.

### Implementation notes

- `POST /api/journeys/:id/summary` → returns the cached summary or generates one.
- **Model:** `claude-opus-5-5` with `effort: "low"`. It is a short, bounded summarization task, so low effort keeps latency down. Use `client.messages.parse()` with `zodOutputFormat(schema)` from `@anthropic-ai/sdk/helpers/zod`.
- **Refusals:** enable the server-side refusal fallback (`fallbacks: "default"` + beta `server-side-fallback-2026-07-01`) and still check `stop_reason` before reading the content.
- **Caching (cost + demo reliability):** store results in an `ai_summaries` table keyed by a hash of (open flags + ranking). Re-running the same demo is instant and free, and "what if" toggles reuse summaries already generated. Keep the system prompt and product catalog as a stable prefix so prompt caching applies too.
- **UX:** show the deterministic flags and ranking immediately, and let the AI summary fade in once it's ready. Nothing blocks on the model.

## 8. Screens

1. **Home:** "What's coming up in your life?" with life event cards.
2. **Questionnaire:** one question per screen, a progress bar, and a live flag count ("3 things to look at so far").
3. **Risk overview:** flag cards by severity, the readiness score, and the AI summary on top.
4. **Recommendations:** ranked plan cards with fit score, covered/uncovered flags, price, and "why this fits" (AI). Partner offers sit beside them.
5. **Journey timeline:** dated checklist; ticking items resolves flags and raises the score.
6. **Flag detail (sheet):** why it was raised, evidence, actions, and which plans cover it.

## 9. Data model changes

This extends the tables in [techStack.md](techStack.md):

| Table                | Contents                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| `insurance_products` | Catalog: name, price, `covers` (`jsonb`), `terms_excerpt`                |
| `journeys`           | One user's life event: event type, answers (`jsonb`), event date         |
| `journey_flags`      | Computed flags with `status` (open / mitigated / covered)                |
| `journey_tasks`      | Timeline items (actions, partner offers, insurance step) with `done`     |
| `ai_summaries`       | Cached AI output keyed by input hash                                     |

## 10. Build plan

Times are rough and assume a ~48h hackathon with 3–4 people.

| Phase | Goal                                           | Output                                                                               |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0     | Skeleton (≈3h)                                 | Monorepo, Docker Postgres, `npm run dev` works, empty screens with routing           |
| 1     | Engine first (≈6h)                             | Moving rules → flags, product catalog seed, ranking function, with unit tests        |
| 2     | Happy path UI (≈10h)                           | Questionnaire → flags → ranked plans → timeline, end to end with real engine output |
| 3     | AI + polish (≈8h)                              | Summary endpoint with fallback, readiness score, animations, "what if" toggle         |
| 4     | Demo (≈6h)                                     | Scripted persona, seeded data, recorded 2-minute pitch video                         |

**Suggested split:** one person on the engine and rules (`shared/`), one on the API, DB, and AI layer, one or two on the UI and the demo story. The engine contract (`Flag`, `InsuranceProduct`, `Rule`) should be agreed in the first hour so everyone can work in parallel.

## 11. Open questions for If mentors

- Can we use If's real product names and the public terms text, and illustrative prices?
- Which partners can we show by name in the demo (Anticimex, Verisure, FirstVet…)?
- Is a deterministic "fit score" acceptable wording, or do recommendations need to be framed as demands-and-needs guidance (EU Insurance Distribution Directive)? If so, the questionnaire could double as that assessment, which is a business point worth pitching.
- Which life event does If care most about: Moving, or another one?
