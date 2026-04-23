# Deglem — Claude Code Guide

## Project Overview

A React Native / Expo app for calorie tracking via food photography. A multimodal LLM (Claude, Gemini, or OpenAI) identifies the food, estimates calories + macros, and returns structured data. Users can add natural-language context, edit the result, and re-analyze. Meals persist locally in SQLite via Drizzle.

**App name:** Deglem (formerly "Calorie Tracker AI" / "Ilchleg").

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 54, React Native 0.81, New Architecture enabled |
| Routing | Expo Router v6 (file-based, typed routes) |
| Styling | NativeWind v4 (Tailwind classes on RN components) |
| AI — Claude | `@anthropic-ai/sdk` with **tool_use** for structured output |
| AI — Gemini | `@google/genai` with **responseSchema** for structured output |
| AI — OpenAI | `openai` with **response_format: json_schema** (strict) for structured output |
| DB | Drizzle ORM + `expo-sqlite` (`useLiveQuery` for reactivity) |
| State | Zustand (`profile-store` + `model-store`, both persisted via SecureStore; legacy `meal-store`) |
| i18n | `i18next` + `react-i18next` — English + Mongolian |
| Fonts | DM Sans via `@expo-google-fonts/dm-sans` |
| Camera | `expo-camera` + `expo-image-picker` + `expo-image-manipulator` |
| Storage | `expo-secure-store` for persisted profile |
| Haptics | `expo-haptics` |
| Auth | `@clerk/expo` — Apple + Google native SSO; token cache from `@clerk/expo/token-cache` |
| Backend | `convex` + `convex/react-clerk` (`ConvexProviderWithClerk`) — JWT via Clerk template `convex` |

## Design System

See `DESIGN.md` for the full system. Key rules:

- **Background**: always `bg-cream` (`#f7f4ed`) — never `bg-white`
- **Text**: `text-charcoal` (`#1c1c1c`) primary, `text-muted` (`#5f5f5d`) secondary
- **Cards**: `border border-cream-border rounded-xl` — borders not shadows
- **Buttons**: `active:opacity-80` on every `Pressable`
- **Camera button** (tab bar): `rounded-full bg-charcoal` 80×80, raised; always stays **last** in the tab order
- **Fonts**: inline `style={{ fontFamily: 'DMSans_400Regular' }}` for body / `'DMSans_600SemiBold'` for headings
- **Touch targets**: minimum 44×44pt

## App Structure

```
app/
  index.tsx            ← Root gate: reads `hasOnboarded`, redirects to /login or /(tabs)
  login.tsx            ← Welcome screen (LoginHero + LoginContinueOptions)
  step-section.tsx     ← Multi-step onboarding (name → profile → goal → plan preview) → sets onboarded
  (tabs)/
    _layout.tsx        ← Tabs: Home · Progress · Profile · Camera (custom raised button, last)
    index.tsx          ← Dashboard: week calendar + macro summary + meal list + model picker pill
    progress.tsx       ← Calorie + weight line charts (gifted-charts), 14-day history
    profile.tsx        ← BMR form + language toggle (MN / EN)
    camera.tsx         ← Navigates to /log/camera (the tab is just an entry point)
  log/
    camera.tsx         ← Full-screen capture, optional context input, picker fallback
    [id].tsx           ← Meal detail: view edited values, re-analyze, delete
  _layout.tsx          ← Fonts + Drizzle migrations + i18n + global.css + splash hide
components/
  login/               ← LoginHero, LoginContinueOptions
  goal-setup/          ← StepIndicator, GoalStep, PlanStep, ProfileStep, SliderCard, Field
  ...                  ← MealCard, CalorieRing, MacroSummary, WeekCalendar, ModelPickerModal, GoalEditorModal…
lib/
  analyze.ts           ← Orchestrates: image prep → provider dispatch → DB write
  i18n.ts              ← i18next init (device-locale aware, mn fallback)
  providers/
    types.ts           ← AnalyzeFoodFn, AnalysisResult, normalize(), languageInstruction()
    claude.ts          ← Claude with tool_use (structured)
    gemini.ts          ← Gemini with responseSchema + thinkingBudget: 0
    openai.ts          ← OpenAI with response_format json_schema (strict)
    models.ts          ← MODELS registry + pricing ($/1M input/output tokens)
db/
  schema.ts            ← `meals` table (with `model` column)
  queries.ts           ← insertMeal, updateMealAnalysis, setMealStatus, deleteMeal…
  migrations/          ← Drizzle SQL migrations + `migrations.js` barrel
  index.ts             ← opens `deglem.db`
store/
  model-store.ts       ← selected model id, persisted via SecureStore (stale IDs dropped on merge)
  profile-store.ts     ← persisted profile via SecureStore + BMR/maintenance calc + onboarding flag + weight log
  meal-store.ts        ← legacy, mostly unused now that meals live in SQLite
locales/
  en.json, mn.json     ← must stay in sync (same keys)
```

