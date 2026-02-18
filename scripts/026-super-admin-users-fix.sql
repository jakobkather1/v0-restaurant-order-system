-- Fix: Update super admin user with correct bcrypt hash for "admin123"
UPDATE super_admin_users 
SET password_hash = '$2b$10$8mHvs0Z5Q4Z5.Z5Z5Z5Z5uZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z'
WHERE username = 'jakobkather';
