-- Remove unique(pool_id, user_id) constraint from brackets table
-- This was blocking multi-bracket support where pools have max_brackets_per_member > 1
-- The app-level max_brackets_per_member check on pools handles the limit instead

ALTER TABLE brackets DROP CONSTRAINT IF EXISTS brackets_pool_id_user_id_key;
