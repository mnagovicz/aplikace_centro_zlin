-- ============================================
-- Migration: Features #1-#5
-- ============================================

-- Feature #2: Game skinning - add image and color columns to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS background_color TEXT;

-- Feature #2: Checkpoint images
ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Feature #4: Require correct answer toggle
ALTER TABLE games ADD COLUMN IF NOT EXISTS require_correct_answer BOOLEAN NOT NULL DEFAULT true;

-- Feature #5: Track correct answers count on player (denormalized for leaderboard)
-- (We already have answered_correctly in player_checkpoints, so we can compute this)
-- No extra column needed - we'll query player_checkpoints.

-- Supabase Storage bucket for game images (run manually or via Supabase dashboard):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('game-images', 'game-images', true);
