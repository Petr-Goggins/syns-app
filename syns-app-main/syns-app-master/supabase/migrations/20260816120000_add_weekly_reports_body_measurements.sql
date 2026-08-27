/*
# Weekly Reports Table

1. Purpose
   Store weekly user reports with weight, feeling, and notes.
   Used for tracking progress and sending weekly notifications.

2. New Tables
   - `weekly_reports`: weekly user reports (weight, feeling, notes, week_start)

3. Security
   - RLS enabled.
   - Users can only access their own reports.
*/

-- ── weekly_reports ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  weight decimal(5,2) NOT NULL,
  feeling text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weekly_reports" ON weekly_reports;
CREATE POLICY "select_own_weekly_reports" ON weekly_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_weekly_reports" ON weekly_reports;
CREATE POLICY "insert_own_weekly_reports" ON weekly_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_weekly_reports" ON weekly_reports;
CREATE POLICY "update_own_weekly_reports" ON weekly_reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_weekly_reports" ON weekly_reports;
CREATE POLICY "delete_own_weekly_reports" ON weekly_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for faster queries by user and week
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week ON weekly_reports(user_id, week_start);

-- ── body_measurements ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight decimal(5,2) NOT NULL,
  chest decimal(5,2),
  waist decimal(5,2),
  hips decimal(5,2),
  left_arm decimal(5,2),
  right_arm decimal(5,2),
  left_leg decimal(5,2),
  right_leg decimal(5,2),
  body_fat decimal(5,2),
  muscle_mass decimal(5,2),
  water_percentage decimal(5,2),
  bone_mass decimal(5,2),
  visceral_fat decimal(5,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_body_measurements" ON body_measurements;
CREATE POLICY "select_own_body_measurements" ON body_measurements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_body_measurements" ON body_measurements;
CREATE POLICY "insert_own_body_measurements" ON body_measurements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_body_measurements" ON body_measurements;
CREATE POLICY "update_own_body_measurements" ON body_measurements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_body_measurements" ON body_measurements;
CREATE POLICY "delete_own_body_measurements" ON body_measurements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id, created_at);

-- ── notification_settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_report_day int DEFAULT 0, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  weekly_report_time time DEFAULT '20:00:00',
  weekly_report_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notification_settings" ON notification_settings;
CREATE POLICY "select_own_notification_settings" ON notification_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notification_settings" ON notification_settings;
CREATE POLICY "insert_own_notification_settings" ON notification_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notification_settings" ON notification_settings;
CREATE POLICY "update_own_notification_settings" ON notification_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notification_settings" ON notification_settings;
CREATE POLICY "delete_own_notification_settings" ON notification_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
