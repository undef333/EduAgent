// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc, and, like, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var knowledgeBase = mysqlTable("knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags"),
  fileUrl: text("fileUrl"),
  uploadedBy: int("uploadedBy").notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("messageRole", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  confidence: varchar("confidence", { length: 20 }),
  sources: text("sources"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var examGradings = mysqlTable("exam_gradings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var resumeReviews = mysqlTable("resume_reviews", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var interviewSessions = mysqlTable("interview_sessions", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var lowConfidenceQueue = mysqlTable("low_confidence_queue", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer"),
  confidence: varchar("confidence", { length: 20 }),
  resolvedBy: int("resolvedBy"),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var jobPostings = mysqlTable("job_postings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var industryArticles = mysqlTable("industry_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  source: mysqlEnum("source", ["quantum_bit", "machine_heart", "mind_element"]).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  imageUrl: text("imageUrl"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userFollowedCompanies = mysqlTable("user_followed_companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    delete values.eduRole;
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserEduRole(userId, eduRole) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ eduRole }).where(eq(users.id, userId));
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}
async function createKnowledgeEntry(entry) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(knowledgeBase).values(entry);
  return result[0].insertId;
}
async function getKnowledgeEntries(approved) {
  const db = await getDb();
  if (!db) return [];
  if (approved !== void 0) {
    return db.select().from(knowledgeBase).where(eq(knowledgeBase.isApproved, approved)).orderBy(desc(knowledgeBase.createdAt));
  }
  return db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.createdAt));
}
async function approveKnowledgeEntry(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeBase).set({ isApproved: true }).where(eq(knowledgeBase.id, id));
}
async function searchKnowledge(query) {
  const db = await getDb();
  if (!db) return [];
  const keywords = query.split(/\s+/).filter((k) => k.length > 0);
  if (keywords.length === 0) return [];
  const keywordConditions = keywords.map(
    (keyword) => or(
      like(knowledgeBase.title, `%${keyword}%`),
      like(knowledgeBase.content, `%${keyword}%`),
      like(knowledgeBase.tags, `%${keyword}%`)
    )
  );
  return db.select().from(knowledgeBase).where(and(
    eq(knowledgeBase.isApproved, true),
    or(...keywordConditions)
  )).limit(20);
}
async function createConversation(userId, title) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(conversations).values({ userId, title: title || "\u65B0\u5BF9\u8BDD" });
  return result[0].insertId;
}
async function getUserConversations(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}
async function addChatMessage(conversationId, role, content, confidence, sources) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values({ conversationId, role, content, confidence, sources });
  return result[0].insertId;
}
async function getConversationMessages(conversationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}
async function createExamGrading(userId, examTitle, examContent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(examGradings).values({ userId, examTitle, examContent });
  return result[0].insertId;
}
async function updateExamGrading(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(examGradings).set(data).where(eq(examGradings.id, id));
}
async function getUserExamGradings(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examGradings).where(eq(examGradings.userId, userId)).orderBy(desc(examGradings.createdAt));
}
async function getAllExamGradings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examGradings).orderBy(desc(examGradings.createdAt));
}
async function createResumeReview(userId, resumeText, resumeUrl) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resumeReviews).values({ userId, resumeText, resumeUrl });
  return result[0].insertId;
}
async function updateResumeReview(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(resumeReviews).set(data).where(eq(resumeReviews.id, id));
}
async function getUserResumeReviews(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumeReviews).where(eq(resumeReviews.userId, userId)).orderBy(desc(resumeReviews.createdAt));
}
async function createInterviewSession(userId, position) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(interviewSessions).values({ userId, position });
  return result[0].insertId;
}
async function updateInterviewSession(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(interviewSessions).set(data).where(eq(interviewSessions.id, id));
}
async function getUserInterviewSessions(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId)).orderBy(desc(interviewSessions.createdAt));
}
async function getInterviewSession(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function addToLowConfidenceQueue(question, answer, confidence) {
  const db = await getDb();
  if (!db) return;
  await db.insert(lowConfidenceQueue).values({ question, answer, confidence });
}
async function getLowConfidenceQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lowConfidenceQueue).where(eq(lowConfidenceQueue.isResolved, false)).orderBy(desc(lowConfidenceQueue.createdAt));
}
async function resolveLowConfidenceItem(id, resolvedBy) {
  const db = await getDb();
  if (!db) return;
  await db.update(lowConfidenceQueue).set({ isResolved: true, resolvedBy }).where(eq(lowConfidenceQueue.id, id));
}
async function getSystemStats() {
  const db = await getDb();
  if (!db) return { users: 0, knowledge: 0, conversations: 0, exams: 0, resumes: 0, interviews: 0 };
  const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
  const [kbCount] = await db.select({ count: sql`count(*)` }).from(knowledgeBase);
  const [convCount] = await db.select({ count: sql`count(*)` }).from(conversations);
  const [examCount] = await db.select({ count: sql`count(*)` }).from(examGradings);
  const [resumeCount] = await db.select({ count: sql`count(*)` }).from(resumeReviews);
  const [interviewCount] = await db.select({ count: sql`count(*)` }).from(interviewSessions);
  return {
    users: userCount.count,
    knowledge: kbCount.count,
    conversations: convCount.count,
    exams: examCount.count,
    resumes: resumeCount.count,
    interviews: interviewCount.count
  };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/dev-oauth.ts
function registerDevOAuthRoutes(app) {
  app.get("/api/dev/login", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).json({ error: "Dev login only available in development mode" });
      return;
    }
    try {
      const testUser = {
        openId: "test-user-dev-001",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "dev"
      };
      try {
        await upsertUser({
          openId: testUser.openId,
          name: testUser.name,
          email: testUser.email,
          loginMethod: testUser.loginMethod,
          lastSignedIn: /* @__PURE__ */ new Date()
        });
      } catch (err) {
        const database = await getDb();
        if (database) {
          await database.insert(users).values({
            openId: testUser.openId,
            name: testUser.name,
            email: testUser.email,
            loginMethod: testUser.loginMethod,
            lastSignedIn: /* @__PURE__ */ new Date()
          }).onDuplicateKeyUpdate({
            set: {
              name: testUser.name,
              email: testUser.email,
              loginMethod: testUser.loginMethod,
              lastSignedIn: /* @__PURE__ */ new Date()
            }
          });
        }
      }
      const sessionToken = await sdk.createSessionToken(testUser.openId, {
        name: testUser.name,
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Dev OAuth] Login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });
  app.get("/api/dev/logout", (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).json({ error: "Dev logout only available in development mode" });
      return;
    }
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect(302, "/");
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/feedDb.ts
import { eq as eq2, desc as desc2 } from "drizzle-orm";
async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(companies.name);
}
async function getJobPostingsByCompanyId(companyId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobPostings).where(eq2(jobPostings.companyId, companyId)).orderBy(desc2(jobPostings.publishedAt)).limit(limit);
}
async function getLatestJobPostings(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobPostings).orderBy(desc2(jobPostings.publishedAt)).limit(limit);
}
async function getLatestArticles(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(industryArticles).orderBy(desc2(industryArticles.publishedAt)).limit(limit);
}
async function getUserFollowedCompanies(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: userFollowedCompanies.id,
    companyId: userFollowedCompanies.companyId,
    company: companies
  }).from(userFollowedCompanies).innerJoin(companies, eq2(userFollowedCompanies.companyId, companies.id)).where(eq2(userFollowedCompanies.userId, userId));
}
async function addFollowedCompany(userId, companyId) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(userFollowedCompanies).values({ userId, companyId });
    return result[0].insertId;
  } catch (error) {
    return null;
  }
}
async function removeFollowedCompany(userId, followedId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(userFollowedCompanies).where(eq2(userFollowedCompanies.id, followedId));
  return true;
}
async function getFollowedCompaniesJobs(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const followedCompanies = await db.select({ companyId: userFollowedCompanies.companyId }).from(userFollowedCompanies).where(eq2(userFollowedCompanies.userId, userId));
  if (followedCompanies.length === 0) return [];
  const companyIds = followedCompanies.map((fc) => fc.companyId);
  return db.select({
    job: jobPostings,
    company: companies
  }).from(jobPostings).innerJoin(companies, eq2(jobPostings.companyId, companies.id)).where(eq2(jobPostings.companyId, companyIds[0])).orderBy(desc2(jobPostings.publishedAt)).limit(limit);
}

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/agents.ts
var QA_SYSTEM_PROMPT = `\u4F60\u662F EduAgent \u667A\u80FD\u95EE\u7B54\u52A9\u624B\uFF0C\u4E00\u4E2A\u4E13\u4E1A\u7684\u6559\u80B2\u9886\u57DF AI \u52A9\u6559\u3002\u4F60\u7684\u804C\u8D23\u662F\u56DE\u7B54\u5B66\u5458\u5173\u4E8E\u8BFE\u7A0B\u77E5\u8BC6\u7684\u95EE\u9898\u3002

## \u56DE\u7B54\u89C4\u5219\uFF1A
1. **\u4E09\u7EA7 Query \u7406\u89E3**\uFF1A
   - \u660E\u786E\u95EE\u9898\uFF1A\u76F4\u63A5\u7ED9\u51FA\u7CBE\u786E\u7B54\u6848
   - \u6A21\u7CCA\u95EE\u9898\uFF1A\u5148\u6F84\u6E05\u7406\u89E3\uFF0C\u518D\u7ED9\u51FA\u6700\u53EF\u80FD\u7684\u7B54\u6848
   - \u5BBD\u6CDB\u95EE\u9898\uFF1A\u63D0\u4F9B\u7ED3\u6784\u5316\u7684\u77E5\u8BC6\u6982\u89C8\uFF0C\u5F15\u5BFC\u6DF1\u5165\u5B66\u4E60

2. **\u7F6E\u4FE1\u5EA6\u611F\u77E5**\uFF1A\u5728\u56DE\u7B54\u672B\u5C3E\u6807\u6CE8\u7F6E\u4FE1\u5EA6\u7B49\u7EA7
   - [\u9AD8\u7F6E\u4FE1\u5EA6]\uFF1A\u7B54\u6848\u57FA\u4E8E\u660E\u786E\u7684\u77E5\u8BC6\u70B9
   - [\u4E2D\u7F6E\u4FE1\u5EA6]\uFF1A\u7B54\u6848\u57FA\u4E8E\u63A8\u7406\u548C\u5173\u8054\u77E5\u8BC6
   - [\u4F4E\u7F6E\u4FE1\u5EA6]\uFF1A\u7B54\u6848\u53EF\u80FD\u4E0D\u591F\u51C6\u786E\uFF0C\u5EFA\u8BAE\u67E5\u9605\u66F4\u591A\u8D44\u6599

3. **\u56DE\u7B54\u683C\u5F0F**\uFF1A\u4F7F\u7528 Markdown \u683C\u5F0F\uFF0C\u5305\u542B\u4EE3\u7801\u5757\u3001\u5217\u8868\u3001\u8868\u683C\u7B49
4. **\u591A\u8F6E\u5BF9\u8BDD**\uFF1A\u8BB0\u4F4F\u4E0A\u4E0B\u6587\uFF0C\u4FDD\u6301\u5BF9\u8BDD\u8FDE\u8D2F\u6027
5. **\u77E5\u8BC6\u5E93\u5F15\u7528**\uFF1A\u5982\u679C\u6709\u76F8\u5173\u77E5\u8BC6\u5E93\u5185\u5BB9\uFF0C\u4F18\u5148\u5F15\u7528\u5E76\u6807\u6CE8\u6765\u6E90`;
async function qaAgent(userMessage, history, knowledgeContext) {
  const messages = [
    { role: "system", content: QA_SYSTEM_PROMPT + (knowledgeContext ? `

## \u76F8\u5173\u77E5\u8BC6\u5E93\u5185\u5BB9\uFF1A
${knowledgeContext}` : "") },
    ...history.slice(-20),
    // 10轮滑动窗口 (user+assistant = 20 messages)
    { role: "user", content: userMessage }
  ];
  const result = await invokeLLM({ messages });
  const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
  let confidence = "medium";
  if (content.includes("[\u9AD8\u7F6E\u4FE1\u5EA6]") || content.includes("\u9AD8\u7F6E\u4FE1\u5EA6")) confidence = "high";
  else if (content.includes("[\u4F4E\u7F6E\u4FE1\u5EA6]") || content.includes("\u4F4E\u7F6E\u4FE1\u5EA6")) confidence = "low";
  return { content, confidence };
}
var GRADING_SYSTEM_PROMPT = `\u4F60\u662F EduAgent \u8BD5\u5377\u6279\u6539\u52A9\u624B\uFF0C\u8D1F\u8D23\u5BF9\u5B66\u5458\u63D0\u4EA4\u7684\u8BD5\u5377/\u4F5C\u4E1A\u8FDB\u884C\u667A\u80FD\u6279\u6539\u3002

## \u6279\u6539\u89C4\u5219\uFF1A
1. **\u4E09\u8F68\u5E76\u884C\u6279\u6539\u67B6\u6784**\uFF1A
   - \u5BA2\u89C2\u9898\uFF1A\u89C4\u5219\u5339\u914D\uFF0C\u5BF9\u7167\u6807\u51C6\u7B54\u6848\u8BC4\u5206
   - \u7B80\u7B54\u9898\uFF1A\u8BED\u4E49\u7406\u89E3\u8BC4\u5206\uFF0C\u5173\u6CE8\u77E5\u8BC6\u70B9\u8986\u76D6\u5EA6\u548C\u8868\u8FBE\u51C6\u786E\u6027
   - \u4EE3\u7801\u9898\uFF1A\u5206\u6790\u4EE3\u7801\u903B\u8F91\u3001\u6B63\u786E\u6027\u3001\u4EE3\u7801\u98CE\u683C

2. **\u8BC4\u5206\u6807\u51C6**\uFF1A
   - \u6BCF\u9053\u9898\u7ED9\u51FA\u5F97\u5206\u548C\u6EE1\u5206
   - \u63D0\u4F9B\u8BE6\u7EC6\u7684\u8BC4\u5206\u7406\u7531
   - \u6807\u6CE8\u77E5\u8BC6\u8584\u5F31\u70B9

3. **\u8F93\u51FA\u683C\u5F0F**\uFF08JSON\uFF09\uFF1A
{
  "questions": [
    {
      "id": 1,
      "type": "objective|subjective|code",
      "score": 8,
      "maxScore": 10,
      "feedback": "\u8BC4\u5206\u7406\u7531",
      "weakPoints": ["\u8584\u5F31\u77E5\u8BC6\u70B9"]
    }
  ],
  "totalScore": 85,
  "maxScore": 100,
  "weakPoints": ["\u603B\u4F53\u8584\u5F31\u77E5\u8BC6\u70B9\u5217\u8868"],
  "summary": "\u603B\u4F53\u8BC4\u4EF7",
  "suggestions": "\u6539\u8FDB\u5EFA\u8BAE"
}`;
async function gradingAgent(examContent) {
  const messages = [
    { role: "system", content: GRADING_SYSTEM_PROMPT },
    { role: "user", content: `\u8BF7\u6279\u6539\u4EE5\u4E0B\u8BD5\u5377/\u4F5C\u4E1A\u5185\u5BB9\uFF1A

${examContent}` }
  ];
  const result = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "grading_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  type: { type: "string" },
                  score: { type: "number" },
                  maxScore: { type: "number" },
                  feedback: { type: "string" },
                  weakPoints: { type: "array", items: { type: "string" } }
                },
                required: ["id", "type", "score", "maxScore", "feedback", "weakPoints"],
                additionalProperties: false
              }
            },
            totalScore: { type: "number" },
            maxScore: { type: "number" },
            weakPoints: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            suggestions: { type: "string" }
          },
          required: ["questions", "totalScore", "maxScore", "weakPoints", "summary", "suggestions"],
          additionalProperties: false
        }
      }
    }
  });
  const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { questions: [], totalScore: 0, maxScore: 100, weakPoints: [], summary: content, suggestions: "" };
  }
  return {
    gradingResult: content,
    totalScore: parsed.totalScore || 0,
    maxScore: parsed.maxScore || 100,
    weakPoints: JSON.stringify(parsed.weakPoints || [])
  };
}
var RESUME_SYSTEM_PROMPT = `\u4F60\u662F EduAgent \u7B80\u5386\u5BA1\u67E5\u52A9\u624B\uFF0C\u8D1F\u8D23\u5BF9\u5B66\u5458\u7B80\u5386\u8FDB\u884C\u516D\u7EF4\u5EA6\u7CBE\u51C6\u8BCA\u65AD\u3002

## \u516D\u7EF4\u5EA6\u8BC4\u4F30\uFF1A
1. **\u5DE5\u4F5C\u7ECF\u5386** (work_experience)\uFF1A\u5DE5\u4F5C\u7ECF\u5386\u7684\u5B8C\u6574\u6027\u3001\u76F8\u5173\u6027\u3001\u6210\u957F\u8F68\u8FF9
2. **\u6280\u80FD\u5339\u914D** (skill_match)\uFF1A\u6280\u80FD\u4E0E\u76EE\u6807\u5C97\u4F4D\u7684\u5339\u914D\u5EA6
3. **\u9879\u76EE\u63CF\u8FF0** (project_description)\uFF1A\u9879\u76EE\u63CF\u8FF0\u7684 STAR \u6CD5\u5219\u8FD0\u7528
4. **\u91CF\u5316\u6570\u636E** (quantitative_data)\uFF1A\u6570\u636E\u91CF\u5316\u7684\u4F7F\u7528\u7A0B\u5EA6
5. **\u683C\u5F0F\u6392\u7248** (formatting)\uFF1A\u7B80\u5386\u683C\u5F0F\u7684\u4E13\u4E1A\u5EA6
6. **\u8868\u8FBE\u89C4\u8303** (expression)\uFF1A\u8BED\u8A00\u8868\u8FBE\u7684\u4E13\u4E1A\u6027\u548C\u89C4\u8303\u6027

## \u8F93\u51FA\u683C\u5F0F\uFF08JSON\uFF09\uFF1A
{
  "overallScore": 75,
  "dimensions": [
    { "name": "\u5DE5\u4F5C\u7ECF\u5386", "key": "work_experience", "score": 80, "maxScore": 100, "feedback": "\u8BC4\u4EF7" },
    { "name": "\u6280\u80FD\u5339\u914D", "key": "skill_match", "score": 70, "maxScore": 100, "feedback": "\u8BC4\u4EF7" },
    { "name": "\u9879\u76EE\u63CF\u8FF0", "key": "project_description", "score": 75, "maxScore": 100, "feedback": "\u8BC4\u4EF7" },
    { "name": "\u91CF\u5316\u6570\u636E", "key": "quantitative_data", "score": 60, "maxScore": 100, "feedback": "\u8BC4\u4EF7" },
    { "name": "\u683C\u5F0F\u6392\u7248", "key": "formatting", "score": 85, "maxScore": 100, "feedback": "\u8BC4\u4EF7" },
    { "name": "\u8868\u8FBE\u89C4\u8303", "key": "expression", "score": 80, "maxScore": 100, "feedback": "\u8BC4\u4EF7" }
  ],
  "suggestions": [
    { "location": "\u539F\u6587\u4F4D\u7F6E", "original": "\u539F\u6587\u5185\u5BB9", "suggestion": "\u4FEE\u6539\u5EFA\u8BAE", "reason": "\u4FEE\u6539\u7406\u7531" }
  ],
  "summary": "\u603B\u4F53\u8BC4\u4EF7"
}`;
async function resumeReviewAgent(resumeText) {
  const messages = [
    { role: "system", content: RESUME_SYSTEM_PROMPT },
    { role: "user", content: `\u8BF7\u5BA1\u67E5\u4EE5\u4E0B\u7B80\u5386\u5185\u5BB9\uFF1A

${resumeText}` }
  ];
  const result = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_review",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            dimensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  key: { type: "string" },
                  score: { type: "number" },
                  maxScore: { type: "number" },
                  feedback: { type: "string" }
                },
                required: ["name", "key", "score", "maxScore", "feedback"],
                additionalProperties: false
              }
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  original: { type: "string" },
                  suggestion: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["location", "original", "suggestion", "reason"],
                additionalProperties: false
              }
            },
            summary: { type: "string" }
          },
          required: ["overallScore", "dimensions", "suggestions", "summary"],
          additionalProperties: false
        }
      }
    }
  });
  const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { overallScore: 0, dimensions: [], suggestions: [], summary: content };
  }
  const radarData = JSON.stringify(
    (parsed.dimensions || []).map((d) => ({
      dimension: d.name,
      score: d.score,
      fullMark: d.maxScore || 100
    }))
  );
  return {
    overallScore: parsed.overallScore || 0,
    dimensionScores: JSON.stringify(parsed.dimensions || []),
    suggestions: JSON.stringify({ suggestions: parsed.suggestions || [], summary: parsed.summary || "" }),
    radarData
  };
}
function getInterviewSystemPrompt(position, stage) {
  const stageInstructions = {
    intro: `\u5F53\u524D\u9636\u6BB5\uFF1A\u81EA\u6211\u4ECB\u7ECD\u9636\u6BB5 (INTRO)
\u8BF7\u8BA9\u5019\u9009\u4EBA\u8FDB\u884C\u81EA\u6211\u4ECB\u7ECD\uFF0C\u4E86\u89E3\u5176\u80CC\u666F\u3001\u6559\u80B2\u7ECF\u5386\u548C\u804C\u4E1A\u76EE\u6807\u3002
\u63D0\u51FA 1-2 \u4E2A\u5F15\u5BFC\u6027\u95EE\u9898\u5E2E\u52A9\u5019\u9009\u4EBA\u5C55\u5F00\u4ECB\u7ECD\u3002
\u8BC4\u4F30\u8981\u70B9\uFF1A\u8868\u8FBE\u6E05\u6670\u5EA6\u3001\u903B\u8F91\u6027\u3001\u81EA\u4FE1\u5EA6\u3002`,
    tech: `\u5F53\u524D\u9636\u6BB5\uFF1A\u6280\u672F\u9762\u8BD5\u9636\u6BB5 (TECH)
\u6839\u636E\u5019\u9009\u4EBA\u5E94\u8058\u7684 ${position} \u5C97\u4F4D\uFF0C\u63D0\u51FA\u6280\u672F\u76F8\u5173\u95EE\u9898\u3002
\u6BCF\u6B21\u63D0\u51FA 1 \u4E2A\u6280\u672F\u95EE\u9898\uFF0C\u6839\u636E\u56DE\u7B54\u6DF1\u5EA6\u8FFD\u95EE\u3002
\u8BC4\u4F30\u8981\u70B9\uFF1A\u6280\u672F\u6DF1\u5EA6\u3001\u95EE\u9898\u89E3\u51B3\u80FD\u529B\u3001\u77E5\u8BC6\u5E7F\u5EA6\u3002`,
    project: `\u5F53\u524D\u9636\u6BB5\uFF1A\u9879\u76EE\u7ECF\u9A8C\u9636\u6BB5 (PROJECT)
\u8BE2\u95EE\u5019\u9009\u4EBA\u7684\u9879\u76EE\u7ECF\u9A8C\uFF0C\u4F7F\u7528 STAR \u6CD5\u5219\u5F15\u5BFC\u56DE\u7B54\u3002
\u5173\u6CE8\u9879\u76EE\u4E2D\u7684\u6280\u672F\u9009\u578B\u3001\u96BE\u70B9\u89E3\u51B3\u3001\u56E2\u961F\u534F\u4F5C\u3002
\u8BC4\u4F30\u8981\u70B9\uFF1A\u9879\u76EE\u590D\u6742\u5EA6\u3001\u4E2A\u4EBA\u8D21\u732E\u3001\u6280\u672F\u51B3\u7B56\u80FD\u529B\u3002`,
    report: `\u5F53\u524D\u9636\u6BB5\uFF1A\u9762\u8BD5\u603B\u7ED3\u9636\u6BB5 (REPORT)
\u8BF7\u751F\u6210\u5B8C\u6574\u7684\u9762\u8BD5\u8BC4\u4F30\u62A5\u544A\uFF0C\u5305\u542B\u4EE5\u4E0B\u5185\u5BB9\u7684 JSON \u683C\u5F0F\uFF1A
{
  "overallScore": 75,
  "dimensions": [
    { "name": "\u6280\u672F\u6DF1\u5EA6", "key": "tech_depth", "score": 80 },
    { "name": "\u8868\u8FBE\u80FD\u529B", "key": "expression", "score": 70 },
    { "name": "\u9879\u76EE\u7ECF\u9A8C", "key": "project_exp", "score": 75 },
    { "name": "\u95EE\u9898\u89E3\u51B3", "key": "problem_solving", "score": 80 },
    { "name": "\u5B66\u4E60\u80FD\u529B", "key": "learning", "score": 85 },
    { "name": "\u56E2\u961F\u534F\u4F5C", "key": "teamwork", "score": 70 }
  ],
  "strengths": ["\u4F18\u52BF1", "\u4F18\u52BF2"],
  "weaknesses": ["\u4E0D\u8DB31", "\u4E0D\u8DB32"],
  "summary": "\u603B\u4F53\u8BC4\u4EF7",
  "recommendation": "\u5EFA\u8BAE"
}`
  };
  return `\u4F60\u662F EduAgent \u6A21\u62DF\u9762\u8BD5\u5B98\uFF0C\u6B63\u5728\u5BF9\u5019\u9009\u4EBA\u8FDB\u884C ${position} \u5C97\u4F4D\u7684\u6A21\u62DF\u9762\u8BD5\u3002

## \u9762\u8BD5\u89C4\u5219\uFF1A
1. \u4FDD\u6301\u4E13\u4E1A\u3001\u53CB\u597D\u7684\u9762\u8BD5\u5B98\u6001\u5EA6
2. \u6839\u636E\u5019\u9009\u4EBA\u7684\u56DE\u7B54\u52A8\u6001\u8C03\u6574\u95EE\u9898\u96BE\u5EA6
3. \u6BCF\u6B21\u53EA\u95EE\u4E00\u4E2A\u95EE\u9898\uFF0C\u7B49\u5F85\u5019\u9009\u4EBA\u56DE\u7B54
4. \u9002\u5F53\u7ED9\u4E88\u6B63\u9762\u53CD\u9988\u548C\u5F15\u5BFC

${stageInstructions[stage] || stageInstructions.tech}`;
}
async function interviewAgent(position, stage, messages) {
  const systemPrompt = getInterviewSystemPrompt(position, stage);
  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];
  const result = await invokeLLM({ messages: allMessages });
  const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  let shouldAdvanceStage = false;
  if (stage === "intro" && userMessageCount >= 2) shouldAdvanceStage = true;
  if (stage === "tech" && userMessageCount >= 4) shouldAdvanceStage = true;
  if (stage === "project" && userMessageCount >= 3) shouldAdvanceStage = true;
  return { content, shouldAdvanceStage };
}
async function generateInterviewReport(position, messages) {
  const systemPrompt = getInterviewSystemPrompt(position, "report");
  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
    { role: "user", content: "\u8BF7\u6839\u636E\u4EE5\u4E0A\u9762\u8BD5\u5BF9\u8BDD\u5185\u5BB9\uFF0C\u751F\u6210\u5B8C\u6574\u7684\u9762\u8BD5\u8BC4\u4F30\u62A5\u544A\uFF08JSON\u683C\u5F0F\uFF09\u3002" }
  ];
  const result = await invokeLLM({
    messages: allMessages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "interview_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            dimensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  key: { type: "string" },
                  score: { type: "number" }
                },
                required: ["name", "key", "score"],
                additionalProperties: false
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            recommendation: { type: "string" }
          },
          required: ["overallScore", "dimensions", "strengths", "weaknesses", "summary", "recommendation"],
          additionalProperties: false
        }
      }
    }
  });
  const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { overallScore: 0, dimensions: [], strengths: [], weaknesses: [], summary: content, recommendation: "" };
  }
  const radarData = JSON.stringify(
    (parsed.dimensions || []).map((d) => ({
      dimension: d.name,
      score: d.score,
      fullMark: 100
    }))
  );
  return {
    report: content,
    radarData,
    overallScore: parsed.overallScore || 0
  };
}
var PIPELINE_SYSTEM_PROMPT = `\u4F60\u662F EduAgent \u610F\u56FE\u8BC6\u522B\u52A9\u624B\u3002\u5206\u6790\u7528\u6237\u7684\u8F93\u5165\uFF0C\u5224\u65AD\u9700\u8981\u8C03\u7528\u54EA\u4E9B Agent \u6765\u5B8C\u6210\u4EFB\u52A1\u3002

## \u53EF\u7528 Agent\uFF1A
1. qa - \u667A\u80FD\u95EE\u7B54\uFF1A\u56DE\u7B54\u8BFE\u7A0B\u77E5\u8BC6\u95EE\u9898
2. grading - \u8BD5\u5377\u6279\u6539\uFF1A\u6279\u6539\u8BD5\u5377/\u4F5C\u4E1A
3. resume - \u7B80\u5386\u5BA1\u67E5\uFF1A\u5BA1\u67E5\u548C\u4F18\u5316\u7B80\u5386
4. interview - \u6A21\u62DF\u9762\u8BD5\uFF1A\u8FDB\u884C\u6A21\u62DF\u9762\u8BD5

## \u8F93\u51FA\u683C\u5F0F\uFF08JSON\uFF09\uFF1A
{
  "agents": ["qa"],
  "complexity": 3,
  "reasoning": "\u7528\u6237\u60F3\u8981\u4E86\u89E3\u67D0\u4E2A\u77E5\u8BC6\u70B9\uFF0C\u4F7F\u7528\u95EE\u7B54 Agent \u5373\u53EF"
}

complexity \u5206\u503C 1-10\uFF0C\u8868\u793A\u4EFB\u52A1\u590D\u6742\u5EA6\u3002\u5982\u679C complexity >= 7\uFF0C\u53EF\u80FD\u9700\u8981\u591A\u4E2A Agent \u534F\u540C\u3002`;
async function identifyIntent(userMessage) {
  const messages = [
    { role: "system", content: PIPELINE_SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ];
  const result = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "intent_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            agents: { type: "array", items: { type: "string" } },
            complexity: { type: "number" },
            reasoning: { type: "string" }
          },
          required: ["agents", "complexity", "reasoning"],
          additionalProperties: false
        }
      }
    }
  });
  const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
  try {
    return JSON.parse(content);
  } catch {
    return { agents: ["qa"], complexity: 1, reasoning: "\u9ED8\u8BA4\u4F7F\u7528\u95EE\u7B54 Agent" };
  }
}

