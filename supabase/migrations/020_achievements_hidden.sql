ALTER TABLE achievements ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;
UPDATE achievements SET hidden = true WHERE id IN ('chalk_master', 'chaos_agent', 'cinderella', 'oracle', 'clown', 'dynasty', 'unicorn');
