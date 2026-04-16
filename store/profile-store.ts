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
  setProfile: (profile: Partial<Profile>) => void;
  addWeightEntry: (weight: number) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      hasOnboarded: false,
      setOnboarded: (value) => set({ hasOnboarded: value }),
      logout: () => set({ hasOnboarded: false }),
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
      name: 'profile-store',
      storage: createJSONStorage(() => secureStoreAdapter),
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
