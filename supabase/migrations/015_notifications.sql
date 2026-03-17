-- 015_notifications.sql
-- Create notifications table for in-app + delivery tracking
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  pool_id UUID REFERENCES pools(id) ON DELETE SET NULL,
  channel TEXT, -- 'push' | 'email' | 'sms' | null (in-app only)
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add channel column to existing tables (idempotent for environments where table already existed)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel TEXT;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Service role inserts (dispatch runs as service role)
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (true);

-- Index for SMS cap query and general user lookups
CREATE INDEX IF NOT EXISTS notifications_user_channel_created ON notifications(user_id, channel, created_at);
CREATE INDEX IF NOT EXISTS notifications_user_read ON notifications(user_id, read) WHERE read = false;
