-- Platform-wide settings table for legal texts and other global configurations
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default platform legal settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
  ('platform_name', 'Restaurant Bestellsystem'),
  ('platform_legal_name', ''),
  ('platform_legal_address', ''),
  ('platform_legal_contact', ''),
  ('platform_tax_id', ''),
  ('platform_imprint', ''),
  ('platform_privacy_policy', ''),
  ('platform_terms_of_service', '')
ON CONFLICT (setting_key) DO NOTHING;
