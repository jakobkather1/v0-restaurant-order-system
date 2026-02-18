-- Set custom domain for Doctor Döner restaurant
-- This enables the custom domain routing to work correctly

UPDATE restaurants 
SET custom_domain = 'xn--doctordner-kcb.de'
WHERE slug = 'doctordoener';

-- Verify the update
SELECT 
  slug,
  name,
  custom_domain,
  LENGTH(custom_domain) as domain_length
FROM restaurants 
WHERE slug = 'doctordoener';
