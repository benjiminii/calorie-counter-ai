import { useAuth, useUser } from '@clerk/expo';
import { useConvex } from 'convex/react';
import { eq } from 'drizzle-orm';
import { useEffect, useRef } from 'react';

import { api } from '@/convex/_generated/api';
import { db } from '@/db';
import { meals } from '@/db/schema';
import { useProfileStore, useProfileStoreHydrated } from '@/store/profile-store';

// Pulls cloud data down on first sign-in when local has nothing to show.
// Runs once per Clerk user id per session. Images never come from the cloud
// (they aren't stored there) — mirrored rows hydrate with photoUri = null.
export function CloudHydrationOnSignIn() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const convex = useConvex();
  const hydrated = useProfileStoreHydrated();
  const hasOnboarded = useProfileStore((s) => s.hasOnboarded);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setOnboarded = useProfileStore((s) => s.setOnboarded);
  const doneForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user?.id || !hydrated) return;
    if (doneForUser.current === user.id) return;
    doneForUser.current = user.id;

    (async () => {
      try {
        if (!hasOnboarded) {
          const cloudProfile = await convex.query(api.profiles.get, {});
          if (cloudProfile?.onboardedAt) {
            setProfile({
              name: cloudProfile.name,
              age: cloudProfile.age,
              gender: cloudProfile.gender,
              weight: cloudProfile.weight,
              height: cloudProfile.height,
              goalWeight: cloudProfile.goalWeight,
              goalDurationMonths: cloudProfile.goalDurationMonths,
              activityLevel: cloudProfile.activityLevel,
              calorieGoal: cloudProfile.calorieGoal,
              useAutoGoal: cloudProfile.useAutoGoal,
              weightLog: cloudProfile.weightLog,
              language: cloudProfile.language,
              onboardedAt: cloudProfile.onboardedAt,
            });
            setOnboarded(true);
          }
        }

        const localCount = await db
          .select({ id: meals.id })
          .from(meals)
          .where(eq(meals.userId, user.id))
          .limit(1);
        if (localCount.length === 0) {
          const cloudMeals = await convex.query(api.meals.list, {});
          for (const m of cloudMeals) {
            await db.insert(meals).values({
              id: m.mealId,
              name: m.name,
              calories: m.calories,
              protein: m.protein,
              carbs: m.carbs,
              fat: m.fat,
              photoUri: null,
              date: m.date,
              loggedAt: m.loggedAt,
              status: m.status,
              ingredients: m.ingredients ?? null,
              description: m.description ?? null,
              confidence: m.confidence ?? null,
              model: m.model ?? null,
              userId: user.id,
            });
          }
        }
      } catch (err) {
        console.warn('[sync] cloud hydration failed', err);
      }
    })();
  }, [isSignedIn, user?.id, hydrated, hasOnboarded, convex, setProfile, setOnboarded]);

  return null;
}
