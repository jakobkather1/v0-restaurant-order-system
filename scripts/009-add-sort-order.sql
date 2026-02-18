-- Add sort_order columns for drag-drop sorting
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on current order
UPDATE categories SET sort_order = id WHERE sort_order = 0;
UPDATE menu_items SET sort_order = id WHERE sort_order = 0;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(restaurant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items(category_id, sort_order);
