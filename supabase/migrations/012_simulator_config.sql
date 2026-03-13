-- Simulation config (singleton)
CREATE TABLE IF NOT EXISTS simulation_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_simulation_mode BOOLEAN NOT NULL DEFAULT false,
  current_simulated_date TIMESTAMPTZ,
  time_multiplier NUMERIC DEFAULT 1,
  sim_label TEXT DEFAULT 'Pre-Tournament',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO simulation_config (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE simulation_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sim_config_read_all" ON simulation_config FOR SELECT USING (true);
CREATE POLICY "sim_config_service_write" ON simulation_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO admin_users (user_id) VALUES ('73016ba6-ac6b-451e-9562-f6d0be8914ae') ON CONFLICT DO NOTHING;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_select" ON admin_users FOR SELECT USING (true);
CREATE POLICY "admin_users_service_write" ON admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sim overrides on games
ALTER TABLE games ADD COLUMN IF NOT EXISTS sim_status TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS sim_home_score INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS sim_away_score INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS sim_winner_id UUID;
