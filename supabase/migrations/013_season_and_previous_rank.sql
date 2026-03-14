-- Wave 5: Add season column to teams/games, previous_rank to brackets
ALTER TABLE teams ADD COLUMN IF NOT EXISTS season INTEGER DEFAULT 2025;
ALTER TABLE games ADD COLUMN IF NOT EXISTS season INTEGER DEFAULT 2025;
CREATE INDEX IF NOT EXISTS idx_teams_season ON teams(season);
CREATE INDEX IF NOT EXISTS idx_games_season ON games(season);

ALTER TABLE brackets ADD COLUMN IF NOT EXISTS previous_rank INTEGER;
