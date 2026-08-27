/*
# Add target_weight and start_weight to profiles

1. Modified Tables
   - `profiles`: added `target_weight` (int, nullable) — the weight the user wants to reach
   - `profiles`: added `start_weight` (int, nullable) — the weight when the goal was first set, used for progress tracking

2. Security
   - No RLS changes — existing owner-scoped policies on `profiles` already cover the new columns.

3. Notes
   - Both columns are nullable so existing profile rows are unaffected.
   - `start_weight` is set automatically by the frontend the first time a user sets a goal + target.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_weight int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS start_weight int;