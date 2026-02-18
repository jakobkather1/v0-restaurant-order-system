-- Domain Requests Table for Restaurant Custom Domains
CREATE TABLE IF NOT EXISTS domain_requests (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  requested_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  
  UNIQUE(requested_domain)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_domain_requests_restaurant_id ON domain_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_domain_requests_status ON domain_requests(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_domain_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domain_requests_updated_at
BEFORE UPDATE ON domain_requests
FOR EACH ROW
EXECUTE FUNCTION update_domain_requests_updated_at();
