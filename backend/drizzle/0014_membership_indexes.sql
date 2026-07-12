CREATE UNIQUE INDEX IF NOT EXISTS `company_memberships_user_company_unique` ON `company_memberships` (`user_id`,`company_id`);
CREATE INDEX IF NOT EXISTS `company_memberships_user_status_idx` ON `company_memberships` (`user_id`,`status`);
CREATE INDEX IF NOT EXISTS `company_memberships_company_status_idx` ON `company_memberships` (`company_id`,`status`);