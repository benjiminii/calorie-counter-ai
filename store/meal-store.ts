import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string;
  date: string;     // "YYYY-MM-DD"
  loggedAt: number; // timestamp
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealState {
  meals: Meal[];
  addMeal: (meal: Omit<Meal, 'id' | 'loggedAt'>) => void;
  removeMeal: (id: string) => void;
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useMealStore = create<MealState>()(
  persist(
    (set) => ({
      meals: [],
      addMeal: (meal) =>
        set((state) => ({
          meals: [
            ...state.meals,
            { ...meal, id: Date.now().toString(), loggedAt: Date.now() },
          ],
        })),
      removeMeal: (id) =>
        set((state) => ({ meals: state.meals.filter((m) => m.id !== id) })),
    }),
    {
      name: 'meal-store',
      storage: createJSONStorage(() => secureStoreAdapter),
    }
  )
);

export function getMealsByDate(meals: Meal[], date: string): Meal[] {
  return meals
    .filter((m) => m.date === date)
    .sort((a, b) => b.loggedAt - a.loggedAt);
}

export function getTotalsByDate(meals: Meal[], date: string): MacroTotals {
  return meals
    .filter((m) => m.date === date)
    .reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}
