-- ============================================
-- ACHIEVEMENTS SYSTEM
-- ============================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('picks', 'social', 'pools', 'streaks', 'special')),
  points INT DEFAULT 50,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);

CREATE POLICY "user_achievements_own_read" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_achievements_public_read" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "user_achievements_service_insert" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- ============================================
-- SEED ACHIEVEMENT DEFINITIONS
-- ============================================

INSERT INTO achievements (id, name, description, emoji, category, points, rarity, secret) VALUES
  -- PICKS
  ('oracle',         'Oracle',        'Pick 3+ upsets correctly',                        '🔮', 'picks',   75,  'rare',      false),
  ('sharpshooter',   'Sharpshooter',  'Get 10+ picks right in a single round',           '🎯', 'picks',   100, 'rare',      false),
  ('ice_cold',       'Ice Cold',      'First to submit a bracket in your pool',          '🧊', 'picks',   50,  'common',    false),
  ('chalk_master',   'Chalk Master',  'Pick all favorites to the Final Four',            '❄️', 'picks',   50,  'common',    false),
  ('chaos_agent',    'Chaos Agent',   'Pick 4+ double-digit seeds to the Sweet 16',      '🌪️', 'picks',   100, 'rare',      false),

  -- STREAKS
  ('on_fire',        'On Fire',       'Nail 5 correct picks in a row',                   '🔥', 'streaks', 75,  'common',    false),
  ('lightning',      'Lightning',     'Nail 10 correct picks in a row',                  '⚡', 'streaks', 150, 'rare',      false),
  ('flawless_round', 'Flawless Round','Go perfect in a round (all picks correct)',        '💀', 'streaks', 200, 'epic',      false),

  -- SOCIAL
  ('trash_talker',   'Trash Talker',  'Send 10 smack talk messages',                     '💬', 'social',  50,  'common',    false),
  ('roaster',        'Roaster',       'Get 5 fire reactions on your smack talk',         '🔥', 'social',  75,  'rare',      false),
  ('social_butterfly','Social Butterfly','Join 3+ pools',                                '👥', 'social',  50,  'common',    false),

  -- POOLS
  ('champion',       'Champion',      'Win a pool',                                      '🏆', 'pools',   200, 'epic',      false),
  ('dynasty',        'Dynasty',       'Win the same pool 2 years in a row',              '👑', 'pools',   500, 'legendary', false),
  ('bracket_buster', 'Bracket Buster','Your pick eliminates the current pool leader',    '💀', 'pools',   150, 'rare',      false),
  ('so_close',       'So Close',      'Finish 2nd place in a pool',                      '🥈', 'pools',   100, 'common',    false),

  -- SPECIAL
  ('cinderella',     'Cinderella',    'Pick a 12+ seed to the Sweet 16 (and they do it)','🐴', 'special', 150, 'rare',      false),
  ('madness',        'Madness',       'Pick the tournament champion correctly',           '🎪', 'special', 300, 'epic',      false),
  ('second_chance',  'Second Chance', 'Win a second chance bracket',                     '🌱', 'special', 200, 'epic',      false),
  ('clown',          'Clown',         'Worst pick accuracy in a round — own it!',        '🤡', 'special', 25,  'common',    false),
  ('unicorn',        'Unicorn',       'Perfect bracket through the Sweet 16',            '🦄', 'special', 750, 'legendary', true)

ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  emoji       = EXCLUDED.emoji,
  category    = EXCLUDED.category,
  points      = EXCLUDED.points,
  rarity      = EXCLUDED.rarity,
  secret      = EXCLUDED.secret;
