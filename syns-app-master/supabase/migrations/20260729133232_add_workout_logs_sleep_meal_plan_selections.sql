/*
# Workout logs + sleep logs upgrade + meal plan selections

1. New Tables
   - `workout_logs`: per-exercise training diary entries (date, exercise name, sets, reps, weight, intensity 1-10, note)
   - `meal_plan_selections`: tracks which meal plan a user selected (category, plan index, date)

2. Modified Tables
   - `sleep_logs`: added `quality` (int 1-5) and `log_date` (date) columns for daily sleep diary

3. Security
   - All new tables get RLS enabled with owner-scoped CRUD (TO authenticated, auth.uid() = user_id)
   - Existing sleep_logs policies remain; new columns are covered by existing policies
*/

-- ── workout_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  exercise_name text NOT NULL,
  sets integer DEFAULT 0,
  reps integer DEFAULT 0,
  weight numeric DEFAULT 0,
  intensity integer DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_workout_logs" ON workout_logs;
CREATE POLICY "select_own_workout_logs" ON workout_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workout_logs" ON workout_logs;
CREATE POLICY "insert_own_workout_logs" ON workout_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workout_logs" ON workout_logs;
CREATE POLICY "update_own_workout_logs" ON workout_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workout_logs" ON workout_logs;
CREATE POLICY "delete_own_workout_logs" ON workout_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, log_date DESC);

-- ── sleep_logs: add quality + log_date ────────────────────
ALTER TABLE sleep_logs ADD COLUMN IF NOT EXISTS quality integer DEFAULT 3 CHECK (quality >= 1 AND quality <= 5);
ALTER TABLE sleep_logs ADD COLUMN IF NOT EXISTS log_date date DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, log_date DESC);

-- ── meal_plan_selections ──────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plan_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  plan_index integer NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plan_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meal_plan_selections" ON meal_plan_selections;
CREATE POLICY "select_own_meal_plan_selections" ON meal_plan_selections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_meal_plan_selections" ON meal_plan_selections;
CREATE POLICY "insert_own_meal_plan_selections" ON meal_plan_selections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_meal_plan_selections" ON meal_plan_selections;
CREATE POLICY "delete_own_meal_plan_selections" ON meal_plan_selections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meal_plan_sel_user_date ON meal_plan_selections(user_id, log_date DESC);