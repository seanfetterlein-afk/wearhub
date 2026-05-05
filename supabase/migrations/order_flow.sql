-- ─── Extend order status enum ────────────────────────────────────────────────
-- Add: confirmed, completed, cancelled
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','confirmed','shipped','delivered','disputed','completed','cancelled','refunded'));

-- ─── Extend message_type to include system messages ───────────────────────────
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text','offer','system','order_update'));

-- ─── New timestamp columns on orders ─────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at      timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_deadline timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at        timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at      timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at      timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at      timestamptz;

-- ─── Link conversations to orders ────────────────────────────────────────────
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE SET NULL;

-- ─── Enable Supabase Realtime for orders ─────────────────────────────────────
-- Allows OrderStatusCard to receive live updates when status changes.
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
