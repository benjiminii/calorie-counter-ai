# Deglem

A React Native / Expo app for effortless calorie tracking powered by AI. Point your camera at any food — a multimodal LLM identifies it, estimates calories and macros, and lets you refine the result with natural-language context before logging.

Supports both **Claude** (Anthropic) and **Gemini** (Google) models with in-app switching, so you can compare quality, speed, and per-request pricing side by side.

## Features

- **AI food recognition** — photograph any meal, get instant calorie + macro estimates
- **Multi-provider** — switch between Claude (Haiku/Sonnet/Opus 4.x) and Gemini (2.5 Flash-Lite/Flash/Pro) at runtime
- **Context refinement** — add portion, cooking method, or extras to improve accuracy
- **Manual override** — edit all numbers before and after logging
- **Localized AI output** — the model responds in the UI language (English / Mongolian)
- **Daily dashboard** — calorie ring, macro summary, week calendar, recent meals
- **Progress view** — 7-day calorie + weight charts, 14-day history
- **Profile** — BMR-based goal calculation (Mifflin-St Jeor), weight log, language toggle

## Tech Stack

- **Expo SDK 54** with New Architecture (React Native 0.81)
- **Expo Router v6** — file-based navigation
- **NativeWind v4** — Tailwind for React Native
- **Anthropic SDK** (`@anthropic-ai/sdk`) + **Google GenAI SDK** (`@google/genai`)
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

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env.local` and fill in both keys:

```bash
cp .env.example .env.local
```

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_GEMINI_API_KEY=...
```

These are bundled into the JS and readable by anyone you share a build with — use dev keys during testing and rotate before shipping.

### Run

```bash
npm start           # Metro bundler
npm run ios         # iOS simulator
npm run android     # Android emulator
npx expo start --tunnel   # share to a remote device via ngrok
```

## Project Structure

```
app/
  (tabs)/
    index.tsx          ← Dashboard: week calendar + macro summary + meal list
    progress.tsx       ← Calorie/weight charts + 14-day history
    profile.tsx        ← BMR goal + language toggle
    camera.tsx         ← Camera tab entry (navigates to /log/camera)
  log/
    camera.tsx         ← Full-screen capture + photo picker
    [id].tsx           ← Meal detail: view/edit/re-analyze/delete
  _layout.tsx          ← Fonts, migrations, global.css, i18n bootstrap
components/            ← MealCard, CalorieRing, MacroSummary, WeekCalendar, ModelPickerModal…
lib/
  analyze.ts           ← Orchestrates image prep → provider → DB write
  i18n.ts              ← i18next init (device-locale aware)
  providers/
    types.ts           ← AnalyzeFoodFn interface, shared normalize()
    claude.ts          ← Claude tool_use integration
    gemini.ts          ← Gemini responseSchema integration
    models.ts          ← Model registry + pricing ($/1M tokens)
db/
  schema.ts            ← Drizzle `meals` table
  queries.ts           ← CRUD helpers
  migrations/          ← Drizzle SQL migrations
store/
  meal-store.ts        ← legacy meal store
  profile-store.ts     ← Persisted profile (SecureStore) + BMR calc
  model-store.ts       ← Selected model id
locales/               ← en.json, mn.json — must stay in sync
DESIGN.md              ← Full design system
CLAUDE.md              ← AI assistant guide for this codebase
```

## Model Switching

Tap the pill next to "Recent Meals" on the dashboard to pick any Claude or Gemini model. Pricing (USD per 1M input/output tokens) is shown per model. The selection persists in memory for the session; each analyzed meal records which model was used (visible on the meal card).

## Design System

Warm, analog aesthetic — cream backgrounds (`#f7f4ed`), charcoal text (`#1c1c1c`), borders instead of shadows, DM Sans throughout. See `DESIGN.md` for the full system.

## Languages

UI + AI output supported in English (`en`) and Mongolian (`mn`). Toggle on the Profile screen (top-right pill). Language choice is applied to the AI prompt at request time, so food names, ingredients, and descriptions come back localized.
