-- Performance indexes: partial index for leaderboard, GIN for picks JSONB, snapshot lookup
-- Applied 2026-03-15

-- Partial index for leaderboard queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_brackets_pool_submitted
  ON brackets(pool_id, is_submitted)
  WHERE is_submitted = true;

-- GIN index for JSONB picks column (used in score recalculation RPC)
CREATE INDEX IF NOT EXISTS idx_brackets_picks_gin
  ON brackets USING GIN(picks);

-- Leaderboard snapshots lookup (rank movement indicators)
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_pool_round
  ON leaderboard_snapshots(pool_id, round);
