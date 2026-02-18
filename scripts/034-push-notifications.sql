-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS push_subscriptions CASCADE;

-- Add push notification subscriptions table
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_restaurant ON push_subscriptions(restaurant_id) WHERE is_active = true;

-- Add push notification preferences to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;
