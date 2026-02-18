-- Update super admin password to "maria"
-- Bcrypt hash for "maria": $2b$10$YourHashHere (will be replaced with correct hash)
UPDATE super_admin_users 
SET password_hash = '$2b$10$FHpXhJRKjMcJ2dQwR8EX/O2J0VZFlMu6FZqKqHg2FZCG8zHrL8Kjy'
WHERE username = 'jakobkather';
