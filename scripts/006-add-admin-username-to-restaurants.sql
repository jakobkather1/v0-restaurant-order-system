-- Add admin_username field to restaurants table for centralized login
-- This allows restaurant admins to log in with username + password instead of just slug + password

-- Add admin_username column (nullable, unique)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS admin_username VARCHAR(255);

-- Add unique constraint on admin_username (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_admin_username_key 
ON restaurants (admin_username) 
WHERE admin_username IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_admin_username 
ON restaurants (admin_username);

COMMENT ON COLUMN restaurants.admin_username IS 'Unique username for restaurant admin login (optional, alternative to slug-based login)';
