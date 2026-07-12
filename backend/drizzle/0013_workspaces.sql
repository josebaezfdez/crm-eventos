-- Migration 0013_workspaces.sql
-- 1. Crear tabla company_memberships
CREATE TABLE `company_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`invited_by` text,
	`invited_at` text,
	`accepted_at` text,
	`created_at` text NOT NULL
);

-- 2. Poblar company_memberships con la data actual de users
INSERT INTO `company_memberships` (`id`, `user_id`, `company_id`, `role`, `status`, `accepted_at`, `created_at`)
SELECT 
  lower(hex(randomblob(16))) as id,
  `id` as user_id,
  `company_id`,
  'ADMIN' as role,
  'ACTIVE' as status,
  `created_at` as accepted_at,
  `created_at`
FROM `users`;

-- 3. Crear nueva tabla users sin company_id
CREATE TABLE `users_new` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);

-- 4. Copiar datos a users_new
INSERT INTO `users_new` (`id`, `email`, `password_hash`, `password_salt`, `name`, `created_at`)
SELECT `id`, `email`, `password_hash`, `password_salt`, `name`, `created_at` FROM `users`;

-- 5. Intercambiar tablas y crear index
DROP TABLE `users`;
ALTER TABLE `users_new` RENAME TO `users`;
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
