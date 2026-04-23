import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type MealStatus = 'analyzing' | 'done' | 'error';

export const meals = sqliteTable('meals', {
  id:          text('id').primaryKey().notNull(),
  name:        text('name').notNull().default(''),
  calories:    integer('calories').notNull().default(0),
  protein:     real('protein').notNull().default(0),
  carbs:       real('carbs').notNull().default(0),
  fat:         real('fat').notNull().default(0),
  photoUri:    text('photo_uri'),
  date:        text('date').notNull(),
  loggedAt:    integer('logged_at').notNull(),
  status:      text('status', { enum: ['analyzing', 'done', 'error'] })
                 .notNull()
                 .$type<MealStatus>()
                 .default('analyzing'),
  ingredients: text('ingredients'), // JSON string → string[]
  description: text('description'),
  confidence:  text('confidence'),
  model:       text('model'), // model id used for analysis, e.g. "claude-haiku-4-5-20251001"
  userId:      text('user_id'),
});

export type MealRow = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
