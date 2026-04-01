import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  OBJECTIVE_QUESTIONS,
  SHORT_ANSWER_QUESTIONS,
  CODE_QUESTIONS,
  SUPPORTED_LANGUAGES,
} from "./questionBank";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      eduRole: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ===== Question Bank Data Tests =====
describe("questionBank data integrity", () => {
  it("should have exactly 10 objective questions", () => {
    expect(OBJECTIVE_QUESTIONS).toHaveLength(10);
  });

  it("should have 5 single-choice and 5 multiple-choice questions", () => {
    const singles = OBJECTIVE_QUESTIONS.filter(q => q.type === "single");
    const multiples = OBJECTIVE_QUESTIONS.filter(q => q.type === "multiple");
    expect(singles).toHaveLength(5);
    expect(multiples).toHaveLength(5);
  });

  it("single-choice questions should have string answers", () => {
    OBJECTIVE_QUESTIONS.filter(q => q.type === "single").forEach(q => {
      expect(typeof q.answer).toBe("string");
      expect(q.answer as string).toMatch(/^[A-E]$/);
    });
  });

  it("multiple-choice questions should have array answers with 2+ items", () => {
    OBJECTIVE_QUESTIONS.filter(q => q.type === "multiple").forEach(q => {
      expect(Array.isArray(q.answer)).toBe(true);
      expect((q.answer as string[]).length).toBeGreaterThanOrEqual(2);
    });
  });

  it("all objective questions should have options, explanation, and tags", () => {
    OBJECTIVE_QUESTIONS.forEach(q => {
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.explanation).toBeTruthy();
      expect(q.tags.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should have exactly 3 short answer questions", () => {
    expect(SHORT_ANSWER_QUESTIONS).toHaveLength(3);
  });

  it("short answer questions should have scoring points and maxScore", () => {
    SHORT_ANSWER_QUESTIONS.forEach(q => {
      expect(q.scoringPoints.length).toBeGreaterThanOrEqual(3);
      expect(q.maxScore).toBeGreaterThan(0);
      expect(q.referenceAnswer).toBeTruthy();
    });
  });

  it("should have exactly 3 code questions", () => {
    expect(CODE_QUESTIONS).toHaveLength(3);
  });

  it("code questions should cover two-pointer, dp, and array categories", () => {
    const categories = CODE_QUESTIONS.map(q => q.category);
    expect(categories).toContain("two-pointer");
    expect(categories).toContain("dp");
    expect(categories).toContain("array");
  });

  it("code questions should have examples, constraints, and hints", () => {
    CODE_QUESTIONS.forEach(q => {
      expect(q.examples.length).toBeGreaterThanOrEqual(2);
      expect(q.constraints.length).toBeGreaterThanOrEqual(2);
      expect(q.hints && q.hints.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("should support at least 8 programming languages", () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(8);
    const values = SUPPORTED_LANGUAGES.map(l => l.value);
    expect(values).toContain("python");
    expect(values).toContain("java");
    expect(values).toContain("cpp");
  });
});

// ===== API Route Tests =====
describe("quiz.objectiveQuestions", () => {
  it("should return 10 questions without answers or explanations", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const questions = await caller.quiz.objectiveQuestions();
    expect(questions).toHaveLength(10);
    questions.forEach((q: any) => {
      expect(q.answer).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.id).toBeDefined();
      expect(q.type).toBeDefined();
      expect(q.question).toBeDefined();
      expect(q.options).toBeDefined();
    });
  });
});

describe("quiz.checkObjective", () => {
  it("should return correct=true for correct single-choice answer (Q1 = B)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.quiz.checkObjective({ questionId: 1, answer: "B" });
    expect(result.isCorrect).toBe(true);
    expect(result.correctAnswer).toBe("B");
    expect(result.explanation).toBeTruthy();
  });

  it("should return correct=false for wrong single-choice answer", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.quiz.checkObjective({ questionId: 1, answer: "A" });
    expect(result.isCorrect).toBe(false);
    expect(result.explanation).toBeTruthy();
  });

  it("should return correct=true for correct multiple-choice answer (Q6 = A,C,D)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.quiz.checkObjective({ questionId: 6, answer: ["A", "C", "D"] });
    expect(result.isCorrect).toBe(true);
  });

  it("should return correct=false for partial multiple-choice answer", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.quiz.checkObjective({ questionId: 6, answer: ["A", "C"] });
    expect(result.isCorrect).toBe(false);
  });

  it("should throw NOT_FOUND for non-existent question", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.quiz.checkObjective({ questionId: 999, answer: "A" })).rejects.toThrow();
  });

  it("should require authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.quiz.checkObjective({ questionId: 1, answer: "B" })).rejects.toThrow();
  });
});

describe("quiz.shortAnswerQuestions", () => {
  it("should return 3 questions without reference answers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const questions = await caller.quiz.shortAnswerQuestions();
    expect(questions).toHaveLength(3);
    questions.forEach((q: any) => {
      expect(q.referenceAnswer).toBeUndefined();
      expect(q.question).toBeTruthy();
      expect(q.maxScore).toBeGreaterThan(0);
      expect(q.scoringPoints).toBeDefined();
    });
  });
});

describe("quiz.codeQuestions", () => {
  it("should return 3 code questions without reference code", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const questions = await caller.quiz.codeQuestions();
    expect(questions).toHaveLength(3);
    questions.forEach((q: any) => {
      expect(q.referenceCode).toBeUndefined();
      expect(q.title).toBeTruthy();
      expect(q.description).toBeTruthy();
      expect(q.examples).toBeDefined();
    });
  });
});
