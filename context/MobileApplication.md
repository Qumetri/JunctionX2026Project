# Mobile Application — How hard is React → React Native?

**Short answer:** moderate. The logic transfers almost for free, but the UI has to be rewritten. Expo puts the app on a real phone within minutes, with no Xcode or Android Studio. The real cost is re-implementing every screen with native primitives and styling. For a ~6–8 screen prototype, expect **roughly 1–1.5 developer-days**, assuming the code is structured as described in [techStack.md](techStack.md) (logic in `shared/`, thin UI).

## What carries over vs. what gets rewritten

| Layer                                         | Ports to RN?       | Notes                                                                                   |
| --------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `shared/` risk engine, types, Zod schemas     | ✅ As-is            | Pure TypeScript, no DOM. This is why we keep it framework-free                          |
| Express backend                               | ✅ Unchanged        | The phone calls the same API                                                            |
| Custom hooks, Context, reducers               | ✅ Mostly as-is     | React is React; `useState`, `useEffect`, Context all work                               |
| Data fetching (`fetch`, TanStack Query)       | ✅ As-is            | Both work in RN; only the base URL changes (see networking below)                       |
| JSX markup (`div`, `p`, `button`, `img`, `input`) | ❌ Rewrite      | Becomes `View`, `Text`, `Pressable`, `Image`, `TextInput`. All text must sit inside `<Text>` |
| CSS files / CSS modules                       | ❌ Rewrite          | RN uses `StyleSheet` objects with Flexbox only (column by default) and no cascade or selectors. If we use Tailwind, NativeWind recovers most of it |
| Routing (React Router)                        | ❌ Replace          | Use Expo Router (file-based) or React Navigation. Screens map 1:1, the API differs      |
| `localStorage`                                | ❌ Replace          | `AsyncStorage` (async API)                                                              |
| Inline SVG, icon sprites                      | ⚠️ Adapt            | `react-native-svg`; Lucide has `lucide-react-native`                                    |
| Web-only libraries (Leaflet, chart libs)      | ⚠️ Swap             | `react-native-maps`, Victory Native, etc. Avoid them in the web app if a port is likely |
| Animations / CSS transitions                  | ⚠️ Rewrite          | `Animated` or Reanimated                                                                |

**Rule of thumb:** anything that touches the DOM or CSS gets rewritten. Everything else is reused.

## Running it on a phone

1. `npx create-expo-app@latest mobile` (alongside `client/` and `server/`).
2. Install **Expo Go** from the App Store or Play Store.
3. `npx expo start` → scan the QR code → the app runs on the phone with hot reload.

### Gotchas

- **The phone can't reach `localhost`.** Point the API base URL to the laptop's LAN IP (`http://192.168.x.x:3001`) on the same Wi-Fi, run `npx expo start --tunnel`, or deploy the Express server. Venue Wi-Fi at hackathons often blocks device-to-device traffic, so deploying the API (Render/Railway) is the safest route.
- **HTTPS / cleartext:** iOS and Android restrict plain-HTTP requests in production builds. Expo Go in dev is lenient, but a deployed HTTPS API avoids surprises.
- **Expo Go version lock:** Expo Go supports only recent Expo SDKs, and each SDK pins specific React/RN versions. Let `create-expo-app` choose the versions; don't force the web app's React version.
- **Monorepo resolution:** importing `shared/` from the Expo app needs Metro to watch the workspace root. Recent Expo versions support npm workspaces out of the box; if not, copy `shared/` in as a fallback.
- **Nudges / notifications:** local scheduled notifications (`expo-notifications`) are enough to demo "reminder 3 days before moving day". Real remote push needs a development build and store credentials, which is not worth it for a hackathon.

## Options for the team

| Option                                   | Effort now | Effort to get on a phone | Trade-off                                                                                         |
| ---------------------------------------- | ---------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| **A. Web app, mobile-first + PWA**       | Baseline   | ~1–2 hours               | Add a manifest, open the deployed URL on the phone, "Add to Home Screen". Looks like an app in the demo; no native APIs |
| **B. React web now, port to Expo later** | Baseline   | ~1–1.5 dev-days          | Our chosen stack. Port only if time allows after the web journey is polished                      |
| **C. Expo from day one (+ react-native-web)** | +½ day setup and learning | Already there | One codebase for phone and browser, but web styling is more constrained and the team works in RN primitives from the start |

## Recommendation

Stay with **React + Express (option B)**, but build so that option A is free and option B stays cheap:

1. Keep all business logic in `shared/` and keep components thin. That decides whether the port takes a day or a week.
2. Build the layout mobile-first and ship it as a **PWA** for the demo. "Runs on a phone" costs a couple of hours, not a day.
3. Choose Tailwind (→ NativeWind) over hand-written CSS if a native port is likely.
4. Start the Expo port only after the Moving journey is fully polished on web. Judges score the experience, not the runtime, so a native app with a weaker journey is a net loss.

Revisit this if the team decides that phone-native features (camera scan of a lease, location-based nudges, real push notifications) are central to the pitch. In that case, option C becomes the better choice.
