-- Add platform-wide SEO settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
('seo_title', 'Order Terminal - Online Bestellsystem für Restaurants'),
('seo_description', 'Professionelles Online-Bestellsystem für Restaurants. Einfache Verwaltung, flexible Lieferzonen, moderne Bestell-Experience.'),
('seo_keywords', 'online bestellsystem, restaurant bestellen, lieferservice, bestell app'),
('og_title', 'Order Terminal - Das moderne Bestellsystem'),
('og_description', 'Digitalisieren Sie Ihr Restaurant mit unserem professionellen Bestellsystem'),
('og_image', '')
ON CONFLICT (setting_key) DO NOTHING;
