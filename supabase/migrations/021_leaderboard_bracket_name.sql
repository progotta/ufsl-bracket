-- Fix leaderboard view:
-- 1. Use COALESCE(bracket_name, name) so user-set display names show correctly
--    (bracket_name column added in 016 but view was never updated)
-- 2. Filter to is_submitted = true so draft/incomplete brackets don't appear
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
LEFT JOIN profiles p ON p.id = b.user_id
WHERE b.is_submitted = true;
