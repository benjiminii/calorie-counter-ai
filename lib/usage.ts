import { useAuth } from '@clerk/expo';
import { useQuery } from 'convex/react';

import { api } from '../convex/_generated/api';

import { DAILY_MEAL_LIMIT } from './plans';

/**
 * Reactive daily AI-analysis usage for the signed-in user.
 *
 * Returns `{ used, limit, allowed, loading }`. Guests always get `allowed`
 * because their data never touches the cloud; the main flow forces sign-in
 * before paywall / limits come into play.
 */
export function useDailyUsage(): {
  used: number;
  limit: number;
  allowed: boolean;
  loading: boolean;
} {
  const { isLoaded, isSignedIn } = useAuth();
  const result = useQuery(
    api.usage.canAnalyzeToday,
    isSignedIn ? {} : 'skip'
  );

  if (!isLoaded) {
    return { used: 0, limit: DAILY_MEAL_LIMIT, allowed: true, loading: true };
  }
  if (!isSignedIn) {
    return { used: 0, limit: DAILY_MEAL_LIMIT, allowed: true, loading: false };
  }
  if (result === undefined) {
    return { used: 0, limit: DAILY_MEAL_LIMIT, allowed: true, loading: true };
  }
  return {
    used: result.used,
    limit: result.limit,
    allowed: result.allowed,
    loading: false,
  };
}

export { DAILY_MEAL_LIMIT };
