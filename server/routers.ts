import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { qaAgent, gradingAgent, resumeReviewAgent, interviewAgent, generateInterviewReport, identifyIntent } from "./agents";
import { SHORT_ANSWER_QUESTIONS, CODE_QUESTIONS, OBJECTIVE_QUESTIONS } from "./questionBank";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import { nanoid } from "nanoid";

// Teacher procedure middleware
const teacherProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || (ctx.user.eduRole !== "teacher" && ctx.user.eduRole !== "admin" && ctx.user.role !== "admin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要教师或管理员权限" });
  }
  return next({ ctx });
});

// Edu admin procedure
const eduAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || (ctx.user.eduRole !== "admin" && ctx.user.role !== "admin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理员权限" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== User Management =====
  user: router({
    updateRole: eduAdminProcedure
      .input(z.object({ userId: z.number(), eduRole: z.enum(["student", "teacher", "admin"]) }))
      .mutation(async ({ input }) => {
        await db.updateUserEduRole(input.userId, input.eduRole);
        return { success: true };
      }),
    list: eduAdminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    stats: protectedProcedure.query(async () => {
      return db.getSystemStats();
    }),
  }),

  // ===== Q&A Agent =====
  qa: router({
    conversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),
    createConversation: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createConversation(ctx.user.id, input.title);
        return { id };
      }),
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getConversationMessages(input.conversationId);
      }),
    chat: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await db.addChatMessage(input.conversationId, "user", input.message);

        // Get conversation history
        const history = await db.getConversationMessages(input.conversationId);
        const messages: Message[] = history.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        // Search knowledge base for context
        const keywords = input.message.split(/\s+/).slice(0, 5).join(" ");
        const kbResults = await db.searchKnowledge(keywords);
        const knowledgeContext = kbResults.length > 0
          ? kbResults.map(k => `【${k.title}】${k.content}`).join("\n\n")
          : undefined;

        // Call Q&A Agent
        const result = await qaAgent(input.message, messages.slice(0, -1), knowledgeContext);

        // Save assistant message
        await db.addChatMessage(
          input.conversationId,
          "assistant",
          result.content,
          result.confidence,
          kbResults.length > 0 ? JSON.stringify(kbResults.map(k => k.title)) : undefined
        );

        // Add to low confidence queue if needed
        if (result.confidence === "low") {
          await db.addToLowConfidenceQueue(input.message, result.content, result.confidence);
        }

        return {
          content: result.content,
          confidence: result.confidence,
          sources: kbResults.map(k => k.title),
        };
      }),
  }),

  // ===== Exam Grading Agent =====
  grading: router({
    submit: protectedProcedure
      .input(z.object({
        examTitle: z.string(),
        examContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create grading record
        const id = await db.createExamGrading(ctx.user.id, input.examTitle, input.examContent);
        if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建批改记录失败" });

        // Call grading agent
        const result = await gradingAgent(input.examContent);

        // Update record
        await db.updateExamGrading(id, {
          gradingResult: result.gradingResult,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          weakPoints: result.weakPoints,
          status: "graded",
        });

        return { id, ...result };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserExamGradings(ctx.user.id);
    }),
    listAll: teacherProcedure.query(async () => {
      return db.getAllExamGradings();
    }),
    review: teacherProcedure
      .input(z.object({
        id: z.number(),
        reviewNote: z.string().optional(),
        status: z.enum(["reviewed", "published"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateExamGrading(input.id, {
          reviewedBy: ctx.user.id,
          reviewNote: input.reviewNote,
          status: input.status,
        });
        return { success: true };
      }),
  }),

  // ===== Resume Review Agent =====
  resume: router({
    submit: protectedProcedure
      .input(z.object({
        resumeText: z.string(),
        resumeUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createResumeReview(ctx.user.id, input.resumeText, input.resumeUrl);
        if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建简历审查记录失败" });

        const result = await resumeReviewAgent(input.resumeText);

        await db.updateResumeReview(id, {
          overallScore: result.overallScore,
          dimensionScores: result.dimensionScores,
          suggestions: result.suggestions,
          radarData: result.radarData,
          status: "completed",
        });

        return { id, ...result };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserResumeReviews(ctx.user.id);
    }),
  }),

  // ===== Interview Agent =====
  interview: router({
    start: protectedProcedure
      .input(z.object({ position: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createInterviewSession(ctx.user.id, input.position);
        if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建面试会话失败" });

        // Generate opening message
        const result = await interviewAgent(input.position, "intro", []);

        await db.updateInterviewSession(id, {
          messages: JSON.stringify([{ role: "assistant", content: result.content }]),
        });

        return { id, message: result.content, stage: "intro" };
      }),
    chat: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "面试会话不存在" });

        const existingMessages: Message[] = JSON.parse(session.messages || "[]");
        existingMessages.push({ role: "user", content: input.message });

        const result = await interviewAgent(
          session.position,
          session.stage,
          existingMessages
        );

        existingMessages.push({ role: "assistant", content: result.content });

        let newStage = session.stage;
        if (result.shouldAdvanceStage) {
          const stageOrder = ["intro", "tech", "project", "report"] as const;
          const currentIndex = stageOrder.indexOf(session.stage as any);
          if (currentIndex < stageOrder.length - 1) {
            newStage = stageOrder[currentIndex + 1];
          }
        }

        await db.updateInterviewSession(input.sessionId, {
          messages: JSON.stringify(existingMessages),
          stage: newStage as any,
        });

        return {
          message: result.content,
          stage: newStage,
          shouldAdvanceStage: result.shouldAdvanceStage,
        };
      }),
    finish: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "面试会话不存在" });

        const messages: Message[] = JSON.parse(session.messages || "[]");
        const reportResult = await generateInterviewReport(session.position, messages);

        await db.updateInterviewSession(input.sessionId, {
          report: reportResult.report,
          radarData: reportResult.radarData,
          overallScore: reportResult.overallScore,
          status: "completed",
          stage: "report",
        });

        return reportResult;
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserInterviewSessions(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getInterviewSession(input.id);
      }),
  }),

  // ===== Knowledge Base =====
  knowledge: router({
    list: protectedProcedure
      .input(z.object({ approved: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.getKnowledgeEntries(input?.approved);
      }),
    create: teacherProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
        tags: z.string().optional(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createKnowledgeEntry({
          ...input,
          uploadedBy: ctx.user.id,
          isApproved: ctx.user.eduRole === "admin" || ctx.user.role === "admin",
        });
        return { id };
      }),
    approve: teacherProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.approveKnowledgeEntry(input.id);
        return { success: true };
      }),
    lowConfidence: teacherProcedure.query(async () => {
      return db.getLowConfidenceQueue();
    }),
    resolveLowConfidence: teacherProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.resolveLowConfidenceItem(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== File Upload =====
  upload: router({
    file: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `eduagent/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        return { url, fileKey };
      }),
  }),

  // ===== Built-in Question Bank =====
  quiz: router({
    objectiveQuestions: publicProcedure.query(() => {
      return OBJECTIVE_QUESTIONS.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        tags: q.tags,
      }));
    }),
    checkObjective: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        answer: z.union([z.string(), z.array(z.string())]),
      }))
      .mutation(async ({ input }) => {
        const q = OBJECTIVE_QUESTIONS.find(q => q.id === input.questionId);
        if (!q) throw new TRPCError({ code: "NOT_FOUND", message: "题目不存在" });
        let isCorrect: boolean;
        if (q.type === "single") {
          isCorrect = input.answer === q.answer;
        } else {
          const userAnswers = (Array.isArray(input.answer) ? input.answer : [input.answer]).sort();
          const correctAnswers = (q.answer as string[]).sort();
          isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
        }
        return { isCorrect, correctAnswer: q.answer, explanation: q.explanation };
      }),
    shortAnswerQuestions: publicProcedure.query(() => {
      return SHORT_ANSWER_QUESTIONS.map(q => ({
        id: q.id,
        question: q.question,
        maxScore: q.maxScore,
        scoringPoints: q.scoringPoints,
      }));
    }),
    gradeShortAnswer: protectedProcedure
      .input(z.object({ questionId: z.number(), userAnswer: z.string() }))
      .mutation(async ({ input }) => {
        const q = SHORT_ANSWER_QUESTIONS.find(q => q.id === input.questionId);
        if (!q) throw new TRPCError({ code: "NOT_FOUND", message: "题目不存在" });
        const systemPrompt = `你是一位专业的 Python 编程教师，正在批改学生的简答题。\n请根据参考答案和评分要点，对学生的回答进行评分和点评。\n\n评分标准：\n- 满分：${q.maxScore} 分\n- 评分要点：${q.scoringPoints.join('；')}\n\n请以 JSON 格式返回，格式如下：\n{\n  "score": <得分，整数>,\n  "maxScore": ${q.maxScore},\n  "feedback": "<详细评语，指出答对的点和遗漏的点>",\n  "correctPoints": ["<答对的要点1>"],\n  "missedPoints": ["<遗漏的要点1>"],\n  "suggestion": "<改进建议>"\n}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `题目：${q.question}\n\n参考答案：${q.referenceAnswer}\n\n学生答案：${input.userAnswer}` },
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
                  suggestion: { type: "string" },
                },
                required: ["score", "maxScore", "feedback", "correctPoints", "missedPoints", "suggestion"],
                additionalProperties: false,
              },
            },
          },
        } as any);
        const content = (response.choices[0]?.message?.content as string) || "{}";
        return JSON.parse(content);
      }),
    codeQuestions: publicProcedure.query(() => {
      return CODE_QUESTIONS.map(q => ({
        id: q.id,
        title: q.title,
        category: q.category,
        categoryLabel: q.categoryLabel,
        difficulty: q.difficulty,
        description: q.description,
        examples: q.examples,
        constraints: q.constraints,
        hints: q.hints,
      }));
    }),
    gradeCode: protectedProcedure
      .input(z.object({ questionId: z.number(), language: z.string(), code: z.string() }))
      .mutation(async ({ input }) => {
        const q = CODE_QUESTIONS.find(q => q.id === input.questionId);
        if (!q) throw new TRPCError({ code: "NOT_FOUND", message: "题目不存在" });
        const systemPrompt = `你是一位专业的算法工程师和代码评审专家，正在对学生提交的算法题代码进行全面评审。\n\n请从以下维度对代码进行详细分析和评分：\n1. 正确性：代码逻辑是否正确，能否通过所有测试用例\n2. 时间复杂度：分析算法的时间复杂度（大O表示法），与最优解对比\n3. 空间复杂度：分析算法的空间复杂度，内存使用是否合理\n4. 代码质量：变量命名、代码结构、可读性、注释\n5. 语法规范：是否符合 ${input.language} 语言的编码规范和最佳实践\n6. 边界处理：是否考虑了空数组、单元素、负数等边界情况\n7. 优化建议：是否有更优的解法或可以改进的地方\n\n请以 JSON 格式返回评审结果：\n{\n  "overallScore": <总分 0-100>,\n  "isCorrect": <代码逻辑是否正确 true/false>,\n  "timeComplexity": "<时间复杂度，如 O(n)>",\n  "spaceComplexity": "<空间复杂度，如 O(1)>",\n  "dimensions": [\n    { "name": "正确性", "score": <0-20>, "maxScore": 20, "comment": "<评语>" },\n    { "name": "时间复杂度", "score": <0-20>, "maxScore": 20, "comment": "<评语>" },\n    { "name": "空间复杂度", "score": <0-15>, "maxScore": 15, "comment": "<评语>" },\n    { "name": "代码质量", "score": <0-20>, "maxScore": 20, "comment": "<评语>" },\n    { "name": "语法规范", "score": <0-15>, "maxScore": 15, "comment": "<评语>" },\n    { "name": "边界处理", "score": <0-10>, "maxScore": 10, "comment": "<评语>" }\n  ],\n  "syntaxErrors": ["<语法错误1>"],\n  "logicErrors": ["<逻辑错误1>"],\n  "improvements": ["<改进建议1>", "<改进建议2>"],\n  "summary": "<总体评价>"\n}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `题目：${q.title}\n\n题目描述：${q.description}\n\n示例：${JSON.stringify(q.examples)}\n\n学生提交的 ${input.language} 代码：\n${input.code}` },
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
                  summary: { type: "string" },
                },
                required: ["overallScore", "isCorrect", "timeComplexity", "spaceComplexity", "dimensions", "syntaxErrors", "logicErrors", "improvements", "summary"],
              },
            },
          },
        } as any);
        const content = (response.choices[0]?.message?.content as string) || "{}";
        return JSON.parse(content);
      }),
  }),

  // ===== Multi-Agent Pipeline =====
  pipeline: router({
    analyze: protectedProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input }) => {
        return identifyIntent(input.message);
      }),
  }),
});

export type AppRouter = typeof appRouter;
