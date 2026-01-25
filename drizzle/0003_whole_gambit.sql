CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`plan` enum('monthly','annual') NOT NULL,
	`status` enum('active','suspended','expired','cancelled') NOT NULL DEFAULT 'active',
	`price_monthly` int NOT NULL,
	`price_annual` int,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	`next_billing_date` timestamp,
	`cancelled_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `organizations` ADD `fiscal_code` varchar(16);--> statement-breakpoint
ALTER TABLE `organizations` ADD `vat_number` varchar(11);--> statement-breakpoint
ALTER TABLE `organizations` ADD `billing_email` varchar(320);--> statement-breakpoint
ALTER TABLE `organizations` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `organizations` ADD `address` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `organizations` ADD `country` varchar(2) DEFAULT 'IT';--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subscription_org_idx` ON `subscriptions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `subscription_status_idx` ON `subscriptions` (`status`);