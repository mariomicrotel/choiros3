CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`user_id` int NOT NULL,
	`check_in_at` timestamp NOT NULL DEFAULT (now()),
	`check_out_at` timestamp,
	`status` enum('present','absent','justified_absence','late') NOT NULL DEFAULT 'present',
	`notes` text,
	`synced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_event_user_idx` UNIQUE(`event_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`type` enum('rehearsal','concert','meeting','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_at` timestamp NOT NULL,
	`end_at` timestamp,
	`venue_id` int,
	`location_string` text,
	`dress_code` varchar(255),
	`call_time` timestamp,
	`notes` text,
	`attachments` json,
	`map_link` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`role` enum('admin','director','secretary','capo_section','member','guest') NOT NULL,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	`left_at` timestamp,
	`status` enum('active','suspended','exited') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`logo_url` text,
	`colors` json,
	`settings` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `org_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('membership_fee','event_fee','donation') NOT NULL,
	`amount_cents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`description` text,
	`due_at` timestamp,
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`voice_section` varchar(50),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`rejection_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rsvp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`user_id` int NOT NULL,
	`status` enum('attending','not_attending','maybe') NOT NULL,
	`motivation` text,
	`responded_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rsvp_id` PRIMARY KEY(`id`),
	CONSTRAINT `rsvp_event_user_idx` UNIQUE(`event_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `setlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setlist_id` int NOT NULL,
	`song_id` int NOT NULL,
	`order` int NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `setlist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `setlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int,
	`organization_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`notes` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `setlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `song_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`song_id` int NOT NULL,
	`type` enum('score_pdf','reference_audio','section_stem','lyrics','youtube_link') NOT NULL,
	`url` text NOT NULL,
	`file_key` varchar(255),
	`voice_section` enum('soprano','mezzo_soprano','alto','tenor','baritone','bass','all'),
	`mime_type` varchar(100),
	`file_size` int,
	`uploaded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `song_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`composer` varchar(255),
	`arranger` varchar(255),
	`language` varchar(50),
	`duration_seconds` int,
	`difficulty` int,
	`tempo_bpm` int,
	`key` varchar(10),
	`categories` json,
	`tags` json,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `songs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`phone` varchar(20),
	`birth_date` timestamp,
	`address` text,
	`city` varchar(100),
	`postal_code` varchar(20),
	`country` varchar(100),
	`voice_section` enum('soprano','mezzo_soprano','alto','tenor','baritone','bass'),
	`status` enum('active','suspended','exited') NOT NULL DEFAULT 'active',
	`notes` text,
	`tags` json,
	`documents` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profile_user_org_idx` UNIQUE(`user_id`,`organization_id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(100),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`phone` varchar(20),
	`email` varchar(320),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `user_openid_idx` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_venue_id_venues_id_fk` FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rsvp` ADD CONSTRAINT `rsvp_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rsvp` ADD CONSTRAINT `rsvp_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setlist_items` ADD CONSTRAINT `setlist_items_setlist_id_setlists_id_fk` FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setlist_items` ADD CONSTRAINT `setlist_items_song_id_songs_id_fk` FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setlists` ADD CONSTRAINT `setlists_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setlists` ADD CONSTRAINT `setlists_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setlists` ADD CONSTRAINT `setlists_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `song_assets` ADD CONSTRAINT `song_assets_song_id_songs_id_fk` FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `song_assets` ADD CONSTRAINT `song_assets_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `songs` ADD CONSTRAINT `songs_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `songs` ADD CONSTRAINT `songs_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `venues` ADD CONSTRAINT `venues_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attendance_event_idx` ON `attendance` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_org_type_idx` ON `events` (`organization_id`,`type`);--> statement-breakpoint
CREATE INDEX `event_org_start_idx` ON `events` (`organization_id`,`start_at`);--> statement-breakpoint
CREATE INDEX `membership_user_org_idx` ON `memberships` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE INDEX `payment_org_user_idx` ON `payments` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `payment_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `reg_org_status_idx` ON `registrations` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `setlist_item_setlist_idx` ON `setlist_items` (`setlist_id`);--> statement-breakpoint
CREATE INDEX `setlist_event_idx` ON `setlists` (`event_id`);--> statement-breakpoint
CREATE INDEX `setlist_org_idx` ON `setlists` (`organization_id`);--> statement-breakpoint
CREATE INDEX `asset_song_idx` ON `song_assets` (`song_id`);--> statement-breakpoint
CREATE INDEX `song_org_idx` ON `songs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `song_title_idx` ON `songs` (`title`);--> statement-breakpoint
CREATE INDEX `venue_org_idx` ON `venues` (`organization_id`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `users` (`email`);