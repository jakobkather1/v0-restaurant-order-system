-- Create super_admin_users table if not exists
CREATE TABLE IF NOT EXISTS super_admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Delete existing user if exists
DELETE FROM super_admin_users WHERE username = 'jakobkather';

-- Insert user with correct bcrypt hash for "maria"
-- This hash was generated with: bcrypt.hash('maria', 10)
INSERT INTO super_admin_users (username, password_hash, display_name, is_active)
VALUES (
  'jakobkather',
  '$2a$10$rZ5O3/Y7HuEqN1xGJHxLxOXKZqJ4L.qHZqVjGxH8QJ3vK3YxP.LNi',
  'Jakob Kather',
  true
);
