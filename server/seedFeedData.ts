import { getDb } from "./db";
import { companies, jobPostings, industryArticles } from "../drizzle/schema";

// Mock companies data
const mockCompanies = [
  {
    name: "B公司",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3EB%3C/text%3E%3C/svg%3E",
    description: "领先的云计算和 AI 平台提供商",
    website: "https://example-b.com",
  },
  {
    name: "A公司",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3EA%3C/text%3E%3C/svg%3E",
    description: "全球领先的互联网科技公司",
    website: "https://example-a.com",
  },
  {
    name: "T公司",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3ET%3C/text%3E%3C/svg%3E",
    description: "专注于社交和内容的科技企业",
    website: "https://example-t.com",
  },
  {
    name: "D公司",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3ED%3C/text%3E%3C/svg%3E",
    description: "电商和本地服务领军企业",
    website: "https://example-d.com",
  },
  {
    name: "M公司",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='48' fill='white' text-anchor='middle' font-weight='bold'%3EM%3C/text%3E%3C/svg%3E",
    description: "移动互联网和游戏领域的创新者",
    website: "https://example-m.com",
  },
];

// Mock job postings
const mockJobs = [
  // B公司 jobs
  {
    companyId: 1,
    title: "高级 AI 研究员",
    category: "research" as const,
    location: "北京",
    salaryMin: 40,
    salaryMax: 60,
    experience: "3-5年",
    education: "硕士及以上",
    description:
      "我们正在寻找具有深厚 AI/ML 背景的研究员，参与前沿的大模型和多模态学习研究。你将与世界级的研究团队合作，在自然语言处理、计算机视觉等领域做出突破性贡献。",
    requirements:
      "- 深厚的机器学习理论基础\n- 熟悉 PyTorch/TensorFlow\n- 有论文发表或开源项目经验\n- 英文沟通能力强",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 1,
    title: "产品经理 - 云平台",
    category: "product" as const,
    location: "北京",
    salaryMin: 30,
    salaryMax: 45,
    experience: "3-5年",
    education: "本科及以上",
    description:
      "负责云平台产品的规划和迭代，与技术、设计、运营团队紧密协作。你需要深入理解用户需求，制定产品战略，推动产品的创新和增长。",
    requirements:
      "- 3年以上互联网产品经验\n- 有 SaaS/云产品经验优先\n- 数据驱动的决策能力\n- 优秀的沟通和协调能力",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 1,
    title: "运营经理 - 生态合作",
    category: "operations" as const,
    location: "上海",
    salaryMin: 25,
    salaryMax: 35,
    experience: "2-4年",
    education: "本科及以上",
    description:
      "管理和拓展云平台的生态合作伙伴，包括集成商、ISV、咨询公司等。制定合作策略，支持合作伙伴的成功，推动平台的生态繁荣。",
    requirements:
      "- 2年以上生态或渠道运营经验\n- 具有商务谈判能力\n- 项目管理能力强\n- 能够承受出差",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },

  // A公司 jobs
  {
    companyId: 2,
    title: "机器学习工程师",
    category: "research" as const,
    location: "杭州",
    salaryMin: 35,
    salaryMax: 55,
    experience: "2-5年",
    education: "本科及以上",
    description:
      "加入我们的 AI 团队，开发和优化推荐算法、搜索排序模型等核心算法。你将处理海量数据，解决实际的业务问题，并将研究成果应用到数亿用户的产品中。",
    requirements:
      "- 扎实的算法基础和数学功底\n- 熟悉常见的 ML 框架\n- 有大规模数据处理经验\n- 有推荐系统或搜索经验优先",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 2,
    title: "资深产品经理",
    category: "product" as const,
    location: "杭州",
    salaryMin: 35,
    salaryMax: 50,
    experience: "5-8年",
    education: "本科及以上",
    description:
      "负责公司核心产品线的战略规划和产品设计。你将带领产品团队，从用户研究、竞品分析到产品发布，全面掌控产品的生命周期。",
    requirements:
      "- 5年以上互联网产品经验\n- 有成功的产品案例\n- 数据分析能力强\n- 具有战略思维和创新意识",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 2,
    title: "内容运营专家",
    category: "operations" as const,
    location: "北京",
    salaryMin: 20,
    salaryMax: 30,
    experience: "2-3年",
    education: "本科及以上",
    description:
      "负责平台内容的策划、审核和优化。与创作者合作，制定内容策略，提升平台的内容质量和用户粘性。",
    requirements:
      "- 2年以上内容运营经验\n- 对热点话题敏感\n- 文案能力强\n- 具有数据分析意识",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },

  // T公司 jobs
  {
    companyId: 3,
    title: "深度学习研究员",
    category: "research" as const,
    location: "深圳",
    salaryMin: 38,
    salaryMax: 58,
    experience: "3-6年",
    education: "硕士及以上",
    description:
      "研究和开发新一代的深度学习模型，特别是在视频理解、多模态学习等领域。你的研究将直接应用到数亿用户的产品体验中。",
    requirements:
      "- 深厚的深度学习理论基础\n- 有 CVPR/ICCV/NeurIPS 等顶级会议论文\n- 熟悉 CUDA 和 GPU 编程\n- 有开源贡献经验优先",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 3,
    title: "产品设计经理",
    category: "product" as const,
    location: "深圳",
    salaryMin: 28,
    salaryMax: 42,
    experience: "3-5年",
    education: "本科及以上",
    description:
      "设计和优化用户体验，从需求分析、原型设计到用户测试。你将与设计师、工程师紧密合作，创造令人惊喜的产品体验。",
    requirements:
      "- 3年以上产品设计经验\n- 熟悉设计工具（Figma/Sketch）\n- 用户研究能力强\n- 有成功的产品案例",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 3,
    title: "社区运营负责人",
    category: "operations" as const,
    location: "深圳",
    salaryMin: 22,
    salaryMax: 32,
    experience: "2-4年",
    education: "本科及以上",
    description:
      "建设和运营活跃的社区生态，制定社区策略，组织社区活动，维护社区秩序。",
    requirements:
      "- 2年以上社区或用户运营经验\n- 具有创意和执行力\n- 沟通能力强\n- 对社交媒体敏感",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },

  // D公司 jobs
  {
    companyId: 4,
    title: "算法工程师 - 推荐系统",
    category: "research" as const,
    location: "北京",
    salaryMin: 32,
    salaryMax: 50,
    experience: "2-5年",
    education: "本科及以上",
    description:
      "优化电商平台的推荐算法，提升用户转化率和平台 GMV。处理海量的用户行为数据，设计和实验新的推荐策略。",
    requirements:
      "- 扎实的算法基础\n- 有推荐系统经验\n- 熟悉 A/B 测试\n- 有大数据处理经验",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 4,
    title: "商业产品经理",
    category: "product" as const,
    location: "北京",
    salaryMin: 30,
    salaryMax: 45,
    experience: "3-5年",
    education: "本科及以上",
    description:
      "负责商家端产品的规划和运营，帮助商家提升销售效率。与商家紧密沟通，理解他们的需求，设计满足市场需求的产品。",
    requirements:
      "- 3年以上 B2B 或平台产品经验\n- 具有商业敏感度\n- 数据分析能力强\n- 有成功的产品增长案例",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 4,
    title: "用户增长运营",
    category: "operations" as const,
    location: "上海",
    salaryMin: 18,
    salaryMax: 28,
    experience: "1-3年",
    education: "本科及以上",
    description:
      "制定和执行用户增长策略，通过多渠道拉新、留存和转化。分析用户数据，优化运营效率。",
    requirements:
      "- 1年以上用户运营经验\n- 数据分析能力\n- 具有创意和执行力\n- 熟悉各大平台的运营规则",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },

  // M公司 jobs
  {
    companyId: 5,
    title: "游戏 AI 研究员",
    category: "research" as const,
    location: "成都",
    salaryMin: 35,
    salaryMax: 52,
    experience: "2-5年",
    education: "本科及以上",
    description:
      "研究和开发游戏 AI 技术，包括 NPC 行为、对话系统、动态难度调整等。让游戏更加智能和有趣。",
    requirements:
      "- 扎实的 AI/ML 基础\n- 有游戏开发经验优先\n- 熟悉 Unity/Unreal\n- 有游戏 AI 项目经验",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 5,
    title: "游戏制作人",
    category: "product" as const,
    location: "成都",
    salaryMin: 28,
    salaryMax: 42,
    experience: "3-6年",
    education: "本科及以上",
    description:
      "负责游戏的整体设计和运营，从概念设计到上线运营。与设计、美术、程序紧密合作，打造爆款游戏。",
    requirements:
      "- 3年以上游戏制作经验\n- 有成功的游戏上线案例\n- 具有创意和执行力\n- 对游戏市场敏感",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    companyId: 5,
    title: "游戏运营经理",
    category: "operations" as const,
    location: "成都",
    salaryMin: 20,
    salaryMax: 30,
    experience: "2-4年",
    education: "本科及以上",
    description:
      "负责游戏的日常运营，包括活动策划、社区管理、数据分析等。提升游戏的日活和留存。",
    requirements:
      "- 2年以上游戏运营经验\n- 数据分析能力强\n- 具有创意\n- 对游戏社区敏感",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// Mock industry articles
const mockArticles = [
  {
    title: "大模型时代，AI 芯片的新机遇与挑战",
    summary:
      "随着 GPT-4 等大模型的推出，AI 芯片市场迎来新的发展机遇。本文分析了当前 AI 芯片的发展趋势，以及国内外厂商的竞争格局。",
    source: "quantum_bit" as const,
    sourceUrl: "https://www.qbitai.com/article/example1",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3EAI 芯片%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    title: "多模态大模型的突破：从文本到视频的跨越",
    summary:
      "多模态大模型正在改变 AI 的发展方向。本文介绍了最新的多模态模型进展，以及它们在实际应用中的潜力。",
    source: "machine_heart" as const,
    sourceUrl: "https://www.jiqizhixin.com/article/example2",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3E多模态 AI%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: "开源大模型的崛起：Llama 2 vs GPT-4",
    summary:
      "Meta 推出的 Llama 2 模型引发了业界关于开源 vs 闭源的新一轮讨论。本文对两者进行了详细对比。",
    source: "quantum_bit" as const,
    sourceUrl: "https://www.qbitai.com/article/example3",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3E开源 LLM%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    title: "AI 安全与对齐：如何让 AI 更加可控？",
    summary:
      "随着 AI 的发展，安全和对齐问题变得越来越重要。本文探讨了当前的 AI 安全研究进展。",
    source: "mind_element" as const,
    sourceUrl: "https://www.xinyuanai.com/article/example4",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3EAI 安全%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    title: "2024 年 AI 投融资趋势分析",
    summary:
      "尽管大环境充满挑战，AI 领域的投融资仍然保持热度。本文分析了 2024 年的投融资趋势和热点领域。",
    source: "machine_heart" as const,
    sourceUrl: "https://www.jiqizhixin.com/article/example5",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23E0E7FF' width='300' height='200'/%3E%3Ctext x='150' y='100' font-size='24' fill='%234F46E5' text-anchor='middle' font-weight='bold'%3E投融资%3C/text%3E%3C/svg%3E",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

export async function seedFeedData() {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] Database not available");
    return;
  }

  try {
    // Check if data already exists
    const existingCompanies = await db.select().from(companies).limit(1);
    if (existingCompanies.length > 0) {
      console.log("[Seed] Feed data already exists, skipping seed");
      return;
    }

    // Insert companies
    console.log("[Seed] Inserting companies...");
    for (const company of mockCompanies) {
      await db.insert(companies).values(company);
    }

    // Insert job postings
    console.log("[Seed] Inserting job postings...");
    for (const job of mockJobs) {
      await db.insert(jobPostings).values(job);
    }

    // Insert articles
    console.log("[Seed] Inserting industry articles...");
    for (const article of mockArticles) {
      await db.insert(industryArticles).values(article);
    }

    console.log("[Seed] Feed data seeded successfully!");
  } catch (error) {
    console.error("[Seed] Error seeding feed data:", error);
  }
}
