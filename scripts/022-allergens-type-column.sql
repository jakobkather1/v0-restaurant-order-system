-- Add type column to allergens table to distinguish between allergens and additives
-- Type: 'allergen' for mandatory allergen labeling, 'additive' for additives

ALTER TABLE allergens ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'allergen';

-- Update existing entries based on common patterns (letters = allergens, numbers = additives)
UPDATE allergens SET type = 'additive' WHERE code ~ '^[0-9]+$';
UPDATE allergens SET type = 'allergen' WHERE code ~ '^[A-Za-z]+$';

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_allergens_type ON allergens(restaurant_id, type);
