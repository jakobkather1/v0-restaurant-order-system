-- Create QR codes table for storing generated QR codes
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_restaurant_id ON qr_codes(restaurant_id);

-- Add constraint to limit 3 QR codes per restaurant
CREATE OR REPLACE FUNCTION check_qr_code_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM qr_codes WHERE restaurant_id = NEW.restaurant_id) >= 3 THEN
    RAISE EXCEPTION 'Restaurant kann maximal 3 QR-Codes haben';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qr_code_limit_trigger ON qr_codes;
CREATE TRIGGER qr_code_limit_trigger
  BEFORE INSERT ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION check_qr_code_limit();
