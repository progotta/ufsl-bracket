-- Push Subscriptions: stores Web Push API subscriptions per user/device
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh: string, auth: string }
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

-- Notification Preferences: per-user toggles
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  game_alerts BOOLEAN DEFAULT true,
  upset_alerts BOOLEAN DEFAULT true,
  pool_updates BOOLEAN DEFAULT true,
  smack_mentions BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: users can only manage their own subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: users can only manage their own preferences
CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all subscriptions for sending notifications
CREATE POLICY "Service role reads all subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can read all preferences
CREATE POLICY "Service role reads all preferences"
  ON notification_preferences FOR SELECT
  USING (auth.role() = 'service_role');
