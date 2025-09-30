-- create_users.sql
-- Users table for admin and possible future users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin', -- e.g. 'admin' or 'user'
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example: insert an admin user (replace HASHED_PASSWORD_HERE with a bcrypt hash)
-- INSERT INTO `users` (username, email, password, role) VALUES ('admin', 'admin@example.com', 'HASHED_PASSWORD_HERE', 'admin');
