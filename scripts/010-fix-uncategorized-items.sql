-- This script assigns uncategorized menu items to the first available category
-- Run this to fix existing items that have category_id = NULL

-- First, let's see which items have no category
SELECT mi.id, mi.name, mi.restaurant_id, mi.category_id 
FROM menu_items mi 
WHERE mi.category_id IS NULL;

-- Assign each uncategorized item to the first category of its restaurant
UPDATE menu_items mi
SET category_id = (
  SELECT c.id 
  FROM categories c 
  WHERE c.restaurant_id = mi.restaurant_id 
  ORDER BY c.sort_order, c.id 
  LIMIT 1
)
WHERE mi.category_id IS NULL
AND EXISTS (
  SELECT 1 FROM categories c WHERE c.restaurant_id = mi.restaurant_id
);

-- Verify the fix
SELECT mi.id, mi.name, mi.restaurant_id, mi.category_id, c.name as category_name
FROM menu_items mi
LEFT JOIN categories c ON mi.category_id = c.id
ORDER BY mi.restaurant_id, mi.category_id;
