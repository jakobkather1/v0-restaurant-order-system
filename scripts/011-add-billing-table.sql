-- Restaurant Billing & Payment Status
CREATE TABLE IF NOT EXISTS restaurant_billings (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  fee_amount DECIMAL(12, 2) DEFAULT 0,
  fee_type VARCHAR(20) DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed')),
  fee_value DECIMAL(10, 2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'open' CHECK (payment_status IN ('open', 'paid')),
  payment_date TIMESTAMP,
  payment_confirmed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, billing_month)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_restaurant_billings_restaurant_id ON restaurant_billings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_billings_month ON restaurant_billings(billing_month);
CREATE INDEX IF NOT EXISTS idx_restaurant_billings_status ON restaurant_billings(payment_status);
