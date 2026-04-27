import { useAuth } from '@clerk/expo';
import { useQuery } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useProfileStore } from '../store/profile-store';

import type { PlanId } from './plans';

export type AccessStatus =
  | { kind: 'guest' }
  | { kind: 'trial'; daysLeft: number; endsAt: number }
  | { kind: 'active'; plan: PlanId; endsAt: number }
  | { kind: 'expired'; trialEndedAt?: number; lastSubEndedAt?: number }
  | { kind: 'loading' };

/**
 * Reactive subscription/trial status for the signed-in user.
 *
 * Returns `'loading'` until Clerk + Convex answer. Guest mode (no Clerk
 * session) short-circuits to a device-local `'trial'` because guests can't
 * pay anyway; the main app flow forces sign-in before onboarding completes.
 */
export function useAccessStatus(): AccessStatus {
  const { isLoaded, isSignedIn } = useAuth();
  const isGuest = useProfileStore((s) => s.isGuest);
  const status = useQuery(
    api.subscriptions.accessStatus,
    isSignedIn ? {} : 'skip'
  );

  if (!isLoaded) return { kind: 'loading' };
  if (!isSignedIn) {
    return isGuest
      ? { kind: 'trial', daysLeft: 3, endsAt: Date.now() + 3 * 24 * 60 * 60 * 1000 }
      : { kind: 'guest' };
  }
  if (status === undefined) return { kind: 'loading' };
  return status as AccessStatus;
}

export function hasAccess(status: AccessStatus): boolean {
  return status.kind === 'trial' || status.kind === 'active';
}