## Core User Flow

0. First launch: `app/index.tsx` checks `hasOnboarded` → routes to `/login` → `/step-section` (name · profile · goal · plan) → sets onboarded and lands on `/(tabs)`
1. User taps the camera tab (bottom-right) on any screen
2. `app/log/camera.tsx` — capture photo + optional quick context, or pick from library
3. `insertMeal()` creates a row with `status: 'analyzing'`, user returns to dashboard (fire-and-forget)
4. `lib/analyze.ts` resizes/re-encodes to JPEG (max 1024px), dispatches to the selected provider, writes result + `model` id to the row
5. Dashboard reactively updates via `useLiveQuery`; shimmer → populated card
6. Tap a card → `app/log/[id].tsx` — edit, re-analyze, or delete

## Provider Layer

All three providers conform to `AnalyzeFoodFn`:

```ts
(jpegBase64: string, context: string, modelId?: string, language?: string) => Promise<AnalysisResult>
```

Dispatch is runtime, driven by `useModelStore.getState().modelId` + `findModel()` → `model.provider`. All UI-visible fields (`name`, `ingredients`, `description`) come back in the active UI language via `languageInstruction()` appended to the user prompt.

### Claude (`lib/providers/claude.ts`)
- Uses `tool_use` with `tool_choice: { type: 'tool', name: 'log_meal' }` — guaranteed structured output
- Default model: `claude-haiku-4-5-20251001`
- `max_tokens: 400`
- Logs `response.usage` per call

### Gemini (`lib/providers/gemini.ts`)
- Uses `responseMimeType: 'application/json'` + `responseSchema` with `propertyOrdering`
- Default model: `gemini-2.5-flash` (also the app-wide `DEFAULT_MODEL_ID`)
- `maxOutputTokens: 400`
- `thinkingConfig: { thinkingBudget: 0 }` — disables reasoning tokens (critical for cost on 2.5 Flash)
- Logs `response.usageMetadata` per call

### OpenAI (`lib/providers/openai.ts`)
- Uses `response_format: { type: 'json_schema', json_schema: { strict: true, ... } }` — guaranteed schema-conforming output
- Default model: `gpt-4.1-nano`
- `max_tokens: 400`
- `dangerouslyAllowBrowser: true` is required because the SDK runs in the RN JS runtime
- Logs `response.usage` per call

### Models & Pricing
`lib/providers/models.ts` holds the full registry with USD per-1M token costs (Gemini, OpenAI, Claude). Tap the pill next to "Recent Meals" to open `ModelPickerModal` and switch providers at runtime. The selection is persisted via `expo-secure-store`; unknown/stale ids rehydrate to the default.

## Auth (Clerk + Convex)

