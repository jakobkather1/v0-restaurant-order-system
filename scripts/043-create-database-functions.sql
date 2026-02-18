-- PostgreSQL Functions (RPC) for improved security and performance
-- These functions run on the database server, reducing network overhead
-- and preventing SQL injection

-- ==========================================
-- 1. Get Restaurant by Slug
-- ==========================================
CREATE OR REPLACE FUNCTION get_restaurant_by_slug(p_slug TEXT)
RETURNS TABLE (
  id INT,
  name TEXT,
  slug TEXT,
  domain TEXT,
  slogan TEXT,
  banner_text TEXT,
  phone TEXT,
  email TEXT,
  street TEXT,
  city TEXT,
  zip TEXT,
  country TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  primary_color TEXT,
  text_color TEXT,
  background_color TEXT,
  opening_hours JSONB,
  accepts_preorders BOOLEAN,
  manually_closed BOOLEAN,
  is_active BOOLEAN,
  owner_name TEXT,
  impressum TEXT,
  checkout_info_text TEXT,
  admin_password_hash TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN,
  stripe_charges_enabled BOOLEAN,
  stripe_payouts_enabled BOOLEAN,
  is_stripe_live_mode BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  accepts_cash BOOLEAN,
  accepts_card BOOLEAN,
  show_revenue_in_dashboard BOOLEAN,
  notification_enabled BOOLEAN,
  ai_assistant_enabled BOOLEAN,
  meta_title TEXT,
  meta_description TEXT,
  seo_footer_content TEXT,
  seo_keywords TEXT,
  custom_domain TEXT,
  primary_button_color TEXT,
  header_background_color TEXT,
  header_text_color TEXT,
  footer_background_color TEXT,
  footer_text_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.domain,
    r.slogan,
    r.banner_text,
    r.phone,
    r.email,
    r.street,
    r.city,
    r.zip,
    r.country,
    r.logo_url,
    r.hero_image_url,
    r.primary_color,
    r.text_color,
    r.background_color,
    r.opening_hours,
    r.accepts_preorders,
    r.manually_closed,
    r.is_active,
    r.owner_name,
    r.impressum,
    r.checkout_info_text,
    r.admin_password_hash,
    r.stripe_account_id,
    r.stripe_onboarding_complete,
    r.stripe_charges_enabled,
    r.stripe_payouts_enabled,
    r.is_stripe_live_mode,
    r.created_at,
    r.updated_at,
    r.accepts_cash,
    r.accepts_card,
    r.show_revenue_in_dashboard,
    r.notification_enabled,
    r.ai_assistant_enabled,
    r.meta_title,
    r.meta_description,
    r.seo_footer_content,
    r.seo_keywords,
    r.custom_domain,
    r.primary_button_color,
    r.header_background_color,
    r.header_text_color,
    r.footer_background_color,
    r.footer_text_color
  FROM restaurants r 
  WHERE LOWER(TRIM(r.slug)) = LOWER(TRIM(p_slug))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 2. Get Restaurant by ID
-- ==========================================
CREATE OR REPLACE FUNCTION get_restaurant_by_id(p_id INT)
RETURNS TABLE (
  id INT,
  name TEXT,
  slug TEXT,
  domain TEXT,
  slogan TEXT,
  banner_text TEXT,
  phone TEXT,
  email TEXT,
  street TEXT,
  city TEXT,
  zip TEXT,
  country TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  primary_color TEXT,
  text_color TEXT,
  background_color TEXT,
  opening_hours JSONB,
  accepts_preorders BOOLEAN,
  manually_closed BOOLEAN,
  is_active BOOLEAN,
  owner_name TEXT,
  impressum TEXT,
  checkout_info_text TEXT,
  admin_password_hash TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN,
  stripe_charges_enabled BOOLEAN,
  stripe_payouts_enabled BOOLEAN,
  is_stripe_live_mode BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  accepts_cash BOOLEAN,
  accepts_card BOOLEAN,
  show_revenue_in_dashboard BOOLEAN,
  notification_enabled BOOLEAN,
  ai_assistant_enabled BOOLEAN,
  meta_title TEXT,
  meta_description TEXT,
  seo_footer_content TEXT,
  seo_keywords TEXT,
  custom_domain TEXT,
  primary_button_color TEXT,
  header_background_color TEXT,
  header_text_color TEXT,
  footer_background_color TEXT,
  footer_text_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.domain,
    r.slogan,
    r.banner_text,
    r.phone,
    r.email,
    r.street,
    r.city,
    r.zip,
    r.country,
    r.logo_url,
    r.hero_image_url,
    r.primary_color,
    r.text_color,
    r.background_color,
    r.opening_hours,
    r.accepts_preorders,
    r.manually_closed,
    r.is_active,
    r.owner_name,
    r.impressum,
    r.checkout_info_text,
    r.admin_password_hash,
    r.stripe_account_id,
    r.stripe_onboarding_complete,
    r.stripe_charges_enabled,
    r.stripe_payouts_enabled,
    r.is_stripe_live_mode,
    r.created_at,
    r.updated_at,
    r.accepts_cash,
    r.accepts_card,
    r.show_revenue_in_dashboard,
    r.notification_enabled,
    r.ai_assistant_enabled,
    r.meta_title,
    r.meta_description,
    r.seo_footer_content,
    r.seo_keywords,
    r.custom_domain,
    r.primary_button_color,
    r.header_background_color,
    r.header_text_color,
    r.footer_background_color,
    r.footer_text_color
  FROM restaurants r 
  WHERE r.id = p_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 3. Get Restaurant by Domain (Custom Domain)
-- ==========================================
CREATE OR REPLACE FUNCTION get_restaurant_by_domain(p_domain TEXT)
RETURNS TABLE (
  id INT,
  name TEXT,
  slug TEXT,
  domain TEXT,
  slogan TEXT,
  banner_text TEXT,
  phone TEXT,
  email TEXT,
  street TEXT,
  city TEXT,
  zip TEXT,
  country TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  primary_color TEXT,
  text_color TEXT,
  background_color TEXT,
  opening_hours JSONB,
  accepts_preorders BOOLEAN,
  manually_closed BOOLEAN,
  is_active BOOLEAN,
  owner_name TEXT,
  impressum TEXT,
  checkout_info_text TEXT,
  admin_password_hash TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN,
  stripe_charges_enabled BOOLEAN,
  stripe_payouts_enabled BOOLEAN,
  is_stripe_live_mode BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  accepts_cash BOOLEAN,
  accepts_card BOOLEAN,
  show_revenue_in_dashboard BOOLEAN,
  notification_enabled BOOLEAN,
  ai_assistant_enabled BOOLEAN,
  meta_title TEXT,
  meta_description TEXT,
  seo_footer_content TEXT,
  seo_keywords TEXT,
  custom_domain TEXT,
  primary_button_color TEXT,
  header_background_color TEXT,
  header_text_color TEXT,
  footer_background_color TEXT,
  footer_text_color TEXT
) AS $$
DECLARE
  normalized_domain TEXT;
BEGIN
  -- Normalize: remove www., lowercase, trim
  normalized_domain := LOWER(TRIM(REPLACE(p_domain, 'www.', '')));
  
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.domain,
    r.slogan,
    r.banner_text,
    r.phone,
    r.email,
    r.street,
    r.city,
    r.zip,
    r.country,
    r.logo_url,
    r.hero_image_url,
    r.primary_color,
    r.text_color,
    r.background_color,
    r.opening_hours,
    r.accepts_preorders,
    r.manually_closed,
    r.is_active,
    r.owner_name,
    r.impressum,
    r.checkout_info_text,
    r.admin_password_hash,
    r.stripe_account_id,
    r.stripe_onboarding_complete,
    r.stripe_charges_enabled,
    r.stripe_payouts_enabled,
    r.is_stripe_live_mode,
    r.created_at,
    r.updated_at,
    r.accepts_cash,
    r.accepts_card,
    r.show_revenue_in_dashboard,
    r.notification_enabled,
    r.ai_assistant_enabled,
    r.meta_title,
    r.meta_description,
    r.seo_footer_content,
    r.seo_keywords,
    r.custom_domain,
    r.primary_button_color,
    r.header_background_color,
    r.header_text_color,
    r.footer_background_color,
    r.footer_text_color
  FROM restaurants r 
  WHERE LOWER(TRIM(REPLACE(r.domain, 'www.', ''))) = normalized_domain
     OR LOWER(TRIM(REPLACE(r.custom_domain, 'www.', ''))) = normalized_domain
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 4. Get Menu Items by Restaurant ID
-- ==========================================
CREATE OR REPLACE FUNCTION get_menu_items_by_restaurant(p_restaurant_id INT)
RETURNS TABLE (
  id INT,
  restaurant_id INT,
  category_id INT,
  name TEXT,
  description TEXT,
  price DECIMAL,
  image_url TEXT,
  is_available BOOLEAN,
  created_at TIMESTAMPTZ,
  slug TEXT,
  sort_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id,
    mi.restaurant_id,
    mi.category_id,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.is_available,
    mi.created_at,
    mi.slug,
    mi.sort_order
  FROM menu_items mi
  WHERE mi.restaurant_id = p_restaurant_id 
    AND mi.is_available = true
  ORDER BY mi.sort_order, mi.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 5. Get Active Orders for Restaurant
-- ==========================================
CREATE OR REPLACE FUNCTION get_active_orders(p_restaurant_id INT)
RETURNS TABLE (
  id INT,
  restaurant_id INT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_street TEXT,
  customer_city TEXT,
  customer_zip TEXT,
  delivery_type TEXT,
  delivery_zone_id INT,
  delivery_zone_name TEXT,
  delivery_time TEXT,
  total DECIMAL,
  discount_amount DECIMAL,
  discount_code TEXT,
  payment_method TEXT,
  is_completed BOOLEAN,
  is_cancelled BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  order_number INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.restaurant_id,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.customer_street,
    o.customer_city,
    o.customer_zip,
    o.delivery_type,
    o.delivery_zone_id,
    dz.name as delivery_zone_name,
    o.delivery_time,
    o.total,
    o.discount_amount,
    o.discount_code,
    o.payment_method,
    o.is_completed,
    o.is_cancelled,
    o.notes,
    o.created_at,
    o.order_number
  FROM orders o
  LEFT JOIN delivery_zones dz ON o.delivery_zone_id = dz.id
  WHERE o.restaurant_id = p_restaurant_id 
    AND o.is_completed = false 
    AND (o.is_cancelled = false OR o.is_cancelled IS NULL)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- Index Optimization
-- ==========================================
-- These indexes improve query performance for the functions above

-- Restaurant lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_slug_lower ON restaurants (LOWER(TRIM(slug)));
CREATE INDEX IF NOT EXISTS idx_restaurants_domain_lower ON restaurants (LOWER(TRIM(REPLACE(domain, 'www.', ''))));

-- Menu and orders
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available ON menu_items (restaurant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_active ON orders (restaurant_id, is_completed, is_cancelled);

-- Comments
COMMENT ON FUNCTION get_restaurant_by_slug IS 'Fetches restaurant data by slug with normalized case-insensitive matching';
COMMENT ON FUNCTION get_restaurant_by_id IS 'Fetches restaurant data by ID';
COMMENT ON FUNCTION get_restaurant_by_domain IS 'Fetches restaurant data by domain (custom or default) with normalized matching';
COMMENT ON FUNCTION get_menu_items_by_restaurant IS 'Fetches all available menu items for a restaurant';
COMMENT ON FUNCTION get_active_orders IS 'Fetches all active (non-completed, non-cancelled) orders for a restaurant';
