-- Cron job script to delete orders older than 24 hours
-- This should be run daily via a scheduled task (Vercel Cron, GitHub Actions, or external service)

DELETE FROM orders 
WHERE created_at < NOW() - INTERVAL '24 hours';

-- Alternative: If using a service that needs a function
CREATE OR REPLACE FUNCTION cleanup_old_orders()
RETURNS void AS $$
BEGIN
  DELETE FROM orders WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- To manually run: SELECT cleanup_old_orders();
