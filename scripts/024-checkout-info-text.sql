-- Add checkout info text field to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS checkout_info_text TEXT;

-- Add comment for clarity
COMMENT ON COLUMN restaurants.checkout_info_text IS 'Custom info text displayed during checkout in the details step';
