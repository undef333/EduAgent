# EduAgent 新功能模块计划：信息速递

## 📋 功能概述

**模块名称**: 信息速递 (Information Feed)  
**功能定位**: 为求职者提供行业动态和岗位机会  
**核心价值**: 帮助用户了解行业最新资讯和关注公司的招聘信息  

---

## 🎯 功能需求

### 1. 行业资讯聚合
**数据源**: 量子位、机器之心、心智元等技术媒体  
**展示内容**:
- 文章标题
- 简短摘要 (100-200 字)
- 发布时间
- 来源标识
- 原文链接
- 文章配图 (可选)

**展示数量**: 5 条最新文章  
**更新频率**: 每日或每 6 小时更新一次

### 2. 岗位信息聚合
**功能流程**:
1. 用户可以添加/管理关注的公司列表
2. 系统自动抓取这些公司的最新岗位信息
3. 展示岗位名称、公司、工作地点、薪资范围、发布时间

**数据源**: 
- BOSS 直聘 (通过 API 或爬虫)
- 公司官网招聘页面
- 拉勾网、前程无忧等招聘平台

**展示内容**:
- 岗位名称
- 公司名称
- 工作地点
- 薪资范围
- 工作经验要求
- 发布时间
- 原文链接

---

## 🏗️ 技术架构设计

### 数据库表结构

#### 1. `user_followed_companies` - 用户关注的公司
```sql
CREATE TABLE user_followed_companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  companyName VARCHAR(255) NOT NULL,
  companyId VARCHAR(255),          -- 第三方平台的公司 ID
  source ENUM('boss', 'lagou', '58', 'company_website') NOT NULL,
  companyLogo TEXT,
  companyWebsite TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_company (userId, companyName, source)
);
```

#### 2. `industry_articles` - 行业资讯缓存
```sql
CREATE TABLE industry_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  content TEXT,
  source ENUM('quantum_bit', 'machine_heart', 'mind_element') NOT NULL,
  sourceUrl TEXT NOT NULL UNIQUE,
  imageUrl TEXT,
  publishedAt TIMESTAMP,
  fetchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_source_published (source, publishedAt DESC)
);
```

#### 3. `job_postings` - 岗位信息缓存
```sql
CREATE TABLE job_postings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId VARCHAR(255) NOT NULL,
  companyName VARCHAR(255) NOT NULL,
  jobTitle VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  salaryMin INT,
  salaryMax INT,
  salaryCurrency VARCHAR(10) DEFAULT 'CNY',
  experience VARCHAR(100),
  education VARCHAR(100),
  source ENUM('boss', 'lagou', '58', 'company_website') NOT NULL,
  sourceUrl TEXT NOT NULL,
  jobDescription TEXT,
  requirements TEXT,
  publishedAt TIMESTAMP,
  fetchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_job (jobId, source),
  INDEX idx_company_source (companyName, source),
  INDEX idx_published (publishedAt DESC)
);
```

