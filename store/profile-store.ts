import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type Gender = 'male' | 'female';

export interface WeightEntry {
  date: string; // "YYYY-MM-DD"
  weight: number; // kg
}

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  weight: number; // kg
  height: number; // cm
  goalWeight: number; // kg
  goalDurationMonths: number;
  activityLevel: ActivityLevel;
  calorieGoal: number; // kcal/day
  useAutoGoal: boolean;
  weightLog: WeightEntry[];
  language: 'mn' | 'en';
  onboardedAt?: string; // ISO date string (YYYY-MM-DD)
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function calculateBMR(
  gender: Gender,
  weight: number,
  height: number,
  age: number
): number {
  return gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateMaintenance(
  gender: Gender,
  weight: number,
  height: number,
  age: number,
  activityLevel: ActivityLevel
): number {
  return Math.round(calculateBMR(gender, weight, height, age) * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateCalorieGoal(
  gender: Gender,
  weight: number,
  height: number,
  activityLevel: ActivityLevel,
  age: number = 30
): number {
  return calculateMaintenance(gender, weight, height, age, activityLevel);
}

export function healthyWeightRange(heightCm: number): { low: number; high: number } {
  const m = heightCm / 100;
  return {
    low: Math.round(18.5 * m * m * 10) / 10,
    high: Math.round(24.9 * m * m * 10) / 10,
  };
}

// Given current weight, goal weight, duration in months, and maintenance calories:
// returns the daily calorie target and the resulting weekly rate of change.
export function calculatePlan(
  currentWeight: number,
  goalWeight: number,
  durationMonths: number,
  maintenance: number
): { dailyCalories: number; weeklyRateKg: number; dailyDeficit: number } {
  const diffKg = currentWeight - goalWeight; // positive = lose
  const totalDeficitKcal = diffKg * 7700;
  const days = Math.max(1, durationMonths * 30);
  const dailyDeficit = totalDeficitKcal / days;
  const dailyCalories = Math.round(maintenance - dailyDeficit);
  const weeklyRateKg = diffKg / (durationMonths * 4.345);
  return { dailyCalories, weeklyRateKg, dailyDeficit };
}

export function getMacroGoals(calorieGoal: number) {
  return {
    protein: Math.round((calorieGoal * 0.3) / 4),
    carbs: Math.round((calorieGoal * 0.4) / 4),
    fat: Math.round((calorieGoal * 0.3) / 9),
  };
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  age: 30,
  gender: 'male',
  weight: 70,
  height: 170,
  goalWeight: 65,
  goalDurationMonths: 3,
  activityLevel: 'moderately_active',
  calorieGoal: 2000,
  useAutoGoal: true,
  weightLog: [],
  language: 'mn',
};

interface ProfileState {
  profile: Profile;
  hasOnboarded: boolean;
  isGuest: boolean;
  /**
   * True once the store has finished rehydrating from SecureStore for the
   * *current* active user. Flips back to false while we swap users and load
   * the new namespace, so consumers (e.g. IndexGate) can wait before reading
   * onboarding state.
   */
  _hydrated: boolean;
  setProfile: (profile: Partial<Profile>) => void;
  addWeightEntry: (weight: number) => void;
  setOnboarded: (value: boolean) => void;
  setGuest: (value: boolean) => void;
  logout: () => void;
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let activeUserId = 'guest';

// SecureStore only allows [A-Za-z0-9._-] in keys, so no ':' or other separators.
function sanitizeUserId(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]/g, '_');
}

function profileStoreKey(userId: string): string {
  return `profile-store_${sanitizeUserId(userId)}`;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      hasOnboarded: false,
      isGuest: false,
      _hydrated: false,
      setOnboarded: (value) => set({ hasOnboarded: value }),
      setGuest: (value) => set({ isGuest: value }),
      logout: () => set({ hasOnboarded: false, isGuest: false }),
      setProfile: (updates) =>
        set((state) => {
          const merged = { ...state.profile, ...updates };
          if (merged.useAutoGoal) {
            merged.calorieGoal = calculateCalorieGoal(
              merged.gender,
              merged.weight,
              merged.height,
              merged.activityLevel
            );
          }
          return { profile: merged };
        }),
      addWeightEntry: (weight) =>
        set((state) => {
          const date = new Date().toISOString().split('T')[0];
          const log = state.profile.weightLog.filter((e) => e.date !== date);
          return {
            profile: {
              ...state.profile,
              weight,
              weightLog: [...log, { date, weight }].slice(-90),
            },
          };
        }),
    }),
    {
      name: profileStoreKey(activeUserId),
      storage: createJSONStorage(() => secureStoreAdapter),
      // `_hydrated` is a runtime flag; never persist it.
      partialize: (state) => {
        const { _hydrated: _ignored, ...rest } = state;
        return rest as Omit<ProfileState, '_hydrated'>;
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ProfileState>),
        profile: {
          ...DEFAULT_PROFILE,
          ...((persisted as Partial<ProfileState>)?.profile ?? {}),
        },
      }),
    }
  )
);

useProfileStore.persist.onFinishHydration(() => {
  useProfileStore.setState({ _hydrated: true });
});

export function setProfileStoreUser(userId: string | null | undefined) {
  const next = userId ?? 'guest';
  if (next === activeUserId) return;
  activeUserId = next;
  // Reset hydrated flag, swap the SecureStore key, then re-hydrate. The
  // onFinishHydration callback above flips `_hydrated` back to true.
  useProfileStore.setState({ _hydrated: false });
  useProfileStore.persist.setOptions({ name: profileStoreKey(activeUserId) });
  useProfileStore.persist.rehydrate();
}

/**
 * Hook: `true` once the store is hydrated for the currently active user.
 * Use this before trusting `hasOnboarded` / profile values after sign-in.
 */
export function useProfileStoreHydrated(): boolean {
  return useProfileStore((s) => s._hydrated);
}
