CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`messageRole` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`confidence` varchar(20),
	`sources` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_gradings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`examTitle` varchar(500) NOT NULL,
	`examContent` text NOT NULL,
	`gradingResult` text,
	`totalScore` int,
	`maxScore` int,
	`weakPoints` text,
	`gradingStatus` enum('pending','graded','reviewed','published') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exam_gradings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`position` varchar(200) NOT NULL,
	`interviewStage` enum('intro','tech','project','report') NOT NULL DEFAULT 'intro',
	`messages` text,
	`report` text,
	`radarData` text,
	`overallScore` int,
	`sessionStatus` enum('active','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`tags` text,
	`fileUrl` text,
	`uploadedBy` int NOT NULL,
	`isApproved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `low_confidence_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text,
	`confidence` varchar(20),
	`resolvedBy` int,
	`isResolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `low_confidence_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resume_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resumeUrl` text,
	`resumeText` text,
	`overallScore` int,
	`dimensionScores` text,
	`suggestions` text,
	`radarData` text,
	`reviewStatus` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resume_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `eduRole` enum('student','teacher','admin') DEFAULT 'student' NOT NULL;