#### 4. `user_job_preferences` - 用户职位偏好 (可选)
```sql
CREATE TABLE user_job_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  jobTitle VARCHAR(255),
  location VARCHAR(255),
  salaryMin INT,
  salaryMax INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔌 API 设计

### 后端 tRPC 路由

```typescript
// 信息速递模块路由
feed: router({
  // ===== 行业资讯 =====
  articles: protectedProcedure
    .input(z.object({ 
      limit: z.number().default(5),
      source: z.enum(['quantum_bit', 'machine_heart', 'mind_element']).optional()
    }))
    .query(async ({ input }) => {
      // 获取最新行业文章
      // 返回: { articles: Article[] }
    }),

  // ===== 关注公司管理 =====
  followedCompanies: protectedProcedure
    .query(async ({ ctx }) => {
      // 获取用户关注的公司列表
      // 返回: { companies: FollowedCompany[] }
    }),

  addFollowedCompany: protectedProcedure
    .input(z.object({
      companyName: z.string(),
      source: z.enum(['boss', 'lagou', '58', 'company_website']),
      companyId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // 添加关注公司
      // 返回: { success: boolean, id: number }
    }),

  removeFollowedCompany: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 移除关注公司
      // 返回: { success: boolean }
    }),

  // ===== 岗位信息 =====
  jobPostings: protectedProcedure
    .input(z.object({
      companyIds: z.array(z.number()).optional(),
      limit: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      // 获取关注公司的最新岗位
      // 返回: { jobs: JobPosting[] }
    }),

  searchJobs: protectedProcedure
    .input(z.object({
      keyword: z.string(),
      location: z.string().optional(),
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional()
    }))
    .query(async ({ input }) => {
      // 搜索岗位
      // 返回: { jobs: JobPosting[] }
    })
});
```

---

## 🌐 数据源分析

### 1. 行业资讯来源

| 源 | 平台 | 抓取方式 | 难度 | 说明 |
|---|------|--------|------|------|
| **量子位** | https://www.qbitai.com | RSS Feed / 爬虫 | ⭐⭐ | 有 RSS，可直接订阅 |
| **机器之心** | https://www.jiqizhixin.com | RSS Feed / 爬虫 | ⭐⭐ | 有 RSS，可直接订阅 |
| **心智元** | https://www.xinyuanai.com | 爬虫 | ⭐⭐⭐ | 需要爬虫，可能有反爬 |

**推荐方案**: 使用 RSS 订阅 + 定时爬虫更新

### 2. 岗位信息来源

| 源 | 平台 | 抓取方式 | 难度 | 说明 |
|---|------|--------|------|------|
| **BOSS 直聘** | https://www.zhipin.com | API (需申请) / 爬虫 | ⭐⭐⭐⭐ | 有 API，但申请困难；爬虫有反爬 |
| **拉勾网** | https://www.lagou.com | API (需申请) / 爬虫 | ⭐⭐⭐⭐ | 有 API，但需要企业认证 |
| **前程无忧** | https://www.51job.com | 爬虫 | ⭐⭐⭐⭐ | 反爬虫措施强 |
| **公司官网** | 各公司官网 | 爬虫 | ⭐⭐⭐⭐⭐ | 每个公司不同，维护成本高 |

**推荐方案**: 优先使用公开 API，其次使用爬虫 + 代理池

---

## 💻 前端页面设计

### 页面结构

```
/feed (信息速递首页)
├── 顶部导航
│   ├── 标签页: 行业资讯 | 岗位推荐 | 我的关注
│   └── 刷新按钮
├── 【行业资讯】标签页
│   ├── 资讯卡片列表 (5 条)
│   │   ├── 文章标题
│   │   ├── 来源标识 (量子位/机器之心/心智元)
│   │   ├── 发布时间
│   │   ├── 简短摘要
│   │   ├── 配图 (可选)
│   │   └── "阅读原文" 链接
│   └── 更新时间提示
├── 【岗位推荐】标签页
│   ├── 关注公司选择器 (下拉/多选)
│   ├── 岗位卡片列表
│   │   ├── 岗位名称
│   │   ├── 公司名称 + Logo
│   │   ├── 工作地点
│   │   ├── 薪资范围
│   │   ├── 发布时间
│   │   ├── 工作经验要求
│   │   └── "查看详情" 链接
│   └── 分页或无限滚动
└── 【我的关注】标签页
    ├── 关注公司列表
    │   ├── 公司名称 + Logo
    │   ├── 关注时间
    │   ├── 最新岗位数
    │   └── 移除按钮
    ├── 添加公司按钮
    └── 公司搜索框
```

### 前端组件

```
FeedPage (主页面)
├── FeedTabs (标签页容器)
├── ArticleList (资讯列表)
│   └── ArticleCard (单条资讯卡片)
├── JobList (岗位列表)
│   ├── CompanyFilter (公司筛选)
│   └── JobCard (单条岗位卡片)
└── FollowedCompanies (关注公司管理)
    ├── CompanyList (公司列表)
    ├── CompanyCard (单个公司卡片)
    └── AddCompanyDialog (添加公司对话框)
```

---

## 🔄 后端服务架构

### 定时任务 (Cron Jobs)

```typescript
// 每 6 小时更新一次行业资讯
schedule('0 */6 * * *', async () => {
  await updateIndustryArticles();
});

// 每 4 小时更新一次岗位信息
schedule('0 */4 * * *', async () => {
  await updateJobPostings();
});
```

### 数据抓取模块

```
server/
├── scrapers/
│   ├── articleScraper.ts       # 文章抓取器
│   │   ├── quantumBitScraper.ts
│   │   ├── machineHeartScraper.ts
│   │   └── mindElementScraper.ts
│   └── jobScraper.ts           # 岗位抓取器
│       ├── bossScraper.ts
│       ├── lagouScraper.ts
│       └── companyWebsiteScraper.ts
├── jobs/
│   ├── updateArticles.ts       # 文章更新任务
│   └── updateJobs.ts           # 岗位更新任务
└── feed.ts                      # 信息速递数据库操作
```

---

## 📊 可行性评估

### ✅ 可行性高的部分

| 功能 | 可行性 | 理由 |
|------|--------|------|
| **行业资讯聚合** | ✅ 高 | 量子位/机器之心有 RSS，易于订阅；心智元可爬虫 |
| **UI/UX 设计** | ✅ 高 | 基于现有 shadcn/ui 组件库，设计简单 |
| **数据库设计** | ✅ 高 | 表结构清晰，易于扩展 |
| **用户关注公司** | ✅ 高 | 简单的 CRUD 操作 |
| **基础岗位展示** | ✅ 中高 | 需要爬虫或 API，但可行 |

### ⚠️ 需要注意的部分

| 功能 | 风险 | 解决方案 |
|------|------|--------|
| **BOSS 直聘爬虫** | ⚠️ 中 | 反爬虫措施强，需要代理池 + User-Agent 轮换 |
| **拉勾网爬虫** | ⚠️ 中 | 类似 BOSS，需要反爬对策 |
| **公司官网爬虫** | ⚠️ 高 | 每个公司不同，维护成本高 |
| **数据准确性** | ⚠️ 中 | 需要数据清洗和验证 |
| **法律合规** | ⚠️ 中 | 需要遵守各平台的 ToS |

### 🚀 快速实现方案 (MVP)

**第一阶段** (优先级高):
1. ✅ 行业资讯聚合 (RSS + 简单爬虫)
2. ✅ 用户关注公司管理
3. ✅ 基础 UI 页面

**第二阶段** (优先级中):
1. ⏳ BOSS 直聘岗位爬虫 (或使用第三方 API)
2. ⏳ 拉勾网岗位爬虫
3. ⏳ 岗位搜索和筛选

**第三阶段** (优先级低):
1. ⏳ 公司官网爬虫集成
2. ⏳ 智能推荐算法
3. ⏳ 岗位通知提醒

---

## 🛠️ 技术栈选择

### 行业资讯抓取

```typescript
// RSS 订阅
import Parser from 'rss-parser';

