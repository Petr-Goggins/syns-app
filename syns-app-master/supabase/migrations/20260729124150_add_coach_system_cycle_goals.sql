/*
# Sync — Coach System, Goals, Cycle Tracking, Exercise Attributes

1. New Tables
   - user_coach_data: 7-block coach questionnaire answers
   - user_goals: flexible weight/performance goals with deadline

2. Modified Tables
   - exercises: added safety_level, effectiveness_score, enjoyment_score, joint_friendly, variation_type
   - profiles: added cycle_last_period, cycle_length, cycle_phase_updated columns
   - food_products: added is_global boolean

3. Security
   - RLS on all new tables, owner-scoped CRUD.
   - food_products.is_global is informational; existing read+insert policies remain.
*/

-- ── exercises: extended attributes ────────────────────────
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS safety_level int DEFAULT 5;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS effectiveness_score int DEFAULT 5;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS enjoyment_score int DEFAULT 5;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS joint_friendly boolean DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS variation_type text DEFAULT 'basic';

-- ── food_products: is_global flag ─────────────────────────
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT true;

-- ── profiles: cycle tracking columns ──────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycle_last_period date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycle_length int DEFAULT 28;

-- ── user_coach_data (owner-scoped) ────────────────────────
CREATE TABLE IF NOT EXISTS user_coach_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_duration text,
  training_level text,
  injuries jsonb DEFAULT '[]',
  health_restrictions text,
  days_per_week int DEFAULT 3,
  preferred_time text,
  workout_duration text,
  free_days jsonb DEFAULT '[]',
  exercise_preference text,
  priority text,
  include_cardio text,
  sleep_hours text,
  stress_level text,
  diet_preference text,
  focus_type text,
  focus_muscle text,
  focus_event text,
  goal_type text,
  goal_amount numeric,
  goal_unit text,
  goal_weeks int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_coach_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_coach" ON user_coach_data;
CREATE POLICY "select_own_coach" ON user_coach_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_coach" ON user_coach_data;
CREATE POLICY "insert_own_coach" ON user_coach_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_coach" ON user_coach_data;
CREATE POLICY "update_own_coach" ON user_coach_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_coach" ON user_coach_data;
CREATE POLICY "delete_own_coach" ON user_coach_data FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── user_goals (owner-scoped) ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  goal_amount numeric,
  goal_unit text,
  target_weeks int,
  start_value numeric,
  current_value numeric,
  target_value numeric,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_goals" ON user_goals;
CREATE POLICY "select_own_goals" ON user_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_goals" ON user_goals;
CREATE POLICY "insert_own_goals" ON user_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_goals" ON user_goals;
CREATE POLICY "update_own_goals" ON user_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_goals" ON user_goals;
CREATE POLICY "delete_own_goals" ON user_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_user ON user_coach_data(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON user_goals(user_id, status);