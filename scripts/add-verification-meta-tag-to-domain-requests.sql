-- Add verification_meta_tag column to domain_requests table
-- This stores the Google Search Console meta tag for domain verification

ALTER TABLE domain_requests 
ADD COLUMN IF NOT EXISTS verification_meta_tag TEXT;

-- Add comment for documentation
COMMENT ON COLUMN domain_requests.verification_meta_tag IS 'Google Search Console verification meta tag (e.g., google-site-verification: abc123...)';
