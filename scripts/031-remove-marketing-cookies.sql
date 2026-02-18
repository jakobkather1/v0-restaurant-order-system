-- Remove Marketing cookie category since it's not needed
DELETE FROM cookie_categories WHERE name = 'marketing';

-- Update sort_order for remaining categories
UPDATE cookie_categories SET sort_order = 1 WHERE name = 'essential';
UPDATE cookie_categories SET sort_order = 2 WHERE name = 'functional';
UPDATE cookie_categories SET sort_order = 3 WHERE name = 'analytics';
