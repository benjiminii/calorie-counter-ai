import { useAuth, useUser } from '@clerk/expo';
import { Redirect } from 'expo-router';

import { useProfileStore, useProfileStoreHydrated } from '@/store/profile-store';

export default function IndexGate() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const isGuest = useProfileStore((s) => s.isGuest);
  const guestOnboarded = useProfileStore((s) => s.hasOnboarded);
  const profileHydrated = useProfileStoreHydrated();

  // Wait for Clerk + the per-user profile store to finish loading before
  // routing, otherwise we risk redirecting based on the previous user's
  // (or the default guest) onboarding flag.
  if (!authLoaded || (isSignedIn && !userLoaded) || !profileHydrated) return null;

  if (!isSignedIn && !isGuest) return <Redirect href={'/login' as never} />;

  const clerkOnboarded =
    user?.unsafeMetadata?.hasOnboarded === true ||
    (user?.publicMetadata as { hasOnboarded?: boolean } | undefined)?.hasOnboarded === true;
  const hasOnboarded = isSignedIn ? clerkOnboarded || guestOnboarded : guestOnboarded;

  return <Redirect href={(hasOnboarded ? '/(tabs)' : '/step-section') as never} />;
}
