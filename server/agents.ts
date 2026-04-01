import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import * as db from "./db";

// ===== Q&A Agent =====
export const QA_SYSTEM_PROMPT = `你是 EduAgent 智能问答助手，一个专业的教育领域 AI 助教。你的职责是回答学员关于课程知识的问题。

## 回答规则：
1. **三级 Query 理解**：
   - 明确问题：直接给出精确答案
   - 模糊问题：先澄清理解，再给出最可能的答案
   - 宽泛问题：提供结构化的知识概览，引导深入学习

2. **置信度感知**：在回答末尾标注置信度等级
   - [高置信度]：答案基于明确的知识点
   - [中置信度]：答案基于推理和关联知识
   - [低置信度]：答案可能不够准确，建议查阅更多资料

3. **回答格式**：使用 Markdown 格式，包含代码块、列表、表格等
4. **多轮对话**：记住上下文，保持对话连贯性
5. **知识库引用**：如果有相关知识库内容，优先引用并标注来源`;

export async function qaAgent(userMessage: string, history: Message[], knowledgeContext?: string): Promise<{ content: string; confidence: string }> {
  const messages: Message[] = [
    { role: "system", content: QA_SYSTEM_PROMPT + (knowledgeContext ? `\n\n## 相关知识库内容：\n${knowledgeContext}` : "") },
    ...history.slice(-20), // 10轮滑动窗口 (user+assistant = 20 messages)
    { role: "user", content: userMessage },
  ];

  const result = await invokeLLM({ messages });
  const content = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : JSON.stringify(result.choices[0].message.content);

  // Extract confidence from response
  let confidence = "medium";
  if (content.includes("[高置信度]") || content.includes("高置信度")) confidence = "high";
  else if (content.includes("[低置信度]") || content.includes("低置信度")) confidence = "low";

  return { content, confidence };
}

// ===== Exam Grading Agent =====
export const GRADING_SYSTEM_PROMPT = `你是 EduAgent 试卷批改助手，负责对学员提交的试卷/作业进行智能批改。

## 批改规则：
1. **三轨并行批改架构**：
   - 客观题：规则匹配，对照标准答案评分
   - 简答题：语义理解评分，关注知识点覆盖度和表达准确性
   - 代码题：分析代码逻辑、正确性、代码风格

2. **评分标准**：
   - 每道题给出得分和满分
   - 提供详细的评分理由
   - 标注知识薄弱点

3. **输出格式**（JSON）：
{
  "questions": [
    {
      "id": 1,
      "type": "objective|subjective|code",
      "score": 8,
      "maxScore": 10,
      "feedback": "评分理由",
      "weakPoints": ["薄弱知识点"]
    }
  ],
  "totalScore": 85,
  "maxScore": 100,
  "weakPoints": ["总体薄弱知识点列表"],
  "summary": "总体评价",
  "suggestions": "改进建议"
}`;

export async function gradingAgent(examContent: string): Promise<{
  gradingResult: string;
  totalScore: number;
  maxScore: number;
  weakPoints: string;
}> {
  const messages: Message[] = [
    { role: "system", content: GRADING_SYSTEM_PROMPT },
    { role: "user", content: `请批改以下试卷/作业内容：\n\n${examContent}` },
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
                  weakPoints: { type: "array", items: { type: "string" } },
                },
                required: ["id", "type", "score", "maxScore", "feedback", "weakPoints"],
                additionalProperties: false,
              },
            },
            totalScore: { type: "number" },
            maxScore: { type: "number" },
            weakPoints: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            suggestions: { type: "string" },
          },
          required: ["questions", "totalScore", "maxScore", "weakPoints", "summary", "suggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : JSON.stringify(result.choices[0].message.content);

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
    weakPoints: JSON.stringify(parsed.weakPoints || []),
  };
}

