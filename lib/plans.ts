/**
 * App-side re-export of the canonical plan registry from `convex/plans.ts`.
 *
 * Importing from `@/lib/plans` keeps React code free of Convex server-only
 * imports; the underlying constants are identical.
 */

export {
  PLANS,
  PLAN_IDS,
  TEST_PLAN_IDS,
  TRIAL_DAYS,
  DAILY_MEAL_LIMIT,
  type Plan,
  type PlanId,
} from '../convex/plans';

/**
 * Best human-readable formatter for MNT amounts. Mongolian locale uses the
 * group separator in both en-US and mn-MN, so this is safe for both.
 */
export function formatMnt(amountMnt: number): string {
  return `₮${amountMnt.toLocaleString('en-US')}`;
}
