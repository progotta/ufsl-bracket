-- Fix leaderboard view to use bracket_name (user-set display name) over the auto-generated name
-- bracket_name column was added in 016 but the view was never updated to use it
DROP VIEW IF EXISTS leaderboard;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  b.pool_id,
  b.user_id,
  p.display_name,
  p.avatar_url,
  p.avatar_icon,
  b.id AS bracket_id,
  COALESCE(b.bracket_name, b.name) AS bracket_name,
  b.score,
  b.max_possible_score,
  b.bracket_type,
  RANK() OVER (PARTITION BY b.pool_id ORDER BY b.score DESC) AS rank
FROM brackets b
LEFT JOIN profiles p ON p.id = b.user_id;
