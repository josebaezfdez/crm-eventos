ALTER TABLE `budgets` ADD `company_id` text DEFAULT 'c_default' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `company_id` text DEFAULT 'c_default' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `company_id` text DEFAULT 'c_default' NOT NULL;--> statement-breakpoint
ALTER TABLE `packages` ADD `company_id` text DEFAULT 'c_default' NOT NULL;--> statement-breakpoint
ALTER TABLE `partners` ADD `company_id` text DEFAULT 'c_default' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `company_id` text DEFAULT 'c_default' NOT NULL;--> statement-breakpoint
ALTER TABLE `post_event_results` ADD `company_id` text DEFAULT 'c_default' NOT NULL;