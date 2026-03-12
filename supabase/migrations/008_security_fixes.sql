-- ============================================
-- SECURITY FIXES — CRITICAL/HIGH RLS POLICIES
-- Audit: 2026-03-12
-- ============================================

-- 3a. Fix smack_messages UPDATE — restrict to message author only
DROP POLICY IF EXISTS "smack_messages_update_own" ON smack_messages;
CREATE POLICY "smack_messages_update_own" ON smack_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3b. Fix user_xp INSERT/UPDATE — service role only (false blocks anon/authenticated)
DROP POLICY IF EXISTS "user_xp_service_upsert" ON user_xp;
CREATE POLICY "user_xp_service_upsert" ON user_xp
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "user_xp_service_update" ON user_xp;
CREATE POLICY "user_xp_service_update" ON user_xp
  FOR UPDATE USING (false);

-- 3c. Fix user_achievements INSERT — service role only
DROP POLICY IF EXISTS "user_achievements_service_insert" ON user_achievements;
CREATE POLICY "user_achievements_service_insert" ON user_achievements
  FOR INSERT WITH CHECK (false);

-- 3d. Enable RLS on simulation_config + admin-only policy
ALTER TABLE simulation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulation_config_admin_read" ON simulation_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.email LIKE '%@ufsl.net'
    )
  );

CREATE POLICY "simulation_config_admin_write" ON simulation_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.email LIKE '%@ufsl.net'
    )
  );
