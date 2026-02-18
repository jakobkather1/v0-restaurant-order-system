-- Add permission and security fields to restaurants table

-- Revenue visibility toggle and Super Admin password per restaurant
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS allow_super_admin_revenue_view BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS super_admin_restaurant_password VARCHAR(255);

-- Encrypted admin password (separate from normal admin password)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS encrypted_admin_password TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS admin_password_set BOOLEAN DEFAULT false;

-- Add order_type to orders table if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup'));

-- Add sort_order fields for drag-drop sorting
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
