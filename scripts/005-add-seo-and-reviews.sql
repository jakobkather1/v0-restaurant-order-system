-- SEO fields for restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_title VARCHAR(70);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_description VARCHAR(160);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_business_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Deutschland';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(100);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_range VARCHAR(10) DEFAULT '€€';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS accepts_reservations BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{Bargeld,Karte}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(100),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_verified_purchase BOOLEAN DEFAULT false,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Menu item SEO fields (for structured data)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_info TEXT[];