// 网页爬虫
import * as cheerio from 'cheerio';
import axios from 'axios';

// 定时任务
import node-cron from 'node-cron';
```

### 岗位信息抓取

```typescript
// 浏览器自动化 (处理 JavaScript 渲染)
import puppeteer from 'puppeteer';

// HTTP 请求
import axios from 'axios';

// 代理管理
import 'proxy-agent';

// 数据解析
import * as cheerio from 'cheerio';
```

### 前端

```typescript
// 已有依赖
- React 19
- Tailwind CSS 4
- shadcn/ui
- Recharts (可选，用于数据可视化)
- Framer Motion (动画)
```

---

## 📈 实现工作量估算

| 任务 | 工作量 | 时间估算 |
|------|--------|---------|
| 数据库表设计和迁移 | ⭐⭐ | 1-2 小时 |
| 行业资讯爬虫 | ⭐⭐⭐ | 2-3 小时 |
| 岗位信息爬虫 (BOSS) | ⭐⭐⭐⭐ | 4-6 小时 |
| 后端 API 和数据库操作 | ⭐⭐⭐ | 3-4 小时 |
| 前端 UI 页面 | ⭐⭐⭐ | 3-4 小时 |
| 定时任务和缓存 | ⭐⭐ | 1-2 小时 |
| 测试和调试 | ⭐⭐⭐ | 2-3 小时 |
| **总计** | | **16-24 小时** |

---

## 🔐 法律和伦理考虑

### 爬虫合规性

1. **遵守 robots.txt**: 检查目标网站的 robots.txt 文件
2. **User-Agent 识别**: 使用合理的 User-Agent
3. **请求频率**: 不过度请求，避免 DDoS 风险
4. **服务条款**: 检查各平台的 ToS 是否允许爬虫
5. **数据隐私**: 不存储个人隐私信息

### 建议

- 优先使用官方 API (如有提供)
- 与平台沟通获取数据授权
- 在 UI 中明确标注数据来源
- 定期检查是否违反 ToS

---

## 📝 实现步骤

### 阶段 1: 基础设施 (2-3 小时)
- [ ] 创建数据库表
- [ ] 设计 tRPC 路由
- [ ] 创建前端页面框架

### 阶段 2: 行业资讯 (2-3 小时)
- [ ] 实现 RSS 订阅器
- [ ] 实现文章爬虫
- [ ] 实现定时更新任务
- [ ] 前端展示逻辑

### 阶段 3: 岗位信息 (4-6 小时)
- [ ] 实现 BOSS 爬虫
- [ ] 实现拉勾爬虫 (可选)
- [ ] 实现岗位搜索
- [ ] 前端展示和筛选

### 阶段 4: 优化和测试 (2-3 小时)
- [ ] 性能优化
- [ ] 错误处理
- [ ] 单元测试
- [ ] 集成测试

---

## 🎯 成功标准

✅ **功能完成**:
- 能够显示最新的行业资讯 (5 条)
- 用户可以添加/移除关注的公司
- 能够显示关注公司的最新岗位
- 岗位信息包含必要字段 (名称、公司、地点、薪资等)

✅ **性能指标**:
- 首页加载时间 < 2 秒
- API 响应时间 < 500ms
- 定时任务不影响主服务性能

✅ **用户体验**:
- UI 美观易用
- 信息展示清晰
- 链接正确可用

---

## 🚨 风险和缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|--------|
| 爬虫被封 IP | 中 | 中 | 使用代理池、降低请求频率 |
| 数据不准确 | 中 | 中 | 数据验证、人工审核 |
| 性能下降 | 低 | 中 | 缓存、异步任务、数据库优化 |
| 法律问题 | 低 | 高 | 遵守 ToS、获取授权 |

---

## 📞 后续决策

**待您确认**:
1. ✅ 是否同意这个功能规划？
2. ✅ 是否需要调整功能范围？
3. ✅ 优先级是否合理？
4. ✅ 是否需要额外的功能？
5. ✅ 何时开始实现？

---

**文档生成时间**: 2026-04-02 GMT+8  
**状态**: 📋 **待审核和批准**
