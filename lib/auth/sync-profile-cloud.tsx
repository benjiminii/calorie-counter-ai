import { useAuth } from '@clerk/expo';
import { useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';

import { api } from '@/convex/_generated/api';
import {
  useProfileStore,
  useProfileStoreHydrated,
  type Profile,
} from '@/store/profile-store';

// Mirrors the local profile to Convex whenever it changes. Only runs after
// the user has onboarded — before that, the profile is still defaults and we
// don't want to overwrite a returning user's cloud profile with empty values.
export function ProfileCloudSync() {
  const { isSignedIn } = useAuth();
  const hydrated = useProfileStoreHydrated();
  const hasOnboarded = useProfileStore((s) => s.hasOnboarded);
  const isGuest = useProfileStore((s) => s.isGuest);
  const profile = useProfileStore((s) => s.profile);
  const upsert = useMutation(api.profiles.upsert);
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || isGuest || !hydrated || !hasOnboarded) return;
    const signature = JSON.stringify(profile);
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    upsert(toConvexArgs(profile)).catch((err) =>
      console.warn('[sync] profile upsert failed', err)
    );
  }, [isSignedIn, isGuest, hydrated, hasOnboarded, profile, upsert]);

  return null;
}

function toConvexArgs(p: Profile) {
  return {
    name: p.name,
    age: p.age,
    gender: p.gender,
    weight: p.weight,
    height: p.height,
    goalWeight: p.goalWeight,
    goalDurationMonths: p.goalDurationMonths,
    activityLevel: p.activityLevel,
    calorieGoal: p.calorieGoal,
    useAutoGoal: p.useAutoGoal,
    weightLog: p.weightLog,
    language: p.language,
    onboardedAt: p.onboardedAt,
  };
}
