import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const mealStatus = v.union(
  v.literal('analyzing'),
  v.literal('done'),
  v.literal('error')
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('meals')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .order('desc')
      .take(500);
  },
});

export const upsert = mutation({
  args: {
    mealId: v.string(),
    name: v.optional(v.string()),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    date: v.optional(v.string()),
    loggedAt: v.optional(v.number()),
    status: v.optional(mealStatus),
    ingredients: v.optional(v.string()),
    description: v.optional(v.string()),
    confidence: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const { mealId, ...fields } = args;
    const existing = await ctx.db
      .query('meals')
      .withIndex('by_clerk_id_and_meal_id', (q) =>
        q.eq('clerkId', identity.subject).eq('mealId', mealId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert('meals', {
      clerkId: identity.subject,
      mealId,
      name: fields.name ?? '',
      calories: fields.calories ?? 0,
      protein: fields.protein ?? 0,
      carbs: fields.carbs ?? 0,
      fat: fields.fat ?? 0,
      date: fields.date ?? '',
      loggedAt: fields.loggedAt ?? Date.now(),
      status: fields.status ?? 'analyzing',
      ingredients: fields.ingredients,
      description: fields.description,
      confidence: fields.confidence,
      model: fields.model,
    });
  },
});

export const remove = mutation({
  args: { mealId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const existing = await ctx.db
      .query('meals')
      .withIndex('by_clerk_id_and_meal_id', (q) =>
        q.eq('clerkId', identity.subject).eq('mealId', args.mealId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
