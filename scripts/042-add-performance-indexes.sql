-- Performance Indexes for faster queries
-- This significantly improves query performance for frequently accessed data

-- Restaurants table indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_custom_domain ON restaurants(custom_domain);

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_category ON menu_items(restaurant_id, category_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);

-- Item variants indexes
CREATE INDEX IF NOT EXISTS idx_item_variants_menu_item_id ON item_variants(menu_item_id);

-- Toppings indexes
CREATE INDEX IF NOT EXISTS idx_toppings_restaurant_id ON toppings(restaurant_id);

-- Delivery zones indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant_id ON delivery_zones(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_postal_codes ON delivery_zones USING GIN(postal_codes);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_approved ON reviews(restaurant_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);

-- Allergens indexes
CREATE INDEX IF NOT EXISTS idx_allergens_restaurant_id ON allergens(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dish_allergens_menu_item_id ON dish_allergens(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_dish_allergens_allergen_id ON dish_allergens(allergen_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_approved_created ON reviews(restaurant_id, is_approved, created_at DESC);
