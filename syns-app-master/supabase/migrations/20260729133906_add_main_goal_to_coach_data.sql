/*
# Add main_goal to coach data

1. Modified Tables
   - user_coach_data: added `main_goal` text column (gain_muscle, lose_weight, maintain_tone, recovery, flexibility, general_health)

2. Security
   - Existing RLS policies remain. No new tables.
*/

ALTER TABLE user_coach_data ADD COLUMN IF NOT EXISTS main_goal text;