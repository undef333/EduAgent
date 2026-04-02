CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`logo` text,
	`description` text,
	`website` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `industry_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`summary` text,
	`source` enum('quantum_bit','machine_heart','mind_element') NOT NULL,
	`sourceUrl` text NOT NULL,
	`imageUrl` text,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `industry_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_postings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('research','product','operations') NOT NULL,
	`location` varchar(255),
	`salaryMin` int,
	`salaryMax` int,
	`experience` varchar(100),
	`education` varchar(100),
	`description` text,
	`requirements` text,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_postings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_followed_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_followed_companies_id` PRIMARY KEY(`id`)
);
