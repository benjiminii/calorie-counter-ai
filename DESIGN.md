# Design System — Calorie Tracker AI (React Native / Expo)

Adapted from the Lovable web design system for cross-platform mobile using **NativeWind v4**.
All styling uses Tailwind class names via NativeWind. No `StyleSheet.create`.

---

## 1. Visual Theme & Atmosphere

Warm, approachable, analog — like a well-crafted food journal. The cream background (`#f7f4ed`) immediately separates the app from sterile health-tracker conventions. Near-black charcoal text on cream creates soft, readable contrast without the harshness of pure black on white.

**Key Characteristics:**
- Warm parchment background (`#f7f4ed`) — not white, the cream is intentional
- **DM Sans** as the primary typeface — humanist warmth, excellent mobile legibility, available via `expo-google-fonts`
- Opacity-driven grays: all derived from `#1c1c1c` at varying transparencies
- Borders over shadows for card containment — `#eceae4`
- Full-pill radius (`rounded-full`) for camera trigger, icon buttons, action pills
- Platform shadow handling: `shadow-*` on iOS, `elevation-*` on Android via NativeWind

---

## 2. Color Palette

### Tailwind Custom Config (`tailwind.config.js`)

```js
theme: {
  extend: {
    colors: {
      cream: '#f7f4ed',
      charcoal: '#1c1c1c',
      'off-white': '#fcfbf8',
      'cream-border': '#eceae4',
      'muted': '#5f5f5d',
    }
  }
}
```

### Roles

| Token | Value | NativeWind Class | Use |
|-------|-------|-----------------|-----|
| Cream | `#f7f4ed` | `bg-cream` | App background, card surfaces |
| Charcoal | `#1c1c1c` | `bg-charcoal` / `text-charcoal` | Text, dark buttons |
| Off-White | `#fcfbf8` | `text-off-white` | Button text on dark backgrounds |
| Cream Border | `#eceae4` | `border-cream-border` | Cards, dividers |
| Muted | `#5f5f5d` | `text-muted` | Captions, secondary text |
| Charcoal 40% | `rgba(28,28,28,0.4)` | `border-charcoal/40` | Interactive borders |
| Charcoal 4% | `rgba(28,28,28,0.04)` | `bg-charcoal/[0.04]` | Pressed state tint |

### Dark Mode
Dark mode support via NativeWind's `dark:` prefix. Map dark variants in `tailwind.config.js`:

```js
colors: {
  cream: { DEFAULT: '#f7f4ed', dark: '#1a1814' },
  charcoal: { DEFAULT: '#1c1c1c', dark: '#f0ede6' },
  'cream-border': { DEFAULT: '#eceae4', dark: '#2a2724' },
  muted: { DEFAULT: '#5f5f5d', dark: '#8a8784' },
}
```

Usage: `className="bg-cream dark:bg-cream-dark text-charcoal dark:text-charcoal-dark"`

---

## 3. Typography

### Font Setup

Install via expo-google-fonts:
```bash
npx expo install @expo-google-fonts/dm-sans expo-font
```

Load in `app/_layout.tsx`:
```tsx
import { useFonts, DMSans_400Regular, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
```

### NativeWind Font Classes

Add to `tailwind.config.js`:
```js
fontFamily: {
  sans: ['DMSans_400Regular', 'system-ui'],
  'sans-semibold': ['DMSans_600SemiBold', 'system-ui'],
}
```

### Type Scale

| Role | Class | Use |
|------|-------|-----|
| Display Hero | `font-sans-semibold text-5xl leading-tight tracking-tight` | Screen titles, calorie totals |
| Section Heading | `font-sans-semibold text-3xl leading-tight tracking-tight` | Section titles |
| Sub-heading | `font-sans-semibold text-2xl leading-tight` | Card headings |
| Card Title | `font-sans text-xl leading-snug` | Meal names |
| Body Large | `font-sans text-lg leading-relaxed` | Intro text |
| Body | `font-sans text-base leading-normal` | Standard content |
| Button | `font-sans text-base` | Button labels |
| Caption | `font-sans text-sm text-muted` | Metadata, timestamps, units |

**Rules:**
- Two weights only: 400 (`font-sans`) and 600 (`font-sans-semibold`)
- Tight tracking (`tracking-tight`) only on large headings (text-2xl+)
- Body and UI text: normal tracking

---

## 4. Spacing System

Base unit: **8px** (`p-2` in Tailwind)

