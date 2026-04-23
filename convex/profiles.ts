import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const activityLevel = v.union(
  v.literal('sedentary'),
  v.literal('lightly_active'),
  v.literal('moderately_active'),
  v.literal('very_active'),
  v.literal('extra_active')
);

const weightEntry = v.object({ date: v.string(), weight: v.number() });

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query('profiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    gender: v.union(v.literal('male'), v.literal('female')),
    weight: v.number(),
    height: v.number(),
    goalWeight: v.number(),
    goalDurationMonths: v.number(),
    activityLevel,
    calorieGoal: v.number(),
    useAutoGoal: v.boolean(),
    weightLog: v.array(weightEntry),
    language: v.union(v.literal('mn'), v.literal('en')),
    onboardedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (existing) {
      await ctx.db.replace(existing._id, { clerkId: identity.subject, ...args });
      return existing._id;
    }
    return await ctx.db.insert('profiles', { clerkId: identity.subject, ...args });
  },
});
