-- Add minimum order value to discount codes
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS minimum_order_value DECIMAL(10, 2) DEFAULT 0;

-- Comment: minimum_order_value of 0 means no minimum required
