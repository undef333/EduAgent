import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  companies,
  jobPostings,
  industryArticles,
  userFollowedCompanies,
  InsertCompany,
  InsertJobPosting,
  InsertIndustryArticle,
  InsertUserFollowedCompany,
} from "../drizzle/schema";

// ===== Company Operations =====
export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(companies.name);
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Job Postings Operations =====
export async function getJobPostingsByCompanyId(companyId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(jobPostings)
    .where(eq(jobPostings.companyId, companyId))
    .orderBy(desc(jobPostings.publishedAt))
    .limit(limit);
}

export async function getLatestJobPostings(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobPostings).orderBy(desc(jobPostings.publishedAt)).limit(limit);
}

export async function getJobPostingsByCategory(category: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(jobPostings)
    .where(eq(jobPostings.category, category as any))
    .orderBy(desc(jobPostings.publishedAt))
    .limit(limit);
}

export async function createJobPosting(data: InsertJobPosting) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(jobPostings).values(data);
  return result[0].insertId;
}

// ===== Industry Articles Operations =====
export async function getLatestArticles(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(industryArticles).orderBy(desc(industryArticles.publishedAt)).limit(limit);
}

export async function getArticlesBySource(source: string, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(industryArticles)
    .where(eq(industryArticles.source, source as any))
    .orderBy(desc(industryArticles.publishedAt))
    .limit(limit);
}

export async function createArticle(data: InsertIndustryArticle) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(industryArticles).values(data);
  return result[0].insertId;
}

// ===== User Followed Companies Operations =====
export async function getUserFollowedCompanies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: userFollowedCompanies.id,
      companyId: userFollowedCompanies.companyId,
      company: companies,
    })
    .from(userFollowedCompanies)
    .innerJoin(companies, eq(userFollowedCompanies.companyId, companies.id))
    .where(eq(userFollowedCompanies.userId, userId));
}

export async function addFollowedCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(userFollowedCompanies).values({ userId, companyId });
    return result[0].insertId;
  } catch (error) {
    // Already followed
    return null;
  }
}

export async function removeFollowedCompany(userId: number, followedId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(userFollowedCompanies).where(eq(userFollowedCompanies.id, followedId));
  return true;
}

export async function getFollowedCompaniesJobs(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get user's followed companies
  const followedCompanies = await db
    .select({ companyId: userFollowedCompanies.companyId })
    .from(userFollowedCompanies)
    .where(eq(userFollowedCompanies.userId, userId));

  if (followedCompanies.length === 0) return [];

  const companyIds = followedCompanies.map((fc) => fc.companyId);

  // Get jobs from followed companies
  return db
    .select({
      job: jobPostings,
      company: companies,
    })
    .from(jobPostings)
    .innerJoin(companies, eq(jobPostings.companyId, companies.id))
    .where(eq(jobPostings.companyId, companyIds[0]))
    .orderBy(desc(jobPostings.publishedAt))
    .limit(limit);
}