- **Entry gate** (`app/index.tsx`): returns null until Clerk loads, redirects to `/login` if signed-out, to `/step-section` or `/(tabs)` based on `user.unsafeMetadata.hasOnboarded`
- **Providers** (`app/_layout.tsx`): `ClerkProvider` (with `tokenCache` from `@clerk/expo/token-cache`) wraps `ConvexProviderWithClerk` wraps theme + Stack
- **OAuth**: `app/login.tsx` uses `useSignInWithApple` (from `@clerk/expo/apple`) + `useSignInWithGoogle` (from `@clerk/expo/google`) — native sheets; `setActive({ session })` and the gate redirects
- **Onboarding flag** (`app/step-section.tsx`): writes `{ hasOnboarded: true }` to `user.unsafeMetadata`; gate reads both `unsafeMetadata` and `publicMetadata` so a future server-side write can migrate it
- **Sign out** on profile: calls `signOut()` from `useAuth()`; gate catches the state change and redirects
- **Per-user scoping**: `profile-store` name is namespaced `profile-store:<clerkId>` via `setProfileStoreUser` — called from `ProfileStoreUserSync`. `meals.userId` filters every read/write (`hooks/use-meals.ts`, `db/queries.ts`, `app/log/[id].tsx`)
- **Convex sync**: `ConvexUserSync` (`lib/auth/sync-convex-user.tsx`) upserts `convex.users` row keyed by Clerk `sub` on every sign-in; no user-authored data syncs to Convex yet
- **Dev build required**: native OAuth cannot run in Expo Go — use `npx eas build --profile development`

## Database

- Single `meals` table; schema in `db/schema.ts`, migrations auto-generated by `drizzle-kit generate`
- Migrations run automatically on app launch via `useMigrations()` in `app/_layout.tsx`
- Reactive reads via `useLiveQuery` (requires `enableChangeListener: true` on the DB handle — set in `db/index.ts`)
- SQL files inlined into JS via `babel-plugin-inline-import` (see `babel.config.js`)
- `meals.userId` column scopes all rows to a Clerk user id — see the Auth section

## i18n

- `lib/i18n.ts` picks device locale at startup, falls back to `mn`
- Toggle language on Profile screen — the choice is written to `profile.language` and persisted via SecureStore
- Both `locales/en.json` and `locales/mn.json` must have identical keys — verify with:
  ```bash
  diff <(jq -r 'keys[]' locales/en.json | sort) <(jq -r 'keys[]' locales/mn.json | sort)
  ```
- AI output language is passed to the provider per request; localizes `name`, `ingredients`, `description` (numeric fields stay numeric)

## NativeWind Setup

- `tailwind.config.js` — custom colors (`cream`, `charcoal`, `cream-border`, `muted`, `off-white`) + DM Sans font families
- `metro.config.js` — `withNativeWind` wrapper pointing to `global.css`
- `global.css` — Tailwind directives, imported at top of `app/_layout.tsx`
- `nativewind-env.d.ts` — type declarations

## Environment

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
```

Stored in `.env.local` (gitignored). `EXPO_PUBLIC_` prefix means **these are bundled into the JS** — anyone with the app bundle can read them. Rotate before sharing builds.

Convex env (set on the Convex deployment, not `.env.local`):

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-clerk-issuer>.clerk.accounts.dev
```

Additional one-time setup:
- Clerk dashboard → JWT Templates → create one named **`convex`** (from the Convex preset). `convex/auth.config.ts` references `applicationID: 'convex'`; without the template, `ctx.auth.getUserIdentity()` returns null and `upsertFromClerk` throws.
- Apple Developer portal → enable **Sign In with Apple** capability on the `com.deglem.app` App ID. Required for real-device Apple SSO (simulator builds work without it). `app.json` declares `ios.usesAppleSignIn: true` for the entitlement.

## Commands

```bash
npm start               # Metro bundler
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run lint            # ESLint
npx expo start --clear  # Clear Metro cache (needed after babel plugin changes)
npx expo start --tunnel # Remote device via ngrok (requires @expo/ngrok)
npx drizzle-kit generate # Generate a new migration after schema changes
```

## Key Conventions

- All styling via NativeWind `className` — no `StyleSheet.create` except for camera overlay
- Use `Pressable` (not `TouchableOpacity`) with `active:opacity-80`
- Inline `style={{ fontFamily: ... }}` for DM Sans — don't rely on Tailwind font utilities
- Haptics on: meal logged (Success), camera capture (Medium), meal deleted (Warning), language switch (selection)
- `SafeAreaView` (from `react-native-safe-area-context`) on all screens
- File names: kebab-case (`meal-card.tsx`, `model-picker-modal.tsx`)
- Component names: PascalCase
- i18n: **every** user-facing string must go through `t()` — both `locales/*.json` files updated together
- Camera tab is **always last** in the tab order — do not reorder it

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
