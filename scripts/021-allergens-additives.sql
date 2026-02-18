-- Allergens and Additives Management System
-- Multi-tenant safe: all queries filtered by restaurant_id

-- Table for allergens/additives definitions per restaurant
CREATE TABLE IF NOT EXISTS allergens (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, code)
);

-- Junction table for dish-allergen relationships (Many-to-Many)
CREATE TABLE IF NOT EXISTS dish_allergens (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  allergen_id INTEGER NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  UNIQUE(menu_item_id, allergen_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allergens_restaurant ON allergens(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dish_allergens_menu_item ON dish_allergens(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_dish_allergens_allergen ON dish_allergens(allergen_id);
