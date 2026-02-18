-- Add refund tracking to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT NULL CHECK (refund_status IN ('none', 'partial', 'full'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Create order refunds history table
CREATE TABLE IF NOT EXISTS order_refunds (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason TEXT,
  stripe_refund_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT,
  CONSTRAINT positive_refund_amount CHECK (refund_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id ON order_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled ON orders(is_cancelled) WHERE is_cancelled = TRUE;

COMMIT;
