-- Migration: Unified notification system with per-channel preferences
-- Replaces the old single-row notification_preferences table with
-- a per-type table supporting push/email/sms channels.

-- Drop old notification_preferences table (had game_alerts, upset_alerts, etc.)
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Notification types enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    -- Player events
    'picks_locking_soon',
    'round_complete',
    'standings_change',
    'bracket_busted',
    'bracket_alive',
    'pool_invite',
    'payment_due',
    -- Commissioner events
    'member_joined',
    'bracket_submitted',
    'unsubmitted_reminder',
    'payment_received',
    'payment_dispute',
    'all_submitted',
    'round_summary',
    'low_engagement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User notification preferences (one row per user per type)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_prefs_own ON notification_preferences FOR ALL USING (user_id = auth.uid());
