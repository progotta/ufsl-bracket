-- Performance indexes for core query patterns identified in audit.

CREATE INDEX IF NOT EXISTS idx_pool_members_user ON pool_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_brackets_pool ON brackets(pool_id);
CREATE INDEX IF NOT EXISTS idx_brackets_user ON brackets(user_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_round ON games(round);
