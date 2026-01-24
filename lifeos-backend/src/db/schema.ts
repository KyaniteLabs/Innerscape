import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// --- AUTH & USERS ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Clerk ID
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- EMOTIONAL CONTEXT (SOMA) ---
export const emotionalContext = sqliteTable('emotional_context', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  energy: integer('energy').notNull(), // 0-100
  valence: integer('valence').notNull(), // -100 to 100
  dominantFeeling: text('dominant_feeling').notNull(),
  bodySensation: text('body_sensation'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// --- BRAIN (MIND) ---
export const captures = sqliteTable('captures', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(), // 'task', 'idea', 'journal', 'person'
  status: text('status').default('inbox'),
  metadata: text('metadata'), // JSON string for extra info
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- HABITS (FLOW) ---
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  frequency: text('frequency').notNull(), // 'daily', 'weekly', etc.
  preferredEnergy: integer('preferred_energy'),
  streak: integer('streak').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const habitCompletions = sqliteTable('habit_completions', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').references(() => habits.id).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});

// --- JOURNAL ENTRIES ---
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  transcriptionSource: text('transcription_source'), // 'whisper' | 'deepgram' | 'typed'
  moodId: text('mood_id').references(() => emotionalContext.id), // Link to mood context
  tags: text('tags'), // JSON array
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- PULSE (HEALTH/ENERGY) ---
export const healthMetrics = sqliteTable('health_metrics', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'hrv', 'steps', 'sleep_duration'
  value: real('value').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const sleepRecords = sqliteTable('sleep_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  quality: integer('quality'), // 1-100
  source: text('source'), // 'apple_health' | 'google_fit' | 'manual'
});

// --- GOALS (NORTH) ---
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: integer('target_date', { mode: 'timestamp' }),
  progress: integer('progress').default(0), // 0-100
  status: text('status').default('active'), // 'active' | 'completed' | 'archived'
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- INSIGHTS ---
export const insights = sqliteTable('insights', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(), // 'pattern', 'correlation', 'suggestion'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
