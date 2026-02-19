-- ============================================
-- OC Centro Zlín – Shopping Center Quest App
-- Supabase PostgreSQL Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  reward_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checkpoints (stations) table
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  correct_answer_index INTEGER NOT NULL,
  order_number INTEGER NOT NULL DEFAULT 0,
  qr_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  completion_code TEXT UNIQUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Player checkpoints (progress tracking)
CREATE TABLE player_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
  answered_correctly BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, checkpoint_id)
);

-- Admin users metadata (linked to Supabase Auth)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('superadmin', 'staff')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_checkpoints_game_id ON checkpoints(game_id);
CREATE INDEX idx_checkpoints_qr_token ON checkpoints(qr_token);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_session_token ON players(session_token);
CREATE INDEX idx_players_completion_code ON players(completion_code);
CREATE INDEX idx_player_checkpoints_player_id ON player_checkpoints(player_id);
CREATE INDEX idx_player_checkpoints_checkpoint_id ON player_checkpoints(checkpoint_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER checkpoints_updated_at
  BEFORE UPDATE ON checkpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Games: anyone can read active games, admins can do everything
CREATE POLICY "Anyone can read active games"
  ON games FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage games"
  ON games FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Checkpoints: read via service role or anon for active games, admins manage
CREATE POLICY "Anyone can read checkpoints of active games"
  ON checkpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = checkpoints.game_id AND games.is_active = true
    )
  );

CREATE POLICY "Admins can manage checkpoints"
  ON checkpoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Players: service role manages (API routes use service key)
CREATE POLICY "Service role manages players"
  ON players FOR ALL
  USING (true)
  WITH CHECK (true);

-- Player checkpoints: service role manages
CREATE POLICY "Service role manages player_checkpoints"
  ON player_checkpoints FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin users: only authenticated admins can read their own record
CREATE POLICY "Admins can read own record"
  ON admin_users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Superadmins can manage admin_users"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
