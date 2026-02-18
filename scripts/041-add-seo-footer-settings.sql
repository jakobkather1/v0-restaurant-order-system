-- Add SEO Footer settings to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_footer_enabled BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_footer_description TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_footer_delivery_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_footer_popular_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_footer_show_social_media BOOLEAN DEFAULT true;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_footer_show_payment_methods BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.seo_footer_enabled IS 'Enable/disable SEO footer display';
COMMENT ON COLUMN restaurants.seo_footer_description IS 'SEO-optimized description text (80-150 words) with keywords';
COMMENT ON COLUMN restaurants.seo_footer_delivery_areas IS 'Array of delivery area objects: [{"name": "Area Name", "link": "#anchor"}]';
COMMENT ON COLUMN restaurants.seo_footer_popular_categories IS 'Array of category objects: [{"name": "Category Name", "link": "#category-id"}]';
COMMENT ON COLUMN restaurants.seo_footer_show_social_media IS 'Show social media icons in footer';
COMMENT ON COLUMN restaurants.seo_footer_show_payment_methods IS 'Show payment method logos in footer';
