-- Add Stripe Connect fields to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_id ON restaurants(stripe_account_id);
