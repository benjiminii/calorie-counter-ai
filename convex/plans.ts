/**
 * Canonical subscription plan registry.
 *
 * Shared by the Convex backend (invoice amount, duration) and the RN app
 * (display labels). Prices are in MNT.
 *
 * NOTE: the app-side file `lib/plans.ts` re-exports these so React code can
 * import from `@/lib/plans` without pulling Convex server-only modules.
 */

export type PlanId = '1d' | '30d' | '90d' | '360d';

export type Plan = {
  id: PlanId;
  days: number;
  amountMnt: number;
  // i18n key for display
  labelKey: string;
};

export const PLANS: Record<PlanId, Plan> = {
  // Dev-only: 1 day for ₮1,000. Used by the test switch on the paywall.
  '1d': { id: '1d', days: 1, amountMnt: 1_000, labelKey: 'plan_1d_label' },
  '30d': { id: '30d', days: 30, amountMnt: 9_900, labelKey: 'plan_30d_label' },
  '90d': { id: '90d', days: 90, amountMnt: 24_900, labelKey: 'plan_90d_label' },
  '360d': { id: '360d', days: 360, amountMnt: 79_900, labelKey: 'plan_360d_label' },
};

export const PLAN_IDS: PlanId[] = ['30d', '90d', '360d'];
export const TEST_PLAN_IDS: PlanId[] = ['1d', '30d', '90d', '360d'];

export const TRIAL_DAYS = 3;
export const DAILY_MEAL_LIMIT = 10;
