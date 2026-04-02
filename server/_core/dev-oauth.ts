/**
 * 开发模式 OAuth 绕过
 * 用于本地开发和测试，允许直接创建测试用户而无需真实 OAuth
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export function registerDevOAuthRoutes(app: Express) {
  // 开发模式：直接创建测试用户并登录
  app.get("/api/dev/login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).json({ error: "Dev login only available in development mode" });
      return;
    }

    try {
      const testUser = {
        openId: "test-user-dev-001",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "dev",
      };

      // 创建或更新测试用户（仅使用现有字段）
      try {
        await db.upsertUser({
          openId: testUser.openId,
          name: testUser.name,
          email: testUser.email,
          loginMethod: testUser.loginMethod,
          lastSignedIn: new Date(),
        });
      } catch (err: any) {
        // 如果 upsertUser 失败，尝试直接插入
        const database = await db.getDb();
        if (database) {
          await database.insert(users).values({
            openId: testUser.openId,
            name: testUser.name,
            email: testUser.email,
            loginMethod: testUser.loginMethod,
            lastSignedIn: new Date(),
          }).onDuplicateKeyUpdate({
            set: {
              name: testUser.name,
              email: testUser.email,
              loginMethod: testUser.loginMethod,
              lastSignedIn: new Date(),
            },
          });
        }
      }

      // 创建会话 token
      const sessionToken = await sdk.createSessionToken(testUser.openId, {
        name: testUser.name,
        expiresInMs: ONE_YEAR_MS,
      });

      // 设置 cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 重定向到首页
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Dev OAuth] Login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  // 开发模式：登出
  app.get("/api/dev/logout", (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).json({ error: "Dev logout only available in development mode" });
      return;
    }

    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect(302, "/");
  });
}