// ===== Resume Review Agent =====
export const RESUME_SYSTEM_PROMPT = `你是 EduAgent 简历审查助手，负责对学员简历进行六维度精准诊断。

## 六维度评估：
1. **工作经历** (work_experience)：工作经历的完整性、相关性、成长轨迹
2. **技能匹配** (skill_match)：技能与目标岗位的匹配度
3. **项目描述** (project_description)：项目描述的 STAR 法则运用
4. **量化数据** (quantitative_data)：数据量化的使用程度
5. **格式排版** (formatting)：简历格式的专业度
6. **表达规范** (expression)：语言表达的专业性和规范性

## 输出格式（JSON）：
{
  "overallScore": 75,
  "dimensions": [
    { "name": "工作经历", "key": "work_experience", "score": 80, "maxScore": 100, "feedback": "评价" },
    { "name": "技能匹配", "key": "skill_match", "score": 70, "maxScore": 100, "feedback": "评价" },
    { "name": "项目描述", "key": "project_description", "score": 75, "maxScore": 100, "feedback": "评价" },
    { "name": "量化数据", "key": "quantitative_data", "score": 60, "maxScore": 100, "feedback": "评价" },
    { "name": "格式排版", "key": "formatting", "score": 85, "maxScore": 100, "feedback": "评价" },
    { "name": "表达规范", "key": "expression", "score": 80, "maxScore": 100, "feedback": "评价" }
  ],
  "suggestions": [
    { "location": "原文位置", "original": "原文内容", "suggestion": "修改建议", "reason": "修改理由" }
  ],
  "summary": "总体评价"
}`;

export async function resumeReviewAgent(resumeText: string): Promise<{
  overallScore: number;
  dimensionScores: string;
  suggestions: string;
  radarData: string;
}> {
  const messages: Message[] = [
    { role: "system", content: RESUME_SYSTEM_PROMPT },
    { role: "user", content: `请审查以下简历内容：\n\n${resumeText}` },
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
                  feedback: { type: "string" },
                },
                required: ["name", "key", "score", "maxScore", "feedback"],
                additionalProperties: false,
              },
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  original: { type: "string" },
                  suggestion: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["location", "original", "suggestion", "reason"],
                additionalProperties: false,
              },
            },
            summary: { type: "string" },
          },
          required: ["overallScore", "dimensions", "suggestions", "summary"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : JSON.stringify(result.choices[0].message.content);

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { overallScore: 0, dimensions: [], suggestions: [], summary: content };
  }

  const radarData = JSON.stringify(
    (parsed.dimensions || []).map((d: any) => ({
      dimension: d.name,
      score: d.score,
      fullMark: d.maxScore || 100,
    }))
  );

  return {
    overallScore: parsed.overallScore || 0,
    dimensionScores: JSON.stringify(parsed.dimensions || []),
    suggestions: JSON.stringify({ suggestions: parsed.suggestions || [], summary: parsed.summary || "" }),
    radarData,
  };
}

// ===== Interview Agent =====
export function getInterviewSystemPrompt(position: string, stage: string): string {
  const stageInstructions: Record<string, string> = {
    intro: `当前阶段：自我介绍阶段 (INTRO)
请让候选人进行自我介绍，了解其背景、教育经历和职业目标。
提出 1-2 个引导性问题帮助候选人展开介绍。
评估要点：表达清晰度、逻辑性、自信度。`,
    tech: `当前阶段：技术面试阶段 (TECH)
根据候选人应聘的 ${position} 岗位，提出技术相关问题。
每次提出 1 个技术问题，根据回答深度追问。
评估要点：技术深度、问题解决能力、知识广度。`,
    project: `当前阶段：项目经验阶段 (PROJECT)
询问候选人的项目经验，使用 STAR 法则引导回答。
关注项目中的技术选型、难点解决、团队协作。
评估要点：项目复杂度、个人贡献、技术决策能力。`,
    report: `当前阶段：面试总结阶段 (REPORT)
请生成完整的面试评估报告，包含以下内容的 JSON 格式：
{
  "overallScore": 75,
  "dimensions": [
    { "name": "技术深度", "key": "tech_depth", "score": 80 },
    { "name": "表达能力", "key": "expression", "score": 70 },
    { "name": "项目经验", "key": "project_exp", "score": 75 },
    { "name": "问题解决", "key": "problem_solving", "score": 80 },
    { "name": "学习能力", "key": "learning", "score": 85 },
    { "name": "团队协作", "key": "teamwork", "score": 70 }
  ],
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "summary": "总体评价",
  "recommendation": "建议"
}`,
  };

  return `你是 EduAgent 模拟面试官，正在对候选人进行 ${position} 岗位的模拟面试。

## 面试规则：
1. 保持专业、友好的面试官态度
2. 根据候选人的回答动态调整问题难度
3. 每次只问一个问题，等待候选人回答
4. 适当给予正面反馈和引导

${stageInstructions[stage] || stageInstructions.tech}`;
}

