CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`client_id` text NOT NULL,
	`package_id` text,
	`items` text NOT NULL,
	`direct_costs` real NOT NULL,
	`partner_costs` real NOT NULL,
	`labor_costs` real NOT NULL,
	`indirect_costs` real NOT NULL,
	`total_cost` real NOT NULL,
	`target_margin_percentage` real NOT NULL,
	`recommended_price_without_vat` real NOT NULL,
	`recommended_price_with_vat` real NOT NULL,
	`offered_price_without_vat` real NOT NULL,
	`offered_price_with_vat` real NOT NULL,
	`vat_percentage` real NOT NULL,
	`expected_profit` real NOT NULL,
	`expected_margin_percentage` real NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`company` text NOT NULL,
	`notes` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`location` text NOT NULL,
	`type` text NOT NULL,
	`attendees` integer NOT NULL,
	`duration_hours` integer NOT NULL,
	`status` text NOT NULL,
	`budget_id` text,
	`notes` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`base_hours` integer NOT NULL,
	`base_cost` real NOT NULL,
	`recommended_price` real NOT NULL,
	`included_items` text NOT NULL,
	`margin_target` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`pricing_type` text NOT NULL,
	`hourly_rate` real NOT NULL,
	`fixed_rate` real NOT NULL,
	`notes` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`status` text NOT NULL,
	`concept` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_event_results` (
	`event_id` text PRIMARY KEY NOT NULL,
	`charged_price` real NOT NULL,
	`real_cost_lines` text NOT NULL,
	`real_total_cost` real NOT NULL,
	`notes` text NOT NULL,
	`saved_at` text NOT NULL
);
