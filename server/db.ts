import { eq, desc, and, like, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  knowledgeBase, InsertKnowledgeEntry,
  conversations, chatMessages,
  examGradings, resumeReviews,
  interviewSessions, lowConfidenceQueue,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== User Operations =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    // 排除 eduRole 字段（如果数据库表中不存在）
    delete (values as any).eduRole;
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserEduRole(userId: number, eduRole: "student" | "teacher" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ eduRole }).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ===== Knowledge Base Operations =====
export async function createKnowledgeEntry(entry: InsertKnowledgeEntry) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(knowledgeBase).values(entry);
  return result[0].insertId;
}

export async function getKnowledgeEntries(approved?: boolean) {
  const db = await getDb();
  if (!db) return [];
  if (approved !== undefined) {
    return db.select().from(knowledgeBase).where(eq(knowledgeBase.isApproved, approved)).orderBy(desc(knowledgeBase.createdAt));
  }
  return db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.createdAt));
}

export async function approveKnowledgeEntry(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeBase).set({ isApproved: true }).where(eq(knowledgeBase.id, id));
}

export async function searchKnowledge(query: string) {
  const db = await getDb();
  if (!db) return [];
  // Search across title, content, and tags for better matching
  const keywords = query.split(/\s+/).filter(k => k.length > 0);
  if (keywords.length === 0) return [];
  
  // Build OR conditions for each keyword across title, content, and tags
  const keywordConditions = keywords.map(keyword =>
    or(
      like(knowledgeBase.title, `%${keyword}%`),
      like(knowledgeBase.content, `%${keyword}%`),
      like(knowledgeBase.tags, `%${keyword}%`)
    )
  );
  
  return db.select().from(knowledgeBase)
    .where(and(
      eq(knowledgeBase.isApproved, true),
      or(...keywordConditions)
    ))
    .limit(20);
}

// ===== Conversation Operations =====
export async function createConversation(userId: number, title?: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(conversations).values({ userId, title: title || "新对话" });
  return result[0].insertId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function addChatMessage(conversationId: number, role: "user" | "assistant" | "system", content: string, confidence?: string, sources?: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values({ conversationId, role, content, confidence, sources });
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

// ===== Exam Grading Operations =====
export async function createExamGrading(userId: number, examTitle: string, examContent: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(examGradings).values({ userId, examTitle, examContent });
  return result[0].insertId;
}

export async function updateExamGrading(id: number, data: Partial<{ gradingResult: string; totalScore: number; maxScore: number; weakPoints: string; status: "pending" | "graded" | "reviewed" | "published"; reviewedBy: number; reviewNote: string }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(examGradings).set(data).where(eq(examGradings.id, id));
}

export async function getUserExamGradings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examGradings).where(eq(examGradings.userId, userId)).orderBy(desc(examGradings.createdAt));
}

export async function getAllExamGradings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examGradings).orderBy(desc(examGradings.createdAt));
}

// ===== Resume Review Operations =====
export async function createResumeReview(userId: number, resumeText: string, resumeUrl?: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resumeReviews).values({ userId, resumeText, resumeUrl });
  return result[0].insertId;
}

export async function updateResumeReview(id: number, data: Partial<{ overallScore: number; dimensionScores: string; suggestions: string; radarData: string; status: "pending" | "completed" }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(resumeReviews).set(data).where(eq(resumeReviews.id, id));
}

export async function getUserResumeReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumeReviews).where(eq(resumeReviews.userId, userId)).orderBy(desc(resumeReviews.createdAt));
}

// ===== Interview Session Operations =====
export async function createInterviewSession(userId: number, position: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(interviewSessions).values({ userId, position });
  return result[0].insertId;
}

export async function updateInterviewSession(id: number, data: Partial<{ stage: "intro" | "tech" | "project" | "report"; messages: string; report: string; radarData: string; overallScore: number; status: "active" | "completed" }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(interviewSessions).set(data).where(eq(interviewSessions.id, id));
}

export async function getUserInterviewSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId)).orderBy(desc(interviewSessions.createdAt));
}

export async function getInterviewSession(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Low Confidence Queue Operations =====
export async function addToLowConfidenceQueue(question: string, answer?: string, confidence?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(lowConfidenceQueue).values({ question, answer, confidence });
}

export async function getLowConfidenceQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lowConfidenceQueue).where(eq(lowConfidenceQueue.isResolved, false)).orderBy(desc(lowConfidenceQueue.createdAt));
}

export async function resolveLowConfidenceItem(id: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(lowConfidenceQueue).set({ isResolved: true, resolvedBy }).where(eq(lowConfidenceQueue.id, id));
}

// ===== Stats =====
export async function getSystemStats() {
  const db = await getDb();
  if (!db) return { users: 0, knowledge: 0, conversations: 0, exams: 0, resumes: 0, interviews: 0 };
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [kbCount] = await db.select({ count: sql<number>`count(*)` }).from(knowledgeBase);
  const [convCount] = await db.select({ count: sql<number>`count(*)` }).from(conversations);
  const [examCount] = await db.select({ count: sql<number>`count(*)` }).from(examGradings);
  const [resumeCount] = await db.select({ count: sql<number>`count(*)` }).from(resumeReviews);
  const [interviewCount] = await db.select({ count: sql<number>`count(*)` }).from(interviewSessions);
  return {
    users: userCount.count,
    knowledge: kbCount.count,
    conversations: convCount.count,
    exams: examCount.count,
    resumes: resumeCount.count,
    interviews: interviewCount.count,
  };
}
