-- Add permission fields to restaurants table if they don't exist
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_edit_menu BOOLEAN DEFAULT TRUE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_edit_settings BOOLEAN DEFAULT TRUE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT TRUE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_manage_orders BOOLEAN DEFAULT TRUE;
