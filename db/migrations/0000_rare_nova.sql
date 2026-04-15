CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`calories` integer DEFAULT 0 NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`carbs` real DEFAULT 0 NOT NULL,
	`fat` real DEFAULT 0 NOT NULL,
	`photo_uri` text,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`status` text DEFAULT 'analyzing' NOT NULL,
	`ingredients` text,
	`description` text,
	`confidence` text
);
