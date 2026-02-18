-- Set default revenue visibility to TRUE for all existing restaurants
UPDATE restaurants 
SET allow_super_admin_revenue_view = TRUE 
WHERE allow_super_admin_revenue_view IS NULL OR allow_super_admin_revenue_view = FALSE;

-- Ensure the column has correct default for new restaurants
ALTER TABLE restaurants 
ALTER COLUMN allow_super_admin_revenue_view SET DEFAULT TRUE;
