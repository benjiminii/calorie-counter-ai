import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { meals } from '@/db/schema';
import type { MealRow } from '@/db/schema';
import { useCurrentUserId } from './use-current-user-id';

export function useMeals(): MealRow[] {
  const userId = useCurrentUserId();
  const { data } = useLiveQuery(
    db
      .select()
      .from(meals)
      .where(userId ? eq(meals.userId, userId) : sql`0 = 1`)
      .orderBy(desc(meals.loggedAt))
  );
  return data ?? [];
}
