-- Migration: Add category-based topping prices
-- This allows each category to define prices for toppings based on their variants

CREATE TABLE IF NOT EXISTS category_topping_prices (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  topping_id INTEGER NOT NULL REFERENCES toppings(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  UNIQUE(category_id, topping_id, variant_name)
);

CREATE INDEX IF NOT EXISTS idx_category_topping_prices_category_id ON category_topping_prices(category_id);
CREATE INDEX IF NOT EXISTS idx_category_topping_prices_topping_id ON category_topping_prices(topping_id);
