import { v } from 'convex/values';

import { internalQuery, query } from './_generated/server';

/**
 * Reactive query used by the payment screen to watch a single invoice's
 * status. Scoped to the caller — returns null for other users' invoices.
 */
export const byInvoiceIdOwned = query({
  args: { invoiceId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const row = await ctx.db
      .query('payments')
      .withIndex('by_invoice_id', (q) => q.eq('invoiceId', args.invoiceId))
      .unique();
    if (!row || row.clerkId !== identity.subject) return null;
    return row;
  },
});

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('payments')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .order('desc')
      .take(Math.max(1, Math.min(args.limit ?? 20, 100)));
  },
});

// Used by the public HTTP callback — runs without auth because the callback
// itself has no user context. Only exposes invoice_id lookup, never payment
// contents.
export const findInvoiceIdBySenderInvoiceNo = internalQuery({
  args: { senderInvoiceNo: v.string() },
  handler: async (ctx, args): Promise<string | null> => {
    const row = await ctx.db
      .query('payments')
      .withIndex('by_sender_invoice_no', (q) =>
        q.eq('senderInvoiceNo', args.senderInvoiceNo)
      )
      .unique();
    return row?.invoiceId ?? null;
  },
});
