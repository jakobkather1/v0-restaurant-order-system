-- Ensure platform_settings table exists with all columns needed for SEO
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert or update SEO settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
('seo_title', 'Order Terminal - Online Bestellsystem für Restaurants'),
('seo_description', 'Professionelles Online-Bestellsystem für Restaurants. Einfache Verwaltung, flexible Lieferzonen, moderne Bestell-Experience.'),
('seo_keywords', 'online bestellsystem, restaurant bestellen, lieferservice, bestell app'),
('og_title', 'Order Terminal - Das moderne Bestellsystem'),
('og_description', 'Digitalisieren Sie Ihr Restaurant mit unserem professionellen Bestellsystem'),
('og_image', '')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Verify data was inserted
SELECT setting_key, setting_value FROM platform_settings 
WHERE setting_key IN ('seo_title', 'seo_description', 'seo_keywords', 'og_title', 'og_description', 'og_image');
