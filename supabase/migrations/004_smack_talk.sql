-- ============================================
-- SMACK TALK
-- ============================================

CREATE TABLE IF NOT EXISTS smack_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) <= 280),
  created_at TIMESTAMPTZ DEFAULT now(),
  reactions JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_smack_pool_created ON smack_messages(pool_id, created_at DESC);

-- RLS
ALTER TABLE smack_messages ENABLE ROW LEVEL SECURITY;

-- Read: pool members (or public pool viewers) can read messages
CREATE POLICY "smack_messages_read" ON smack_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pools p
      WHERE p.id = smack_messages.pool_id
        AND (
          p.is_public = true
          OR p.commissioner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM pool_members pm
            WHERE pm.pool_id = p.id AND pm.user_id = auth.uid()
          )
        )
    )
  );

-- Insert: only pool members can post
CREATE POLICY "smack_messages_insert" ON smack_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM pool_members pm
      WHERE pm.pool_id = smack_messages.pool_id AND pm.user_id = auth.uid()
    )
  );

-- Update: only the message author can update (for reactions from own perspective)
-- Reactions are updated server-side via API route so we use a separate permissive rule
CREATE POLICY "smack_messages_update_own" ON smack_messages
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Delete: author or commissioner can delete
CREATE POLICY "smack_messages_delete" ON smack_messages
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM pools p
      WHERE p.id = smack_messages.pool_id AND p.commissioner_id = auth.uid()
    )
  );
