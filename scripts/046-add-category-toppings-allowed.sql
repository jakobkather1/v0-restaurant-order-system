-- Add allow_toppings column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS allow_toppings BOOLEAN DEFAULT false;

-- Set allow_toppings to true for categories that have items with toppings_allowed = true
UPDATE categories c
SET allow_toppings = true
WHERE EXISTS (
  SELECT 1 FROM menu_items m 
  WHERE m.category_id = c.id 
  AND m.toppings_allowed = true
);

-- Remove toppings_allowed from menu_items (optional - can keep for backwards compatibility)
-- ALTER TABLE menu_items DROP COLUMN IF EXISTS toppings_allowed;
