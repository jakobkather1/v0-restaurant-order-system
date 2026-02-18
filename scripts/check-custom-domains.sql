-- Check custom domains in database
SELECT 
  id, 
  name, 
  slug,
  custom_domain
FROM restaurants 
WHERE custom_domain IS NOT NULL 
  AND custom_domain != '';
