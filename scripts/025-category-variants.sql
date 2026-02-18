-- Add category-based variants system
-- Each category can have its own set of variants (sizes)
-- All menu items in that category will inherit these variants

CREATE TABLE IF NOT EXISTS category_variants (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_category_variants_category_id ON category_variants(category_id);

-- Migrate existing item_variants to category_variants
-- This will take the first variant set from each category and apply it to the category level
INSERT INTO category_variants (category_id, name, price_modifier, sort_order)
SELECT DISTINCT ON (c.id, iv.name) 
  c.id as category_id,
  iv.name,
  iv.price_modifier,
  iv.sort_order
FROM categories c
JOIN menu_items mi ON mi.category_id = c.id
JOIN item_variants iv ON iv.menu_item_id = mi.id
ORDER BY c.id, iv.name, iv.sort_order;
