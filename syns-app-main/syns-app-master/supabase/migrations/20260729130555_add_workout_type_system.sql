/*
# Sync — Workout type system + exercise replacement

1. Modified Tables
   - exercises: added workout_type column (strength/yoga/cardio/stretching/functional)
   - user_plans: added workout_type column

2. Security
   - Existing RLS policies remain. No new tables.
*/

-- ── exercises: workout_type ───────────────────────────────
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS workout_type text DEFAULT 'strength';

-- ── user_plans: workout_type ──────────────────────────────
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS workout_type text DEFAULT 'strength';

-- Backfill existing exercises as strength
UPDATE exercises SET workout_type = 'strength' WHERE workout_type IS NULL;
UPDATE user_plans SET workout_type = 'strength' WHERE workout_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_workout_type ON exercises(workout_type);