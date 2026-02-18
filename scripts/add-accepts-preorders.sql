-- Add accepts_preorders column to restaurants table
-- This allows restaurants to enable/disable pre-orders when closed

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS accepts_preorders BOOLEAN DEFAULT true;

-- By default, all restaurants accept pre-orders
UPDATE restaurants 
SET accepts_preorders = true 
WHERE accepts_preorders IS NULL;
