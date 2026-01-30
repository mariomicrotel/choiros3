ALTER TABLE `songs` MODIFY COLUMN `categories` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `songs` MODIFY COLUMN `tags` json DEFAULT ('[]');