-- Fix SEO column names to match server action
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS geo_lat DECIMAL(10, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS geo_lng DECIMAL(11, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Copy data from old columns if they exist
UPDATE restaurants SET geo_lat = latitude WHERE geo_lat IS NULL AND latitude IS NOT NULL;
UPDATE restaurants SET geo_lng = longitude WHERE geo_lng IS NULL AND longitude IS NOT NULL;
