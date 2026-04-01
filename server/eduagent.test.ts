import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    eduRole: "student",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createMockContext({ name: "Alice" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Alice");
    expect(result?.eduRole).toBe("student");
  });

  it("returns null when unauthenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("role-based access control", () => {
  it("student cannot access user.list (admin only)", async () => {
    const ctx = createMockContext({ eduRole: "student", role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.list()).rejects.toThrow();
  });

  it("teacher cannot access user.list (admin only)", async () => {
    const ctx = createMockContext({ eduRole: "teacher", role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.list()).rejects.toThrow();
  });

  it("student cannot access knowledge.create (teacher only)", async () => {
    const ctx = createMockContext({ eduRole: "student", role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.knowledge.create({ title: "Test", content: "Content" })
    ).rejects.toThrow();
  });

  it("student cannot access grading.listAll (teacher only)", async () => {
    const ctx = createMockContext({ eduRole: "student", role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.grading.listAll()).rejects.toThrow();
  });

  it("student cannot access grading.review (teacher only)", async () => {
    const ctx = createMockContext({ eduRole: "student", role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.grading.review({ id: 1, status: "reviewed" })
    ).rejects.toThrow();
  });

  it("student cannot access user.updateRole (admin only)", async () => {
    const ctx = createMockContext({ eduRole: "student", role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.user.updateRole({ userId: 2, eduRole: "teacher" })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot access protected routes", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.qa.conversations()).rejects.toThrow();
    await expect(caller.grading.list()).rejects.toThrow();
    await expect(caller.resume.list()).rejects.toThrow();
    await expect(caller.interview.list()).rejects.toThrow();
  });
});

describe("pipeline.analyze", () => {
  it("returns intent analysis for a simple question", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pipeline.analyze({ message: "什么是机器学习？" });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("agents");
    expect(result).toHaveProperty("complexity");
    expect(Array.isArray(result.agents)).toBe(true);
    expect(typeof result.complexity).toBe("number");
  });
});
