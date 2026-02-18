-- Add minimum_order_value column to delivery_zones table
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS minimum_order_value DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Set default value for existing zones
UPDATE delivery_zones SET minimum_order_value = 0 WHERE minimum_order_value IS NULL;