| Tailwind | px | Use |
|----------|----|-----|
| `p-1` / `gap-1` | 4px | Micro gaps, icon padding |
| `p-2` / `gap-2` | 8px | Tight internal spacing |
| `p-3` / `gap-3` | 12px | Card internal padding |
| `p-4` / `gap-4` | 16px | Standard padding, button horizontal |
| `p-6` / `gap-6` | 24px | Section inner padding |
| `p-8` / `gap-8` | 32px | Card outer margins |
| `p-10` / `gap-10` | 40px | Screen horizontal padding |
| `p-14` / `gap-14` | 56px | Large section spacing |
| `p-20` / `gap-20` | 80px | Hero/feature spacing |

Screen horizontal padding: `px-5` (20px) on all screens.

---

## 5. Border Radius Scale

| Name | Class | px | Use |
|------|-------|----|-----|
| Micro | `rounded` | 4px | Small chips, tags |
| Standard | `rounded-md` | 6px | Buttons, inputs |
| Comfortable | `rounded-lg` | 8px | Compact cards |
| Card | `rounded-xl` | 12px | Meal cards, containers |
| Container | `rounded-2xl` | 16px | Bottom sheets, large panels |
| Full Pill | `rounded-full` | 9999px | Camera button, icon pills |

---

## 6. Component Stylings

### Buttons

**Primary Dark**
```tsx
<Pressable className="bg-charcoal rounded-md px-4 py-2 active:opacity-80 ios:shadow-sm ios:shadow-black/20">
  <Text className="text-off-white font-sans text-base">Log Meal</Text>
</Pressable>
```

**Ghost / Outline**
```tsx
<Pressable className="border border-charcoal/40 rounded-md px-4 py-2 active:opacity-80">
  <Text className="text-charcoal font-sans text-base">Cancel</Text>
</Pressable>
```

**Cream Surface (Tertiary)**
```tsx
<Pressable className="bg-cream rounded-md px-4 py-2 active:opacity-80">
  <Text className="text-charcoal font-sans text-base">Edit</Text>
</Pressable>
```

**Pill / Icon Button**
```tsx
<Pressable className="bg-cream rounded-full p-3 active:opacity-80 ios:shadow-sm ios:shadow-black/10">
  <Icon name="camera" size={24} color="#1c1c1c" />
</Pressable>
```

**Camera Trigger (Primary Action)**
```tsx
<Pressable className="bg-charcoal rounded-full w-20 h-20 items-center justify-center active:opacity-80 ios:shadow-md ios:shadow-black/30 android:elevation-4">
  <Icon name="camera" size={32} color="#fcfbf8" />
</Pressable>
```

### Cards & Containers

**Meal Card**
```tsx
<View className="bg-cream border border-cream-border rounded-xl p-4 gap-3">
  <Text className="font-sans-semibold text-xl text-charcoal">{mealName}</Text>
  <Text className="font-sans text-sm text-muted">{calories} kcal</Text>
</View>
```

**Summary / Stat Card**
```tsx
<View className="bg-cream border border-cream-border rounded-2xl p-6 gap-2">
  <Text className="font-sans-semibold text-5xl text-charcoal tracking-tight">{total}</Text>
  <Text className="font-sans text-sm text-muted">calories today</Text>
</View>
```

### Inputs & Forms

**Text Input**
```tsx
<TextInput
  className="bg-cream border border-cream-border rounded-md px-4 py-3 font-sans text-base text-charcoal"
  placeholderTextColor="#5f5f5d"
  placeholder="Add context..."
/>
```

**Focused state:** Use `focus:border-charcoal/40` (NativeWind v4 supports focus variant on TextInput).

### AI Context Input (Distinctive Component)

The main input for adding context to a food photo — large, inviting, not clinical:

```tsx
<View className="bg-cream border border-cream-border rounded-2xl px-4 py-3 gap-3">
  <TextInput
    className="font-sans text-base text-charcoal min-h-[60px]"
    placeholderTextColor="#5f5f5d"
    placeholder="Describe the portion, cooking method, extras..."
    multiline
  />
  <View className="flex-row gap-2 flex-wrap">
    {suggestions.map(s => (
      <Pressable key={s} className="border border-cream-border rounded-full px-3 py-1 active:opacity-70">
        <Text className="font-sans text-sm text-charcoal">{s}</Text>
      </Pressable>
    ))}
  </View>
</View>
```

### Calorie Ring / Progress

Use `react-native-svg` with the cream palette:
- Track color: `#eceae4`
- Fill color: `#1c1c1c`
- Center label: `font-sans-semibold text-5xl text-charcoal`

