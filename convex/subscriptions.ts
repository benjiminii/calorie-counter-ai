import { v } from 'convex/values';

import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  action,
  internalMutation,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { DAILY_MEAL_LIMIT, PLANS, TRIAL_DAYS, type PlanId } from './plans';
import {
  checkPayment,
  createSimpleInvoice,
  firstPaidRow,
  type QPayDeepLink,
} from './qpay';

const planIdValidator = v.union(
  v.literal('1d'),
  v.literal('30d'),
  v.literal('90d'),
  v.literal('360d')
);

const DAY_MS = 24 * 60 * 60 * 1000;

type AccessStatus =
  | { kind: 'guest' }
  | { kind: 'trial'; daysLeft: number; endsAt: number }
  | { kind: 'active'; plan: PlanId; endsAt: number }
  | { kind: 'expired'; trialEndedAt?: number; lastSubEndedAt?: number };

async function loadActiveSubscription(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<'subscriptions'> | null> {
  const rows = await ctx.db
    .query('subscriptions')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
    .order('desc')
    .take(5);
  const now = Date.now();
  const live = rows.find((r) => r.status === 'active' && r.endsAt > now);
  return live ?? null;
}

async function computeAccessStatus(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<AccessStatus> {
  const activeSub = await loadActiveSubscription(ctx, clerkId);
  if (activeSub) {
    return { kind: 'active', plan: activeSub.plan as PlanId, endsAt: activeSub.endsAt };
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
    .unique();

  const trialStartedAt = user?.trialStartedAt;
  if (trialStartedAt) {
    const trialEndsAt = trialStartedAt + TRIAL_DAYS * DAY_MS;
    const now = Date.now();
    if (trialEndsAt > now) {
      const daysLeft = Math.max(1, Math.ceil((trialEndsAt - now) / DAY_MS));
      return { kind: 'trial', daysLeft, endsAt: trialEndsAt };
    }

    const mostRecentSub = await ctx.db
      .query('subscriptions')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .order('desc')
      .first();
    return {
      kind: 'expired',
      trialEndedAt: trialEndsAt,
      lastSubEndedAt: mostRecentSub?.endsAt,
    };
  }

  // No user row yet (pre-ConvexUserSync) or no trialStartedAt: treat as a
  // brand-new signed-in account whose trial hasn't been stamped yet.
  return { kind: 'trial', daysLeft: TRIAL_DAYS, endsAt: Date.now() + TRIAL_DAYS * DAY_MS };
}

export const accessStatus = query({
  args: {},
  handler: async (ctx): Promise<AccessStatus> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { kind: 'guest' };
    return computeAccessStatus(ctx, identity.subject);
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { subscription: null, payments: [] };

    const subscription = await loadActiveSubscription(ctx, identity.subject);
    const payments = await ctx.db
      .query('payments')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .order('desc')
      .take(20);

    return { subscription, payments };
  },
});

// ─── Payment row helpers ─────────────────────────────────────────────────────

export const recordInvoice = internalMutation({
  args: {
    clerkId: v.string(),
    plan: planIdValidator,
    amount: v.number(),
    invoiceId: v.string(),
    senderInvoiceNo: v.string(),
    qrText: v.string(),
    deepLinks: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        link: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<Id<'payments'>> => {
    return await ctx.db.insert('payments', {
      clerkId: args.clerkId,
      plan: args.plan,
      amount: args.amount,
      invoiceId: args.invoiceId,
      senderInvoiceNo: args.senderInvoiceNo,
      qrText: args.qrText,
      deepLinks: args.deepLinks,
      status: 'NEW',
      createdAt: Date.now(),
    });
  },
});

/**
 * Apply a verified QPay payment:
 *   1. Marks the payment row PAID (idempotent — re-running is a no-op)
 *   2. Extends the user's active subscription or creates a new one
 *
 * Both the HTTP callback and the client-triggered verify path go through here
 * so we never grant access without a PAID row from `/v2/payment/check`.
 */
export const applyPayment = internalMutation({
  args: {
    invoiceId: v.string(),
    qpayPaymentId: v.optional(v.string()),
    paidAmount: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ applied: boolean; reason?: string }> => {
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_invoice_id', (q) => q.eq('invoiceId', args.invoiceId))
      .unique();
    if (!payment) return { applied: false, reason: 'payment-not-found' };
    if (payment.status === 'PAID') return { applied: true, reason: 'already-paid' };

    const now = Date.now();
    await ctx.db.patch(payment._id, {
      status: 'PAID',
      paidAt: now,
      qpayPaymentId: args.qpayPaymentId,
      paidAmount: args.paidAmount,
    });

    // Mark any previously-active subs as expired so only one is live at a time.
    const existingActive = await ctx.db
      .query('subscriptions')
      .withIndex('by_clerk_id_and_status', (q) =>
        q.eq('clerkId', payment.clerkId).eq('status', 'active')
      )
      .collect();
    for (const row of existingActive) {
      await ctx.db.patch(row._id, { status: 'expired' });
    }

    const days = PLANS[payment.plan as PlanId].days;
    await ctx.db.insert('subscriptions', {
      clerkId: payment.clerkId,
      plan: payment.plan,
      startsAt: now,
      endsAt: now + days * DAY_MS,
      status: 'active',
      paymentId: payment._id,
    });

    return { applied: true };
  },
});

/**
 * TEST-ONLY: instantly grants the caller an active subscription for `plan`
 * without touching QPay. Inserts a synthetic PAID payment row so the audit
 * trail still shows how access was granted.
 *
 * Guard on the client (see `isTest` in `app/paywall.tsx`). If you want extra
 * safety in prod, add `ALLOW_TEST_SUBSCRIPTIONS=true` to the Convex env and
 * short-circuit below when it's not set.
 */
export const grantTestSubscription = mutation({
  args: { plan: planIdValidator },
  handler: async (
    ctx,
    args
  ): Promise<{ endsAt: number; plan: PlanId }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const plan = PLANS[args.plan];
    const now = Date.now();
    const senderInvoiceNo = `TEST-${args.plan}-${now}`;

    const paymentId = await ctx.db.insert('payments', {
      clerkId: identity.subject,
      plan: args.plan,
      amount: plan.amountMnt,
      invoiceId: senderInvoiceNo,
      senderInvoiceNo,
      qrText: '',
      deepLinks: [],
      status: 'PAID',
      createdAt: now,
      paidAt: now,
      paidAmount: plan.amountMnt,
      qpayPaymentId: 'test',
    });

    // Expire any currently active subs so only one is live at a time.
    const existingActive = await ctx.db
      .query('subscriptions')
      .withIndex('by_clerk_id_and_status', (q) =>
        q.eq('clerkId', identity.subject).eq('status', 'active')
      )
      .collect();
    for (const row of existingActive) {
      await ctx.db.patch(row._id, { status: 'expired' });
    }

    const endsAt = now + plan.days * DAY_MS;
    await ctx.db.insert('subscriptions', {
      clerkId: identity.subject,
      plan: args.plan,
      startsAt: now,
      endsAt,
      status: 'active',
      paymentId,
    });

    return { endsAt, plan: args.plan };
  },
});

// ─── Actions (talk to QPay) ──────────────────────────────────────────────────

export const createInvoice = action({
  args: { plan: planIdValidator },
  handler: async (
    ctx: ActionCtx,
    args
  ): Promise<{
    invoiceId: string;
    qrImage: string;
    qrText: string;
    deepLinks: QPayDeepLink[];
    amount: number;
    plan: PlanId;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const plan = PLANS[args.plan];
    const senderInvoiceNo = `${identity.subject.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20)}-${args.plan}-${Date.now()}`;
    const description = `Deglem ${plan.id} subscription`;

    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      throw new Error('CONVEX_SITE_URL is not set; cannot build callback URL.');
    }
    const callbackUrl = `${siteUrl}/qpay/callback?sender_invoice_no=${encodeURIComponent(senderInvoiceNo)}`;

    // Clerk user ids often contain `_`; strip to stay within QPay's allowed
    // character set. Using the user id gives QPay a stable receiver code.
    const invoiceReceiverCode =
      identity.subject.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'terminal';

    const invoice = await createSimpleInvoice({
      senderInvoiceNo,
      invoiceReceiverCode,
      amount: plan.amountMnt,
      description,
      callbackUrl,
    });

    await ctx.runMutation(internal.subscriptions.recordInvoice, {
      clerkId: identity.subject,
      plan: args.plan,
      amount: plan.amountMnt,
      invoiceId: invoice.invoice_id,
      senderInvoiceNo,
      qrText: invoice.qr_text,
      deepLinks: invoice.urls ?? [],
    });

    return {
      invoiceId: invoice.invoice_id,
      qrImage: invoice.qr_image,
      qrText: invoice.qr_text,
      deepLinks: invoice.urls ?? [],
      amount: plan.amountMnt,
      plan: args.plan,
    };
  },
});

export const verifyInvoice = action({
  args: { invoiceId: v.string() },
  handler: async (
    ctx: ActionCtx,
    args
  ): Promise<{ status: 'PAID' | 'PENDING' | 'FAILED'; amount?: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Make sure the caller owns this invoice before hitting QPay.
    const mine: Doc<'payments'> | null = await ctx.runQuery(
      api.payments.byInvoiceIdOwned,
      { invoiceId: args.invoiceId }
    );
    if (!mine) throw new Error('Unknown invoice');

    if (mine.status === 'PAID') return { status: 'PAID', amount: mine.paidAmount };

    const check = await checkPayment(args.invoiceId);
    const paid = firstPaidRow(check);
    if (!paid) {
      if (check.rows.some((r) => r.payment_status === 'FAILED')) {
        return { status: 'FAILED' };
      }
      return { status: 'PENDING' };
    }

    await ctx.runMutation(internal.subscriptions.applyPayment, {
      invoiceId: args.invoiceId,
      qpayPaymentId: String(paid.payment_id),
      paidAmount: Number(paid.payment_amount),
    });
    return { status: 'PAID', amount: Number(paid.payment_amount) };
  },
});

// ─── Helpers also consumed by the http callback ──────────────────────────────

export const getPaymentByInvoiceId = query({
  args: { invoiceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_invoice_id', (q) => q.eq('invoiceId', args.invoiceId))
      .unique();
  },
});

// Convenience: today's meal count for the signed-in user (re-exported for the
// client via `usage.canAnalyzeToday` — kept here so server code can call it).
export async function todayMealCountForClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string,
  today: string
): Promise<number> {
  const rows = await ctx.db
    .query('meals')
    .withIndex('by_clerk_id_and_date', (q) =>
      q.eq('clerkId', clerkId).eq('date', today)
    )
    .take(DAILY_MEAL_LIMIT + 1);
  return rows.length;
}
