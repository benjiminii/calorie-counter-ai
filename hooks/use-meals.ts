import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { meals } from '@/db/schema';
import type { MealRow } from '@/db/schema';

export function useMeals(): MealRow[] {
  const { data } = useLiveQuery(
    db.select().from(meals).orderBy(desc(meals.loggedAt))
  );
  return data ?? [];
}
