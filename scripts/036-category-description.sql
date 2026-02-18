-- Add description field to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment
COMMENT ON COLUMN categories.description IS 'Optional description shown below category name in terminal';
