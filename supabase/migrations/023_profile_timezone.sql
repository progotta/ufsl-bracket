ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Denver';
