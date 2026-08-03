/*
# Sync Fitness Tracker — Core Schema

1. Purpose
   Multi-user fitness tracking app with AI mentor. Each authenticated user owns their
   profile, water logs, workouts, sleep logs, meal logs, chat messages, and stats.

2. New Tables
   - `profiles`: user profile (gender, age, height, weight, goal, activity, equipment, cycle, fasting, diet)
   - `water_logs`: daily water intake entries (amount in ml)
   - `workouts`: workout entries (type, duration, intensity)
   - `sleep_logs`: sleep entries (hours)
   - `meal_logs`: meal entries (home/prepared, macro compliance)
   - `chat_messages`: AI chat history (role: user/assistant, content)
   - `user_stats`: level, xp, and skill percentages (strength, endurance, sleep, nutrition)

3. Security
   - RLS enabled on every table.
   - All tables are owner-scoped (user_id DEFAULT auth.uid()).
   - Four separate CRUD policies per table, scoped TO authenticated.

4. Notes
   - profile.id doubles as the foreign key to auth.users (1:1).
   - user_stats has a unique constraint on user_id so upserts work cleanly.
*/

-- ── profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  gender text DEFAULT 'not_specified',
  age int,
  height int,
  weight int,
  goal text DEFAULT 'maintain',
  activity_level text DEFAULT 'moderate',
  equipment text[] DEFAULT '{}',
  cycle_phase text DEFAULT 'not_specified',
  fasting text[] DEFAULT '{}',
  diet text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ── water_logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount int NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_water" ON water_logs;
CREATE POLICY "select_own_water" ON water_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_water" ON water_logs;
CREATE POLICY "insert_own_water" ON water_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_water" ON water_logs;
CREATE POLICY "update_own_water" ON water_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_water" ON water_logs;
CREATE POLICY "delete_own_water" ON water_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── workouts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  duration int NOT NULL,
  intensity text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_workouts" ON workouts;
CREATE POLICY "select_own_workouts" ON workouts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workouts" ON workouts;
CREATE POLICY "insert_own_workouts" ON workouts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workouts" ON workouts;
CREATE POLICY "update_own_workouts" ON workouts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workouts" ON workouts;
CREATE POLICY "delete_own_workouts" ON workouts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── sleep_logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  hours numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sleep" ON sleep_logs;
CREATE POLICY "select_own_sleep" ON sleep_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sleep" ON sleep_logs;
CREATE POLICY "insert_own_sleep" ON sleep_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sleep" ON sleep_logs;
CREATE POLICY "update_own_sleep" ON sleep_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sleep" ON sleep_logs;
CREATE POLICY "delete_own_sleep" ON sleep_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── meal_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type text NOT NULL,
  in_macros boolean DEFAULT true,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meals" ON meal_logs;
CREATE POLICY "select_own_meals" ON meal_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_meals" ON meal_logs;
CREATE POLICY "insert_own_meals" ON meal_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_meals" ON meal_logs;
CREATE POLICY "update_own_meals" ON meal_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_meals" ON meal_logs;
CREATE POLICY "delete_own_meals" ON meal_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat" ON chat_messages;
CREATE POLICY "select_own_chat" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_chat" ON chat_messages;
CREATE POLICY "insert_own_chat" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_chat" ON chat_messages;
CREATE POLICY "delete_own_chat" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── user_stats ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  level int DEFAULT 1,
  xp int DEFAULT 0,
  strength int DEFAULT 10,
  endurance int DEFAULT 10,
  sleep_skill int DEFAULT 10,
  nutrition int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_stats" ON user_stats;
CREATE POLICY "select_own_stats" ON user_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_stats" ON user_stats;
CREATE POLICY "insert_own_stats" ON user_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_stats" ON user_stats;
CREATE POLICY "update_own_stats" ON user_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_stats" ON user_stats;
CREATE POLICY "delete_own_stats" ON user_stats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_water_logs_user ON water_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user ON sleep_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user ON meal_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at DESC);