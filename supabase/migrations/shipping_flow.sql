-- ─── Extend order status enum ────────────────────────────────────────────────
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending_payment','pending','paid',
    'awaiting_seller_shipping','label_created','confirmed',
    'shipped','in_transit','delivered','completed',
    'cancelled','refunded','disputed'
  ));

-- ─── New price + address columns on orders ────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_price       numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_price   numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee     numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price      numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name       text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_address    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_city       text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_zip        text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method  text;

-- ─── Shipments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier          text        NOT NULL,
  shipping_method  text        NOT NULL,
  label_url        text,
  tracking_number  text,
  tracking_url     text,
  package_code     text,
  status           text        NOT NULL DEFAULT 'label_created',
  created_at       timestamptz NOT NULL DEFAULT now(),
  shipped_at       timestamptz,
  delivered_at     timestamptz
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer or seller can view shipment"
  ON shipments FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- ─── Order events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  message     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer or seller can view order events"
  ON order_events FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- ─── Enable realtime for shipments ───────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
