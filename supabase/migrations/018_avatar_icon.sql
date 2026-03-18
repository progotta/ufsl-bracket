-- Add avatar_icon column to profiles for mascot avatar selection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_icon TEXT;

-- Update leaderboard view to include avatar_icon
DROP VIEW IF EXISTS leaderboard;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  b.pool_id,
  b.user_id,
  p.display_name,
  p.avatar_url,
  p.avatar_icon,
  b.id AS bracket_id,
  b.name AS bracket_name,
  b.score,
  b.max_possible_score,
  b.bracket_type,
  RANK() OVER (PARTITION BY b.pool_id ORDER BY b.score DESC) AS rank
FROM brackets b
LEFT JOIN profiles p ON p.id = b.user_id;

-- Update global_leaderboard view to include avatar_icon
DROP VIEW IF EXISTS global_leaderboard;
CREATE VIEW global_leaderboard AS
SELECT
  b.user_id,
  p.display_name,
  p.avatar_url,
  p.avatar_icon,
  sum(b.score) as total_score,
  sum(b.correct_picks) as total_correct_picks,
  count(b.id) as bracket_count,
  max(b.score) as best_score,
  rank() over (order by sum(b.score) desc, sum(b.correct_picks) desc) as rank
FROM brackets b
JOIN profiles p ON p.id = b.user_id
WHERE b.is_submitted = true
GROUP BY b.user_id, p.display_name, p.avatar_url, p.avatar_icon;
