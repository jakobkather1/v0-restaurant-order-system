-- Add manually_closed column to restaurants table
-- This allows restaurant owners to temporarily close their restaurant
-- even during normal opening hours (e.g., for early closing, emergencies, etc.)

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS manually_closed BOOLEAN DEFAULT false;

COMMENT ON COLUMN restaurants.manually_closed IS 'When true, restaurant does not accept any orders (including preorders), regardless of opening hours';
