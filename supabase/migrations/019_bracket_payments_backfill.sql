-- Backfill: create one payment row per submitted bracket (where none exists)
INSERT INTO payments (pool_id, bracket_id, user_id, amount, status, payment_method)
SELECT
  b.pool_id,
  b.id AS bracket_id,
  b.user_id,
  COALESCE(p.entry_fee, 0) AS amount,
  COALESCE(
    (SELECT pm.payment_status FROM pool_members pm
     WHERE pm.pool_id = b.pool_id AND pm.user_id = b.user_id LIMIT 1),
    'unpaid'
  ) AS status,
  'manual' AS payment_method
FROM brackets b
JOIN pools p ON b.pool_id = p.id
WHERE b.is_submitted = true
  AND p.entry_fee > 0
  AND NOT EXISTS (
    SELECT 1 FROM payments py WHERE py.bracket_id = b.id AND py.pool_id = b.pool_id
  );

-- Unique constraint for upsert on bracket_id + pool_id
CREATE UNIQUE INDEX IF NOT EXISTS payments_bracket_pool_unique
  ON payments (bracket_id, pool_id) WHERE bracket_id IS NOT NULL;

-- Allow members to read their own payments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='payments_own_select') THEN
    CREATE POLICY "payments_own_select" ON payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow members to update their own payments (claim as pending_verification)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='payments_own_update') THEN
    CREATE POLICY "payments_own_update" ON payments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
