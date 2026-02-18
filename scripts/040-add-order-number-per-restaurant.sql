-- Add order_number column to orders table
-- Each restaurant starts at 1 and increments independently

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Backfill order numbers for existing orders
-- Group by restaurant and assign sequential numbers based on creation date
WITH numbered_orders AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY created_at, id) as new_order_number
  FROM orders
)
UPDATE orders
SET order_number = numbered_orders.new_order_number
FROM numbered_orders
WHERE orders.id = numbered_orders.id;

-- Make order_number required going forward
ALTER TABLE orders 
ALTER COLUMN order_number SET NOT NULL;

-- Create unique constraint to ensure no duplicate order numbers per restaurant
ALTER TABLE orders 
ADD CONSTRAINT unique_order_number_per_restaurant UNIQUE (restaurant_id, order_number);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_order_number ON orders(restaurant_id, order_number);
