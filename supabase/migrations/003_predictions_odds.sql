-- Migration 003: Predictions & Odds tables
-- Stores game odds and team win probabilities for the bracket

-- ─────────────────────────────────────────────────────────────
-- game_odds: Betting lines for bracket matchups
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_odds (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- References the games table (optional — may not exist until bracket is set)
  game_id         UUID REFERENCES games(id) ON DELETE SET NULL,

  -- Matchup identifier (e.g. "1v16", "5v12") — always set
  matchup_key     TEXT NOT NULL,

  -- Team identifiers
  favorite_team_id  TEXT,                   -- internal team id
  underdog_team_id  TEXT,

  -- Spread
  spread            NUMERIC(5,1),           -- e.g. -5.5 (negative = fav)
  spread_label      TEXT,                   -- e.g. "Duke -5.5"

  -- Moneyline (American format)
  moneyline_fav     INTEGER,               -- e.g. -220
  moneyline_dog     INTEGER,               -- e.g. +180

  -- Over/Under
  over_under        NUMERIC(5,1),

  -- Source metadata
  source            TEXT DEFAULT 'mock',
  external_game_id  TEXT,                   -- The Odds API game id

  -- Tournament context
  tournament_year   INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  round             INTEGER,

  UNIQUE(game_id),
  UNIQUE(favorite_team_id, underdog_team_id, tournament_year, round)
);

-- ─────────────────────────────────────────────────────────────
-- team_predictions: Win probabilities for each team
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_predictions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  team_id           TEXT NOT NULL,
  tournament_year   INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,

  -- Win probability (0–100)
  win_probability   NUMERIC(5,2),

  -- Efficiency rating (KenPom style)
  efficiency_rating NUMERIC(6,2),

  -- Source
  source            TEXT DEFAULT 'mock',  -- 'FiveThirtyEight', 'KenPom', etc.
  model_version     TEXT,

  -- Projected scoring
  projected_score   NUMERIC(5,1),

  UNIQUE(team_id, tournament_year, source)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_game_odds_game_id ON game_odds(game_id);
CREATE INDEX IF NOT EXISTS idx_game_odds_matchup ON game_odds(matchup_key, tournament_year);
CREATE INDEX IF NOT EXISTS idx_team_predictions_team ON team_predictions(team_id, tournament_year);

-- ─────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────
ALTER TABLE game_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_predictions ENABLE ROW LEVEL SECURITY;

-- Anyone can read odds/predictions
CREATE POLICY "Public read game_odds"
  ON game_odds FOR SELECT USING (true);

CREATE POLICY "Public read team_predictions"
  ON team_predictions FOR SELECT USING (true);

-- Only service role can write (odds fetched server-side)
CREATE POLICY "Service role insert game_odds"
  ON game_odds FOR INSERT WITH CHECK (false); -- block direct inserts; use service role

CREATE POLICY "Service role insert team_predictions"
  ON team_predictions FOR INSERT WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────
-- Updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_odds_updated_at
  BEFORE UPDATE ON game_odds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_predictions_updated_at
  BEFORE UPDATE ON team_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
