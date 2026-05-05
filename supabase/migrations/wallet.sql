-- ─── Wallets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid    NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pending_balance   integer NOT NULL DEFAULT 0 CHECK (pending_balance   >= 0),
  available_balance integer NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  currency          text    NOT NULL DEFAULT 'dkk',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── Wallet Transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id                 uuid    REFERENCES orders(id),
  stripe_payment_intent_id text,
  stripe_transfer_id       text,
  stripe_payout_id         text,
  amount                   integer NOT NULL CHECK (amount > 0),
  currency                 text    NOT NULL DEFAULT 'dkk',
  type   text NOT NULL CHECK (type   IN ('sale_pending','release_to_available','payout','refund','adjustment')),
  status text NOT NULL CHECK (status IN ('pending','available','paid_out','failed','refunded')),
  description              text,
  created_at               timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate webhook processing for same payment intent
CREATE UNIQUE INDEX IF NOT EXISTS wallet_txn_payment_intent_idx
  ON wallet_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL
    AND type = 'sale_pending';

-- ─── Stripe Connect fields on profiles ───────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarded  boolean NOT NULL DEFAULT false;

-- ─── Auto-update wallet timestamp ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wallet_updated_at ON wallets;
CREATE TRIGGER wallet_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();

-- ─── Atomic balance functions ─────────────────────────────────────────────────
-- Called exclusively from server-side code using the service role key.

CREATE OR REPLACE FUNCTION add_to_pending_balance(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO wallets (user_id, pending_balance, available_balance)
  VALUES (p_user_id, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE
    SET pending_balance = wallets.pending_balance + p_amount,
        updated_at      = now();
END;
$$;

CREATE OR REPLACE FUNCTION release_wallet_funds(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wallets
  SET pending_balance   = GREATEST(0, pending_balance - p_amount),
      available_balance = available_balance + p_amount,
      updated_at        = now()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION add_to_available_balance(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wallets
  SET available_balance = available_balance + p_amount,
      updated_at        = now()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_available_balance(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE wallets
  SET available_balance = available_balance - p_amount,
      updated_at        = now()
  WHERE user_id         = p_user_id
    AND available_balance >= p_amount;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;
END;
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_own_select"              ON wallets;
DROP POLICY IF EXISTS "wallet_transactions_own_select" ON wallet_transactions;

-- Authenticated users can only read their own data.
-- All writes go through the service role (webhook + server actions), which bypasses RLS.
CREATE POLICY "wallet_own_select" ON wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "wallet_transactions_own_select" ON wallet_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
