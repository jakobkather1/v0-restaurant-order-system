-- SQL to manually insert bella-marina restaurant if it doesn't exist
-- Run this in the Neon console if the restaurant is missing

INSERT INTO restaurants (
  name,
  slug,
  address,
  phone,
  email,
  slogan,
  is_active,
  primary_color,
  opening_hours,
  fee_type,
  fee_value,
  city,
  postal_code,
  country,
  cuisine_type,
  price_range
) VALUES (
  'Bella Marina',
  'bella-marina',
  'Musterstraße 123, 12345 Musterstadt',
  '+49 123 456789',
  'info@bella-marina.de',
  'Authentische italienische Küche',
  true,
  '#e63946',
  '{"mon": {"open": "11:00", "close": "22:00"}, "tue": {"open": "11:00", "close": "22:00"}, "wed": {"open": "11:00", "close": "22:00"}, "thu": {"open": "11:00", "close": "22:00"}, "fri": {"open": "11:00", "close": "23:00"}, "sat": {"open": "12:00", "close": "23:00"}, "sun": {"open": "12:00", "close": "21:00"}}'::jsonb,
  'percentage',
  5,
  'Musterstadt',
  '12345',
  'DE',
  'Italienisch',
  '$$'
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the insert
SELECT id, name, slug, is_active FROM restaurants WHERE slug = 'bella-marina';
