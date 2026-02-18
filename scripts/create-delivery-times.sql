-- Create delivery_times table for managing delivery and pickup times per zone
CREATE TABLE IF NOT EXISTS delivery_times (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  delivery_zone_id INTEGER REFERENCES delivery_zones(id) ON DELETE CASCADE,
  -- NULL delivery_zone_id means pickup time
  preparation_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, delivery_zone_id)
);

-- Add scheduled_time column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_times_restaurant ON delivery_times(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_time ON orders(scheduled_time);

-- Insert default pickup time (NULL zone_id = pickup)
INSERT INTO delivery_times (restaurant_id, delivery_zone_id, preparation_minutes)
SELECT id, NULL, 30 FROM restaurants
ON CONFLICT (restaurant_id, delivery_zone_id) DO NOTHING;

COMMENT ON TABLE delivery_times IS 'Stores preparation/delivery times for each zone and pickup';
COMMENT ON COLUMN delivery_times.delivery_zone_id IS 'NULL means this is the pickup time';
COMMENT ON COLUMN orders.scheduled_time IS 'Customer-selected time for pickup/delivery (NULL = ASAP)';
