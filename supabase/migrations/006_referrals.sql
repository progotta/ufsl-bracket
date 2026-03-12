-- ============================================
-- REFERRALS & INVITE SYSTEM
-- ============================================

-- Add invite/join settings to pools
ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS max_members integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS join_requires_approval boolean DEFAULT false NOT NULL;

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  converted_at TIMESTAMPTZ  -- when they actually joined
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_idx ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS referrals_pool_idx ON referrals(pool_id);
CREATE INDEX IF NOT EXISTS referrals_invite_code_idx ON referrals(invite_code);

-- Pending pool join requests (for approval-required pools)
CREATE TABLE IF NOT EXISTS pool_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,
  UNIQUE (pool_id, user_id)
);

CREATE INDEX IF NOT EXISTS pool_join_requests_pool_idx ON pool_join_requests(pool_id);
CREATE INDEX IF NOT EXISTS pool_join_requests_user_idx ON pool_join_requests(user_id);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_join_requests ENABLE ROW LEVEL SECURITY;

-- Referrals: anyone can insert, users can see their own
CREATE POLICY "insert_referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "view_own_referrals" ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Pool join requests: users can insert own, commissioners can view/update
CREATE POLICY "insert_join_requests" ON pool_join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "view_own_requests" ON pool_join_requests FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "commissioner_view_requests" ON pool_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pools
      WHERE pools.id = pool_join_requests.pool_id
      AND pools.commissioner_id = auth.uid()
    )
  );
CREATE POLICY "commissioner_update_requests" ON pool_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pools
      WHERE pools.id = pool_join_requests.pool_id
      AND pools.commissioner_id = auth.uid()
    )
  );
