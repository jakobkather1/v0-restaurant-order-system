-- Add AI assistant enabled field to restaurants
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS ai_assistant_enabled BOOLEAN DEFAULT FALSE;

-- Set default to false for existing restaurants
UPDATE restaurants SET ai_assistant_enabled = FALSE WHERE ai_assistant_enabled IS NULL;
