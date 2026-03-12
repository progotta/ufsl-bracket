-- Migration: Second Chance Brackets
-- Adds bracket_type support to brackets and pools tables

-- Add bracket_type to brackets table
ALTER TABLE brackets
  ADD COLUMN IF NOT EXISTS bracket_type TEXT DEFAULT 'full'
    CHECK (bracket_type IN ('full', 'fresh32', 'sweet16', 'elite8', 'final4'));

-- Add bracket_type and locks_at to pools table
ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS bracket_type TEXT DEFAULT 'full'
    CHECK (bracket_type IN ('full', 'fresh32', 'sweet16', 'elite8', 'final4'));

ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS locks_at TIMESTAMPTZ;

-- Backfill existing records
UPDATE brackets SET bracket_type = 'full' WHERE bracket_type IS NULL;
UPDATE pools SET bracket_type = 'full' WHERE bracket_type IS NULL;

-- Update the leaderboard view to include bracket_type
DROP VIEW IF EXISTS leaderboard;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  b.pool_id,
  b.user_id,
  p.display_name,
  p.avatar_url,
  b.id AS bracket_id,
  b.name AS bracket_name,
  b.score,
  b.max_possible_score,
  b.bracket_type,
  RANK() OVER (PARTITION BY b.pool_id ORDER BY b.score DESC) AS rank
FROM brackets b
LEFT JOIN profiles p ON p.id = b.user_id;
