import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  FileCheck,
  FileText,
  Mic,
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

const agentCards = [
  {
    title: "智能问答",
    description: "基于 RAG 的课程知识问答，支持多轮对话和置信度感知",
    icon: MessageSquare,
    path: "/qa",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "试卷批改",
    description: "三轨并行批改架构，客观题规则匹配、简答题语义评分、代码题分析",
    icon: FileCheck,
    path: "/grading",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "简历审查",
    description: "六维度精准诊断，提供带原文定位的修改建议和能力雷达图",
    icon: FileText,
    path: "/resume",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "模拟面试",
    description: "四阶段状态机设计，动态题目生成和双轨并行评估",
    icon: Mic,
    path: "/interview",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.user.stats.useQuery();

  const eduRole = (user as any)?.eduRole || "student";

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            欢迎回来，{user?.name || "用户"}
          </h1>
          <p className="text-muted-foreground mt-1">
            EduAgent 教育智能体平台 — 让 AI 赋能教育
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">问答对话</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.conversations || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">累计对话数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">试卷批改</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.exams || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">累计批改数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">简历审查</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.resumes || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">累计审查数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模拟面试</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.interviews || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">累计面试数</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">智能 Agent</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {agentCards.map((card) => (
            <Card
              key={card.path}
              className="group hover:shadow-md transition-all cursor-pointer border-l-4"
              style={{ borderLeftColor: "var(--primary)" }}
              onClick={() => setLocation(card.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats for Teachers/Admins */}
      {(eduRole === "teacher" || eduRole === "admin") && (
        <div>
          <h2 className="text-lg font-semibold mb-4">教学管理</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/knowledge")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50">
                    <BookOpen className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">知识库管理</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {isLoading ? "..." : `${stats?.knowledge || 0} 条知识`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/grading-review")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">批改审核</CardTitle>
                    <CardDescription className="text-xs mt-1">审核学员试卷批改结果</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {eduRole === "admin" && (
              <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/admin/users")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">用户管理</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {isLoading ? "..." : `${stats?.users || 0} 位用户`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
