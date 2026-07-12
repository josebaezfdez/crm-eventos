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
--> statement-breakpoint
CREATE UNIQUE INDEX `company_memberships_user_company_unique` ON `company_memberships` (`user_id`,`company_id`);--> statement-breakpoint
CREATE INDEX `company_memberships_user_status_idx` ON `company_memberships` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `company_memberships_company_status_idx` ON `company_memberships` (`company_id`,`status`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `company_id`;