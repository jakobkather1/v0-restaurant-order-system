-- Add background_color and text_color columns to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#1f2937';

-- Update existing restaurants with default values
UPDATE restaurants SET background_color = '#ffffff' WHERE background_color IS NULL;
UPDATE restaurants SET text_color = '#1f2937' WHERE text_color IS NULL;