// server/questionBank.ts
var OBJECTIVE_QUESTIONS = [
  // ===== 5 道单选题 =====
  {
    id: 1,
    type: "single",
    question: "\u5728 Python \u4E2D\uFF0C\u4EE5\u4E0B\u54EA\u4E2A\u5173\u952E\u5B57\u7528\u4E8E\u5B9A\u4E49\u51FD\u6570\uFF1F",
    options: [
      { key: "A", text: "function" },
      { key: "B", text: "def" },
      { key: "C", text: "func" },
      { key: "D", text: "define" }
    ],
    answer: "B",
    explanation: "Python \u4F7F\u7528 `def` \u5173\u952E\u5B57\u5B9A\u4E49\u51FD\u6570\uFF0C\u4F8B\u5982 `def my_func():` \u3002\u5176\u4ED6\u8BED\u8A00\uFF08\u5982 JavaScript\uFF09\u4F7F\u7528 `function`\uFF0C\u4F46 Python \u4E0D\u652F\u6301\u8BE5\u5199\u6CD5\u3002",
    tags: ["\u51FD\u6570", "\u8BED\u6CD5\u57FA\u7840"]
  },
  {
    id: 2,
    type: "single",
    question: "Python \u4E2D\u5217\u8868\uFF08list\uFF09\u548C\u5143\u7EC4\uFF08tuple\uFF09\u7684\u4E3B\u8981\u533A\u522B\u662F\u4EC0\u4E48\uFF1F",
    options: [
      { key: "A", text: "\u5217\u8868\u53EF\u4EE5\u5B58\u50A8\u591A\u79CD\u6570\u636E\u7C7B\u578B\uFF0C\u5143\u7EC4\u53EA\u80FD\u5B58\u50A8\u540C\u4E00\u79CD" },
      { key: "B", text: "\u5217\u8868\u662F\u53EF\u53D8\u7684\uFF0C\u5143\u7EC4\u662F\u4E0D\u53EF\u53D8\u7684" },
      { key: "C", text: "\u5217\u8868\u4F7F\u7528\u5706\u62EC\u53F7\uFF0C\u5143\u7EC4\u4F7F\u7528\u65B9\u62EC\u53F7" },
      { key: "D", text: "\u5217\u8868\u6BD4\u5143\u7EC4\u5360\u7528\u66F4\u5C11\u7684\u5185\u5B58" }
    ],
    answer: "B",
    explanation: "\u5217\u8868\uFF08list\uFF09\u662F\u53EF\u53D8\u7684\uFF08mutable\uFF09\uFF0C\u521B\u5EFA\u540E\u53EF\u4EE5\u589E\u5220\u6539\u5143\u7D20\uFF1B\u5143\u7EC4\uFF08tuple\uFF09\u662F\u4E0D\u53EF\u53D8\u7684\uFF08immutable\uFF09\uFF0C\u4E00\u65E6\u521B\u5EFA\u5C31\u4E0D\u80FD\u4FEE\u6539\u3002\u4E24\u8005\u90FD\u53EF\u4EE5\u5B58\u50A8\u591A\u79CD\u6570\u636E\u7C7B\u578B\uFF0C\u5217\u8868\u7528 `[]`\uFF0C\u5143\u7EC4\u7528 `()`\u3002",
    tags: ["\u6570\u636E\u7ED3\u6784", "\u5217\u8868", "\u5143\u7EC4"]
  },
  {
    id: 3,
    type: "single",
    question: "\u4EE5\u4E0B\u4EE3\u7801\u7684\u8F93\u51FA\u7ED3\u679C\u662F\u4EC0\u4E48\uFF1F\n\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
    options: [
      { key: "A", text: "[1, 2, 3]" },
      { key: "B", text: "[1, 2, 3, 4]" },
      { key: "C", text: "[1, 2, 3] \u548C [1, 2, 3, 4]" },
      { key: "D", text: "\u62A5\u9519" }
    ],
    answer: "B",
    explanation: "\u5728 Python \u4E2D\uFF0C`y = x` \u662F\u5F15\u7528\u8D4B\u503C\uFF0C`y` \u548C `x` \u6307\u5411\u540C\u4E00\u4E2A\u5217\u8868\u5BF9\u8C61\u3002\u56E0\u6B64\u5BF9 `y` \u7684\u4FEE\u6539\uFF08`append(4)`\uFF09\u4F1A\u540C\u65F6\u5F71\u54CD `x`\uFF0C\u8F93\u51FA\u4E3A `[1, 2, 3, 4]`\u3002\u82E5\u8981\u521B\u5EFA\u72EC\u7ACB\u526F\u672C\uFF0C\u5E94\u4F7F\u7528 `y = x.copy()` \u6216 `y = x[:]`\u3002",
    tags: ["\u5F15\u7528\u8D4B\u503C", "\u5217\u8868", "\u5185\u5B58\u6A21\u578B"]
  },
  {
    id: 4,
    type: "single",
    question: "Python \u4E2D range(1, 10, 2) \u751F\u6210\u7684\u5E8F\u5217\u662F\uFF1F",
    options: [
      { key: "A", text: "1, 2, 3, 4, 5, 6, 7, 8, 9" },
      { key: "B", text: "1, 3, 5, 7, 9" },
      { key: "C", text: "2, 4, 6, 8, 10" },
      { key: "D", text: "1, 3, 5, 7" }
    ],
    answer: "B",
    explanation: "`range(start, stop, step)` \u4ECE start \u5F00\u59CB\uFF0C\u4EE5 step \u4E3A\u6B65\u957F\uFF0C\u5230 stop \u4E4B\u524D\u7ED3\u675F\uFF08\u4E0D\u542B stop\uFF09\u3002`range(1, 10, 2)` \u751F\u6210 1, 3, 5, 7, 9\u3002",
    tags: ["range", "\u5FAA\u73AF", "\u8BED\u6CD5\u57FA\u7840"]
  },
  {
    id: 5,
    type: "single",
    question: "\u4EE5\u4E0B\u54EA\u4E2A\u662F Python \u4E2D\u6B63\u786E\u7684\u5B57\u5178\uFF08dict\uFF09\u521B\u5EFA\u65B9\u5F0F\uFF1F",
    options: [
      { key: "A", text: "d = {1, 2, 3}" },
      { key: "B", text: "d = ['key': 'value']" },
      { key: "C", text: "d = {'name': 'Alice', 'age': 18}" },
      { key: "D", text: "d = ('name', 'Alice')" }
    ],
    answer: "C",
    explanation: "Python \u5B57\u5178\u4F7F\u7528\u82B1\u62EC\u53F7 `{}` \u521B\u5EFA\uFF0C\u683C\u5F0F\u4E3A `{key: value}`\u3002\u9009\u9879 A \u662F\u96C6\u5408\uFF08set\uFF09\uFF0C\u9009\u9879 B \u8BED\u6CD5\u9519\u8BEF\uFF0C\u9009\u9879 D \u662F\u5143\u7EC4\u3002",
    tags: ["\u5B57\u5178", "\u6570\u636E\u7ED3\u6784", "\u8BED\u6CD5\u57FA\u7840"]
  },
  // ===== 5 道多选题 =====
  {
    id: 6,
    type: "multiple",
    question: "\u4EE5\u4E0B\u54EA\u4E9B\u662F Python \u7684\u5185\u7F6E\u6570\u636E\u7C7B\u578B\uFF1F\uFF08\u591A\u9009\uFF09",
    options: [
      { key: "A", text: "int\uFF08\u6574\u6570\uFF09" },
      { key: "B", text: "array\uFF08\u6570\u7EC4\uFF09" },
      { key: "C", text: "str\uFF08\u5B57\u7B26\u4E32\uFF09" },
      { key: "D", text: "dict\uFF08\u5B57\u5178\uFF09" },
      { key: "E", text: "vector\uFF08\u5411\u91CF\uFF09" }
    ],
    answer: ["A", "C", "D"],
    explanation: "Python \u5185\u7F6E\u6570\u636E\u7C7B\u578B\u5305\u62EC\uFF1Aint\u3001float\u3001str\u3001bool\u3001list\u3001tuple\u3001dict\u3001set \u7B49\u3002`array` \u9700\u8981\u901A\u8FC7 `import array` \u5BFC\u5165\uFF0C`vector` \u4E0D\u662F Python \u5185\u7F6E\u7C7B\u578B\uFF08C++ \u4E2D\u6709 vector\uFF09\u3002",
    tags: ["\u6570\u636E\u7C7B\u578B", "\u5185\u7F6E\u7C7B\u578B"]
  },
  {
    id: 7,
    type: "multiple",
    question: "\u5173\u4E8E Python \u7684\u5F02\u5E38\u5904\u7406\uFF0C\u4EE5\u4E0B\u8BF4\u6CD5\u6B63\u786E\u7684\u662F\uFF1F\uFF08\u591A\u9009\uFF09",
    options: [
      { key: "A", text: "try...except \u53EF\u4EE5\u6355\u83B7\u5E76\u5904\u7406\u5F02\u5E38" },
      { key: "B", text: "finally \u5757\u4E2D\u7684\u4EE3\u7801\u65E0\u8BBA\u662F\u5426\u53D1\u751F\u5F02\u5E38\u90FD\u4F1A\u6267\u884C" },
      { key: "C", text: "raise \u8BED\u53E5\u7528\u4E8E\u4E3B\u52A8\u629B\u51FA\u5F02\u5E38" },
      { key: "D", text: "\u4E00\u4E2A try \u5757\u53EA\u80FD\u5BF9\u5E94\u4E00\u4E2A except \u5757" }
    ],
    answer: ["A", "B", "C"],
    explanation: "A\u3001B\u3001C \u5747\u6B63\u786E\u3002D \u9519\u8BEF\uFF1A\u4E00\u4E2A `try` \u5757\u53EF\u4EE5\u5BF9\u5E94\u591A\u4E2A `except` \u5757\uFF0C\u5206\u522B\u5904\u7406\u4E0D\u540C\u7C7B\u578B\u7684\u5F02\u5E38\uFF0C\u4F8B\u5982 `except ValueError:` \u548C `except TypeError:`\u3002",
    tags: ["\u5F02\u5E38\u5904\u7406", "try-except", "\u9519\u8BEF\u5904\u7406"]
  },
  {
    id: 8,
    type: "multiple",
    question: "\u4EE5\u4E0B\u54EA\u4E9B\u65B9\u6CD5\u53EF\u4EE5\u7528\u4E8E\u5B57\u7B26\u4E32\uFF08str\uFF09\u64CD\u4F5C\uFF1F\uFF08\u591A\u9009\uFF09",
    options: [
      { key: "A", text: "split() \u2014 \u5206\u5272\u5B57\u7B26\u4E32" },
      { key: "B", text: "append() \u2014 \u8FFD\u52A0\u5185\u5BB9" },
      { key: "C", text: "strip() \u2014 \u53BB\u9664\u9996\u5C3E\u7A7A\u767D" },
      { key: "D", text: "replace() \u2014 \u66FF\u6362\u5B50\u4E32" },
      { key: "E", text: "pop() \u2014 \u79FB\u9664\u6700\u540E\u4E00\u4E2A\u5B57\u7B26" }
    ],
    answer: ["A", "C", "D"],
    explanation: "`split()`\u3001`strip()`\u3001`replace()` \u90FD\u662F\u5B57\u7B26\u4E32\u7684\u5185\u7F6E\u65B9\u6CD5\u3002`append()` \u662F\u5217\u8868\u7684\u65B9\u6CD5\uFF0C\u5B57\u7B26\u4E32\u6CA1\u6709 `append()`\uFF1B`pop()` \u4E5F\u662F\u5217\u8868/\u5B57\u5178\u7684\u65B9\u6CD5\uFF0C\u5B57\u7B26\u4E32\u4E0D\u53EF\u53D8\uFF0C\u6CA1\u6709 `pop()`\u3002",
    tags: ["\u5B57\u7B26\u4E32", "\u5B57\u7B26\u4E32\u65B9\u6CD5"]
  },
  {
    id: 9,
    type: "multiple",
    question: "\u5173\u4E8E Python \u7684\u9762\u5411\u5BF9\u8C61\u7F16\u7A0B\uFF0C\u4EE5\u4E0B\u8BF4\u6CD5\u6B63\u786E\u7684\u662F\uFF1F\uFF08\u591A\u9009\uFF09",
    options: [
      { key: "A", text: "__init__ \u662F\u7C7B\u7684\u6784\u9020\u65B9\u6CD5\uFF0C\u5728\u521B\u5EFA\u5BF9\u8C61\u65F6\u81EA\u52A8\u8C03\u7528" },
      { key: "B", text: "self \u53C2\u6570\u4EE3\u8868\u7C7B\u672C\u8EAB\uFF0C\u4E0D\u4EE3\u8868\u5B9E\u4F8B" },
      { key: "C", text: "Python \u652F\u6301\u591A\u91CD\u7EE7\u627F" },
      { key: "D", text: "\u5B50\u7C7B\u53EF\u4EE5\u901A\u8FC7 super() \u8C03\u7528\u7236\u7C7B\u7684\u65B9\u6CD5" }
    ],
    answer: ["A", "C", "D"],
    explanation: "A\u3001C\u3001D \u6B63\u786E\u3002B \u9519\u8BEF\uFF1A`self` \u4EE3\u8868\u7C7B\u7684\u5B9E\u4F8B\uFF08\u5BF9\u8C61\uFF09\uFF0C\u4E0D\u662F\u7C7B\u672C\u8EAB\u3002\u7C7B\u672C\u8EAB\u901A\u5E38\u7528 `cls` \u8868\u793A\uFF08\u5728\u7C7B\u65B9\u6CD5\u4E2D\uFF09\u3002",
    tags: ["\u9762\u5411\u5BF9\u8C61", "\u7C7B", "\u7EE7\u627F"]
  },
  {
    id: 10,
    type: "multiple",
    question: "\u4EE5\u4E0B\u54EA\u4E9B\u662F Python \u4E2D\u5408\u6CD5\u7684\u53D8\u91CF\u547D\u540D\uFF1F\uFF08\u591A\u9009\uFF09",
    options: [
      { key: "A", text: "my_variable" },
      { key: "B", text: "2nd_value" },
      { key: "C", text: "_private" },
      { key: "D", text: "class" },
      { key: "E", text: "CamelCase" }
    ],
    answer: ["A", "C", "E"],
    explanation: "Python \u53D8\u91CF\u540D\u89C4\u5219\uFF1A\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\uFF0C\u4E0D\u80FD\u4EE5\u6570\u5B57\u5F00\u5934\uFF0C\u4E0D\u80FD\u4F7F\u7528\u5173\u952E\u5B57\u3002`my_variable`\u3001`_private`\u3001`CamelCase` \u5408\u6CD5\uFF1B`2nd_value` \u4EE5\u6570\u5B57\u5F00\u5934\uFF0C\u975E\u6CD5\uFF1B`class` \u662F Python \u5173\u952E\u5B57\uFF0C\u4E0D\u80FD\u7528\u4F5C\u53D8\u91CF\u540D\u3002",
    tags: ["\u53D8\u91CF\u547D\u540D", "\u8BED\u6CD5\u89C4\u5219", "\u5173\u952E\u5B57"]
  }
];
var SHORT_ANSWER_QUESTIONS = [
  {
    id: 1,
    question: "\u8BF7\u89E3\u91CA Python \u4E2D\u7684\u88C5\u9970\u5668\uFF08Decorator\uFF09\u662F\u4EC0\u4E48\uFF0C\u5E76\u7ED9\u51FA\u4E00\u4E2A\u7B80\u5355\u7684\u4F7F\u7528\u793A\u4F8B\u3002",
    referenceAnswer: `\u88C5\u9970\u5668\u662F Python \u4E2D\u4E00\u79CD\u7279\u6B8A\u7684\u8BED\u6CD5\uFF0C\u7528\u4E8E\u5728\u4E0D\u4FEE\u6539\u539F\u51FD\u6570\u4EE3\u7801\u7684\u60C5\u51B5\u4E0B\uFF0C\u4E3A\u51FD\u6570\u6DFB\u52A0\u989D\u5916\u7684\u529F\u80FD\u3002\u88C5\u9970\u5668\u672C\u8D28\u4E0A\u662F\u4E00\u4E2A\u63A5\u53D7\u51FD\u6570\u4F5C\u4E3A\u53C2\u6570\u5E76\u8FD4\u56DE\u65B0\u51FD\u6570\u7684\u9AD8\u9636\u51FD\u6570\uFF0C\u4F7F\u7528 @ \u7B26\u53F7\u5E94\u7528\u3002

\u793A\u4F8B\uFF1A
def log_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"\u8C03\u7528\u51FD\u6570: {func.__name__}")
        result = func(*args, **kwargs)
        print(f"\u51FD\u6570\u6267\u884C\u5B8C\u6BD5")
        return result
    return wrapper

@log_decorator
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")`,
    scoringPoints: [
      "\u6B63\u786E\u89E3\u91CA\u88C5\u9970\u5668\u7684\u6982\u5FF5\uFF08\u4E0D\u4FEE\u6539\u539F\u51FD\u6570\uFF0C\u6DFB\u52A0\u989D\u5916\u529F\u80FD\uFF09",
      "\u63D0\u5230\u88C5\u9970\u5668\u662F\u9AD8\u9636\u51FD\u6570",
      "\u63D0\u5230\u4F7F\u7528 @ \u7B26\u53F7\u5E94\u7528",
      "\u7ED9\u51FA\u6B63\u786E\u7684\u4EE3\u7801\u793A\u4F8B",
      "\u4EE3\u7801\u793A\u4F8B\u80FD\u6B63\u786E\u8FD0\u884C"
    ],
    maxScore: 10
  },
  {
    id: 2,
    question: "Python \u4E2D\u7684\u5217\u8868\u63A8\u5BFC\u5F0F\uFF08List Comprehension\uFF09\u662F\u4EC0\u4E48\uFF1F\u8BF7\u4E3E\u4F8B\u8BF4\u660E\u5176\u4E0E\u666E\u901A for \u5FAA\u73AF\u7684\u533A\u522B\uFF0C\u5E76\u5206\u6790\u5176\u4F18\u7F3A\u70B9\u3002",
    referenceAnswer: `\u5217\u8868\u63A8\u5BFC\u5F0F\u662F Python \u4E2D\u4E00\u79CD\u7B80\u6D01\u7684\u521B\u5EFA\u5217\u8868\u7684\u65B9\u5F0F\uFF0C\u8BED\u6CD5\u4E3A [expression for item in iterable if condition]\u3002

\u4E0E\u666E\u901A for \u5FAA\u73AF\u7684\u6BD4\u8F83\uFF1A
# \u666E\u901A for \u5FAA\u73AF
squares = []
for i in range(10):
    if i % 2 == 0:
        squares.append(i ** 2)

# \u5217\u8868\u63A8\u5BFC\u5F0F\uFF08\u7B49\u4EF7\u5199\u6CD5\uFF09
squares = [i ** 2 for i in range(10) if i % 2 == 0]

\u4F18\u70B9\uFF1A\u4EE3\u7801\u66F4\u7B80\u6D01\u3001\u6267\u884C\u901F\u5EA6\u901A\u5E38\u6BD4\u7B49\u4EF7\u7684 for \u5FAA\u73AF\u5FEB
\u7F3A\u70B9\uFF1A\u590D\u6742\u903B\u8F91\u65F6\u53EF\u8BFB\u6027\u4E0B\u964D\uFF1B\u5927\u6570\u636E\u91CF\u65F6\u5185\u5B58\u5360\u7528\u9AD8\uFF0C\u6B64\u65F6\u5E94\u4F7F\u7528\u751F\u6210\u5668\u8868\u8FBE\u5F0F`,
    scoringPoints: [
      "\u6B63\u786E\u89E3\u91CA\u5217\u8868\u63A8\u5BFC\u5F0F\u7684\u8BED\u6CD5",
      "\u7ED9\u51FA\u6B63\u786E\u7684\u4EE3\u7801\u793A\u4F8B",
      "\u4E0E for \u5FAA\u73AF\u8FDB\u884C\u5BF9\u6BD4",
      "\u5206\u6790\u4F18\u70B9\uFF08\u7B80\u6D01/\u901F\u5EA6\uFF09",
      "\u5206\u6790\u7F3A\u70B9\uFF08\u590D\u6742\u903B\u8F91/\u5185\u5B58\uFF09"
    ],
    maxScore: 10
  },
  {
    id: 3,
    question: "\u8BF7\u89E3\u91CA Python \u4E2D GIL\uFF08\u5168\u5C40\u89E3\u91CA\u5668\u9501\uFF09\u7684\u6982\u5FF5\uFF0C\u5B83\u5BF9\u591A\u7EBF\u7A0B\u7F16\u7A0B\u6709\u4EC0\u4E48\u5F71\u54CD\uFF1F\u5982\u4F55\u7ED5\u8FC7 GIL \u7684\u9650\u5236\uFF1F",
    referenceAnswer: `GIL\uFF08Global Interpreter Lock\uFF0C\u5168\u5C40\u89E3\u91CA\u5668\u9501\uFF09\u662F CPython \u89E3\u91CA\u5668\u4E2D\u7684\u4E00\u4E2A\u4E92\u65A5\u9501\uFF0C\u5B83\u786E\u4FDD\u540C\u4E00\u65F6\u523B\u53EA\u6709\u4E00\u4E2A\u7EBF\u7A0B\u5728\u6267\u884C Python \u5B57\u8282\u7801\u3002

\u5BF9\u591A\u7EBF\u7A0B\u7684\u5F71\u54CD\uFF1A
1. CPU \u5BC6\u96C6\u578B\u4EFB\u52A1\uFF1A\u591A\u7EBF\u7A0B\u65E0\u6CD5\u771F\u6B63\u5E76\u884C\u6267\u884C\uFF0C\u56E0\u4E3A GIL \u9650\u5236\u4E86\u540C\u65F6\u53EA\u6709\u4E00\u4E2A\u7EBF\u7A0B\u8FD0\u884C
2. I/O \u5BC6\u96C6\u578B\u4EFB\u52A1\uFF1AGIL \u5728 I/O \u7B49\u5F85\u65F6\u4F1A\u91CA\u653E\uFF0C\u56E0\u6B64\u591A\u7EBF\u7A0B\u5BF9 I/O \u5BC6\u96C6\u578B\u4EFB\u52A1\u4ECD\u6709\u6548\u679C

\u7ED5\u8FC7 GIL \u7684\u65B9\u6CD5\uFF1A
1. \u4F7F\u7528 multiprocessing \u6A21\u5757\uFF08\u591A\u8FDB\u7A0B\uFF09\uFF0C\u6BCF\u4E2A\u8FDB\u7A0B\u6709\u72EC\u7ACB\u7684 GIL
2. \u4F7F\u7528 C \u6269\u5C55\uFF08\u5982 NumPy\uFF09\uFF0C\u5728 C \u4EE3\u7801\u4E2D\u53EF\u4EE5\u91CA\u653E GIL
3. \u4F7F\u7528 concurrent.futures.ProcessPoolExecutor \u8FDB\u884C\u8FDB\u7A0B\u6C60\u5E76\u884C
4. \u4F7F\u7528 asyncio \u8FDB\u884C\u5F02\u6B65\u7F16\u7A0B\uFF08\u9002\u5408 I/O \u5BC6\u96C6\u578B\uFF09`,
    scoringPoints: [
      "\u6B63\u786E\u89E3\u91CA GIL \u7684\u5B9A\u4E49",
      "\u8BF4\u660E\u5BF9 CPU \u5BC6\u96C6\u578B\u4EFB\u52A1\u7684\u5F71\u54CD",
      "\u8BF4\u660E\u5BF9 I/O \u5BC6\u96C6\u578B\u4EFB\u52A1\u7684\u5F71\u54CD",
      "\u63D0\u51FA\u81F3\u5C11\u4E24\u79CD\u7ED5\u8FC7 GIL \u7684\u65B9\u6CD5",
      "\u89E3\u91CA\u6E05\u6670\u3001\u903B\u8F91\u4E25\u8C28"
    ],
    maxScore: 10
  }
];
var CODE_QUESTIONS = [
  {
    id: 1,
    title: "\u4E24\u6570\u4E4B\u548C II\uFF08\u53CC\u6307\u9488\uFF09",
    category: "two-pointer",
    categoryLabel: "\u53CC\u6307\u9488",
    difficulty: "medium",
    description: `\u7ED9\u5B9A\u4E00\u4E2A\u5DF2\u6309\u7167\u5347\u5E8F\u6392\u5217\u7684\u6574\u6570\u6570\u7EC4 numbers\uFF0C\u8BF7\u4F60\u4ECE\u6570\u7EC4\u4E2D\u627E\u51FA\u4E24\u4E2A\u6570\u6EE1\u8DB3\u76F8\u52A0\u4E4B\u548C\u7B49\u4E8E\u76EE\u6807\u6570 target\u3002

\u51FD\u6570\u5E94\u8BE5\u4EE5\u957F\u5EA6\u4E3A 2 \u7684\u6574\u6570\u6570\u7EC4\u7684\u5F62\u5F0F\u8FD4\u56DE\u8FD9\u4E24\u4E2A\u6570\u7684\u4E0B\u6807\u503C\u3002numbers \u7684\u4E0B\u6807\u4ECE 1 \u5F00\u59CB\uFF0C\u6240\u4EE5\u7B54\u6848\u6570\u7EC4\u5E94\u5F53\u6EE1\u8DB3 1 <= answer[0] < answer[1] <= numbers.length\u3002

\u4F60\u53EF\u4EE5\u5047\u8BBE\u6BCF\u4E2A\u8F93\u5165\u53EA\u5BF9\u5E94\u552F\u4E00\u7684\u7B54\u6848\uFF0C\u800C\u4E14\u4F60\u4E0D\u53EF\u4EE5\u91CD\u590D\u4F7F\u7528\u76F8\u540C\u7684\u5143\u7D20\u3002

\u8BF7\u4F7F\u7528\u53CC\u6307\u9488\u65B9\u6CD5\u5B9E\u73B0\uFF0C\u65F6\u95F4\u590D\u6742\u5EA6\u8981\u6C42 O(n)\uFF0C\u7A7A\u95F4\u590D\u6742\u5EA6\u8981\u6C42 O(1)\u3002`,
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1, 2]", explanation: "2 + 7 = 9\uFF0C\u5B83\u4EEC\u7684\u4E0B\u6807\u5206\u522B\u4E3A 1 \u548C 2\u3002" },
      { input: "numbers = [2,3,4], target = 6", output: "[1, 3]", explanation: "2 + 4 = 6\uFF0C\u4E0B\u6807\u4E3A 1 \u548C 3\u3002" },
      { input: "numbers = [-1,0], target = -1", output: "[1, 2]", explanation: "-1 + 0 = -1\uFF0C\u4E0B\u6807\u4E3A 1 \u548C 2\u3002" }
    ],
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers \u6309\u975E\u9012\u51CF\u987A\u5E8F\u6392\u5217",
      "-1000 <= target <= 1000",
      "\u4EC5\u5B58\u5728\u4E00\u4E2A\u6709\u6548\u7B54\u6848"
    ],
    hints: [
      "\u4F7F\u7528\u5DE6\u53F3\u4E24\u4E2A\u6307\u9488\uFF0C\u5206\u522B\u6307\u5411\u6570\u7EC4\u9996\u5C3E",
      "\u82E5\u4E24\u6307\u9488\u4E4B\u548C\u7B49\u4E8E target\uFF0C\u8FD4\u56DE\u7ED3\u679C",
      "\u82E5\u548C\u5C0F\u4E8E target\uFF0C\u5DE6\u6307\u9488\u53F3\u79FB\uFF1B\u82E5\u548C\u5927\u4E8E target\uFF0C\u53F3\u6307\u9488\u5DE6\u79FB"
    ],
    referenceCode: {
      python: `def twoSum(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        s = numbers[left] + numbers[right]
        if s == target:
            return [left + 1, right + 1]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []`
    }
  },
  {
    id: 2,
    title: "\u6700\u957F\u516C\u5171\u5B50\u5E8F\u5217\uFF08\u52A8\u6001\u89C4\u5212\uFF09",
    category: "dp",
    categoryLabel: "\u52A8\u6001\u89C4\u5212",
    difficulty: "medium",
    description: `\u7ED9\u5B9A\u4E24\u4E2A\u5B57\u7B26\u4E32 text1 \u548C text2\uFF0C\u8FD4\u56DE\u8FD9\u4E24\u4E2A\u5B57\u7B26\u4E32\u7684\u6700\u957F\u516C\u5171\u5B50\u5E8F\u5217\u7684\u957F\u5EA6\u3002\u5982\u679C\u4E0D\u5B58\u5728\u516C\u5171\u5B50\u5E8F\u5217\uFF0C\u8FD4\u56DE 0\u3002

\u4E00\u4E2A\u5B57\u7B26\u4E32\u7684\u5B50\u5E8F\u5217\u662F\u6307\u8FD9\u6837\u4E00\u4E2A\u65B0\u7684\u5B57\u7B26\u4E32\uFF1A\u5B83\u662F\u7531\u539F\u5B57\u7B26\u4E32\u5728\u4E0D\u6539\u53D8\u5B57\u7B26\u7684\u76F8\u5BF9\u987A\u5E8F\u7684\u60C5\u51B5\u4E0B\u5220\u9664\u67D0\u4E9B\u5B57\u7B26\uFF08\u4E5F\u53EF\u4EE5\u4E0D\u5220\u9664\u4EFB\u4F55\u5B57\u7B26\uFF09\u540E\u7EC4\u6210\u7684\u65B0\u5B57\u7B26\u4E32\u3002

\u4F8B\u5982\uFF0C"ace" \u662F "abcde" \u7684\u5B50\u5E8F\u5217\uFF0C\u4F46 "aec" \u4E0D\u662F "abcde" \u7684\u5B50\u5E8F\u5217\u3002

\u8BF7\u4F7F\u7528\u52A8\u6001\u89C4\u5212\u65B9\u6CD5\u5B9E\u73B0\u3002`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: '\u6700\u957F\u516C\u5171\u5B50\u5E8F\u5217\u662F "ace"\uFF0C\u5B83\u7684\u957F\u5EA6\u4E3A 3\u3002' },
      { input: 'text1 = "abc", text2 = "abc"', output: "3", explanation: '\u6700\u957F\u516C\u5171\u5B50\u5E8F\u5217\u662F "abc"\uFF0C\u5B83\u7684\u957F\u5EA6\u4E3A 3\u3002' },
      { input: 'text1 = "abc", text2 = "def"', output: "0", explanation: "\u4E24\u4E2A\u5B57\u7B26\u4E32\u6CA1\u6709\u516C\u5171\u5B50\u5E8F\u5217\uFF0C\u8FD4\u56DE 0\u3002" }
    ],
    constraints: [
      "1 <= text1.length, text2.length <= 1000",
      "text1 \u548C text2 \u4EC5\u7531\u5C0F\u5199\u82F1\u6587\u5B57\u7B26\u7EC4\u6210"
    ],
    hints: [
      "\u5B9A\u4E49 dp[i][j] \u4E3A text1 \u524D i \u4E2A\u5B57\u7B26\u4E0E text2 \u524D j \u4E2A\u5B57\u7B26\u7684\u6700\u957F\u516C\u5171\u5B50\u5E8F\u5217\u957F\u5EA6",
      "\u82E5 text1[i-1] == text2[j-1]\uFF0C\u5219 dp[i][j] = dp[i-1][j-1] + 1",
      "\u5426\u5219 dp[i][j] = max(dp[i-1][j], dp[i][j-1])"
    ],
    referenceCode: {
      python: `def longestCommonSubsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`
    }
  },
  {
    id: 3,
    title: "\u9664\u81EA\u8EAB\u4EE5\u5916\u6570\u7EC4\u7684\u4E58\u79EF\uFF08\u6570\u7EC4\uFF09",
    category: "array",
    categoryLabel: "\u6570\u7EC4",
    difficulty: "medium",
    description: `\u7ED9\u4F60\u4E00\u4E2A\u6574\u6570\u6570\u7EC4 nums\uFF0C\u8FD4\u56DE\u6570\u7EC4 answer\uFF0C\u5176\u4E2D answer[i] \u7B49\u4E8E nums \u4E2D\u9664 nums[i] \u4E4B\u5916\u5176\u4F59\u5404\u5143\u7D20\u7684\u4E58\u79EF\u3002

\u9898\u76EE\u6570\u636E\u4FDD\u8BC1\u6570\u7EC4 nums \u4E4B\u4E2D\u4EFB\u610F\u5143\u7D20\u7684\u5168\u90E8\u524D\u7F00\u5143\u7D20\u548C\u540E\u7F00\u7684\u4E58\u79EF\u90FD\u5728 32 \u4F4D\u6574\u6570\u8303\u56F4\u5185\u3002

\u8BF7\u4E0D\u8981\u4F7F\u7528\u9664\u6CD5\uFF0C\u4E14\u5728 O(n) \u65F6\u95F4\u590D\u6742\u5EA6\u5185\u5B8C\u6210\u6B64\u9898\u3002

\u8FDB\u9636\uFF1A\u4F60\u53EF\u4EE5\u5728 O(1) \u7684\u989D\u5916\u7A7A\u95F4\u590D\u6742\u5EA6\u5185\u5B8C\u6210\u8FD9\u4E2A\u9898\u76EE\u5417\uFF1F\uFF08\u8F93\u51FA\u6570\u7EC4\u4E0D\u88AB\u89C6\u4E3A\u989D\u5916\u7A7A\u95F4\uFF09`,
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "answer[0]=2*3*4=24, answer[1]=1*3*4=12, answer[2]=1*2*4=8, answer[3]=1*2*3=6" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" }
    ],
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "\u4FDD\u8BC1\u6570\u7EC4 nums \u4E4B\u4E2D\u4EFB\u610F\u5143\u7D20\u7684\u5168\u90E8\u524D\u7F00\u5143\u7D20\u548C\u540E\u7F00\u7684\u4E58\u79EF\u90FD\u5728 32 \u4F4D\u6574\u6570\u8303\u56F4\u5185"
    ],
    hints: [
      "\u5BF9\u4E8E\u6BCF\u4E2A\u5143\u7D20\uFF0C\u5176\u7ED3\u679C = \u5DE6\u4FA7\u6240\u6709\u5143\u7D20\u7684\u4E58\u79EF \xD7 \u53F3\u4FA7\u6240\u6709\u5143\u7D20\u7684\u4E58\u79EF",
      "\u5148\u4ECE\u5DE6\u5230\u53F3\u904D\u5386\uFF0C\u8BA1\u7B97\u6BCF\u4E2A\u4F4D\u7F6E\u5DE6\u4FA7\u7684\u524D\u7F00\u79EF",
      "\u518D\u4ECE\u53F3\u5230\u5DE6\u904D\u5386\uFF0C\u4E58\u4EE5\u53F3\u4FA7\u7684\u540E\u7F00\u79EF"
    ],
    referenceCode: {
      python: `def productExceptSelf(nums):
    n = len(nums)
    answer = [1] * n
    prefix = 1
    for i in range(n):
        answer[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        answer[i] *= suffix
        suffix *= nums[i]
    return answer`
    }
  }
];

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/routers.ts
import { nanoid } from "nanoid";
var teacherProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.eduRole !== "teacher" && ctx.user.eduRole !== "admin" && ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "\u9700\u8981\u6559\u5E08\u6216\u7BA1\u7406\u5458\u6743\u9650" });
  }
  return next({ ctx });
});
var eduAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.eduRole !== "admin" && ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ===== User Management =====
  user: router({
    updateRole: eduAdminProcedure.input(z2.object({ userId: z2.number(), eduRole: z2.enum(["student", "teacher", "admin"]) })).mutation(async ({ input }) => {
      await updateUserEduRole(input.userId, input.eduRole);
      return { success: true };
    }),
    list: eduAdminProcedure.query(async () => {
      return getAllUsers();
    }),
    stats: protectedProcedure.query(async () => {
      return getSystemStats();
    })
  }),
  // ===== Q&A Agent =====
  qa: router({
    conversations: protectedProcedure.query(async ({ ctx }) => {
      return getUserConversations(ctx.user.id);
    }),
    createConversation: protectedProcedure.input(z2.object({ title: z2.string().optional() })).mutation(async ({ ctx, input }) => {
      const id = await createConversation(ctx.user.id, input.title);
      return { id };
    }),
    getMessages: protectedProcedure.input(z2.object({ conversationId: z2.number() })).query(async ({ input }) => {
      return getConversationMessages(input.conversationId);
    }),
    chat: protectedProcedure.input(z2.object({
      conversationId: z2.number(),
      message: z2.string()
    })).mutation(async ({ ctx, input }) => {
      await addChatMessage(input.conversationId, "user", input.message);
      const history = await getConversationMessages(input.conversationId);
      const messages = history.map((m) => ({
        role: m.role,
        content: m.content
      }));
      const keywords = input.message.split(/\s+/).slice(0, 5).join(" ");
      const kbResults = await searchKnowledge(keywords);
      if (kbResults.length > 0) {
        const kbAnswer = kbResults.map((k) => `### ${k.title}

${k.content}`).join("\n\n---\n\n");
        const finalContent = kbAnswer + "\n\n---\n\n> \u6B64\u7B54\u6848\u51FA\u81EA\u4E8E\u77E5\u8BC6\u5E93";
        await addChatMessage(
          input.conversationId,
          "assistant",
          finalContent,
          "high",
          JSON.stringify(kbResults.map((k) => k.title))
        );
        return {
          content: finalContent,
          confidence: "high",
          sources: kbResults.map((k) => k.title)
        };
      }
      const result = await qaAgent(input.message, messages.slice(0, -1));
      await addChatMessage(
        input.conversationId,
        "assistant",
        result.content,
        result.confidence,
        void 0
      );
      if (result.confidence === "low") {
        await addToLowConfidenceQueue(input.message, result.content, result.confidence);
      }
      return {
        content: result.content,
        confidence: result.confidence,
        sources: []
      };
    })
  }),
  // ===== Exam Grading Agent =====
  grading: router({
    submit: protectedProcedure.input(z2.object({
      examTitle: z2.string(),
      examContent: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const id = await createExamGrading(ctx.user.id, input.examTitle, input.examContent);
      if (!id) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u521B\u5EFA\u6279\u6539\u8BB0\u5F55\u5931\u8D25" });
      const result = await gradingAgent(input.examContent);
      await updateExamGrading(id, {
        gradingResult: result.gradingResult,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        weakPoints: result.weakPoints,
        status: "graded"
      });
      return { id, ...result };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserExamGradings(ctx.user.id);
    }),
    listAll: teacherProcedure.query(async () => {
      return getAllExamGradings();
    }),
    review: teacherProcedure.input(z2.object({
      id: z2.number(),
      reviewNote: z2.string().optional(),
      status: z2.enum(["reviewed", "published"])
    })).mutation(async ({ ctx, input }) => {
      await updateExamGrading(input.id, {
        reviewedBy: ctx.user.id,
        reviewNote: input.reviewNote,
        status: input.status
      });
      return { success: true };
    })
  }),
  // ===== Resume Review Agent =====
  resume: router({
    submit: protectedProcedure.input(z2.object({
      resumeText: z2.string(),
      resumeUrl: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const id = await createResumeReview(ctx.user.id, input.resumeText, input.resumeUrl);
      if (!id) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u521B\u5EFA\u7B80\u5386\u5BA1\u67E5\u8BB0\u5F55\u5931\u8D25" });
      const result = await resumeReviewAgent(input.resumeText);
      await updateResumeReview(id, {
        overallScore: result.overallScore,
        dimensionScores: result.dimensionScores,
        suggestions: result.suggestions,
        radarData: result.radarData,
        status: "completed"
      });
      return { id, ...result };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserResumeReviews(ctx.user.id);
    })
  }),
  // ===== Interview Agent =====
  interview: router({
    start: protectedProcedure.input(z2.object({ position: z2.string() })).mutation(async ({ ctx, input }) => {
      const id = await createInterviewSession(ctx.user.id, input.position);
      if (!id) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u521B\u5EFA\u9762\u8BD5\u4F1A\u8BDD\u5931\u8D25" });
      const result = await interviewAgent(input.position, "intro", []);
      await updateInterviewSession(id, {
        messages: JSON.stringify([{ role: "assistant", content: result.content }])
      });
      return { id, message: result.content, stage: "intro" };
    }),
    chat: protectedProcedure.input(z2.object({
      sessionId: z2.number(),
      message: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const session = await getInterviewSession(input.sessionId);
      if (!session) throw new TRPCError3({ code: "NOT_FOUND", message: "\u9762\u8BD5\u4F1A\u8BDD\u4E0D\u5B58\u5728" });
      const existingMessages = JSON.parse(session.messages || "[]");
      existingMessages.push({ role: "user", content: input.message });
      const result = await interviewAgent(
        session.position,
        session.stage,
        existingMessages
      );
      existingMessages.push({ role: "assistant", content: result.content });
      let newStage = session.stage;
      if (result.shouldAdvanceStage) {
        const stageOrder = ["intro", "tech", "project", "report"];
        const currentIndex = stageOrder.indexOf(session.stage);
        if (currentIndex < stageOrder.length - 1) {
          newStage = stageOrder[currentIndex + 1];
        }
      }
      await updateInterviewSession(input.sessionId, {
        messages: JSON.stringify(existingMessages),
        stage: newStage
      });
      return {
        message: result.content,
        stage: newStage,
        shouldAdvanceStage: result.shouldAdvanceStage
      };
    }),
    finish: protectedProcedure.input(z2.object({ sessionId: z2.number() })).mutation(async ({ ctx, input }) => {
      const session = await getInterviewSession(input.sessionId);
      if (!session) throw new TRPCError3({ code: "NOT_FOUND", message: "\u9762\u8BD5\u4F1A\u8BDD\u4E0D\u5B58\u5728" });
      const messages = JSON.parse(session.messages || "[]");
      const reportResult = await generateInterviewReport(session.position, messages);
      await updateInterviewSession(input.sessionId, {
        report: reportResult.report,
        radarData: reportResult.radarData,
        overallScore: reportResult.overallScore,
        status: "completed",
        stage: "report"
      });
      return reportResult;
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserInterviewSessions(ctx.user.id);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getInterviewSession(input.id);
    })
  }),
  // ===== Knowledge Base =====
  knowledge: router({
    list: protectedProcedure.input(z2.object({ approved: z2.boolean().optional() }).optional()).query(async ({ input }) => {
      return getKnowledgeEntries(input?.approved);
    }),
    create: teacherProcedure.input(z2.object({
      title: z2.string(),
      content: z2.string(),
      category: z2.string().optional(),
      tags: z2.string().optional(),
      fileUrl: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const id = await createKnowledgeEntry({
        ...input,
        uploadedBy: ctx.user.id,
        isApproved: ctx.user.eduRole === "admin" || ctx.user.role === "admin"
      });
      return { id };
    }),
    approve: teacherProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await approveKnowledgeEntry(input.id);
      return { success: true };
    }),
    lowConfidence: teacherProcedure.query(async () => {
      return getLowConfidenceQueue();
    }),
    resolveLowConfidence: teacherProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await resolveLowConfidenceItem(input.id, ctx.user.id);
      return { success: true };
    })
  }),
  // ===== File Upload =====
  upload: router({
    file: protectedProcedure.input(z2.object({
      fileName: z2.string(),
      fileData: z2.string(),
      // base64 encoded
      contentType: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const fileKey = `eduagent/${ctx.user.id}/${nanoid()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      return { url, fileKey };
    })
  }),
  // ===== Built-in Question Bank =====
  quiz: router({
    objectiveQuestions: publicProcedure.query(() => {
      return OBJECTIVE_QUESTIONS.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        tags: q.tags
      }));
    }),
    checkObjective: protectedProcedure.input(z2.object({
      questionId: z2.number(),
      answer: z2.union([z2.string(), z2.array(z2.string())])
    })).mutation(async ({ input }) => {
      const q = OBJECTIVE_QUESTIONS.find((q2) => q2.id === input.questionId);
      if (!q) throw new TRPCError3({ code: "NOT_FOUND", message: "\u9898\u76EE\u4E0D\u5B58\u5728" });
      let isCorrect;
      if (q.type === "single") {
        isCorrect = input.answer === q.answer;
      } else {
        const userAnswers = (Array.isArray(input.answer) ? input.answer : [input.answer]).sort();
        const correctAnswers = q.answer.sort();
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
      }
      return { isCorrect, correctAnswer: q.answer, explanation: q.explanation };
    }),
    shortAnswerQuestions: publicProcedure.query(() => {
      return SHORT_ANSWER_QUESTIONS.map((q) => ({
        id: q.id,
        question: q.question,
        maxScore: q.maxScore,
        scoringPoints: q.scoringPoints
      }));
    }),
    gradeShortAnswer: protectedProcedure.input(z2.object({ questionId: z2.number(), userAnswer: z2.string() })).mutation(async ({ input }) => {
      const q = SHORT_ANSWER_QUESTIONS.find((q2) => q2.id === input.questionId);
      if (!q) throw new TRPCError3({ code: "NOT_FOUND", message: "\u9898\u76EE\u4E0D\u5B58\u5728" });
      const systemPrompt = `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684 Python \u7F16\u7A0B\u6559\u5E08\uFF0C\u6B63\u5728\u6279\u6539\u5B66\u751F\u7684\u7B80\u7B54\u9898\u3002
\u8BF7\u6839\u636E\u53C2\u8003\u7B54\u6848\u548C\u8BC4\u5206\u8981\u70B9\uFF0C\u5BF9\u5B66\u751F\u7684\u56DE\u7B54\u8FDB\u884C\u8BC4\u5206\u548C\u70B9\u8BC4\u3002

\u8BC4\u5206\u6807\u51C6\uFF1A
- \u6EE1\u5206\uFF1A${q.maxScore} \u5206
- \u8BC4\u5206\u8981\u70B9\uFF1A${q.scoringPoints.join("\uFF1B")}

\u8BF7\u4EE5 JSON \u683C\u5F0F\u8FD4\u56DE\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
{
  "score": <\u5F97\u5206\uFF0C\u6574\u6570>,
  "maxScore": ${q.maxScore},
  "feedback": "<\u8BE6\u7EC6\u8BC4\u8BED\uFF0C\u6307\u51FA\u7B54\u5BF9\u7684\u70B9\u548C\u9057\u6F0F\u7684\u70B9>",
  "correctPoints": ["<\u7B54\u5BF9\u7684\u8981\u70B91>"],
  "missedPoints": ["<\u9057\u6F0F\u7684\u8981\u70B91>"],
  "suggestion": "<\u6539\u8FDB\u5EFA\u8BAE>"
}`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `\u9898\u76EE\uFF1A${q.question}

\u53C2\u8003\u7B54\u6848\uFF1A${q.referenceAnswer}

\u5B66\u751F\u7B54\u6848\uFF1A${input.userAnswer}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "short_answer_grading",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "integer" },
                maxScore: { type: "integer" },
                feedback: { type: "string" },
                correctPoints: { type: "array", items: { type: "string" } },
                missedPoints: { type: "array", items: { type: "string" } },
                suggestion: { type: "string" }
              },
              required: ["score", "maxScore", "feedback", "correctPoints", "missedPoints", "suggestion"],
              additionalProperties: false
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    }),
    codeQuestions: publicProcedure.query(() => {
      return CODE_QUESTIONS.map((q) => ({
        id: q.id,
        title: q.title,
        category: q.category,
        categoryLabel: q.categoryLabel,
        difficulty: q.difficulty,
        description: q.description,
        examples: q.examples,
        constraints: q.constraints,
        hints: q.hints
      }));
    }),
    gradeCode: protectedProcedure.input(z2.object({ questionId: z2.number(), language: z2.string(), code: z2.string() })).mutation(async ({ input }) => {
      const q = CODE_QUESTIONS.find((q2) => q2.id === input.questionId);
      if (!q) throw new TRPCError3({ code: "NOT_FOUND", message: "\u9898\u76EE\u4E0D\u5B58\u5728" });
      const systemPrompt = `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u7B97\u6CD5\u5DE5\u7A0B\u5E08\u548C\u4EE3\u7801\u8BC4\u5BA1\u4E13\u5BB6\uFF0C\u6B63\u5728\u5BF9\u5B66\u751F\u63D0\u4EA4\u7684\u7B97\u6CD5\u9898\u4EE3\u7801\u8FDB\u884C\u5168\u9762\u8BC4\u5BA1\u3002

\u8BF7\u4ECE\u4EE5\u4E0B\u7EF4\u5EA6\u5BF9\u4EE3\u7801\u8FDB\u884C\u8BE6\u7EC6\u5206\u6790\u548C\u8BC4\u5206\uFF1A
1. \u6B63\u786E\u6027\uFF1A\u4EE3\u7801\u903B\u8F91\u662F\u5426\u6B63\u786E\uFF0C\u80FD\u5426\u901A\u8FC7\u6240\u6709\u6D4B\u8BD5\u7528\u4F8B
2. \u65F6\u95F4\u590D\u6742\u5EA6\uFF1A\u5206\u6790\u7B97\u6CD5\u7684\u65F6\u95F4\u590D\u6742\u5EA6\uFF08\u5927O\u8868\u793A\u6CD5\uFF09\uFF0C\u4E0E\u6700\u4F18\u89E3\u5BF9\u6BD4
3. \u7A7A\u95F4\u590D\u6742\u5EA6\uFF1A\u5206\u6790\u7B97\u6CD5\u7684\u7A7A\u95F4\u590D\u6742\u5EA6\uFF0C\u5185\u5B58\u4F7F\u7528\u662F\u5426\u5408\u7406
4. \u4EE3\u7801\u8D28\u91CF\uFF1A\u53D8\u91CF\u547D\u540D\u3001\u4EE3\u7801\u7ED3\u6784\u3001\u53EF\u8BFB\u6027\u3001\u6CE8\u91CA
5. \u8BED\u6CD5\u89C4\u8303\uFF1A\u662F\u5426\u7B26\u5408 ${input.language} \u8BED\u8A00\u7684\u7F16\u7801\u89C4\u8303\u548C\u6700\u4F73\u5B9E\u8DF5
6. \u8FB9\u754C\u5904\u7406\uFF1A\u662F\u5426\u8003\u8651\u4E86\u7A7A\u6570\u7EC4\u3001\u5355\u5143\u7D20\u3001\u8D1F\u6570\u7B49\u8FB9\u754C\u60C5\u51B5
7. \u4F18\u5316\u5EFA\u8BAE\uFF1A\u662F\u5426\u6709\u66F4\u4F18\u7684\u89E3\u6CD5\u6216\u53EF\u4EE5\u6539\u8FDB\u7684\u5730\u65B9

\u8BF7\u4EE5 JSON \u683C\u5F0F\u8FD4\u56DE\u8BC4\u5BA1\u7ED3\u679C\uFF1A
{
  "overallScore": <\u603B\u5206 0-100>,
  "isCorrect": <\u4EE3\u7801\u903B\u8F91\u662F\u5426\u6B63\u786E true/false>,
  "timeComplexity": "<\u65F6\u95F4\u590D\u6742\u5EA6\uFF0C\u5982 O(n)>",
  "spaceComplexity": "<\u7A7A\u95F4\u590D\u6742\u5EA6\uFF0C\u5982 O(1)>",
  "dimensions": [
    { "name": "\u6B63\u786E\u6027", "score": <0-20>, "maxScore": 20, "comment": "<\u8BC4\u8BED>" },
    { "name": "\u65F6\u95F4\u590D\u6742\u5EA6", "score": <0-20>, "maxScore": 20, "comment": "<\u8BC4\u8BED>" },
    { "name": "\u7A7A\u95F4\u590D\u6742\u5EA6", "score": <0-15>, "maxScore": 15, "comment": "<\u8BC4\u8BED>" },
    { "name": "\u4EE3\u7801\u8D28\u91CF", "score": <0-20>, "maxScore": 20, "comment": "<\u8BC4\u8BED>" },
    { "name": "\u8BED\u6CD5\u89C4\u8303", "score": <0-15>, "maxScore": 15, "comment": "<\u8BC4\u8BED>" },
    { "name": "\u8FB9\u754C\u5904\u7406", "score": <0-10>, "maxScore": 10, "comment": "<\u8BC4\u8BED>" }
  ],
  "syntaxErrors": ["<\u8BED\u6CD5\u9519\u8BEF1>"],
  "logicErrors": ["<\u903B\u8F91\u9519\u8BEF1>"],
  "improvements": ["<\u6539\u8FDB\u5EFA\u8BAE1>", "<\u6539\u8FDB\u5EFA\u8BAE2>"],
  "summary": "<\u603B\u4F53\u8BC4\u4EF7>"
}`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `\u9898\u76EE\uFF1A${q.title}

\u9898\u76EE\u63CF\u8FF0\uFF1A${q.description}

\u793A\u4F8B\uFF1A${JSON.stringify(q.examples)}

\u5B66\u751F\u63D0\u4EA4\u7684 ${input.language} \u4EE3\u7801\uFF1A
${input.code}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "code_grading",
            strict: false,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "integer" },
                isCorrect: { type: "boolean" },
                timeComplexity: { type: "string" },
                spaceComplexity: { type: "string" },
                dimensions: { type: "array", items: { type: "object" } },
                syntaxErrors: { type: "array", items: { type: "string" } },
                logicErrors: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                summary: { type: "string" }
              },
              required: ["overallScore", "isCorrect", "timeComplexity", "spaceComplexity", "dimensions", "syntaxErrors", "logicErrors", "improvements", "summary"]
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    })
  }),
  // ===== Information Feed =====
  feed: router({
    companies: protectedProcedure.query(async () => {
      return getAllCompanies();
    }),
    articles: protectedProcedure.input(z2.object({ limit: z2.number().default(5) })).query(async ({ input }) => {
      return getLatestArticles(input.limit);
    }),
    jobs: protectedProcedure.input(z2.object({ limit: z2.number().default(20) })).query(async ({ input }) => {
      return getLatestJobPostings(input.limit);
    }),
    jobsByCompany: protectedProcedure.input(z2.object({ companyId: z2.number(), limit: z2.number().default(10) })).query(async ({ input }) => {
      return getJobPostingsByCompanyId(input.companyId, input.limit);
    }),
    followedCompanies: protectedProcedure.query(async ({ ctx }) => {
      return getUserFollowedCompanies(ctx.user.id);
    }),
    addFollowedCompany: protectedProcedure.input(z2.object({ companyId: z2.number() })).mutation(async ({ ctx, input }) => {
      const id = await addFollowedCompany(ctx.user.id, input.companyId);
      return { success: !!id, id };
    }),
    removeFollowedCompany: protectedProcedure.input(z2.object({ followedId: z2.number() })).mutation(async ({ ctx, input }) => {
      const success = await removeFollowedCompany(ctx.user.id, input.followedId);
      return { success };
    }),
    followedCompaniesJobs: protectedProcedure.input(z2.object({ limit: z2.number().default(20) })).query(async ({ ctx, input }) => {
      return getFollowedCompaniesJobs(ctx.user.id, input.limit);
    })
  }),
  // ===== Multi-Agent Pipeline =====
  pipeline: router({
    analyze: protectedProcedure.input(z2.object({ message: z2.string() })).mutation(async ({ input }) => {
      return identifyIntent(input.message);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/seedFeedData.ts
var mockCompanies = [
  {
    name: "B\u516C\u53F8",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3EB%3C/text%3E%3C/svg%3E",
    description: "\u9886\u5148\u7684\u4E91\u8BA1\u7B97\u548C AI \u5E73\u53F0\u63D0\u4F9B\u5546",
    website: "https://example-b.com"
  },
  {
    name: "A\u516C\u53F8",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3EA%3C/text%3E%3C/svg%3E",
    description: "\u5168\u7403\u9886\u5148\u7684\u4E92\u8054\u7F51\u79D1\u6280\u516C\u53F8",
    website: "https://example-a.com"
  },
  {
    name: "T\u516C\u53F8",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3ET%3C/text%3E%3C/svg%3E",
    description: "\u4E13\u6CE8\u4E8E\u793E\u4EA4\u548C\u5185\u5BB9\u7684\u79D1\u6280\u4F01\u4E1A",
    website: "https://example-t.com"
  },
  {
    name: "D\u516C\u53F8",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3ED%3C/text%3E%3C/svg%3E",
    description: "\u7535\u5546\u548C\u672C\u5730\u670D\u52A1\u9886\u519B\u4F01\u4E1A",
    website: "https://example-d.com"
  },
  {
    name: "M\u516C\u53F8",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3EM%3C/text%3E%3C/svg%3E",
    description: "\u79FB\u52A8\u4E92\u8054\u7F51\u548C\u6E38\u620F\u9886\u57DF\u7684\u521B\u65B0\u8005",
    website: "https://example-m.com"
  }
];
var mockJobs = [
  // B公司 jobs
  {
    companyId: 1,
    title: "\u9AD8\u7EA7 AI \u7814\u7A76\u5458",
    category: "research",
    location: "\u5317\u4EAC",
    salaryMin: 40,
    salaryMax: 60,
    experience: "3-5\u5E74",
    education: "\u7855\u58EB\u53CA\u4EE5\u4E0A",
    description: "\u6211\u4EEC\u6B63\u5728\u5BFB\u627E\u5177\u6709\u6DF1\u539A AI/ML \u80CC\u666F\u7684\u7814\u7A76\u5458\uFF0C\u53C2\u4E0E\u524D\u6CBF\u7684\u5927\u6A21\u578B\u548C\u591A\u6A21\u6001\u5B66\u4E60\u7814\u7A76\u3002\u4F60\u5C06\u4E0E\u4E16\u754C\u7EA7\u7684\u7814\u7A76\u56E2\u961F\u5408\u4F5C\uFF0C\u5728\u81EA\u7136\u8BED\u8A00\u5904\u7406\u3001\u8BA1\u7B97\u673A\u89C6\u89C9\u7B49\u9886\u57DF\u505A\u51FA\u7A81\u7834\u6027\u8D21\u732E\u3002",
    requirements: "- \u6DF1\u539A\u7684\u673A\u5668\u5B66\u4E60\u7406\u8BBA\u57FA\u7840\n- \u719F\u6089 PyTorch/TensorFlow\n- \u6709\u8BBA\u6587\u53D1\u8868\u6216\u5F00\u6E90\u9879\u76EE\u7ECF\u9A8C\n- \u82F1\u6587\u6C9F\u901A\u80FD\u529B\u5F3A",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 1,
    title: "\u4EA7\u54C1\u7ECF\u7406 - \u4E91\u5E73\u53F0",
    category: "product",
    location: "\u5317\u4EAC",
    salaryMin: 30,
    salaryMax: 45,
    experience: "3-5\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8D1F\u8D23\u4E91\u5E73\u53F0\u4EA7\u54C1\u7684\u89C4\u5212\u548C\u8FED\u4EE3\uFF0C\u4E0E\u6280\u672F\u3001\u8BBE\u8BA1\u3001\u8FD0\u8425\u56E2\u961F\u7D27\u5BC6\u534F\u4F5C\u3002\u4F60\u9700\u8981\u6DF1\u5165\u7406\u89E3\u7528\u6237\u9700\u6C42\uFF0C\u5236\u5B9A\u4EA7\u54C1\u6218\u7565\uFF0C\u63A8\u52A8\u4EA7\u54C1\u7684\u521B\u65B0\u548C\u589E\u957F\u3002",
    requirements: "- 3\u5E74\u4EE5\u4E0A\u4E92\u8054\u7F51\u4EA7\u54C1\u7ECF\u9A8C\n- \u6709 SaaS/\u4E91\u4EA7\u54C1\u7ECF\u9A8C\u4F18\u5148\n- \u6570\u636E\u9A71\u52A8\u7684\u51B3\u7B56\u80FD\u529B\n- \u4F18\u79C0\u7684\u6C9F\u901A\u548C\u534F\u8C03\u80FD\u529B",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 1,
    title: "\u8FD0\u8425\u7ECF\u7406 - \u751F\u6001\u5408\u4F5C",
    category: "operations",
    location: "\u4E0A\u6D77",
    salaryMin: 25,
    salaryMax: 35,
    experience: "2-4\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u7BA1\u7406\u548C\u62D3\u5C55\u4E91\u5E73\u53F0\u7684\u751F\u6001\u5408\u4F5C\u4F19\u4F34\uFF0C\u5305\u62EC\u96C6\u6210\u5546\u3001ISV\u3001\u54A8\u8BE2\u516C\u53F8\u7B49\u3002\u5236\u5B9A\u5408\u4F5C\u7B56\u7565\uFF0C\u652F\u6301\u5408\u4F5C\u4F19\u4F34\u7684\u6210\u529F\uFF0C\u63A8\u52A8\u5E73\u53F0\u7684\u751F\u6001\u7E41\u8363\u3002",
    requirements: "- 2\u5E74\u4EE5\u4E0A\u751F\u6001\u6216\u6E20\u9053\u8FD0\u8425\u7ECF\u9A8C\n- \u5177\u6709\u5546\u52A1\u8C08\u5224\u80FD\u529B\n- \u9879\u76EE\u7BA1\u7406\u80FD\u529B\u5F3A\n- \u80FD\u591F\u627F\u53D7\u51FA\u5DEE",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3)
  },
  // A公司 jobs
  {
    companyId: 2,
    title: "\u673A\u5668\u5B66\u4E60\u5DE5\u7A0B\u5E08",
    category: "research",
    location: "\u676D\u5DDE",
    salaryMin: 35,
    salaryMax: 55,
    experience: "2-5\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u52A0\u5165\u6211\u4EEC\u7684 AI \u56E2\u961F\uFF0C\u5F00\u53D1\u548C\u4F18\u5316\u63A8\u8350\u7B97\u6CD5\u3001\u641C\u7D22\u6392\u5E8F\u6A21\u578B\u7B49\u6838\u5FC3\u7B97\u6CD5\u3002\u4F60\u5C06\u5904\u7406\u6D77\u91CF\u6570\u636E\uFF0C\u89E3\u51B3\u5B9E\u9645\u7684\u4E1A\u52A1\u95EE\u9898\uFF0C\u5E76\u5C06\u7814\u7A76\u6210\u679C\u5E94\u7528\u5230\u6570\u4EBF\u7528\u6237\u7684\u4EA7\u54C1\u4E2D\u3002",
    requirements: "- \u624E\u5B9E\u7684\u7B97\u6CD5\u57FA\u7840\u548C\u6570\u5B66\u529F\u5E95\n- \u719F\u6089\u5E38\u89C1\u7684 ML \u6846\u67B6\n- \u6709\u5927\u89C4\u6A21\u6570\u636E\u5904\u7406\u7ECF\u9A8C\n- \u6709\u63A8\u8350\u7CFB\u7EDF\u6216\u641C\u7D22\u7ECF\u9A8C\u4F18\u5148",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 2,
    title: "\u8D44\u6DF1\u4EA7\u54C1\u7ECF\u7406",
    category: "product",
    location: "\u676D\u5DDE",
    salaryMin: 35,
    salaryMax: 50,
    experience: "5-8\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8D1F\u8D23\u516C\u53F8\u6838\u5FC3\u4EA7\u54C1\u7EBF\u7684\u6218\u7565\u89C4\u5212\u548C\u4EA7\u54C1\u8BBE\u8BA1\u3002\u4F60\u5C06\u5E26\u9886\u4EA7\u54C1\u56E2\u961F\uFF0C\u4ECE\u7528\u6237\u7814\u7A76\u3001\u7ADE\u54C1\u5206\u6790\u5230\u4EA7\u54C1\u53D1\u5E03\uFF0C\u5168\u9762\u638C\u63A7\u4EA7\u54C1\u7684\u751F\u547D\u5468\u671F\u3002",
    requirements: "- 5\u5E74\u4EE5\u4E0A\u4E92\u8054\u7F51\u4EA7\u54C1\u7ECF\u9A8C\n- \u6709\u6210\u529F\u7684\u4EA7\u54C1\u6848\u4F8B\n- \u6570\u636E\u5206\u6790\u80FD\u529B\u5F3A\n- \u5177\u6709\u6218\u7565\u601D\u7EF4\u548C\u521B\u65B0\u610F\u8BC6",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 2,
    title: "\u5185\u5BB9\u8FD0\u8425\u4E13\u5BB6",
    category: "operations",
    location: "\u5317\u4EAC",
    salaryMin: 20,
    salaryMax: 30,
    experience: "2-3\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8D1F\u8D23\u5E73\u53F0\u5185\u5BB9\u7684\u7B56\u5212\u3001\u5BA1\u6838\u548C\u4F18\u5316\u3002\u4E0E\u521B\u4F5C\u8005\u5408\u4F5C\uFF0C\u5236\u5B9A\u5185\u5BB9\u7B56\u7565\uFF0C\u63D0\u5347\u5E73\u53F0\u7684\u5185\u5BB9\u8D28\u91CF\u548C\u7528\u6237\u7C98\u6027\u3002",
    requirements: "- 2\u5E74\u4EE5\u4E0A\u5185\u5BB9\u8FD0\u8425\u7ECF\u9A8C\n- \u5BF9\u70ED\u70B9\u8BDD\u9898\u654F\u611F\n- \u6587\u6848\u80FD\u529B\u5F3A\n- \u5177\u6709\u6570\u636E\u5206\u6790\u610F\u8BC6",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3)
  },
  // T公司 jobs
  {
    companyId: 3,
    title: "\u6DF1\u5EA6\u5B66\u4E60\u7814\u7A76\u5458",
    category: "research",
    location: "\u6DF1\u5733",
    salaryMin: 38,
    salaryMax: 58,
    experience: "3-6\u5E74",
    education: "\u7855\u58EB\u53CA\u4EE5\u4E0A",
    description: "\u7814\u7A76\u548C\u5F00\u53D1\u65B0\u4E00\u4EE3\u7684\u6DF1\u5EA6\u5B66\u4E60\u6A21\u578B\uFF0C\u7279\u522B\u662F\u5728\u89C6\u9891\u7406\u89E3\u3001\u591A\u6A21\u6001\u5B66\u4E60\u7B49\u9886\u57DF\u3002\u4F60\u7684\u7814\u7A76\u5C06\u76F4\u63A5\u5E94\u7528\u5230\u6570\u4EBF\u7528\u6237\u7684\u4EA7\u54C1\u4F53\u9A8C\u4E2D\u3002",
    requirements: "- \u6DF1\u539A\u7684\u6DF1\u5EA6\u5B66\u4E60\u7406\u8BBA\u57FA\u7840\n- \u6709 CVPR/ICCV/NeurIPS \u7B49\u9876\u7EA7\u4F1A\u8BAE\u8BBA\u6587\n- \u719F\u6089 CUDA \u548C GPU \u7F16\u7A0B\n- \u6709\u5F00\u6E90\u8D21\u732E\u7ECF\u9A8C\u4F18\u5148",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 3,
    title: "\u4EA7\u54C1\u8BBE\u8BA1\u7ECF\u7406",
    category: "product",
    location: "\u6DF1\u5733",
    salaryMin: 28,
    salaryMax: 42,
    experience: "3-5\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8BBE\u8BA1\u548C\u4F18\u5316\u7528\u6237\u4F53\u9A8C\uFF0C\u4ECE\u9700\u6C42\u5206\u6790\u3001\u539F\u578B\u8BBE\u8BA1\u5230\u7528\u6237\u6D4B\u8BD5\u3002\u4F60\u5C06\u4E0E\u8BBE\u8BA1\u5E08\u3001\u5DE5\u7A0B\u5E08\u7D27\u5BC6\u5408\u4F5C\uFF0C\u521B\u9020\u4EE4\u4EBA\u60CA\u559C\u7684\u4EA7\u54C1\u4F53\u9A8C\u3002",
    requirements: "- 3\u5E74\u4EE5\u4E0A\u4EA7\u54C1\u8BBE\u8BA1\u7ECF\u9A8C\n- \u719F\u6089\u8BBE\u8BA1\u5DE5\u5177\uFF08Figma/Sketch\uFF09\n- \u7528\u6237\u7814\u7A76\u80FD\u529B\u5F3A\n- \u6709\u6210\u529F\u7684\u4EA7\u54C1\u6848\u4F8B",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 3,
    title: "\u793E\u533A\u8FD0\u8425\u8D1F\u8D23\u4EBA",
    category: "operations",
    location: "\u6DF1\u5733",
    salaryMin: 22,
    salaryMax: 32,
    experience: "2-4\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u5EFA\u8BBE\u548C\u8FD0\u8425\u6D3B\u8DC3\u7684\u793E\u533A\u751F\u6001\uFF0C\u5236\u5B9A\u793E\u533A\u7B56\u7565\uFF0C\u7EC4\u7EC7\u793E\u533A\u6D3B\u52A8\uFF0C\u7EF4\u62A4\u793E\u533A\u79E9\u5E8F\u3002",
    requirements: "- 2\u5E74\u4EE5\u4E0A\u793E\u533A\u6216\u7528\u6237\u8FD0\u8425\u7ECF\u9A8C\n- \u5177\u6709\u521B\u610F\u548C\u6267\u884C\u529B\n- \u6C9F\u901A\u80FD\u529B\u5F3A\n- \u5BF9\u793E\u4EA4\u5A92\u4F53\u654F\u611F",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3)
  },
  // D公司 jobs
  {
    companyId: 4,
    title: "\u7B97\u6CD5\u5DE5\u7A0B\u5E08 - \u63A8\u8350\u7CFB\u7EDF",
    category: "research",
    location: "\u5317\u4EAC",
    salaryMin: 32,
    salaryMax: 50,
    experience: "2-5\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u4F18\u5316\u7535\u5546\u5E73\u53F0\u7684\u63A8\u8350\u7B97\u6CD5\uFF0C\u63D0\u5347\u7528\u6237\u8F6C\u5316\u7387\u548C\u5E73\u53F0 GMV\u3002\u5904\u7406\u6D77\u91CF\u7684\u7528\u6237\u884C\u4E3A\u6570\u636E\uFF0C\u8BBE\u8BA1\u548C\u5B9E\u9A8C\u65B0\u7684\u63A8\u8350\u7B56\u7565\u3002",
    requirements: "- \u624E\u5B9E\u7684\u7B97\u6CD5\u57FA\u7840\n- \u6709\u63A8\u8350\u7CFB\u7EDF\u7ECF\u9A8C\n- \u719F\u6089 A/B \u6D4B\u8BD5\n- \u6709\u5927\u6570\u636E\u5904\u7406\u7ECF\u9A8C",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 4,
    title: "\u5546\u4E1A\u4EA7\u54C1\u7ECF\u7406",
    category: "product",
    location: "\u5317\u4EAC",
    salaryMin: 30,
    salaryMax: 45,
    experience: "3-5\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8D1F\u8D23\u5546\u5BB6\u7AEF\u4EA7\u54C1\u7684\u89C4\u5212\u548C\u8FD0\u8425\uFF0C\u5E2E\u52A9\u5546\u5BB6\u63D0\u5347\u9500\u552E\u6548\u7387\u3002\u4E0E\u5546\u5BB6\u7D27\u5BC6\u6C9F\u901A\uFF0C\u7406\u89E3\u4ED6\u4EEC\u7684\u9700\u6C42\uFF0C\u8BBE\u8BA1\u6EE1\u8DB3\u5E02\u573A\u9700\u6C42\u7684\u4EA7\u54C1\u3002",
    requirements: "- 3\u5E74\u4EE5\u4E0A B2B \u6216\u5E73\u53F0\u4EA7\u54C1\u7ECF\u9A8C\n- \u5177\u6709\u5546\u4E1A\u654F\u611F\u5EA6\n- \u6570\u636E\u5206\u6790\u80FD\u529B\u5F3A\n- \u6709\u6210\u529F\u7684\u4EA7\u54C1\u589E\u957F\u6848\u4F8B",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 4,
    title: "\u7528\u6237\u589E\u957F\u8FD0\u8425",
    category: "operations",
    location: "\u4E0A\u6D77",
    salaryMin: 18,
    salaryMax: 28,
    experience: "1-3\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u5236\u5B9A\u548C\u6267\u884C\u7528\u6237\u589E\u957F\u7B56\u7565\uFF0C\u901A\u8FC7\u591A\u6E20\u9053\u62C9\u65B0\u3001\u7559\u5B58\u548C\u8F6C\u5316\u3002\u5206\u6790\u7528\u6237\u6570\u636E\uFF0C\u4F18\u5316\u8FD0\u8425\u6548\u7387\u3002",
    requirements: "- 1\u5E74\u4EE5\u4E0A\u7528\u6237\u8FD0\u8425\u7ECF\u9A8C\n- \u6570\u636E\u5206\u6790\u80FD\u529B\n- \u5177\u6709\u521B\u610F\u548C\u6267\u884C\u529B\n- \u719F\u6089\u5404\u5927\u5E73\u53F0\u7684\u8FD0\u8425\u89C4\u5219",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3)
  },
  // M公司 jobs
  {
    companyId: 5,
    title: "\u6E38\u620F AI \u7814\u7A76\u5458",
    category: "research",
    location: "\u6210\u90FD",
    salaryMin: 35,
    salaryMax: 52,
    experience: "2-5\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u7814\u7A76\u548C\u5F00\u53D1\u6E38\u620F AI \u6280\u672F\uFF0C\u5305\u62EC NPC \u884C\u4E3A\u3001\u5BF9\u8BDD\u7CFB\u7EDF\u3001\u52A8\u6001\u96BE\u5EA6\u8C03\u6574\u7B49\u3002\u8BA9\u6E38\u620F\u66F4\u52A0\u667A\u80FD\u548C\u6709\u8DA3\u3002",
    requirements: "- \u624E\u5B9E\u7684 AI/ML \u57FA\u7840\n- \u6709\u6E38\u620F\u5F00\u53D1\u7ECF\u9A8C\u4F18\u5148\n- \u719F\u6089 Unity/Unreal\n- \u6709\u6E38\u620F AI \u9879\u76EE\u7ECF\u9A8C",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 5,
    title: "\u6E38\u620F\u5236\u4F5C\u4EBA",
    category: "product",
    location: "\u6210\u90FD",
    salaryMin: 28,
    salaryMax: 42,
    experience: "3-6\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8D1F\u8D23\u6E38\u620F\u7684\u6574\u4F53\u8BBE\u8BA1\u548C\u8FD0\u8425\uFF0C\u4ECE\u6982\u5FF5\u8BBE\u8BA1\u5230\u4E0A\u7EBF\u8FD0\u8425\u3002\u4E0E\u8BBE\u8BA1\u3001\u7F8E\u672F\u3001\u7A0B\u5E8F\u7D27\u5BC6\u5408\u4F5C\uFF0C\u6253\u9020\u7206\u6B3E\u6E38\u620F\u3002",
    requirements: "- 3\u5E74\u4EE5\u4E0A\u6E38\u620F\u5236\u4F5C\u7ECF\u9A8C\n- \u6709\u6210\u529F\u7684\u6E38\u620F\u4E0A\u7EBF\u6848\u4F8B\n- \u5177\u6709\u521B\u610F\u548C\u6267\u884C\u529B\n- \u5BF9\u6E38\u620F\u5E02\u573A\u654F\u611F",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3)
  },
  {
    companyId: 5,
    title: "\u6E38\u620F\u8FD0\u8425\u7ECF\u7406",
    category: "operations",
    location: "\u6210\u90FD",
    salaryMin: 20,
    salaryMax: 30,
    experience: "2-4\u5E74",
    education: "\u672C\u79D1\u53CA\u4EE5\u4E0A",
    description: "\u8D1F\u8D23\u6E38\u620F\u7684\u65E5\u5E38\u8FD0\u8425\uFF0C\u5305\u62EC\u6D3B\u52A8\u7B56\u5212\u3001\u793E\u533A\u7BA1\u7406\u3001\u6570\u636E\u5206\u6790\u7B49\u3002\u63D0\u5347\u6E38\u620F\u7684\u65E5\u6D3B\u548C\u7559\u5B58\u3002",
    requirements: "- 2\u5E74\u4EE5\u4E0A\u6E38\u620F\u8FD0\u8425\u7ECF\u9A8C\n- \u6570\u636E\u5206\u6790\u80FD\u529B\u5F3A\n- \u5177\u6709\u521B\u610F\n- \u5BF9\u6E38\u620F\u793E\u533A\u654F\u611F",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3)
  }
];
var mockArticles = [
  {
    title: "\u5927\u6A21\u578B\u65F6\u4EE3\uFF0CAI \u82AF\u7247\u7684\u65B0\u673A\u9047\u4E0E\u6311\u6218",
    summary: "\u968F\u7740 GPT-4 \u7B49\u5927\u6A21\u578B\u7684\u63A8\u51FA\uFF0CAI \u82AF\u7247\u5E02\u573A\u8FCE\u6765\u65B0\u7684\u53D1\u5C55\u673A\u9047\u3002\u672C\u6587\u5206\u6790\u4E86\u5F53\u524D AI \u82AF\u7247\u7684\u53D1\u5C55\u8D8B\u52BF\uFF0C\u4EE5\u53CA\u56FD\u5185\u5916\u5382\u5546\u7684\u7ADE\u4E89\u683C\u5C40\u3002",
    source: "quantum_bit",
    sourceUrl: "https://www.qbitai.com/article/example1",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3EAI \u82AF\u7247%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3)
  },
  {
    title: "\u591A\u6A21\u6001\u5927\u6A21\u578B\u7684\u7A81\u7834\uFF1A\u4ECE\u6587\u672C\u5230\u89C6\u9891\u7684\u8DE8\u8D8A",
    summary: "\u591A\u6A21\u6001\u5927\u6A21\u578B\u6B63\u5728\u6539\u53D8 AI \u7684\u53D1\u5C55\u65B9\u5411\u3002\u672C\u6587\u4ECB\u7ECD\u4E86\u6700\u65B0\u7684\u591A\u6A21\u6001\u6A21\u578B\u8FDB\u5C55\uFF0C\u4EE5\u53CA\u5B83\u4EEC\u5728\u5B9E\u9645\u5E94\u7528\u4E2D\u7684\u6F5C\u529B\u3002",
    source: "machine_heart",
    sourceUrl: "https://www.jiqizhixin.com/article/example2",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3E\u591A\u6A21\u6001 AI%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3)
  },
  {
    title: "\u5F00\u6E90\u5927\u6A21\u578B\u7684\u5D1B\u8D77\uFF1ALlama 2 vs GPT-4",
    summary: "Meta \u63A8\u51FA\u7684 Llama 2 \u6A21\u578B\u5F15\u53D1\u4E86\u4E1A\u754C\u5173\u4E8E\u5F00\u6E90 vs \u95ED\u6E90\u7684\u65B0\u4E00\u8F6E\u8BA8\u8BBA\u3002\u672C\u6587\u5BF9\u4E24\u8005\u8FDB\u884C\u4E86\u8BE6\u7EC6\u5BF9\u6BD4\u3002",
    source: "quantum_bit",
    sourceUrl: "https://www.qbitai.com/article/example3",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3E\u5F00\u6E90 LLM%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3)
  },
  {
    title: "AI \u5B89\u5168\u4E0E\u5BF9\u9F50\uFF1A\u5982\u4F55\u8BA9 AI \u66F4\u52A0\u53EF\u63A7\uFF1F",
    summary: "\u968F\u7740 AI \u7684\u53D1\u5C55\uFF0C\u5B89\u5168\u548C\u5BF9\u9F50\u95EE\u9898\u53D8\u5F97\u8D8A\u6765\u8D8A\u91CD\u8981\u3002\u672C\u6587\u63A2\u8BA8\u4E86\u5F53\u524D\u7684 AI \u5B89\u5168\u7814\u7A76\u8FDB\u5C55\u3002",
    source: "mind_element",
    sourceUrl: "https://www.xinyuanai.com/article/example4",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3EAI \u5B89\u5168%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3)
  },
  {
    title: "2024 \u5E74 AI \u6295\u878D\u8D44\u8D8B\u52BF\u5206\u6790",
    summary: "\u5C3D\u7BA1\u5927\u73AF\u5883\u5145\u6EE1\u6311\u6218\uFF0CAI \u9886\u57DF\u7684\u6295\u878D\u8D44\u4ECD\u7136\u4FDD\u6301\u70ED\u5EA6\u3002\u672C\u6587\u5206\u6790\u4E86 2024 \u5E74\u7684\u6295\u878D\u8D44\u8D8B\u52BF\u548C\u70ED\u70B9\u9886\u57DF\u3002",
    source: "machine_heart",
    sourceUrl: "https://www.jiqizhixin.com/article/example5",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3E\u6295\u878D\u8D44%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3)
  }
];
async function seedFeedData() {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] Database not available");
    return;
  }
  try {
    const existingCompanies = await db.select().from(companies).limit(1);
    if (existingCompanies.length > 0) {
      console.log("[Seed] Feed data already exists, skipping seed");
      return;
    }
    console.log("[Seed] Inserting companies...");
    for (const company of mockCompanies) {
      await db.insert(companies).values(company);
    }
    console.log("[Seed] Inserting job postings...");
    for (const job of mockJobs) {
      await db.insert(jobPostings).values(job);
    }
    console.log("[Seed] Inserting industry articles...");
    for (const article of mockArticles) {
      await db.insert(industryArticles).values(article);
    }
    console.log("[Seed] Feed data seeded successfully!");
  } catch (error) {
    console.error("[Seed] Error seeding feed data:", error);
  }
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  await seedFeedData();
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  if (process.env.NODE_ENV === "development") {
    registerDevOAuthRoutes(app);
  }
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
