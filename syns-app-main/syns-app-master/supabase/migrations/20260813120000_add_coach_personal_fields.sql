/*
# Sync — Add Personal Goal and Exercise Preferences to Coach Data

1. Modified Tables
   - user_coach_data: added personal_goal, exercise_likes, exercise_dislikes columns

2. Purpose
   - Store user's specific personal goal (e.g., \"присесть 150 кг\")
   - Store liked and disliked exercises for personalized program generation
*/

-- ── user_coach_data: add personal goal and preferences ────────────────
ALTER TABLE user_coach_data ADD COLUMN IF NOT EXISTS personal_goal text;
ALTER TABLE user_coach_data ADD COLUMN IF NOT EXISTS exercise_likes text;
ALTER TABLE user_coach_data ADD COLUMN IF NOT EXISTS exercise_dislikes text;

-- Update comment
COMMENT ON COLUMN user_coach_data.personal_goal IS 'User specific personal goal (e.g., squat 150kg)';
COMMENT ON COLUMN user_coach_data.exercise_likes IS 'Comma-separated list of liked exercises';
COMMENT ON COLUMN user_coach_data.exercise_dislikes IS 'Comma-separated list of disliked exercises';
