import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const activityLevel = v.union(
  v.literal('sedentary'),
  v.literal('lightly_active'),
  v.literal('moderately_active'),
  v.literal('very_active'),
  v.literal('extra_active')
);

const mealStatus = v.union(
  v.literal('analyzing'),
  v.literal('done'),
  v.literal('error')
);

const planId = v.union(
  v.literal('1d'),
  v.literal('30d'),
  v.literal('90d'),
  v.literal('360d')
);

// Matches QPay's payment_status enum (NEW | FAILED | PAID | REFUNDED) plus a
// local CANCELED state we use if the user abandons an invoice.
const paymentStatus = v.union(
  v.literal('NEW'),
  v.literal('PAID'),
  v.literal('FAILED'),
  v.literal('REFUNDED'),
  v.literal('CANCELED')
);

const subscriptionStatus = v.union(
  v.literal('active'),
  v.literal('expired')
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    // Stamped on first upsertFromClerk. Drives the 3-day free trial.
    trialStartedAt: v.optional(v.number()),
  }).index('by_clerk_id', ['clerkId']),

  profiles: defineTable({
    clerkId: v.string(),
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
    weightLog: v.array(
      v.object({ date: v.string(), weight: v.number() })
    ),
    language: v.union(v.literal('mn'), v.literal('en')),
    onboardedAt: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']),

  meals: defineTable({
    clerkId: v.string(),
    mealId: v.string(), // matches the SQLite row id (client-generated nanoid/timestamp)
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    date: v.string(),
    loggedAt: v.number(),
    status: mealStatus,
    ingredients: v.optional(v.string()),
    description: v.optional(v.string()),
    confidence: v.optional(v.string()),
    model: v.optional(v.string()),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_clerk_id_and_meal_id', ['clerkId', 'mealId'])
    .index('by_clerk_id_and_date', ['clerkId', 'date']),

  subscriptions: defineTable({
    clerkId: v.string(),
    plan: planId,
    startsAt: v.number(),
    endsAt: v.number(),
    status: subscriptionStatus,
    // Link back to the payment that activated this subscription. Optional so
    // we can also create comp subscriptions in the future.
    paymentId: v.optional(v.id('payments')),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_clerk_id_and_status', ['clerkId', 'status']),

  payments: defineTable({
    clerkId: v.string(),
    plan: planId,
    amount: v.number(), // MNT
    invoiceId: v.string(), // QPay invoice_id (uuid)
    senderInvoiceNo: v.string(), // our unique id per purchase attempt
    qrText: v.optional(v.string()),
    deepLinks: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        link: v.string(),
      })
    ),
    status: paymentStatus,
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    qpayPaymentId: v.optional(v.string()),
    paidAmount: v.optional(v.number()),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_invoice_id', ['invoiceId'])
    .index('by_sender_invoice_no', ['senderInvoiceNo']),
});
