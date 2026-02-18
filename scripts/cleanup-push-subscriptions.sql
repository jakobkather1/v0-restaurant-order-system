-- Cleanup Push Subscriptions
-- This removes all existing push subscriptions that were created with old VAPID keys
-- Admins will need to re-subscribe using the new VAPID keys

-- Delete all existing push subscriptions
DELETE FROM push_subscriptions;

-- Reset the sequence (optional, for clean IDs)
ALTER SEQUENCE push_subscriptions_id_seq RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as remaining_subscriptions FROM push_subscriptions;
