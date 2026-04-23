# Deglem

A React Native / Expo app for effortless calorie tracking powered by AI. Point your camera at any food — a multimodal LLM identifies it, estimates calories and macros, and lets you refine the result with natural-language context before logging.

Supports **Claude** (Anthropic), **Gemini** (Google), and **OpenAI** models with in-app switching, so you can compare quality, speed, and per-request pricing side by side.

## Features

- **Apple + Google sign-in** via Clerk — sign-in is required; onboarding runs after authentication
- **Convex cloud mirror** — local-first: SQLite + Zustand stay authoritative, every write is mirrored to Convex (`users`, `profiles`, `meals` tables). Food images are **not** uploaded; they stay on-device. Signing into a fresh install hydrates profile + meals back from Convex.
- **AI food recognition** — photograph any meal, get instant calorie + macro estimates
- **Multi-provider** — switch between Claude (Haiku/Sonnet/Opus 4.x), Gemini (2.5 Flash-Lite/Flash/Pro), and OpenAI (GPT-4.1 Nano/Mini/4.1) at runtime; selection persists across launches
- **Onboarding flow** — guided name, profile, and goal setup on first launch (Mifflin-St Jeor maintenance + weekly rate → calorie target)
- **Context refinement** — add portion, cooking method, or extras to improve accuracy
- **Manual override** — edit all numbers before and after logging
- **Localized AI output** — the model responds in the UI language (English / Mongolian)
- **Daily dashboard** — calorie ring, macro summary, week calendar, recent meals
- **Progress view** — 7-day calorie + weight charts, 14-day history
- **Profile** — BMR-based goal calculation, weight log, persisted language preference

## Tech Stack

- **Expo SDK 54** with New Architecture (React Native 0.81)
- **Expo Router v6** — file-based navigation
- **NativeWind v4** — Tailwind for React Native
- **Anthropic SDK** (`@anthropic-ai/sdk`) + **Google GenAI SDK** (`@google/genai`) + **OpenAI SDK** (`openai`)
- **Clerk** (`@clerk/expo`) — Apple + Google SSO, SecureStore-backed token cache
- **Convex** — backend for future cloud sync; authenticated via Clerk JWT template
- **Drizzle ORM** + **expo-sqlite** — local persistence with reactive `useLiveQuery`
- **Zustand** — lightweight client state
- **i18next** + **react-i18next** — English + Mongolian
- **DM Sans** via `@expo-google-fonts/dm-sans`

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app or iOS/Android simulator
- Anthropic API key (https://console.anthropic.com)
- Google AI Studio API key (https://aistudio.google.com/apikey)
- OpenAI API key (https://platform.openai.com/api-keys)

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env.local` and fill in the keys for the providers you want to use:

```bash
cp .env.example .env.local
```

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
```

These are bundled into the JS and readable by anyone you share a build with — use dev keys during testing and rotate before shipping.

Bootstrap Convex (one-time, opens a browser to log in):

```bash
npx convex dev --once --configure=new
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-clerk-issuer>.clerk.accounts.dev
npx convex dev --once
```

In the Clerk dashboard, create a **JWT template named `convex`** (JWT Templates → New → Convex preset). Without this, `ctx.auth.getUserIdentity()` returns null on the Convex side and the user upsert will throw `Not authenticated`.

For Apple Sign-In on a real device, enable the **Sign In with Apple** capability on the `com.deglem.app` App ID in the Apple Developer portal (simulator builds work without this).

### Run

```bash
npm start                  # Metro bundler (attaches to an existing dev-client build)
npm run ios                # expo run:ios — compiles the iOS app locally then runs it
npm run android            # expo run:android — compiles the Android app locally then runs it
npx expo start --tunnel    # share to a remote device via ngrok
```

> `npm run ios` / `npm run android` now perform a **full native build** (the project uses Clerk native modules, so a dev client is required). The first run takes several minutes and requires a working Xcode / Android Studio toolchain. After that, `npm start` alone is enough to attach Metro to the already-built dev client.

> Native Apple/Google sign-in does **not** work in Expo Go — it needs an EAS development build. For a cloud build instead of local:
>
> ```bash
> npx eas build --profile development --platform ios
> npx eas build --profile development --platform android
> ```

## Project Structure

```
app/
  index.tsx            ← Root gate: redirects to /login or /(tabs) based on onboarding status
  login.tsx            ← Welcome screen (hero + continue options)
  step-section.tsx     ← Multi-step onboarding (name → profile → goal → plan preview)
  (tabs)/
    index.tsx          ← Dashboard: week calendar + macro summary + meal list
    progress.tsx       ← Calorie/weight charts + 14-day history
    profile.tsx        ← BMR goal + language toggle
    camera.tsx         ← Camera tab entry (navigates to /log/camera)
  log/
    camera.tsx         ← Full-screen capture + photo picker
    [id].tsx           ← Meal detail: view/edit/re-analyze/delete
  _layout.tsx          ← Fonts, migrations, global.css, i18n bootstrap
components/
  login/               ← LoginHero, LoginContinueOptions
  goal-setup/          ← Step components for onboarding (name, profile, goal, plan)
  ...                  ← MealCard, CalorieRing, MacroSummary, WeekCalendar, ModelPickerModal…
lib/
  analyze.ts           ← Orchestrates image prep → provider → DB write
  i18n.ts              ← i18next init (device-locale aware)
  providers/
    types.ts           ← AnalyzeFoodFn interface, shared normalize()
    claude.ts          ← Claude tool_use integration
    gemini.ts          ← Gemini responseSchema integration
    openai.ts          ← OpenAI response_format json_schema integration
    models.ts          ← Model registry + pricing ($/1M tokens)
db/
  schema.ts            ← Drizzle `meals` table
  queries.ts           ← CRUD helpers
  migrations/          ← Drizzle SQL migrations
store/
  meal-store.ts        ← legacy meal store
  profile-store.ts     ← Persisted profile (SecureStore) + BMR calc + onboarding flag
  model-store.ts       ← Selected model id (persisted via SecureStore)
locales/               ← en.json, mn.json — must stay in sync
DESIGN.md              ← Full design system
CLAUDE.md              ← AI assistant guide for this codebase
```

## Model Switching

Tap the pill next to "Recent Meals" on the dashboard to pick any Claude, Gemini, or OpenAI model. Pricing (USD per 1M input/output tokens) is shown per model. The selection persists across launches via `expo-secure-store`; each analyzed meal records which model was used (visible on the meal card).

## Design System

Warm, analog aesthetic — cream backgrounds (`#f7f4ed`), charcoal text (`#1c1c1c`), borders instead of shadows, DM Sans throughout. See `DESIGN.md` for the full system.

## Languages

UI + AI output supported in English (`en`) and Mongolian (`mn`). Toggle from the Profile screen — the choice is persisted on the profile. Language is applied to the AI prompt at request time, so food names, ingredients, and descriptions come back localized.
