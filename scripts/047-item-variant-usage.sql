-- Create table to track which category variants each menu item actually uses
-- This allows items in the same category to use different subsets of the category's variants

CREATE TABLE IF NOT EXISTS item_variant_usage (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  category_variant_id INTEGER NOT NULL REFERENCES category_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(menu_item_id, category_variant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_variant_usage_menu_item ON item_variant_usage(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_variant_usage_category_variant ON item_variant_usage(category_variant_id);

-- Comment
COMMENT ON TABLE item_variant_usage IS 'Tracks which category variants each menu item uses. If no entries exist for an item, it uses all category variants.';
