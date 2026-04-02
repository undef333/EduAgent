import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Users table with extended role support for EduAgent
 * Roles: student, teacher, admin
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Knowledge base entries for RAG-based Q&A
 */
export const knowledgeBase = mysqlTable("knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags"),
  fileUrl: text("fileUrl"),
  uploadedBy: int("uploadedBy").notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeEntry = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeEntry = typeof knowledgeBase.$inferInsert;

/**
 * Chat conversations for Q&A Agent
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;

/**
 * Chat messages within conversations
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("messageRole", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  confidence: varchar("confidence", { length: 20 }),
  sources: text("sources"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

/**
 * Exam grading records
 */
export const examGradings = mysqlTable("exam_gradings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  examTitle: varchar("examTitle", { length: 500 }).notNull(),
  examContent: text("examContent").notNull(),
  gradingResult: text("gradingResult"),
  totalScore: int("totalScore"),
  maxScore: int("maxScore"),
  weakPoints: text("weakPoints"),
  status: mysqlEnum("gradingStatus", ["pending", "graded", "reviewed", "published"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExamGrading = typeof examGradings.$inferSelect;

/**
 * Resume review records
 */
export const resumeReviews = mysqlTable("resume_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resumeUrl: text("resumeUrl"),
  resumeText: text("resumeText"),
  overallScore: int("overallScore"),
  dimensionScores: text("dimensionScores"),
  suggestions: text("suggestions"),
  radarData: text("radarData"),
  status: mysqlEnum("reviewStatus", ["pending", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResumeReview = typeof resumeReviews.$inferSelect;

/**
 * Mock interview sessions
 */
export const interviewSessions = mysqlTable("interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  stage: mysqlEnum("interviewStage", ["intro", "tech", "project", "report"]).default("intro").notNull(),
  messages: text("messages"),
  report: text("report"),
  radarData: text("radarData"),
  overallScore: int("overallScore"),
  status: mysqlEnum("sessionStatus", ["active", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterviewSession = typeof interviewSessions.$inferSelect;

/**
 * Low confidence questions queue for knowledge base improvement
 */
export const lowConfidenceQueue = mysqlTable("low_confidence_queue", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer"),
  confidence: varchar("confidence", { length: 20 }),
  resolvedBy: int("resolvedBy"),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LowConfidenceItem = typeof lowConfidenceQueue.$inferSelect;

/**
 * Companies for job feed
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Job postings
 */
export const jobPostings = mysqlTable("job_postings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["research", "product", "operations"]).notNull(),
  location: varchar("location", { length: 255 }),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
  experience: varchar("experience", { length: 100 }),
  education: varchar("education", { length: 100 }),
  description: text("description"),
  requirements: text("requirements"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

/**
 * Industry articles
 */
export const industryArticles = mysqlTable("industry_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  source: mysqlEnum("source", ["quantum_bit", "machine_heart", "mind_element"]).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  imageUrl: text("imageUrl"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IndustryArticle = typeof industryArticles.$inferSelect;
export type InsertIndustryArticle = typeof industryArticles.$inferInsert;

/**
 * User followed companies
 */
export const userFollowedCompanies = mysqlTable("user_followed_companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFollowedCompany = typeof userFollowedCompanies.$inferSelect;
export type InsertUserFollowedCompany = typeof userFollowedCompanies.$inferInsert;
