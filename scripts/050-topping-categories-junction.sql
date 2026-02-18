-- Create junction table for topping-category relationships
-- This stores which categories each topping is available in

CREATE TABLE IF NOT EXISTS topping_categories (
  id SERIAL PRIMARY KEY,
  topping_id INTEGER NOT NULL REFERENCES toppings(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(topping_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_topping_categories_topping_id ON topping_categories(topping_id);
CREATE INDEX IF NOT EXISTS idx_topping_categories_category_id ON topping_categories(category_id);

COMMENT ON TABLE topping_categories IS 'Junction table defining which categories each topping is available in';