export async function interviewAgent(
  position: string,
  stage: string,
  messages: Message[]
): Promise<{ content: string; shouldAdvanceStage: boolean }> {
  const systemPrompt = getInterviewSystemPrompt(position, stage);
  const allMessages: Message[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const result = await invokeLLM({ messages: allMessages });
  const content = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : JSON.stringify(result.choices[0].message.content);

  // Determine if stage should advance based on message count per stage
  const userMessageCount = messages.filter(m => m.role === "user").length;
  let shouldAdvanceStage = false;
  if (stage === "intro" && userMessageCount >= 2) shouldAdvanceStage = true;
  if (stage === "tech" && userMessageCount >= 4) shouldAdvanceStage = true;
  if (stage === "project" && userMessageCount >= 3) shouldAdvanceStage = true;

  return { content, shouldAdvanceStage };
}

export async function generateInterviewReport(
  position: string,
  messages: Message[]
): Promise<{
  report: string;
  radarData: string;
  overallScore: number;
}> {
  const systemPrompt = getInterviewSystemPrompt(position, "report");
  const allMessages: Message[] = [
    { role: "system", content: systemPrompt },
    ...messages,
    { role: "user", content: "请根据以上面试对话内容，生成完整的面试评估报告（JSON格式）。" },
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
                  score: { type: "number" },
                },
                required: ["name", "key", "score"],
                additionalProperties: false,
              },
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            recommendation: { type: "string" },
          },
          required: ["overallScore", "dimensions", "strengths", "weaknesses", "summary", "recommendation"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : JSON.stringify(result.choices[0].message.content);

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { overallScore: 0, dimensions: [], strengths: [], weaknesses: [], summary: content, recommendation: "" };
  }

  const radarData = JSON.stringify(
    (parsed.dimensions || []).map((d: any) => ({
      dimension: d.name,
      score: d.score,
      fullMark: 100,
    }))
  );

  return {
    report: content,
    radarData,
    overallScore: parsed.overallScore || 0,
  };
}

// ===== Multi-Agent Pipeline =====
export const PIPELINE_SYSTEM_PROMPT = `你是 EduAgent 意图识别助手。分析用户的输入，判断需要调用哪些 Agent 来完成任务。

## 可用 Agent：
1. qa - 智能问答：回答课程知识问题
2. grading - 试卷批改：批改试卷/作业
3. resume - 简历审查：审查和优化简历
4. interview - 模拟面试：进行模拟面试

## 输出格式（JSON）：
{
  "agents": ["qa"],
  "complexity": 3,
  "reasoning": "用户想要了解某个知识点，使用问答 Agent 即可"
}

complexity 分值 1-10，表示任务复杂度。如果 complexity >= 7，可能需要多个 Agent 协同。`;

export async function identifyIntent(userMessage: string): Promise<{
  agents: string[];
  complexity: number;
  reasoning: string;
}> {
  const messages: Message[] = [
    { role: "system", content: PIPELINE_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
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
            reasoning: { type: "string" },
          },
          required: ["agents", "complexity", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : JSON.stringify(result.choices[0].message.content);

  try {
    return JSON.parse(content);
  } catch {
    return { agents: ["qa"], complexity: 1, reasoning: "默认使用问答 Agent" };
  }
}
