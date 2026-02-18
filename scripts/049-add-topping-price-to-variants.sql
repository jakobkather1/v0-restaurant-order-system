-- Add topping_price column to category_variants table
-- This allows defining a universal topping price per variant

ALTER TABLE category_variants 
ADD COLUMN IF NOT EXISTS topping_price DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN category_variants.topping_price IS 'Universal topping price for this variant, applies to all toppings in the category';

-- Drop the category_topping_prices table as it's no longer needed
-- The topping_price is now stored directly in category_variants
DROP TABLE IF EXISTS category_topping_prices;
