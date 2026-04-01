import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCheck, Loader2, AlertTriangle, CheckCircle, Clock,
  ListChecks, PenLine, Code2, ArrowRight
} from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import ObjectiveQuiz from "./grading/ObjectiveQuiz";
import ShortAnswerQuiz from "./grading/ShortAnswerQuiz";
import CodeQuiz from "./grading/CodeQuiz";

type QuizMode = null | "objective" | "shortAnswer" | "code";

export default function Grading() {
  const [examTitle, setExamTitle] = useState("");
  const [examContent, setExamContent] = useState("");
  const [activeTab, setActiveTab] = useState("practice");
  const [quizMode, setQuizMode] = useState<QuizMode>(null);

  const { data: gradingList, refetch } = trpc.grading.list.useQuery();

  const submitMutation = trpc.grading.submit.useMutation({
    onSuccess: () => {
      toast.success("批改完成！");
      setExamTitle("");
      setExamContent("");
      setActiveTab("history");
      refetch();
    },
    onError: (err) => {
      toast.error("批改失败：" + err.message);
    },
  });

  const handleSubmit = () => {
    if (!examTitle.trim() || !examContent.trim()) {
      toast.error("请填写试卷标题和内容");
      return;
    }
    submitMutation.mutate({ examTitle, examContent });
  };

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "待批改", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    graded: { label: "已批改", color: "bg-blue-100 text-blue-700", icon: FileCheck },
    reviewed: { label: "已审核", color: "bg-green-100 text-green-700", icon: CheckCircle },
    published: { label: "已发布", color: "bg-purple-100 text-purple-700", icon: CheckCircle },
  };

  // If a quiz mode is active, render the corresponding quiz component
  if (quizMode === "objective") {
    return (
      <div className="space-y-6">
        <ObjectiveQuiz onBack={() => setQuizMode(null)} />
      </div>
    );
  }
  if (quizMode === "shortAnswer") {
    return (
      <div className="space-y-6">
        <ShortAnswerQuiz onBack={() => setQuizMode(null)} />
      </div>
    );
  }
  if (quizMode === "code") {
    return (
      <div className="space-y-6">
        <CodeQuiz onBack={() => setQuizMode(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">试卷批改</h1>
        <p className="text-muted-foreground mt-1">
          三轨并行批改：客观题规则匹配、简答题语义评分、代码题逻辑分析
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="practice">题型练习</TabsTrigger>
          <TabsTrigger value="submit">提交批改</TabsTrigger>
          <TabsTrigger value="history">批改记录</TabsTrigger>
        </TabsList>

        {/* ===== 题型练习 Tab ===== */}
        <TabsContent value="practice" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* 客观题 */}
            <Card
              className="group cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 hover:-translate-y-1"
              onClick={() => setQuizMode("objective")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <ListChecks className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">客观题</CardTitle>
                    <CardDescription className="text-xs mt-0.5">选择题 · 即时判分</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  5 道单选题 + 5 道多选题，涵盖 Python 基础知识。选择答案后即时判分，答错自动显示详细解析。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge variant="secondary" className="text-xs">10 题</Badge>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Python 基础</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>

            {/* 简答题 */}
            <Card
              className="group cursor-pointer transition-all hover:shadow-lg hover:border-green-300 hover:-translate-y-1"
              onClick={() => setQuizMode("shortAnswer")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <PenLine className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">简答题</CardTitle>
                    <CardDescription className="text-xs mt-0.5">文字作答 · AI 批改</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  3 道 Python 进阶简答题，涵盖装饰器、列表推导式、GIL 等核心概念。AI 逐点评分并给出改进建议。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge variant="secondary" className="text-xs">3 题</Badge>
                    <Badge className="bg-green-100 text-green-700 text-xs">Python 进阶</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
                </div>
              </CardContent>
            </Card>

            {/* 代码题 */}
            <Card
              className="group cursor-pointer transition-all hover:shadow-lg hover:border-orange-300 hover:-translate-y-1"
              onClick={() => setQuizMode("code")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Code2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">代码题</CardTitle>
                    <CardDescription className="text-xs mt-0.5">编程实战 · 全面审查</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  双指针、动态规划、数组各 1 题。支持 8 种语言，AI 从正确性、复杂度、代码质量等六维度全面审查。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge variant="secondary" className="text-xs">3 题</Badge>
                    <Badge className="bg-orange-100 text-orange-700 text-xs">算法编程</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== 提交批改 Tab ===== */}
        <TabsContent value="submit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">提交试卷/作业</CardTitle>
              <CardDescription>
                粘贴试卷内容或作业代码，AI 将自动进行智能批改
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">试卷标题</label>
                <Input
                  placeholder="例如：Python 期中考试"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">试卷/作业内容</label>
                <Textarea
                  placeholder="粘贴试卷内容、作业代码或答题内容..."
                  value={examContent}
                  onChange={(e) => setExamContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI 正在批改中...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    开始批改
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 批改记录 Tab ===== */}
        <TabsContent value="history" className="mt-4">
          <div className="space-y-4">
            {gradingList?.map((grading) => {
              const status = statusMap[grading.status] || statusMap.pending;
              let parsedResult: any = null;
              try {
                parsedResult = grading.gradingResult ? JSON.parse(grading.gradingResult) : null;
              } catch { /* ignore */ }

              return (
                <Card key={grading.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{grading.examTitle}</CardTitle>
                      <div className="flex items-center gap-2">
                        {grading.totalScore !== null && (
                          <Badge variant="outline" className="text-lg font-bold">
                            {grading.totalScore}/{grading.maxScore}
                          </Badge>
                        )}
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {new Date(grading.createdAt).toLocaleString("zh-CN")}
                    </CardDescription>
                  </CardHeader>
                  {parsedResult && (
                    <CardContent>
                      <div className="space-y-3">
                        {parsedResult.summary && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">总体评价</p>
                            <Streamdown>{parsedResult.summary}</Streamdown>
                          </div>
                        )}
                        {parsedResult.questions?.map((q: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">第 {q.id} 题</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {q.type === "objective" ? "客观题" : q.type === "code" ? "代码题" : "简答题"}
                                </Badge>
                                <span className="text-sm font-bold">{q.score}/{q.maxScore}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{q.feedback}</p>
                            {q.weakPoints?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {q.weakPoints.map((wp: string, j: number) => (
                                  <Badge key={j} variant="secondary" className="text-xs bg-red-50 text-red-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {wp}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {parsedResult.weakPoints?.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-sm font-medium text-red-700 mb-2">知识薄弱点</p>
                            <div className="flex gap-1 flex-wrap">
                              {parsedResult.weakPoints.map((wp: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">{wp}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {parsedResult.suggestions && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 mb-1">改进建议</p>
                            <p className="text-sm text-blue-600">{parsedResult.suggestions}</p>
                          </div>
                        )}
                        {grading.reviewNote && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-700 mb-1">教师评语</p>
                            <p className="text-sm text-green-600">{grading.reviewNote}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
            {(!gradingList || gradingList.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>暂无批改记录</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
