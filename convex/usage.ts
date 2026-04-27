import { query } from './_generated/server';
import { DAILY_MEAL_LIMIT } from './plans';
import { todayMealCountForClerkId } from './subscriptions';

function todayIsoLocal(): string {
  return new Date().toISOString().split('T')[0];
}

export const todayMealCount = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    return await todayMealCountForClerkId(ctx, identity.subject, todayIsoLocal());
  },
});

export const canAnalyzeToday = query({
  args: {},
  handler: async (
    ctx
  ): Promise<{ allowed: boolean; used: number; limit: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { allowed: true, used: 0, limit: DAILY_MEAL_LIMIT };
    const used = await todayMealCountForClerkId(
      ctx,
      identity.subject,
      todayIsoLocal()
    );
    return { allowed: used < DAILY_MEAL_LIMIT, used, limit: DAILY_MEAL_LIMIT };
  },
});
