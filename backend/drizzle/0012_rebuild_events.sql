CREATE TABLE `events_new` (
  `id` text PRIMARY KEY NOT NULL,
  `company_id` text DEFAULT 'c_default' NOT NULL,
  `client_id` text NOT NULL,
  `name` text NOT NULL,
  `date` text NOT NULL,
  `location` text NOT NULL,
  `type` text NOT NULL,
  `attendees` integer NOT NULL,
  `duration_hours` real NOT NULL,
  `status` text NOT NULL,
  `accepted_budget_id` text,
  `notes` text NOT NULL,
  `created_at` text NOT NULL
);

INSERT INTO `events_new` (id, company_id, client_id, name, date, location, type, attendees, duration_hours, status, accepted_budget_id, notes, created_at) 
SELECT id, company_id, client_id, name, date, location, type, attendees, duration_hours, status, accepted_budget_id, notes, created_at 
FROM `events`;

DROP TABLE `events`;

ALTER TABLE `events_new` RENAME TO `events`;
