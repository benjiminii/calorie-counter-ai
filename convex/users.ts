import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const row = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();
    return row;
  },
});

export const upsertFromClerk = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (existing) {
      const patch: Record<string, unknown> = { ...args };
      if (existing.trialStartedAt == null) {
        patch.trialStartedAt = Date.now();
      }
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert('users', {
      clerkId: identity.subject,
      trialStartedAt: Date.now(),
      ...args,
    });
  },
});
