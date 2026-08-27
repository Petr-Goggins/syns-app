/*
# Sync — Workout & Nutrition System Schema

1. Purpose
   Adds exercise library, workout templates, user plans, exercise logs,
   food product database, nutrition logs, and weight tracking.

2. New Tables
   - exercises: reference library of 50+ exercises
   - workout_templates: 5 templates with JSON day-structure and 4-week progression
   - user_plans: personalized plans generated for each user
   - exercise_logs: per-exercise completion records (weight, reps, sets)
   - food_products: 100+ product database with macros per serving
   - nutrition_logs: daily food intake entries by meal type
   - weight_logs: weight history for progress charts

3. Modified Tables
   - profiles: added training_level, weak_muscles, days_per_week columns
   - user_stats: renamed conceptually sleep_skill -> recovery_skill (new column)

4. Security
   - RLS on all new tables. Reference tables (exercises, workout_templates, food_products)
     are read-only for authenticated users. User-data tables are owner-scoped.
*/

-- ── profiles additions ────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_level text DEFAULT 'beginner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weak_muscles text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS days_per_week int DEFAULT 3;

-- ── user_stats additions ──────────────────────────────────
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS recovery int DEFAULT 10;

-- ── exercises (reference, read-only) ──────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  muscle_group text NOT NULL,
  equipment text NOT NULL,
  difficulty text NOT NULL,
  video_url text,
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_exercises" ON exercises;
CREATE POLICY "read_exercises" ON exercises FOR SELECT TO authenticated USING (true);

-- ── workout_templates (reference, read-only) ──────────────
CREATE TABLE IF NOT EXISTS workout_templates (
  id serial PRIMARY KEY,
  name text NOT NULL,
  goal text NOT NULL,
  difficulty_level text NOT NULL,
  days_per_week int NOT NULL,
  structure jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_templates" ON workout_templates;
CREATE POLICY "read_templates" ON workout_templates FOR SELECT TO authenticated USING (true);

-- ── food_products (reference, read-only for users) ────────
CREATE TABLE IF NOT EXISTS food_products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  proteins numeric NOT NULL DEFAULT 0,
  fats numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  calories numeric NOT NULL DEFAULT 0,
  serving_size int NOT NULL DEFAULT 100,
  category text NOT NULL,
  barcode text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE food_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_products" ON food_products;
CREATE POLICY "read_products" ON food_products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_products" ON food_products;
CREATE POLICY "insert_products" ON food_products FOR INSERT TO authenticated WITH CHECK (true);

-- ── user_plans (owner-scoped) ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text NOT NULL,
  weeks int DEFAULT 4,
  days_per_week int DEFAULT 3,
  structure jsonb NOT NULL,
  weak_muscles text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_plans" ON user_plans;
CREATE POLICY "select_own_plans" ON user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_plans" ON user_plans;
CREATE POLICY "insert_own_plans" ON user_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_plans" ON user_plans;
CREATE POLICY "update_own_plans" ON user_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_plans" ON user_plans;
CREATE POLICY "delete_own_plans" ON user_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── exercise_logs (owner-scoped) ──────────────────────────
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES user_plans(id) ON DELETE CASCADE,
  exercise_id int NOT NULL REFERENCES exercises(id),
  week int NOT NULL DEFAULT 1,
  day int NOT NULL DEFAULT 1,
  sets int NOT NULL DEFAULT 3,
  reps int NOT NULL DEFAULT 10,
  weight numeric DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_exlogs" ON exercise_logs;
CREATE POLICY "select_own_exlogs" ON exercise_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_exlogs" ON exercise_logs;
CREATE POLICY "insert_own_exlogs" ON exercise_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_exlogs" ON exercise_logs;
CREATE POLICY "update_own_exlogs" ON exercise_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_exlogs" ON exercise_logs;
CREATE POLICY "delete_own_exlogs" ON exercise_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── nutrition_logs (owner-scoped) ─────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id int REFERENCES food_products(id),
  custom_name text,
  meal_type text NOT NULL,
  grams int NOT NULL,
  proteins numeric DEFAULT 0,
  fats numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  calories numeric DEFAULT 0,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_nutrition" ON nutrition_logs;
CREATE POLICY "select_own_nutrition" ON nutrition_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_nutrition" ON nutrition_logs;
CREATE POLICY "insert_own_nutrition" ON nutrition_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_nutrition" ON nutrition_logs;
CREATE POLICY "update_own_nutrition" ON nutrition_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_nutrition" ON nutrition_logs;
CREATE POLICY "delete_own_nutrition" ON nutrition_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── weight_logs (owner-scoped) ────────────────────────────
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  weight numeric NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_weight" ON weight_logs;
CREATE POLICY "select_own_weight" ON weight_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weight" ON weight_logs;
CREATE POLICY "insert_own_weight" ON weight_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weight" ON weight_logs;
CREATE POLICY "update_own_weight" ON weight_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weight" ON weight_logs;
CREATE POLICY "delete_own_weight" ON weight_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exlogs_user ON exercise_logs(user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON nutrition_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_products_name ON food_products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON food_products(barcode);