### Tab Bar

```tsx
// In app/(tabs)/_layout.tsx
tabBarStyle: {
  backgroundColor: '#f7f4ed',
  borderTopColor: '#eceae4',
  borderTopWidth: 1,
}
tabBarActiveTintColor: '#1c1c1c'
tabBarInactiveTintColor: '#5f5f5d'
```

### Bottom Sheet (Confirm / Edit Screen)

```tsx
<View className="bg-cream rounded-t-2xl px-5 pt-4 pb-8 gap-5">
  <View className="w-10 h-1 bg-cream-border rounded-full self-center" /> {/* drag handle */}
  ...
</View>
```

---

## 7. Shadows & Elevation

React Native shadows are platform-specific. NativeWind v4 handles this with platform prefixes:

| Level | iOS Classes | Android Classes | Use |
|-------|-------------|-----------------|-----|
| Flat | — | — | Most surfaces, cards (borders only) |
| Subtle | `ios:shadow-sm ios:shadow-black/10` | `android:elevation-1` | Pill buttons |
| Raised | `ios:shadow-md ios:shadow-black/20` | `android:elevation-3` | Camera button, bottom sheet |
| High | `ios:shadow-lg ios:shadow-black/25` | `android:elevation-6` | Modals |

**Rule:** Cards use `border border-cream-border` — not shadows. Only interactive floating elements (buttons, bottom sheets) use elevation.

---

## 8. Screen Layouts

### Dashboard Screen
```
SafeAreaView bg-cream
  ScrollView px-5
    ← Calorie ring stat card (rounded-2xl)
    ← "Today" section heading
    ← Meal card list (gap-3)
  ← Floating camera button (absolute bottom-6 right-6)
```

### Camera Screen
```
View flex-1 bg-black
  ← CameraView flex-1
  ← Overlay: bottom safe area
      ← Context input pill (above shutter)
      ← Shutter button (rounded-full bg-charcoal)
      ← Cancel (ghost pill)
```

### Confirm / Edit Screen (Bottom Sheet)
```
BottomSheet bg-cream rounded-t-2xl
  ← Food photo thumbnail (rounded-xl border border-cream-border)
  ← AI result: name + calories (editable)
  ← Macro breakdown row
  ← Context TextInput
  ← "Log Meal" primary button
```

---

## 9. Touch & Interaction

- Minimum touch target: **44×44pt** (Apple HIG) / **48×48dp** (Material)
- All `Pressable` use `active:opacity-80` for tactile feedback
- Pill buttons use `active:opacity-70` (lighter default opacity makes the press more visible)
- No hover states — use `pressed` state from `Pressable` render prop for complex interactions
- Haptic feedback on: meal logged, calorie goal reached, camera capture

```tsx
import * as Haptics from 'expo-haptics';
// On log: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
// On capture: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
```

---

## 10. NativeWind Setup

### Installation
```bash
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
npx tailwindcss init
```

### `tailwind.config.js`
```js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#f7f4ed',
        charcoal: '#1c1c1c',
        'off-white': '#fcfbf8',
        'cream-border': '#eceae4',
        muted: '#5f5f5d',
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'system-ui'],
        'sans-semibold': ['DMSans_600SemiBold', 'system-ui'],
      },
    },
  },
  plugins: [],
};
```

### `babel.config.js`
```js
module.exports = {
  presets: [
    ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
};
```

### `global.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import in `app/_layout.tsx`:
```tsx
import '../global.css';
```

---

## 11. Do's and Don'ts (Mobile)

### Do
- Use `bg-cream` everywhere — never `bg-white`
- Use `border border-cream-border` for card containment — not shadow
- Use `rounded-full` only for the camera button and icon action pills
- Use `active:opacity-80` on every `Pressable`
- Use `px-5` (20px) as the standard screen horizontal padding
- Use `font-sans-semibold` only for headings and large numeric displays
- Add haptics on primary actions (log, capture, goal reached)
- Use `ios:` and `android:` prefixes for platform-specific shadow/elevation

### Don't
- Don't use `bg-white` or `bg-gray-*` — derive from cream or charcoal opacity
- Don't use heavy elevation on cards — borders only
- Don't use `font-bold` (700) — `font-sans-semibold` (600) is the maximum
- Don't add `rounded-full` to wide buttons — only icon/action pills
- Don't use saturated accent colors — the palette is intentionally warm-neutral
- Don't skip `SafeAreaView` on screens with camera or absolute-positioned buttons
