-- Create function to notify on new orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSON;
BEGIN
  -- Only trigger on INSERT (new orders)
  IF TG_OP = 'INSERT' THEN
    -- Build notification payload with essential order data
    notification_payload = json_build_object(
      'event', 'new_order',
      'order_id', NEW.id,
      'restaurant_id', NEW.restaurant_id,
      'order_number', NEW.order_number,
      'customer_name', NEW.customer_name,
      'order_type', NEW.order_type,
      'total', NEW.total,
      'status', NEW.status,
      'created_at', NEW.created_at
    );
    
    -- Send notification on channel specific to restaurant
    PERFORM pg_notify(
      'order_events_' || NEW.restaurant_id::text,
      notification_payload::text
    );
    
    -- Also send on global channel for all restaurants
    PERFORM pg_notify(
      'order_events',
      notification_payload::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS order_notification_trigger ON orders;

-- Create trigger that fires AFTER INSERT
CREATE TRIGGER order_notification_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Add comment for documentation
COMMENT ON FUNCTION notify_new_order() IS 'Sends real-time notifications via pg_notify when new orders are inserted';
COMMENT ON TRIGGER order_notification_trigger ON orders IS 'Triggers real-time notifications for new orders';
