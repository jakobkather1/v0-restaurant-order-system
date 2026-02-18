-- Add stripe_is_live_mode column to track whether the connected account was created in live or test mode
-- This prevents live keys from trying to access test accounts and vice versa

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS stripe_is_live_mode BOOLEAN DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.stripe_is_live_mode IS 'TRUE if Stripe account was created with live keys, FALSE if test keys, NULL if unknown';

-- Clear any existing test accounts if we are now in live mode
-- This is a safety measure - accounts created with test keys cannot be accessed with live keys
UPDATE restaurants 
SET 
  stripe_account_id = NULL,
  stripe_onboarding_complete = false,
  stripe_charges_enabled = false,
  stripe_payouts_enabled = false,
  stripe_connected_at = NULL,
  stripe_is_live_mode = NULL
WHERE stripe_account_id IS NOT NULL 
  AND (stripe_is_live_mode = false OR stripe_is_live_mode IS NULL);
