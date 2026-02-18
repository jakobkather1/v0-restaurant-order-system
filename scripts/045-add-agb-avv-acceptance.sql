-- Add AGBs and AVV (Auftragsverarbeitungsvertrag) to platform settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
  ('platform_agbs', ''),
  ('platform_avv', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Add acceptance tracking to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS agb_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avv_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agb_accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS avv_accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS agb_accepted_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS avv_accepted_by VARCHAR(255);

-- Create index for acceptance status checks
CREATE INDEX IF NOT EXISTS idx_restaurants_agb_avv ON restaurants(agb_accepted, avv_accepted);
