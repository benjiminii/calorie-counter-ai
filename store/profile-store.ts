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
  gender: Gender;
  weight: number; // kg
  height: number; // cm
  activityLevel: ActivityLevel;
  calorieGoal: number; // kcal/day
  useAutoGoal: boolean;
  weightLog: WeightEntry[];
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function calculateCalorieGoal(
  gender: Gender,
  weight: number,
  height: number,
  activityLevel: ActivityLevel
): number {
  // Mifflin-St Jeor BMR
  const bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * 30 + 5
      : 10 * weight + 6.25 * height - 5 * 30 - 161;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
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
  gender: 'male',
  weight: 70,
  height: 170,
  activityLevel: 'moderately_active',
  calorieGoal: 2000,
  useAutoGoal: true,
  weightLog: [],
};

interface ProfileState {
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => void;
  addWeightEntry: (weight: number) => void;
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
    }
  )
);
