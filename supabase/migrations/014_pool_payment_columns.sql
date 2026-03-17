-- Add payment and bracket-rule columns to pools table
-- These were defined in TypeScript types but never created in the database

ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_structure JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS max_brackets_per_member INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fee_per_bracket BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS one_payout_per_person BOOLEAN DEFAULT false;

-- Add payment tracking columns to pool_members
ALTER TABLE pool_members
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'waived', 'pending_verification')),
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_note TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT DEFAULT NULL;

-- Create payments table for detailed payment records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bracket_id UUID REFERENCES brackets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'unpaid'
    CHECK (status IN ('unpaid', 'pending_verification', 'paid', 'waived', 'refunded')),
  payment_method TEXT,
  payment_platform TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paypal_order_id TEXT,
  payment_date TIMESTAMPTZ,
  payment_note TEXT
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments visible to pool commissioner and the paying user
CREATE POLICY "payments_read" ON payments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM pools WHERE pools.id = payments.pool_id AND pools.commissioner_id = auth.uid()
    )
  );

-- Users can insert their own payments
CREATE POLICY "payments_own_insert" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Commissioner can update any payment in their pool
CREATE POLICY "payments_commissioner_update" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pools WHERE pools.id = payments.pool_id AND pools.commissioner_id = auth.uid()
    )
  );

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
