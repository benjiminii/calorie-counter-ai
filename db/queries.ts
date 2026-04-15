import { desc, eq } from 'drizzle-orm';
import { db } from './index';
import { meals, type MealRow } from './schema';

// ─── Utilities ───────────────────────────────────────────────────────────────

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMealsByDate(allMeals: MealRow[], date: string): MealRow[] {
  return allMeals
    .filter((m) => m.date === date)
    .sort((a, b) => b.loggedAt - a.loggedAt);
}

export function getTotalsByDate(
  allMeals: MealRow[],
  date: string
): { calories: number; protein: number; carbs: number; fat: number } {
  return allMeals
    .filter((m) => m.date === date && m.status === 'done')
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

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getAllMeals(): Promise<MealRow[]> {
  return db.select().from(meals).orderBy(desc(meals.loggedAt));
}

export async function getMealById(id: string): Promise<MealRow | undefined> {
  const rows = await db.select().from(meals).where(eq(meals.id, id)).limit(1);
  return rows[0];
}

export async function insertMeal(data: {
  id: string;
  photoUri: string;
  date: string;
}): Promise<void> {
  await db.insert(meals).values({
    id: data.id,
    photoUri: data.photoUri,
    date: data.date,
    loggedAt: Date.now(),
    status: 'analyzing',
  });
}

export async function updateMealAnalysis(
  id: string,
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    description: string;
    confidence: string;
    model: string;
  }
): Promise<void> {
  await db
    .update(meals)
    .set({ ...data, status: 'done' })
    .where(eq(meals.id, id));
}

export async function setMealStatus(
  id: string,
  status: 'analyzing' | 'error'
): Promise<void> {
  await db.update(meals).set({ status }).where(eq(meals.id, id));
}

export async function updateMealBasic(
  id: string,
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }
): Promise<void> {
  await db.update(meals).set(data).where(eq(meals.id, id));
}

export async function deleteMeal(id: string): Promise<void> {
  await db.delete(meals).where(eq(meals.id, id));
}
