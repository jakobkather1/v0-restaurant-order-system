-- Check what custom domain values are stored for Doctor Döner
SELECT 
  slug,
  name,
  custom_domain,
  LENGTH(custom_domain) as domain_length,
  custom_domain = 'xn--doctordner-kcb.de' as exact_match,
  custom_domain = 'www.xn--doctordner-kcb.de' as www_match
FROM restaurants 
WHERE slug = 'doctordoener' OR name LIKE '%Doctor%' OR name LIKE '%Döner%';

-- Also check delivery zones for this restaurant
SELECT 
  dz.name,
  LOWER(REPLACE(dz.name, ' ', '-')) as generated_slug,
  dz.price,
  dz.minimum_order_value
FROM delivery_zones dz
JOIN restaurants r ON dz.restaurant_id = r.id
WHERE r.slug = 'doctordoener'
ORDER BY dz.name;
