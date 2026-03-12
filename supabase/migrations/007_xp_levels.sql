-- ============================================
-- XP & LEVELS SYSTEM
-- ============================================

-- Add xp_value column to achievements table (maps to XP instead of generic points)
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS xp_value INT DEFAULT 50;

-- Backfill xp_value from points for existing rows
UPDATE achievements SET xp_value = points WHERE xp_value = 50 AND points != 50;

-- User XP tracking table
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_xp_user ON user_xp(user_id);

-- RLS
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_xp_public_read" ON user_xp FOR SELECT USING (true);
CREATE POLICY "user_xp_service_upsert" ON user_xp FOR INSERT WITH CHECK (true);
CREATE POLICY "user_xp_service_update" ON user_xp FOR UPDATE USING (true);

-- Add bracket_id to user_achievements for tracking which bracket triggered it
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS bracket_id UUID REFERENCES brackets(id) ON DELETE SET NULL;

-- ============================================
-- UPDATE / INSERT ACHIEVEMENT SEEDS WITH XP
-- ============================================

-- Ensure the requested 9 achievements exist with correct XP values
INSERT INTO achievements (id, name, description, emoji, category, points, xp_value, rarity, secret) VALUES
  ('oracle',            'Oracle',           'Pick 3+ upsets correctly',              '🔮', 'picks',   150, 150, 'rare',      false),
  ('sharpshooter',      'Sharpshooter',     'Get 10+ correct picks in a round',      '🎯', 'picks',   200, 200, 'rare',      false),
  ('bracket_buster',    'Bracket Buster',   'Your pick knocks someone out',          '💀', 'pools',   100, 100, 'rare',      false),
  ('cinderella',        'Cinderella',       'Pick a 12+ seed to the Sweet 16',       '🐴', 'special', 175, 175, 'rare',      false),
  ('on_fire',           'On Fire',          '5-game correct streak',                 '🔥', 'streaks', 125, 125, 'common',    false),
  ('champion',          'Champion',         'Win a pool',                            '🏆', 'pools',   500, 500, 'epic',      false),
  ('clown',             'Clown',            'Worst pick of the day',                 '🤡', 'special',  25,  25, 'common',    false),
  ('first_bracket',     'First Bracket',    'Create your first bracket',             '🎉', 'picks',    50,  50, 'common',    false),
  ('social_butterfly',  'Social Butterfly', 'Invite a friend',                       '🦋', 'social',  200, 200, 'rare',      false)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  emoji       = EXCLUDED.emoji,
  category    = EXCLUDED.category,
  points      = EXCLUDED.points,
  xp_value    = EXCLUDED.xp_value,
  rarity      = EXCLUDED.rarity,
  secret      = EXCLUDED.secret;

-- Also update xp_value for all other existing achievements
UPDATE achievements SET xp_value = points WHERE xp_value IS NULL OR xp_value = 50;

-- ============================================
-- FUNCTION: Recalculate user XP from achievements
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_user_xp(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total INT;
  v_level INT;
BEGIN
  SELECT COALESCE(SUM(a.xp_value), 0) INTO v_total
  FROM user_achievements ua
  JOIN achievements a ON a.id = ua.achievement_id
  WHERE ua.user_id = p_user_id;

  -- Level thresholds: Rookie(0), Contender(200), Bracket Nerd(500), Oracle(1000), Legend(2000)
  v_level := CASE
    WHEN v_total >= 2000 THEN 5
    WHEN v_total >= 1000 THEN 4
    WHEN v_total >= 500  THEN 3
    WHEN v_total >= 200  THEN 2
    ELSE 1
  END;

  INSERT INTO user_xp (user_id, total_xp, level, updated_at)
  VALUES (p_user_id, v_total, v_level, now())
  ON CONFLICT (user_id)
  DO UPDATE SET total_xp = v_total, level = v_level, updated_at = now();
END;
$$ LANGUAGE plpgsql;
