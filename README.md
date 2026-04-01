# EduAgent 教育智能体平台

EduAgent 是一个面向教育场景的多 Agent 智能辅助系统，基于大语言模型（LLM）为学员、教师和管理员提供智能化的学习与教学支持。

## 核心功能

### 四大智能 Agent

| Agent | 功能描述 | 核心技术 |
|-------|---------|---------|
| **智能问答** | 基于 RAG 的课程知识问答 | 三级 Query 理解、多轮对话记忆（10轮滑动窗口）、置信度感知回答 |
| **试卷批改** | 三轨并行批改架构 | 客观题规则匹配、简答题 LLM 语义评分、代码题逻辑分析 |
| **简历审查** | 六维度精准诊断 | 工作经历、技能匹配、项目描述、量化数据、格式排版、表达规范 |
| **模拟面试** | 四阶段状态机设计 | INTRO → TECH → PROJECT → REPORT，双轨并行评估 |

### 三级角色权限系统

- **学员**：使用四大 Agent + 查看个人记录
- **教师**：学员权限 + 审核知识库/批改 + 班级报告 + 上传课程资料
- **管理员**：教师权限 + 用户管理 + 系统配置

### 其他特性

- **多 Agent 串联 Pipeline**：自动识别复杂意图，触发多 Agent 协同完成复合任务
- **知识库管理**：支持课程资料上传、知识点标注、低置信度问题待补充队列
- **能力雷达图可视化**：直观展示简历能力分布和面试表现的多维度评估结果
- **历史记录与报告**：保存学员的问答历史、批改记录、简历审查报告、面试报告

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| **前端** | React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| **后端** | Express 4 + tRPC 11 + Node.js |
| **数据库** | MySQL (TiDB) + Drizzle ORM |
| **AI 引擎** | LLM API (DeepSeek-V3 兼容) |
| **文件存储** | S3 兼容存储 |
| **认证** | Manus OAuth |
| **可视化** | Recharts (雷达图) |

## 项目结构

```
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   │   ├── Home.tsx           # 仪表盘首页
│   │   │   ├── QAChat.tsx         # 智能问答
│   │   │   ├── Grading.tsx        # 试卷批改
│   │   │   ├── ResumeReview.tsx   # 简历审查
│   │   │   ├── Interview.tsx      # 模拟面试
│   │   │   ├── KnowledgeBase.tsx  # 知识库管理
│   │   │   ├── GradingReview.tsx  # 批改审核
│   │   │   ├── AdminUsers.tsx     # 用户管理
│   │   │   └── History.tsx        # 历史记录
│   │   ├── components/     # 可复用组件
│   │   └── App.tsx         # 路由配置
├── server/                 # 后端代码
│   ├── routers.ts          # tRPC 路由
│   ├── db.ts               # 数据库操作
│   ├── agents.ts           # 四大 Agent 核心逻辑
│   ├── llmStream.ts        # LLM 流式输出
│   └── storage.ts          # S3 文件存储
├── drizzle/                # 数据库 Schema
│   └── schema.ts           # 表结构定义
└── shared/                 # 共享类型和常量
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 数据库迁移

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 启动开发服务器

```bash
pnpm dev
```

### 运行测试

```bash
pnpm test
```

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | 数据库连接字符串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `BUILT_IN_FORGE_API_URL` | LLM API 地址 |
| `BUILT_IN_FORGE_API_KEY` | LLM API 密钥 |

## 许可证

MIT License
