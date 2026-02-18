-- Super Admin Users Table
CREATE TABLE IF NOT EXISTS super_admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Insert first user "jakobkather" with password "admin123" (bcrypt hash)
-- Password: admin123
INSERT INTO super_admin_users (username, password_hash, display_name, is_active)
VALUES ('jakobkather', '$2a$10$rQZ8K.D5HxQp.9hLjH4kxeQj1BQJPbL4LD3fqJ.1T8Z1jK8VZ1qLm', 'Jakob Kather', true)
ON CONFLICT (username) DO NOTHING;
