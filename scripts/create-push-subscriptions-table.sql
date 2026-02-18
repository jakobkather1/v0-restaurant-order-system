-- Create push_subscriptions table for Web Push Notifications
-- This table stores browser push subscriptions for each restaurant's admin

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure each restaurant can only have one subscription per endpoint
  UNIQUE(restaurant_id, endpoint)
);

-- Index for faster lookups by restaurant
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_restaurant_id 
ON push_subscriptions(restaurant_id) 
WHERE is_active = true;

-- Index for faster lookups by endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

COMMENT ON TABLE push_subscriptions IS 'Stores Web Push notification subscriptions for restaurant admins';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Browser push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for encryption (base64url encoded)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret for encryption (base64url encoded)';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'Browser user agent for debugging';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether this subscription is still active (false if browser unsubscribed)';
