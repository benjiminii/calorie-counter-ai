import { and, desc, eq } from 'drizzle-orm';
import type { FunctionArgs } from 'convex/server';

import { api } from '@/convex/_generated/api';
import { convex } from '@/lib/convex-client';
import { getActiveProfileStoreUser } from '@/store/profile-store';

import { db } from './index';
import { meals, type MealRow } from './schema';

// ─── Cloud mirror ────────────────────────────────────────────────────────────
// Every write that goes through this file fires a fire-and-forget mirror to
// Convex. Images are never sent — they stay local. Guest users and anything
// that doesn't belong to the currently active signed-in user are skipped.

function shouldMirror(rowUserId: string): boolean {
  if (!convex) {
    if (__DEV__) console.log('[sync] skip: convex client is null (EXPO_PUBLIC_CONVEX_URL missing?)');
    return false;
  }
  if (!rowUserId || rowUserId === 'guest') {
    if (__DEV__) console.log('[sync] skip: rowUserId is', rowUserId || 'empty');
    return false;
  }
  const active = getActiveProfileStoreUser();
  if (rowUserId !== active) {
    if (__DEV__) console.log('[sync] skip: rowUserId', rowUserId, '!== active', active);
    return false;
  }
  return true;
}

type MealUpsertFields = Omit<FunctionArgs<typeof api.meals.upsert>, 'mealId'>;

function mirrorUpsert(mealId: string, fields: MealUpsertFields, userId: string) {
  if (!shouldMirror(userId)) return;
  if (__DEV__) console.log('[sync] → meal upsert', mealId, Object.keys(fields));
  convex!
    .mutation(api.meals.upsert, { mealId, ...fields })
    .then((id) => {
      if (__DEV__) console.log('[sync] ✓ meal upsert', mealId, '→', id);
    })
    .catch((err) => console.warn('[sync] ✗ meal upsert failed', mealId, err));
}

function mirrorRemove(mealId: string, userId: string) {
  if (!shouldMirror(userId)) return;
  if (__DEV__) console.log('[sync] → meal remove', mealId);
  convex!
    .mutation(api.meals.remove, { mealId })
    .then(() => {
      if (__DEV__) console.log('[sync] ✓ meal remove', mealId);
    })
    .catch((err) => console.warn('[sync] ✗ meal remove failed', mealId, err));
}

async function readUserId(id: string): Promise<string | null> {
  const rows = await db
    .select({ userId: meals.userId })
    .from(meals)
    .where(eq(meals.id, id))
    .limit(1);
  return rows[0]?.userId ?? null;
}

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

export async function getAllMeals(userId: string): Promise<MealRow[]> {
  return db
    .select()
    .from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.loggedAt));
}

export async function getMealById(
  id: string,
  userId: string
): Promise<MealRow | undefined> {
  const rows = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function insertMeal(data: {
  id: string;
  photoUri: string;
  date: string;
  userId: string;
}): Promise<void> {
  const loggedAt = Date.now();
  await db.insert(meals).values({
    id: data.id,
    photoUri: data.photoUri,
    date: data.date,
    loggedAt,
    status: 'analyzing',
    userId: data.userId,
  });
  mirrorUpsert(
    data.id,
    { date: data.date, loggedAt, status: 'analyzing' },
    data.userId
  );
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
  const userId = await readUserId(id);
  if (userId) mirrorUpsert(id, { ...data, status: 'done' }, userId);
}

export async function setMealStatus(
  id: string,
  status: 'analyzing' | 'error'
): Promise<void> {
  await db.update(meals).set({ status }).where(eq(meals.id, id));
  const userId = await readUserId(id);
  if (userId) mirrorUpsert(id, { status }, userId);
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
  const userId = await readUserId(id);
  if (userId) mirrorUpsert(id, data, userId);
}

export async function deleteMeal(id: string): Promise<void> {
  const userId = await readUserId(id);
  await db.delete(meals).where(eq(meals.id, id));
  if (userId) mirrorRemove(id, userId);
}
