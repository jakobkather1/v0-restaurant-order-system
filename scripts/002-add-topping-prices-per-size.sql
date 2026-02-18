-- Migration: Add topping prices per size
-- This allows toppings to have different prices based on the item variant (S, M, L)

-- Create a new table for topping price variants
CREATE TABLE IF NOT EXISTS topping_price_variants (
  id SERIAL PRIMARY KEY,
  topping_id INTEGER NOT NULL REFERENCES toppings(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  UNIQUE(topping_id, variant_name)
);

-- Add estimated_time column to orders for preparation time tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT NULL;

-- Add order_type column to orders (delivery or pickup)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup'));

-- Make customer_address nullable for pickup orders
ALTER TABLE orders ALTER COLUMN customer_address DROP NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_topping_price_variants_topping_id ON topping_price_variants(topping_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_completed ON orders(is_completed);
