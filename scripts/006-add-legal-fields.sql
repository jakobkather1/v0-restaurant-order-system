-- Add legal fields to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS legal_address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS legal_contact VARCHAR(255);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS privacy_policy_content TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS legal_disclaimer TEXT;

-- Create global_settings table for platform-level legal texts
CREATE TABLE IF NOT EXISTS global_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default global settings
INSERT INTO global_settings (key, value) VALUES 
  ('platform_impressum', ''),
  ('platform_privacy_policy', '')
ON CONFLICT (key) DO NOTHING;
