CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tax_id` text,
	`address` text,
	`email` text,
	`phone` text,
	`website` text,
	`logo_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `company_id` text DEFAULT 'c_default' NOT NULL;