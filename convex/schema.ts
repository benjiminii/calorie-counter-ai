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

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
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
    .index('by_clerk_id_and_meal_id', ['clerkId', 'mealId']),
});
